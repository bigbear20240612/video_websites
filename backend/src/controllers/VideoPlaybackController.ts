/*
 * 大雄视频平台 - 视频播放控制器
 * 处理视频播放、流媒体、播放统计等功能
 */

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import Video, { IVideo, VideoStatus, VideoVisibility } from '../models/Video';
import User from '../models/User';
import { ApiResponse } from '../types/ApiResponse';
import { getClientIP } from '../utils/helpers';
import { generateDownloadUrl } from '../services/FileUploadService';
import redis from '../config/redis';

export class VideoPlaybackController {

  /**
   * 获取视频播放信息
   * GET /api/playback/:id/info
   */
  public async getPlaybackInfo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const currentUserId = req.user?.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: '无效的视频ID'
        } as ApiResponse);
        return;
      }

      const video = await Video.findById(id)
        .populate('uploader', 'username nickname avatar verified isVip')
        .lean();

      if (!video) {
        res.status(404).json({
          success: false,
          message: '视频不存在'
        } as ApiResponse);
        return;
      }

      // 检查访问权限
      const canAccess = await this.checkPlaybackAccess(video as IVideo, currentUserId);
      if (!canAccess) {
        res.status(403).json({
          success: false,
          message: '无权播放此视频'
        } as ApiResponse);
        return;
      }

      // 检查视频是否准备就绪
      if (video.status !== VideoStatus.READY) {
        res.status(503).json({
          success: false,
          message: '视频正在处理中，请稍后重试',
          data: {
            status: video.status,
            processingProgress: video.processingProgress
          }
        } as ApiResponse);
        return;
      }

      // 生成播放URL（带签名）
      const playbackUrls = await this.generatePlaybackUrls(video.qualities);

      // 构建播放信息
      const playbackInfo = {
        videoId: video._id,
        title: video.title,
        description: video.description,
        duration: video.duration,
        thumbnail: video.thumbnail,
        thumbnails: video.thumbnails,
        uploader: video.uploader,
        
        // 播放源
        sources: playbackUrls,
        
        // 视频属性
        isAgeRestricted: video.isAgeRestricted,
        contentWarnings: video.contentWarnings,
        language: video.language,
        category: video.category,
        tags: video.tags,
        
        // 统计信息
        stats: video.stats,
        
        // 时间信息
        publishedAt: video.publishedAt,
        uploadedAt: video.uploadedAt
      };

      res.json({
        success: true,
        data: { playback: playbackInfo }
      } as ApiResponse);

    } catch (error) {
      console.error('获取播放信息失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 视频流播放（支持Range请求）
   * GET /api/playback/:id/stream
   */
  public async streamVideo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const quality = req.query.quality as string || '720p';
      const currentUserId = req.user?.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: '无效的视频ID'
        } as ApiResponse);
        return;
      }

      const video = await Video.findById(id);
      if (!video) {
        res.status(404).json({
          success: false,
          message: '视频不存在'
        } as ApiResponse);
        return;
      }

      // 检查访问权限
      const canAccess = await this.checkPlaybackAccess(video, currentUserId);
      if (!canAccess) {
        res.status(403).json({
          success: false,
          message: '无权播放此视频'
        } as ApiResponse);
        return;
      }

      // 检查视频状态
      if (video.status !== VideoStatus.READY) {
        res.status(503).json({
          success: false,
          message: '视频正在处理中'
        } as ApiResponse);
        return;
      }

      // 查找对应质量的视频文件
      let videoQuality = video.qualities.find(q => q.resolution === quality);
      if (!videoQuality && video.qualities.length > 0) {
        // 如果没找到指定质量，使用最高质量
        videoQuality = video.qualities.reduce((prev, current) => {
          const prevRes = parseInt(prev.resolution);
          const currRes = parseInt(current.resolution);
          return currRes > prevRes ? current : prev;
        });
      }

      if (!videoQuality) {
        res.status(404).json({
          success: false,
          message: '视频文件不存在'
        } as ApiResponse);
        return;
      }

      // 如果是云存储，重定向到CDN
      if (!videoQuality.url.includes('localhost')) {
        const streamUrl = await generateDownloadUrl(this.extractKeyFromUrl(videoQuality.url), 3600);
        res.redirect(302, streamUrl);
        return;
      }

      // 本地文件流播放
      await this.streamLocalFile(req, res, videoQuality.url, videoQuality.size);

      // 记录播放事件（异步）
      this.recordPlaybackEvent(video._id.toString(), currentUserId, getClientIP(req), quality);

    } catch (error) {
      console.error('视频流播放失败:', error);
      res.status(500).json({
        success: false,
        message: '播放失败'
      } as ApiResponse);
    }
  }

  /**
   * 记录播放进度
   * POST /api/playback/:id/progress
   */
  public async recordProgress(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { currentTime, duration, quality } = req.body;
      const userId = req.user?.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: '无效的视频ID'
        } as ApiResponse);
        return;
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: '参数错误',
          errors: errors.array()
        } as ApiResponse);
        return;
      }

      // 存储播放进度到Redis
      if (userId) {
        const progressKey = `playback_progress:${userId}:${id}`;
        const progressData = {
          currentTime: Math.floor(currentTime),
          duration: Math.floor(duration),
          quality,
          lastUpdated: Date.now()
        };

        await redis.setex(progressKey, 7 * 24 * 60 * 60, JSON.stringify(progressData)); // 保存7天

        // 如果播放完成度超过90%，记录为已观看
        const completionRate = currentTime / duration;
        if (completionRate >= 0.9) {
          await this.markAsWatched(userId, id);
        }
      }

      res.json({
        success: true,
        message: '进度保存成功'
      } as ApiResponse);

    } catch (error) {
      console.error('记录播放进度失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 获取播放进度
   * GET /api/playback/:id/progress
   */
  public async getProgress(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: '需要登录'
        } as ApiResponse);
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: '无效的视频ID'
        } as ApiResponse);
        return;
      }

      const progressKey = `playback_progress:${userId}:${id}`;
      const progressData = await redis.get(progressKey);

      if (progressData) {
        const progress = JSON.parse(progressData);
        res.json({
          success: true,
          data: { progress }
        } as ApiResponse);
      } else {
        res.json({
          success: true,
          data: { progress: null }
        } as ApiResponse);
      }

    } catch (error) {
      console.error('获取播放进度失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 获取播放统计
   * GET /api/playback/:id/stats
   */
  public async getPlaybackStats(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: '无效的视频ID'
        } as ApiResponse);
        return;
      }

      const video = await Video.findById(id);
      if (!video) {
        res.status(404).json({
          success: false,
          message: '视频不存在'
        } as ApiResponse);
        return;
      }

      // 检查权限 - 只有视频作者和管理员可以查看详细统计
      if (video.uploader.toString() !== userId) {
        const user = await User.findById(userId);
        if (!user || user.role !== 'admin') {
          res.status(403).json({
            success: false,
            message: '无权查看统计信息'
          } as ApiResponse);
          return;
        }
      }

      // 从Redis获取详细统计信息
      const statsKey = `video_stats:${id}`;
      const statsData = await redis.hgetall(statsKey);

      // 获取质量分布统计
      const qualityStats = await this.getQualityStats(id);

      // 获取地区分布统计
      const regionStats = await this.getRegionStats(id);

      // 获取时间分布统计
      const timeStats = await this.getTimeStats(id);

      const stats = {
        basic: video.stats,
        detailed: {
          totalPlaytime: parseInt(statsData.totalPlaytime || '0'),
          uniqueViewers: parseInt(statsData.uniqueViewers || '0'),
          avgWatchTime: parseFloat(statsData.avgWatchTime || '0'),
          completionRate: parseFloat(statsData.completionRate || '0'),
          qualityDistribution: qualityStats,
          regionDistribution: regionStats,
          hourlyDistribution: timeStats
        }
      };

      res.json({
        success: true,
        data: { stats }
      } as ApiResponse);

    } catch (error) {
      console.error('获取播放统计失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 检查播放访问权限
   */
  private async checkPlaybackAccess(video: IVideo, currentUserId?: string): Promise<boolean> {
    // 已删除或封禁的视频不可播放
    if (video.status === VideoStatus.DELETED || video.status === VideoStatus.BLOCKED) {
      return false;
    }

    // 作者可以播放自己的所有视频
    if (currentUserId && video.uploader.toString() === currentUserId) {
      return true;
    }

    // 公开视频所有人都可以播放
    if (video.visibility === VideoVisibility.PUBLIC && video.status === VideoStatus.READY) {
      return true;
    }

    // 不公开但可通过链接访问的视频
    if (video.visibility === VideoVisibility.UNLISTED && video.status === VideoStatus.READY) {
      return true;
    }

    return false;
  }

  /**
   * 生成播放URL
   */
  private async generatePlaybackUrls(qualities: any[]): Promise<any[]> {
    const playbackUrls = [];

    for (const quality of qualities) {
      try {
        let playbackUrl: string;

        if (quality.url.includes('localhost')) {
          // 本地文件，直接使用
          playbackUrl = quality.url;
        } else {
          // 云存储文件，生成签名URL
          const key = this.extractKeyFromUrl(quality.url);
          playbackUrl = await generateDownloadUrl(key, 3600); // 1小时有效期
        }

        playbackUrls.push({
          quality: quality.resolution,
          url: playbackUrl,
          bitrate: quality.bitrate,
          format: quality.format,
          size: quality.size
        });
      } catch (error) {
        console.warn(`生成播放URL失败: ${quality.resolution}`, error);
      }
    }

    // 按分辨率排序（从高到低）
    return playbackUrls.sort((a, b) => {
      const aRes = parseInt(a.quality);
      const bRes = parseInt(b.quality);
      return bRes - aRes;
    });
  }

  /**
   * 流式传输本地文件
   */
  private async streamLocalFile(req: Request, res: Response, fileUrl: string, fileSize: number): Promise<void> {
    const filePath = fileUrl.replace(/^https?:\/\/[^\/]+/, process.env.LOCAL_UPLOAD_DIR || './uploads');
    
    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        message: '视频文件不存在'
      } as ApiResponse);
      return;
    }

    const stat = fs.statSync(filePath);
    const fileSize_actual = stat.size;
    const range = req.headers.range;

    if (range) {
      // 支持范围请求（HTTP Range）
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize_actual - 1;
      const chunksize = (end - start) + 1;
      
      const file = fs.createReadStream(filePath, { start, end });
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize_actual}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
        'Cache-Control': 'public, max-age=86400'
      });
      
      file.pipe(res);
    } else {
      // 完整文件传输
      res.writeHead(200, {
        'Content-Length': fileSize_actual,
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400'
      });
      
      fs.createReadStream(filePath).pipe(res);
    }
  }

  /**
   * 记录播放事件
   */
  private async recordPlaybackEvent(videoId: string, userId: string | undefined, ip: string, quality: string): Promise<void> {
    try {
      // 防重复统计（同一用户1小时内重复播放不计数）
      const dedupeKey = `playback_dedupe:${userId || ip}:${videoId}`;
      const exists = await redis.get(dedupeKey);
      
      if (exists) {
        return; // 已经统计过了
      }

      // 设置去重标记（1小时）
      await redis.setex(dedupeKey, 3600, '1');

      // 增加播放次数
      await Video.findByIdAndUpdate(videoId, {
        $inc: { 'stats.views': 1 }
      });

      // 记录到详细统计
      const statsKey = `video_stats:${videoId}`;
      await redis.hincrby(statsKey, 'totalViews', 1);

      // 记录质量统计
      const qualityKey = `video_quality_stats:${videoId}`;
      await redis.hincrby(qualityKey, quality, 1);

      // 记录时间统计
      const hour = new Date().getHours();
      const timeKey = `video_time_stats:${videoId}`;
      await redis.hincrby(timeKey, hour.toString(), 1);

      // 如果有用户ID，记录到用户观看历史
      if (userId) {
        const historyKey = `user_watch_history:${userId}`;
        await redis.lpush(historyKey, JSON.stringify({
          videoId,
          watchedAt: Date.now(),
          quality
        }));
        await redis.ltrim(historyKey, 0, 999); // 保留最近1000条
        await redis.expire(historyKey, 30 * 24 * 60 * 60); // 保存30天
      }

      console.log(`播放事件记录: 视频=${videoId}, 用户=${userId || '匿名'}, 质量=${quality}`);

    } catch (error) {
      console.error('记录播放事件失败:', error);
    }
  }

  /**
   * 标记为已观看
   */
  private async markAsWatched(userId: string, videoId: string): Promise<void> {
    const watchedKey = `user_watched:${userId}`;
    await redis.sadd(watchedKey, videoId);
    await redis.expire(watchedKey, 90 * 24 * 60 * 60); // 保存90天
  }

  /**
   * 获取质量分布统计
   */
  private async getQualityStats(videoId: string): Promise<any> {
    const qualityKey = `video_quality_stats:${videoId}`;
    return await redis.hgetall(qualityKey);
  }

  /**
   * 获取地区分布统计
   */
  private async getRegionStats(videoId: string): Promise<any> {
    const regionKey = `video_region_stats:${videoId}`;
    return await redis.hgetall(regionKey);
  }

  /**
   * 获取时间分布统计
   */
  private async getTimeStats(videoId: string): Promise<any> {
    const timeKey = `video_time_stats:${videoId}`;
    return await redis.hgetall(timeKey);
  }

  /**
   * 从URL提取key
   */
  private extractKeyFromUrl(url: string): string {
    const urlParts = url.split('/');
    return urlParts.slice(-2).join('/');
  }
}

export default new VideoPlaybackController();