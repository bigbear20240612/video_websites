/*
 * 大雄视频平台 - 视频处理服务
 * 处理视频转码、缩略图生成、质量转换等功能
 */

import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import ffmpeg from 'fluent-ffmpeg';
import ffprobeStatic from 'ffprobe-static';
import ffmpegStatic from 'ffmpeg-static';
import Queue from 'bull';
import redis from '../config/redis';
import Video, { IVideo, VideoStatus, VideoQuality } from '../models/Video';
import VideoProcessingJob, { IVideoProcessingJob, JobStatus, JobType, JobResult } from '../models/VideoProcessingJob';
import { uploadProcessedVideo, uploadThumbnail, deleteVideoFile } from './FileUploadService';

// 配置FFmpeg路径
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}
if (ffprobeStatic.path) {
  ffmpeg.setFfprobePath(ffprobeStatic.path);
}

// 创建任务队列
export const videoProcessingQueue = new Queue('video processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  },
  defaultJobOptions: {
    removeOnComplete: 100,  // 保留100个已完成任务
    removeOnFail: 50,       // 保留50个失败任务
    attempts: 3,            // 最多重试3次
    backoff: {
      type: 'exponential',
      delay: 5000           // 5秒延迟，指数退避
    }
  }
});

// 预设的转码配置
const TRANSCODE_PRESETS = {
  '240p': {
    resolution: '426x240',
    videoBitrate: '400k',
    audioBitrate: '64k',
    fps: 30
  },
  '360p': {
    resolution: '640x360',
    videoBitrate: '800k',
    audioBitrate: '96k',
    fps: 30
  },
  '480p': {
    resolution: '854x480',
    videoBitrate: '1500k',
    audioBitrate: '128k',
    fps: 30
  },
  '720p': {
    resolution: '1280x720',
    videoBitrate: '2500k',
    audioBitrate: '192k',
    fps: 30
  },
  '1080p': {
    resolution: '1920x1080',
    videoBitrate: '5000k',
    audioBitrate: '192k',
    fps: 30
  },
  '1440p': {
    resolution: '2560x1440',
    videoBitrate: '9000k',
    audioBitrate: '192k',
    fps: 60
  },
  '2160p': {
    resolution: '3840x2160',
    videoBitrate: '18000k',
    audioBitrate: '192k',
    fps: 60
  }
};

export class VideoProcessingService {
  private processingJobs: Map<string, ChildProcess> = new Map();

  constructor() {
    this.initializeQueue();
  }

  /**
   * 初始化任务队列处理器
   */
  private initializeQueue(): void {
    videoProcessingQueue.process('video-processing', async (job) => {
      const { jobId } = job.data;
      return this.processJob(jobId);
    });

    // 队列事件监听
    videoProcessingQueue.on('active', (job) => {
      console.log(`开始处理任务: ${job.data.jobId}`);
    });

    videoProcessingQueue.on('completed', (job, result) => {
      console.log(`任务完成: ${job.data.jobId}`, result);
    });

    videoProcessingQueue.on('failed', (job, err) => {
      console.error(`任务失败: ${job.data.jobId}`, err);
    });

    videoProcessingQueue.on('stalled', (job) => {
      console.warn(`任务超时: ${job.data.jobId}`);
    });
  }

  /**
   * 添加处理任务到队列
   */
  public async addJobs(jobIds: string[]): Promise<void> {
    for (const jobId of jobIds) {
      await videoProcessingQueue.add('video-processing', { jobId }, {
        priority: await this.getJobPriority(jobId),
        delay: Math.random() * 1000 // 随机延迟0-1秒，避免并发冲突
      });
    }
  }

  /**
   * 获取任务优先级
   */
  private async getJobPriority(jobId: string): Promise<number> {
    try {
      const job = await VideoProcessingJob.findById(jobId);
      return job?.priority || 50;
    } catch (error) {
      return 50;
    }
  }

  /**
   * 处理单个任务
   */
  public async processJob(jobId: string): Promise<any> {
    const job = await VideoProcessingJob.findById(jobId);
    if (!job) {
      throw new Error(`任务不存在: ${jobId}`);
    }

    // 检查任务状态
    if (job.status !== JobStatus.PENDING) {
      console.warn(`任务状态异常: ${jobId}, status: ${job.status}`);
      return;
    }

    try {
      // 更新任务状态为处理中
      await job.updateProgress({
        percentage: 0,
        currentStep: '开始处理',
        message: '初始化处理环境...',
        startTime: new Date()
      });

      let result: JobResult;

      switch (job.jobType) {
        case JobType.TRANSCODE:
          result = await this.processTranscode(job);
          break;
        case JobType.THUMBNAIL:
          result = await this.processThumbnail(job);
          break;
        case JobType.AUDIO_EXTRACT:
          result = await this.processAudioExtract(job);
          break;
        case JobType.COMPRESS:
          result = await this.processCompress(job);
          break;
        default:
          throw new Error(`不支持的任务类型: ${job.jobType}`);
      }

      // 标记任务完成
      await job.markAsCompleted(result);

      // 更新视频状态
      await this.updateVideoStatus(job.videoId);

      return result;

    } catch (error) {
      console.error(`处理任务失败: ${jobId}`, error);
      await job.markAsFailed((error as Error).message);
      
      // 更新视频状态为失败
      await Video.findByIdAndUpdate(job.videoId, {
        status: VideoStatus.FAILED
      });

      throw error;
    }
  }

