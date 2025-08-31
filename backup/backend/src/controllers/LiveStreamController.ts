/*
 * 大雄视频平台 - 直播控制器
 * 处理直播管理、推流控制、观众互动等功能
 */

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import LiveStream, { ILiveStream, StreamStatus } from '../models/LiveStream';
import LiveMessage, { MessageType } from '../models/LiveMessage';
import User from '../models/User';
import { ApiResponse, ListResponse } from '../types/ApiResponse';
import { calculatePagination, getClientIP } from '../utils/helpers';
import redis from '../config/redis';

export class LiveStreamController {

  /**
   * 创建直播间
   * POST /api/live/streams
   */
  public async createStream(req: Request, res: Response): Promise<void> {
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

      const streamerId = req.user!.id;
      const {
        title,
        description,
        category,
        tags,
        isPrivate,
        isRecordEnabled,
        isReplayEnabled,
        scheduledStartTime
      } = req.body;

      // 检查用户是否已有活跃的直播间
      const existingStream = await LiveStream.findOne({
        streamerId,
        status: { $in: [StreamStatus.LIVE, StreamStatus.PREPARING] }
      });

      if (existingStream) {
        res.status(409).json({
          success: false,
          message: '您已有正在进行的直播，请先结束当前直播'
        } as ApiResponse);
        return;
      }

      // 检查用户直播权限
      const user = await User.findById(streamerId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: '用户不存在'
        } as ApiResponse);
        return;
      }

      // 创建直播间
      const stream = new LiveStream({
        streamerId,
        title,
        description,
        category,
        tags: tags || [],
        isPrivate: isPrivate || false,
        isRecordEnabled: isRecordEnabled !== false,
        isReplayEnabled: isReplayEnabled !== false,
        scheduledStartTime: scheduledStartTime ? new Date(scheduledStartTime) : undefined,
        supportedQualities: ['480p', '720p', '1080p'] // 默认支持的质量
      });

      await stream.save();

      // 生成推流和播放URL
      const rtmpConfig = stream.generateStreamUrls();

      res.status(201).json({
        success: true,
        message: '直播间创建成功',
        data: {
          stream: {
            id: stream._id,
            title: stream.title,
            description: stream.description,
            category: stream.category,
            status: stream.status,
            streamKey: stream.streamKey,
            rtmpConfig
          }
        }
      } as ApiResponse);

    } catch (error) {
      console.error('创建直播间失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 开始直播
   * POST /api/live/streams/:id/start
   */
  public async startStream(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const streamerId = req.user!.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: '无效的直播间ID'
        } as ApiResponse);
        return;
      }

      const stream = await LiveStream.findById(id);
      if (!stream) {
        res.status(404).json({
          success: false,
          message: '直播间不存在'
        } as ApiResponse);
        return;
      }

      // 检查权限
      if (stream.streamerId.toString() !== streamerId) {
        res.status(403).json({
          success: false,
          message: '无权操作此直播间'
        } as ApiResponse);
        return;
      }

      // 检查直播间状态
      if (stream.status === StreamStatus.LIVE) {
        res.status(409).json({
          success: false,
          message: '直播已经开始'
        } as ApiResponse);
        return;
      }

      if (stream.isBanned) {
        res.status(403).json({
          success: false,
          message: '直播间已被封禁'
        } as ApiResponse);
        return;
      }

      // 开始直播
      await stream.startStream();

      res.json({
        success: true,
        message: '直播开始成功',
        data: {
          stream: {
            id: stream._id,
            status: stream.status,
            actualStartTime: stream.actualStartTime
          }
        }
      } as ApiResponse);

    } catch (error) {
      console.error('开始直播失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 结束直播
   * POST /api/live/streams/:id/end
   */
  public async endStream(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const streamerId = req.user!.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: '无效的直播间ID'
        } as ApiResponse);
        return;
      }

      const stream = await LiveStream.findById(id);
      if (!stream) {
        res.status(404).json({
          success: false,
          message: '直播间不存在'
        } as ApiResponse);
        return;
      }

      // 检查权限
      if (stream.streamerId.toString() !== streamerId) {
        res.status(403).json({
          success: false,
          message: '无权操作此直播间'
        } as ApiResponse);
        return;
      }

      // 结束直播
      await stream.endStream();

      res.json({
        success: true,
        message: '直播结束成功',
        data: {
          stream: {
            id: stream._id,
            status: stream.status,
            endTime: stream.endTime,
            duration: stream.stats.duration
          }
        }
      } as ApiResponse);

    } catch (error) {
      console.error('结束直播失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 获取直播间信息
   * GET /api/live/streams/:id
   */
  public async getStreamInfo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const currentUserId = req.user?.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: '无效的直播间ID'
        } as ApiResponse);
        return;
      }

      const stream = await LiveStream.findById(id)
        .populate('streamerId', 'username nickname avatar verified level')
        .lean();

      if (!stream) {
        res.status(404).json({
          success: false,
          message: '直播间不存在'
        } as ApiResponse);
        return;
      }

      // 检查访问权限
      if (stream.isPrivate && stream.streamerId._id.toString() !== currentUserId) {
        res.status(403).json({
          success: false,
          message: '该直播间为私人直播'
        } as ApiResponse);
        return;
      }

      // 构建返回数据（隐藏敏感信息）
      const streamInfo = {
        ...stream,
        rtmpConfig: currentUserId === stream.streamerId._id.toString() ? stream.rtmpConfig : undefined
      };

      res.json({
        success: true,
        data: { stream: streamInfo }
      } as ApiResponse);

    } catch (error) {
      console.error('获取直播间信息失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 获取正在直播的列表
   * GET /api/live/streams
   */
  public async getLiveStreams(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const category = req.query.category as string;
      const sortBy = (req.query.sortBy as string) || 'viewers';

      // 获取直播列表
      const streams = await LiveStream.getLiveStreams(page, limit, category, sortBy as any);

      // 获取总数
      const query: any = {
        status: StreamStatus.LIVE,
        isPrivate: false,
        isBanned: false
      };
      
      if (category) {
        query.category = category;
      }

      const total = await LiveStream.countDocuments(query);
      const pagination = calculatePagination(page, limit, total);

      res.json({
        success: true,
        data: {
          streams,
          pagination
        }
      } as ApiResponse<ListResponse<ILiveStream>>);

    } catch (error) {
      console.error('获取直播列表失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 获取用户的直播列表
   * GET /api/live/streams/user/:userId
   */
  public async getUserStreams(req: Request, res: Response): Promise<void> {
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

      const isOwnStreams = currentUserId === userId;

      const streams = await LiveStream.getUserStreams(
        new mongoose.Types.ObjectId(userId),
        isOwnStreams,
        page,
        limit
      );

      const total = await LiveStream.countDocuments({
        streamerId: userId,
        ...(isOwnStreams ? {} : { isPrivate: false })
      });

      const pagination = calculatePagination(page, limit, total);

      res.json({
        success: true,
        data: {
          streams,
          pagination
        }
      } as ApiResponse);

    } catch (error) {
      console.error('获取用户直播列表失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 更新直播间信息
   * PUT /api/live/streams/:id
   */
  public async updateStream(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const streamerId = req.user!.id;
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
          message: '无效的直播间ID'
        } as ApiResponse);
        return;
      }

      const stream = await LiveStream.findById(id);
      if (!stream) {
        res.status(404).json({
          success: false,
          message: '直播间不存在'
        } as ApiResponse);
        return;
      }

      // 检查权限
      if (stream.streamerId.toString() !== streamerId) {
        res.status(403).json({
          success: false,
          message: '无权编辑此直播间'
        } as ApiResponse);
        return;
      }

      const {
        title,
        description,
        category,
        tags,
        isPrivate,
        isRecordEnabled,
        isReplayEnabled
      } = req.body;

      // 更新允许的字段
      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (category !== undefined) updateData.category = category;
      if (tags !== undefined) updateData.tags = tags;
      if (isPrivate !== undefined) updateData.isPrivate = isPrivate;
      if (isRecordEnabled !== undefined) updateData.isRecordEnabled = isRecordEnabled;
      if (isReplayEnabled !== undefined) updateData.isReplayEnabled = isReplayEnabled;

      const updatedStream = await LiveStream.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        message: '直播间信息更新成功',
        data: { stream: updatedStream }
      } as ApiResponse);

    } catch (error) {
      console.error('更新直播间失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 删除直播间
   * DELETE /api/live/streams/:id
   */
  public async deleteStream(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const streamerId = req.user!.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: '无效的直播间ID'
        } as ApiResponse);
        return;
      }

      const stream = await LiveStream.findById(id);
      if (!stream) {
        res.status(404).json({
          success: false,
          message: '直播间不存在'
        } as ApiResponse);
        return;
      }

      // 检查权限
      if (stream.streamerId.toString() !== streamerId) {
        res.status(403).json({
          success: false,
          message: '无权删除此直播间'
        } as ApiResponse);
        return;
      }

      // 不能删除正在直播的房间
      if (stream.status === StreamStatus.LIVE) {
        res.status(409).json({
          success: false,
          message: '请先结束直播再删除直播间'
        } as ApiResponse);
        return;
      }

      await LiveStream.findByIdAndDelete(id);

      res.json({
        success: true,
        message: '直播间删除成功'
      } as ApiResponse);

    } catch (error) {
      console.error('删除直播间失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 获取直播间聊天记录
   * GET /api/live/streams/:id/messages
   */
  public async getStreamMessages(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const before = req.query.before ? new Date(req.query.before as string) : undefined;
      const messageTypes = req.query.types ? (req.query.types as string).split(',') as MessageType[] : undefined;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: '无效的直播间ID'
        } as ApiResponse);
        return;
      }

      const stream = await LiveStream.findById(id);
      if (!stream) {
        res.status(404).json({
          success: false,
          message: '直播间不存在'
        } as ApiResponse);
        return;
      }

      const messages = await LiveMessage.getStreamMessages(
        new mongoose.Types.ObjectId(id),
        limit,
        before,
        messageTypes
      );

      res.json({
        success: true,
        data: { messages }
      } as ApiResponse);

    } catch (error) {
      console.error('获取聊天记录失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 获取直播统计信息
   * GET /api/live/streams/:id/stats
   */
  public async getStreamStats(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const streamerId = req.user!.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: '无效的直播间ID'
        } as ApiResponse);
        return;
      }

      const stream = await LiveStream.findById(id);
      if (!stream) {
        res.status(404).json({
          success: false,
          message: '直播间不存在'
        } as ApiResponse);
        return;
      }

      // 检查权限 - 只有主播可以查看详细统计
      if (stream.streamerId.toString() !== streamerId) {
        res.status(403).json({
          success: false,
          message: '无权查看此直播间的统计信息'
        } as ApiResponse);
        return;
      }

      // 获取礼物统计
      const giftStats = await LiveMessage.getGiftStats(new mongoose.Types.ObjectId(id));

      // 构建统计数据
      const stats = {
        basic: stream.stats,
        gifts: giftStats,
        performance: {
          isActive: stream.isStreamActive(),
          uptime: stream.actualStartTime ? 
            Math.floor((new Date().getTime() - stream.actualStartTime.getTime()) / 1000) : 0,
          avgViewers: stream.stats.totalViews / Math.max(stream.stats.duration / 3600, 1) // 每小时平均观众
        }
      };

      res.json({
        success: true,
        data: { stats }
      } as ApiResponse);

    } catch (error) {
      console.error('获取直播统计失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 心跳接口（推流端调用）
   * POST /api/live/streams/:id/heartbeat
   */
  public async streamHeartbeat(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { streamKey, viewerCount } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: '无效的直播间ID'
        } as ApiResponse);
        return;
      }

      const stream = await LiveStream.findById(id);
      if (!stream) {
        res.status(404).json({
          success: false,
          message: '直播间不存在'
        } as ApiResponse);
        return;
      }

      // 验证推流密钥
      if (stream.streamKey !== streamKey) {
        res.status(401).json({
          success: false,
          message: '无效的推流密钥'
        } as ApiResponse);
        return;
      }

      // 更新心跳和观众数
      if (typeof viewerCount === 'number' && viewerCount >= 0) {
        await stream.updateViewerCount(viewerCount);
      } else {
        stream.lastHeartbeat = new Date();
        await stream.save();
      }

      res.json({
        success: true,
        message: '心跳更新成功'
      } as ApiResponse);

    } catch (error) {
      console.error('更新直播心跳失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }
}

export default new LiveStreamController();