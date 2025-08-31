/*
 * 大雄视频平台 - 视频控制器
 * 处理视频上传、管理、播放等核心功能
 */

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs/promises';
import Video, { IVideo, VideoStatus, VideoVisibility } from '../models/Video';
import VideoProcessingJob, { JobType } from '../models/VideoProcessingJob';
import User from '../models/User';
import { ApiResponse, ListResponse } from '../types/ApiResponse';
import { calculatePagination, formatFileSize, getClientIP } from '../utils/helpers';
import { uploadVideoFile, deleteVideoFile } from '../services/FileUploadService';
import { videoProcessingQueue } from '../services/VideoProcessingService';

export class VideoController {

  /**
   * 初始化视频上传
   * POST /api/videos/upload/init
   */
  public async initializeUpload(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: '输入参数有误',
          errors: errors.array()
        } as ApiResponse);
        return;
      }

      const userId = req.user!.id;
      const { 
        title, 
        description, 
        category, 
        tags, 
        visibility, 
        isAgeRestricted,
        language 
      } = req.body;

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: '请选择视频文件'
        } as ApiResponse);
        return;
      }

      // 验证文件类型
      const allowedMimeTypes = [
        'video/mp4', 'video/avi', 'video/mov', 'video/wmv',
        'video/flv', 'video/webm', 'video/mkv', 'video/m4v'
      ];

      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        res.status(400).json({
          success: false,
          message: '不支持的视频格式'
        } as ApiResponse);
        return;
      }

      // 检查文件大小限制
      const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
      if (req.file.size > maxSize) {
        res.status(400).json({
          success: false,
          message: `文件大小不能超过 ${formatFileSize(maxSize)}`
        } as ApiResponse);
        return;
      }

      // 检查用户上传限制
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: '用户不存在'
        } as ApiResponse);
        return;
      }

      // 检查上传配额（VIP用户有更高限制）
      const dailyLimit = user.isVip ? 50 : 10;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayUploads = await Video.countDocuments({
        uploader: userId,
        uploadedAt: { $gte: today }
      });

      if (todayUploads >= dailyLimit) {
        res.status(429).json({
          success: false,
          message: `今日上传次数已达上限 (${dailyLimit}次)`
        } as ApiResponse);
        return;
      }

      // 上传文件到存储服务
      const uploadResult = await uploadVideoFile(req.file, userId);

      // 创建视频记录
      const video = new Video({
        title,
        description,
        uploader: userId,
        originalFileName: req.file.originalname,
        originalFileSize: req.file.size,
        originalFormat: path.extname(req.file.originalname).slice(1).toLowerCase(),
        originalUrl: uploadResult.url,
        category,
        tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
        visibility: visibility || VideoVisibility.PRIVATE,
        isAgeRestricted: isAgeRestricted || false,
        language: language || 'zh-CN',
        status: VideoStatus.UPLOADING
      });

      await video.save();

      // 创建处理任务
      await this.createProcessingJobs(video, userId);

      // 更新用户视频数量
      await User.findByIdAndUpdate(userId, { 
        $inc: { videoCount: 1 } 
      });

      res.status(201).json({
        success: true,
        message: '视频上传成功，正在处理中...',
        data: {
          video: {
            id: video._id,
            title: video.title,
            status: video.status,
            uploadedAt: video.uploadedAt
          }
        }
      } as ApiResponse);

    } catch (error) {
      console.error('视频上传初始化失败:', error);
      res.status(500).json({
        success: false,
        message: '上传失败，请稍后重试'
      } as ApiResponse);
    }
  }

  /**
   * 获取视频详情
   * GET /api/videos/:id
   */
  public async getVideoDetails(req: Request, res: Response): Promise<void> {
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
      const canAccess = this.checkVideoAccess(video as IVideo, currentUserId);
      if (!canAccess) {
        res.status(403).json({
          success: false,
          message: '无权访问此视频'
        } as ApiResponse);
        return;
      }

      // 如果是公开视频且不是作者自己观看，增加播放次数
      if (video.visibility === VideoVisibility.PUBLIC && 
          video.uploader._id.toString() !== currentUserId) {
        await Video.findByIdAndUpdate(id, { 
          $inc: { 'stats.views': 1 } 
        });
        video.stats.views += 1;
      }

      res.json({
        success: true,
        data: { video }
      } as ApiResponse);

    } catch (error) {
      console.error('获取视频详情失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 更新视频信息
   * PUT /api/videos/:id
   */
  public async updateVideo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: '输入参数有误',
          errors: errors.array()
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

      const video = await Video.findById(id);
      if (!video) {
        res.status(404).json({
          success: false,
          message: '视频不存在'
        } as ApiResponse);
        return;
      }

      // 检查权限 - 只有作者和管理员可以编辑
      if (video.uploader.toString() !== userId) {
        const user = await User.findById(userId);
        if (!user || user.role !== 'admin') {
          res.status(403).json({
            success: false,
            message: '无权编辑此视频'
          } as ApiResponse);
          return;
        }
      }

      const {
        title,
        description,
        category,
        tags,
        visibility,
        isAgeRestricted,
        language,
        contentWarnings
      } = req.body;

      // 构建更新数据
      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (category !== undefined) updateData.category = category;
      if (tags !== undefined) {
        updateData.tags = typeof tags === 'string' 
          ? tags.split(',').map((tag: string) => tag.trim())
          : tags;
      }
      if (visibility !== undefined) {
        updateData.visibility = visibility;
        // 如果改为公开，设置发布时间
        if (visibility === VideoVisibility.PUBLIC && !video.publishedAt) {
          updateData.publishedAt = new Date();
        }
      }
      if (isAgeRestricted !== undefined) updateData.isAgeRestricted = isAgeRestricted;
      if (language !== undefined) updateData.language = language;
      if (contentWarnings !== undefined) updateData.contentWarnings = contentWarnings;

      const updatedVideo = await Video.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('uploader', 'username nickname avatar verified');

      res.json({
        success: true,
        message: '视频信息更新成功',
        data: { video: updatedVideo }
      } as ApiResponse);

    } catch (error) {
      console.error('更新视频失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 删除视频
   * DELETE /api/videos/:id
   */
  public async deleteVideo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

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

      // 检查权限
      if (video.uploader.toString() !== userId) {
        const user = await User.findById(userId);
        if (!user || user.role !== 'admin') {
          res.status(403).json({
            success: false,
            message: '无权删除此视频'
          } as ApiResponse);
          return;
        }
      }

      // 软删除 - 标记状态为已删除
      video.status = VideoStatus.DELETED;
      video.visibility = VideoVisibility.PRIVATE;
      await video.save();

      // 取消正在处理的任务
      await VideoProcessingJob.updateMany(
        { videoId: id, status: { $in: ['pending', 'processing'] } },
        { status: 'cancelled' }
      );

      // 更新用户视频数量
      await User.findByIdAndUpdate(video.uploader, { 
        $inc: { videoCount: -1 } 
      });

      // TODO: 异步删除文件
      // deleteVideoFile(video.originalUrl);
      // video.qualities.forEach(quality => deleteVideoFile(quality.url));

      res.json({
        success: true,
        message: '视频删除成功'
      } as ApiResponse);

    } catch (error) {
      console.error('删除视频失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 获取视频列表
   * GET /api/videos
   */
  public async getVideoList(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const category = req.query.category as string;
      const tags = req.query.tags as string;
      const search = req.query.search as string;
      const sort = req.query.sort as string || 'createdAt';
      const order = req.query.order as string === 'asc' ? 1 : -1;

      // 构建查询条件
      const query: any = {
        status: VideoStatus.READY,
        visibility: VideoVisibility.PUBLIC
      };

      if (category) {
        query.category = category;
      }

      if (tags) {
        const tagArray = tags.split(',').map(tag => tag.trim());
        query.tags = { $in: tagArray };
      }

      if (search) {
        query.$text = { $search: search };
      }

      // 计算分页
      const pagination = calculatePagination(page, limit, 0);
      
      // 获取总数
      const total = await Video.countDocuments(query);
      
      // 构建排序条件
      let sortQuery: any = {};
      if (search) {
        sortQuery = { score: { $meta: 'textScore' } };
      } else {
        sortQuery[sort] = order;
      }

      // 获取视频列表
      const videos = await Video.find(query)
        .sort(sortQuery)
        .skip(pagination.offset)
        .limit(limit)
        .populate('uploader', 'username nickname avatar verified')
        .select('-originalUrl -qualities.url'); // 不返回播放链接

      // 重新计算分页信息
      const finalPagination = calculatePagination(page, limit, total);

      res.json({
        success: true,
        data: {
          videos,
          pagination: finalPagination
        }
      } as ApiResponse<ListResponse<IVideo>>);

    } catch (error) {
      console.error('获取视频列表失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 获取用户视频列表
   * GET /api/videos/user/:userId
   */
  public async getUserVideos(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        res.status(400).json({
          success: false,
          message: '无效的用户ID'
        } as ApiResponse);
        return;
      }

      // 检查用户是否存在
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: '用户不存在'
        } as ApiResponse);
        return;
      }

      // 是否查看自己的视频
      const isOwnVideos = currentUserId === userId;

      const videos = await Video.getUserVideos(
        new mongoose.Types.ObjectId(userId),
        isOwnVideos,
        page,
        limit
      );

      const total = await Video.countDocuments({
        uploader: userId,
        status: { $ne: VideoStatus.DELETED },
        ...(isOwnVideos ? {} : { 
          visibility: { $in: [VideoVisibility.PUBLIC, VideoVisibility.UNLISTED] }
        })
      });

      const pagination = calculatePagination(page, limit, total);

      res.json({
        success: true,
        data: {
          videos,
          pagination,
          user: {
            username: user.username,
            nickname: user.nickname,
            avatar: user.avatar,
            verified: user.verified
          }
        }
      } as ApiResponse);

    } catch (error) {
      console.error('获取用户视频失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 获取视频处理状态
   * GET /api/videos/:id/processing-status
   */
  public async getProcessingStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

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

      // 检查权限
      if (video.uploader.toString() !== userId) {
        res.status(403).json({
          success: false,
          message: '无权查看此视频的处理状态'
        } as ApiResponse);
        return;
      }

      // 获取处理任务
      const jobs = await VideoProcessingJob.find({ videoId: id })
        .sort({ createdAt: -1 })
        .lean();

      res.json({
        success: true,
        data: {
          video: {
            id: video._id,
            status: video.status,
            processingProgress: video.processingProgress
          },
          jobs
        }
      } as ApiResponse);

    } catch (error) {
      console.error('获取处理状态失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 检查视频访问权限
   */
  private checkVideoAccess(video: IVideo, currentUserId?: string): boolean {
    // 已删除视频不可访问
    if (video.status === VideoStatus.DELETED || video.status === VideoStatus.BLOCKED) {
      return false;
    }

    // 作者可以访问自己的所有视频
    if (currentUserId && video.uploader.toString() === currentUserId) {
      return true;
    }

    // 公开视频所有人都可以访问
    if (video.visibility === VideoVisibility.PUBLIC && video.status === VideoStatus.READY) {
      return true;
    }

    // 不公开但可通过链接访问的视频
    if (video.visibility === VideoVisibility.UNLISTED && video.status === VideoStatus.READY) {
      return true;
    }

    // 其他情况不可访问
    return false;
  }

  /**
   * 创建视频处理任务
   */
  private async createProcessingJobs(video: IVideo, userId: string): Promise<void> {
    try {
      // 创建缩略图生成任务
      const thumbnailJob = new VideoProcessingJob({
        videoId: video._id,
        userId,
        jobType: JobType.THUMBNAIL,
        inputFile: video.originalUrl,
        priority: 80,
        settings: {
          thumbnailCount: 5,
          thumbnailSize: '320x180'
        }
      });

      // 创建转码任务 - 多个分辨率
      const transcodeJobs = [
        { resolution: '720p', bitrate: 2500, priority: 60 },
        { resolution: '1080p', bitrate: 5000, priority: 40 },
        { resolution: '480p', bitrate: 1500, priority: 70 }
      ].map(config => new VideoProcessingJob({
        videoId: video._id,
        userId,
        jobType: JobType.TRANSCODE,
        inputFile: video.originalUrl,
        priority: config.priority,
        settings: {
          outputFormat: 'mp4',
          outputResolution: config.resolution,
          outputBitrate: config.bitrate,
          outputFps: 30
        }
      }));

      // 批量保存任务
      await Promise.all([
        thumbnailJob.save(),
        ...transcodeJobs.map(job => job.save())
      ]);

      // 将任务加入处理队列
      await videoProcessingQueue.addJobs([
        thumbnailJob._id.toString(),
        ...transcodeJobs.map(job => job._id.toString())
      ]);

    } catch (error) {
      console.error('创建处理任务失败:', error);
      throw error;
    }
  }
}

export default new VideoController();