  /**
   * 视频转码处理
   */
  private async processTranscode(job: IVideoProcessingJob): Promise<JobResult> {
    const { outputResolution, outputFormat, outputBitrate, outputFps } = job.settings;
    const preset = TRANSCODE_PRESETS[outputResolution as keyof typeof TRANSCODE_PRESETS];
    
    if (!preset) {
      throw new Error(`不支持的分辨率: ${outputResolution}`);
    }

    // 获取视频信息
    const videoInfo = await this.getVideoInfo(job.inputFile);
    
    // 计算输出分辨率（保持宽高比）
    const { width: outputWidth, height: outputHeight } = this.calculateOutputDimensions(
      videoInfo.width,
      videoInfo.height,
      preset.resolution
    );

    const tempOutputPath = `/tmp/transcode_${job._id}_${outputResolution}.${outputFormat}`;

    return new Promise((resolve, reject) => {
      const command = ffmpeg(job.inputFile)
        .videoCodec('libx264')
        .audioCodec('aac')
        .size(`${outputWidth}x${outputHeight}`)
        .videoBitrate(preset.videoBitrate)
        .audioBitrate(preset.audioBitrate)
        .fps(outputFps || preset.fps)
        .format(outputFormat || 'mp4')
        .outputOptions([
          '-preset medium',          // 编码速度与质量平衡
          '-crf 23',                // 恒定质量因子
          '-movflags +faststart',   // 优化Web播放
          '-pix_fmt yuv420p'        // 兼容性像素格式
        ])
        .output(tempOutputPath);

      // 进度监听
      command.on('progress', async (progress) => {
        const percentage = Math.min(Math.round(progress.percent || 0), 90);
        await job.updateProgress({
          percentage,
          currentStep: '视频转码中',
          message: `转码进度: ${percentage}%, 时间: ${progress.timemark}`,
          processedBytes: Math.round((progress.percent / 100) * videoInfo.size),
          totalBytes: videoInfo.size
        });
      });

      command.on('end', async () => {
        try {
          // 上传转码后的文件
          const uploadResult = await uploadProcessedVideo(tempOutputPath, job.videoId.toString(), outputResolution);
          
          // 获取输出文件信息
          const outputInfo = await this.getVideoInfo(tempOutputPath);
          
          // 清理临时文件
          await fs.unlink(tempOutputPath).catch(err => console.warn('清理临时文件失败:', err));

          // 构建结果
          const result: JobResult = {
            outputFiles: [{
              url: uploadResult.url,
              type: 'video',
              size: outputInfo.size,
              resolution: `${outputWidth}x${outputHeight}`,
              bitrate: parseInt(preset.videoBitrate.replace('k', '')) * 1000
            }],
            videoInfo: {
              duration: outputInfo.duration,
              width: outputWidth,
              height: outputHeight,
              fps: outputFps || preset.fps,
              bitrate: parseInt(preset.videoBitrate.replace('k', '')) * 1000,
              format: outputFormat || 'mp4'
            }
          };

          // 更新视频质量信息
          await this.addVideoQuality(job.videoId, {
            resolution: outputResolution,
            bitrate: parseInt(preset.videoBitrate.replace('k', '')) * 1000,
            size: outputInfo.size,
            url: uploadResult.url,
            format: outputFormat || 'mp4'
          } as VideoQuality);

          resolve(result);

        } catch (error) {
          reject(error);
        }
      });

      command.on('error', (error) => {
        // 清理临时文件
        fs.unlink(tempOutputPath).catch(() => {});
        reject(new Error(`转码失败: ${error.message}`));
      });

      // 启动转码
      command.run();
      
      // 存储进程引用以支持取消
      this.processingJobs.set(job._id.toString(), command as any);
    });
  }

  /**
   * 缩略图生成处理
   */
  private async processThumbnail(job: IVideoProcessingJob): Promise<JobResult> {
    const { thumbnailCount = 5, thumbnailSize = '320x180', thumbnailTimes } = job.settings;
    
    // 获取视频信息
    const videoInfo = await this.getVideoInfo(job.inputFile);
    const duration = videoInfo.duration;
    
    // 计算缩略图时间点
    const timePoints = thumbnailTimes || this.generateThumbnailTimePoints(duration, thumbnailCount);
    
    const thumbnailUrls: string[] = [];
    const tempDir = `/tmp/thumbnails_${job._id}`;
    
    try {
      // 创建临时目录
      await fs.mkdir(tempDir, { recursive: true });

      for (let i = 0; i < timePoints.length; i++) {
        const time = timePoints[i];
        const outputPath = path.join(tempDir, `thumb_${i}.jpg`);

        await new Promise<void>((resolve, reject) => {
          ffmpeg(job.inputFile)
            .seekInput(time)
            .frames(1)
            .size(thumbnailSize)
            .format('image2')
            .outputOptions(['-q:v 2']) // 高质量JPEG
            .output(outputPath)
            .on('end', () => resolve())
            .on('error', reject)
            .run();
        });

        // 上传缩略图
        const uploadResult = await uploadThumbnail(outputPath, job.videoId.toString(), i);
        thumbnailUrls.push(uploadResult.url);

        // 更新进度
        const percentage = Math.round(((i + 1) / timePoints.length) * 90);
        await job.updateProgress({
          percentage,
          currentStep: '生成缩略图',
          message: `生成第 ${i + 1}/${timePoints.length} 张缩略图`
        });
      }

      // 设置第一张为主缩略图
      if (thumbnailUrls.length > 0) {
        await Video.findByIdAndUpdate(job.videoId, {
          thumbnail: thumbnailUrls[0],
          thumbnails: thumbnailUrls
        });
      }

      return {
        thumbnails: thumbnailUrls,
        videoInfo: {
          duration: videoInfo.duration,
          width: videoInfo.width,
          height: videoInfo.height,
          fps: videoInfo.fps,
          bitrate: videoInfo.bitrate,
          format: videoInfo.format
        }
      };

    } finally {
      // 清理临时目录
      await fs.rm(tempDir, { recursive: true, force: true }).catch(err => 
        console.warn('清理临时目录失败:', err)
      );
    }
  }

  /**
   * 音频提取处理
   */
  private async processAudioExtract(job: IVideoProcessingJob): Promise<JobResult> {
    const tempOutputPath = `/tmp/audio_${job._id}.mp3`;

    return new Promise((resolve, reject) => {
      ffmpeg(job.inputFile)
        .noVideo()
        .audioCodec('mp3')
        .audioBitrate('192k')
        .format('mp3')
        .output(tempOutputPath)
        .on('progress', async (progress) => {
          const percentage = Math.min(Math.round(progress.percent || 0), 90);
          await job.updateProgress({
            percentage,
            currentStep: '提取音频',
            message: `提取进度: ${percentage}%`
          });
        })
        .on('end', async () => {
          try {
            // 上传音频文件
            const uploadResult = await uploadProcessedVideo(tempOutputPath, job.videoId.toString(), 'audio');
            
            // 获取文件大小
            const stats = await fs.stat(tempOutputPath);
            
            // 清理临时文件
            await fs.unlink(tempOutputPath).catch(err => console.warn('清理临时文件失败:', err));

            resolve({
              outputFiles: [{
                url: uploadResult.url,
                type: 'audio',
                size: stats.size,
                bitrate: 192000
              }]
            });
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          fs.unlink(tempOutputPath).catch(() => {});
          reject(new Error(`音频提取失败: ${error.message}`));
        })
        .run();
    });
  }

  /**
   * 视频压缩处理
   */
  private async processCompress(job: IVideoProcessingJob): Promise<JobResult> {
    const tempOutputPath = `/tmp/compressed_${job._id}.mp4`;
    
    return new Promise((resolve, reject) => {
      ffmpeg(job.inputFile)
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
          '-preset slower',      // 更好的压缩效果
          '-crf 28',            // 较高的压缩比
          '-movflags +faststart'
        ])
        .format('mp4')
        .output(tempOutputPath)
        .on('progress', async (progress) => {
          const percentage = Math.min(Math.round(progress.percent || 0), 90);
          await job.updateProgress({
            percentage,
            currentStep: '视频压缩',
            message: `压缩进度: ${percentage}%`
          });
        })
        .on('end', async () => {
          try {
            const uploadResult = await uploadProcessedVideo(tempOutputPath, job.videoId.toString(), 'compressed');
            const stats = await fs.stat(tempOutputPath);
            
            await fs.unlink(tempOutputPath).catch(err => console.warn('清理临时文件失败:', err));

            resolve({
              outputFiles: [{
                url: uploadResult.url,
                type: 'video',
                size: stats.size
              }]
            });
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          fs.unlink(tempOutputPath).catch(() => {});
          reject(new Error(`视频压缩失败: ${error.message}`));
        })
        .run();
    });
  }

  // ==================== 辅助方法 ====================

  /**
   * 获取视频信息
   */
  private async getVideoInfo(videoPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

        resolve({
          duration: metadata.format.duration || 0,
          size: metadata.format.size || 0,
          bitrate: metadata.format.bit_rate || 0,
          format: metadata.format.format_name || 'unknown',
          width: videoStream?.width || 0,
          height: videoStream?.height || 0,
          fps: videoStream?.r_frame_rate ? this.parseFPS(videoStream.r_frame_rate) : 0,
          videoCodec: videoStream?.codec_name || 'unknown',
          audioCodec: audioStream?.codec_name || 'unknown'
        });
      });
    });
  }

  /**
   * 解析帧率
   */
  private parseFPS(fpsString: string): number {
    const [numerator, denominator] = fpsString.split('/').map(Number);
    return denominator ? numerator / denominator : numerator;
  }

  /**
   * 计算输出尺寸（保持宽高比）
   */
  private calculateOutputDimensions(inputWidth: number, inputHeight: number, targetResolution: string): { width: number; height: number } {
    const [targetWidth, targetHeight] = targetResolution.split('x').map(Number);
    const inputAspectRatio = inputWidth / inputHeight;
    const targetAspectRatio = targetWidth / targetHeight;

    let outputWidth: number;
    let outputHeight: number;

    if (inputAspectRatio > targetAspectRatio) {
      // 输入更宽，以宽度为准
      outputWidth = targetWidth;
      outputHeight = Math.round(targetWidth / inputAspectRatio);
    } else {
      // 输入更高，以高度为准
      outputHeight = targetHeight;
      outputWidth = Math.round(targetHeight * inputAspectRatio);
    }

    // 确保是偶数（H.264要求）
    outputWidth = outputWidth % 2 === 0 ? outputWidth : outputWidth - 1;
    outputHeight = outputHeight % 2 === 0 ? outputHeight : outputHeight - 1;

    return { width: outputWidth, height: outputHeight };
  }

  /**
   * 生成缩略图时间点
   */
  private generateThumbnailTimePoints(duration: number, count: number): number[] {
    const timePoints: number[] = [];
    const interval = duration / (count + 1);
    
    for (let i = 1; i <= count; i++) {
      timePoints.push(Math.round(interval * i));
    }
    
    return timePoints;
  }

  /**
   * 添加视频质量版本
   */
  private async addVideoQuality(videoId: any, quality: VideoQuality): Promise<void> {
    const video = await Video.findById(videoId);
    if (video) {
      await video.addQuality(quality);
    }
  }

  /**
   * 更新视频状态
   */
  private async updateVideoStatus(videoId: any): Promise<void> {
    // 检查是否所有任务都已完成
    const pendingJobs = await VideoProcessingJob.countDocuments({
      videoId,
      status: { $in: [JobStatus.PENDING, JobStatus.PROCESSING] }
    });

    if (pendingJobs === 0) {
      // 检查是否有失败的关键任务
      const failedCriticalJobs = await VideoProcessingJob.countDocuments({
        videoId,
        status: JobStatus.FAILED,
        jobType: { $in: [JobType.TRANSCODE, JobType.THUMBNAIL] }
      });

      const newStatus = failedCriticalJobs > 0 ? VideoStatus.FAILED : VideoStatus.READY;
      
      await Video.findByIdAndUpdate(videoId, {
        status: newStatus,
        processingProgress: {
          percentage: 100,
          currentStep: newStatus === VideoStatus.READY ? '处理完成' : '处理失败',
          message: newStatus === VideoStatus.READY ? '视频已准备就绪' : '视频处理失败',
          updatedAt: new Date()
        }
      });

      console.log(`视频 ${videoId} 处理完成，状态: ${newStatus}`);
    }
  }

  /**
   * 取消任务
   */
  public async cancelJob(jobId: string): Promise<void> {
    const process = this.processingJobs.get(jobId);
    if (process) {
      process.kill('SIGTERM');
      this.processingJobs.delete(jobId);
    }

    await VideoProcessingJob.findByIdAndUpdate(jobId, {
      status: JobStatus.CANCELLED
    });
  }

  /**
   * 获取队列状态
   */
  public async getQueueStatus(): Promise<any> {
    const waiting = await videoProcessingQueue.getWaiting();
    const active = await videoProcessingQueue.getActive();
    const completed = await videoProcessingQueue.getCompleted();
    const failed = await videoProcessingQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      total: waiting.length + active.length + completed.length + failed.length
    };
  }

  /**
   * 清理队列
   */
  public async cleanQueue(): Promise<void> {
    await videoProcessingQueue.clean(24 * 60 * 60 * 1000, 'completed'); // 清理24小时前的完成任务
    await videoProcessingQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed'); // 清理7天前的失败任务
  }
}

export default new VideoProcessingService();