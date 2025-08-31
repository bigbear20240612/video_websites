/*
 * 大雄视频平台 - 评论控制器
 * 处理评论的增删改查、点赞、回复等功能
 */

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Comment, { IComment, CommentStatus } from '../models/Comment';
import Video from '../models/Video';
import User from '../models/User';
import { ApiResponse, ListResponse } from '../types/ApiResponse';
import { calculatePagination, getClientIP } from '../utils/helpers';
import redis from '../config/redis';

export class CommentController {

  /**
   * 添加评论
   * POST /api/comments
   */
  public async createComment(req: Request, res: Response): Promise<void> {
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
      const { videoId, content, parentId } = req.body;

      // 验证视频是否存在
      const video = await Video.findById(videoId);
      if (!video) {
        res.status(404).json({
          success: false,
          message: '视频不存在'
        } as ApiResponse);
        return;
      }

      // 检查视频是否允许评论
      if (!video.allowComments) {
        res.status(403).json({
          success: false,
          message: '该视频已关闭评论功能'
        } as ApiResponse);
        return;
      }

      // 如果是回复，验证父评论是否存在
      if (parentId) {
        const parentComment = await Comment.findById(parentId);
        if (!parentComment || parentComment.videoId.toString() !== videoId) {
          res.status(404).json({
            success: false,
            message: '父评论不存在或不属于该视频'
          } as ApiResponse);
          return;
        }
      }

      // 检查用户评论频率限制
      const rateLimitKey = `comment_rate:${userId}`;
      const recentComments = await redis.get(rateLimitKey);
      
      if (recentComments && parseInt(recentComments) >= 5) {
        res.status(429).json({
          success: false,
          message: '评论过于频繁，请稍后重试'
        } as ApiResponse);
        return;
      }

      // 创建评论
      const comment = new Comment({
        videoId,
        userId,
        content,
        parentId: parentId || null
      });

      await comment.save();

      // 更新频率限制计数
      const currentCount = await redis.incr(rateLimitKey);
      if (currentCount === 1) {
        await redis.expire(rateLimitKey, 300); // 5分钟内最多5条评论
      }

      // 更新视频评论数
      await Video.findByIdAndUpdate(videoId, {
        $inc: { 'stats.comments': 1 }
      });

      // 如果是回复，更新父评论回复数
      if (parentId) {
        await Comment.findByIdAndUpdate(parentId, {
          $inc: { replies: 1 }
        });
      }

      // 获取完整的评论信息（包含用户信息）
      const fullComment = await Comment.findById(comment._id)
        .populate('userId', 'username nickname avatar verified')
        .lean();

      res.status(201).json({
        success: true,
        message: '评论发布成功',
        data: { comment: fullComment }
      } as ApiResponse);

    } catch (error) {
      console.error('创建评论失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 获取视频评论列表
   * GET /api/comments/video/:videoId
   */
  public async getVideoComments(req: Request, res: Response): Promise<void> {
    try {
      const { videoId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const sortBy = (req.query.sortBy as string) || 'newest';

      if (!mongoose.Types.ObjectId.isValid(videoId)) {
        res.status(400).json({
          success: false,
          message: '无效的视频ID'
        } as ApiResponse);
        return;
      }

      // 验证视频是否存在
      const video = await Video.findById(videoId);
      if (!video) {
        res.status(404).json({
          success: false,
          message: '视频不存在'
        } as ApiResponse);
        return;
      }

      // 获取评论列表
      const comments = await Comment.getVideoComments(
        new mongoose.Types.ObjectId(videoId),
        page,
        limit,
        sortBy as any
      );

      // 获取总评论数
      const total = await Comment.countDocuments({
        videoId,
        parentId: null,
        status: CommentStatus.ACTIVE
      });

      const pagination = calculatePagination(page, limit, total);

      // 如果用户已登录，获取用户对评论的操作状态
      const userActions = req.user ? await this.getUserCommentActions(req.user.id, comments.map(c => c._id)) : {};

      res.json({
        success: true,
        data: {
          comments: comments.map(comment => ({
            ...comment,
            userActions: userActions[comment._id.toString()] || { liked: false, disliked: false }
          })),
          pagination
        }
      } as ApiResponse);

    } catch (error) {
      console.error('获取视频评论失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 获取评论回复
   * GET /api/comments/:id/replies
   */
  public async getCommentReplies(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: '无效的评论ID'
        } as ApiResponse);
        return;
      }

      // 验证父评论是否存在
      const parentComment = await Comment.findById(id);
      if (!parentComment) {
        res.status(404).json({
          success: false,
          message: '评论不存在'
        } as ApiResponse);
        return;
      }

      // 获取回复列表
      const replies = await Comment.getCommentReplies(
        new mongoose.Types.ObjectId(id),
        page,
        limit
      );

      // 获取总回复数
      const total = await Comment.countDocuments({
        parentId: id,
        status: CommentStatus.ACTIVE
      });

      const pagination = calculatePagination(page, limit, total);

      // 获取用户操作状态
      const userActions = req.user ? await this.getUserCommentActions(req.user.id, replies.map(r => r._id)) : {};

      res.json({
        success: true,
        data: {
          replies: replies.map(reply => ({
            ...reply,
            userActions: userActions[reply._id.toString()] || { liked: false, disliked: false }
          })),
          pagination
        }
      } as ApiResponse);

    } catch (error) {
      console.error('获取评论回复失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 点赞/取消点赞评论
   * POST /api/comments/:id/like
   */
  public async likeComment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: '无效的评论ID'
        } as ApiResponse);
        return;
      }

      const comment = await Comment.findById(id);
      if (!comment) {
        res.status(404).json({
          success: false,
          message: '评论不存在'
        } as ApiResponse);
        return;
      }

      // 检查是否已经点赞
      const likeKey = `comment_likes:${userId}`;
      const dislikeKey = `comment_dislikes:${userId}`;
      
      const hasLiked = await redis.sismember(likeKey, id);
      const hasDisliked = await redis.sismember(dislikeKey, id);

      if (hasLiked) {
        // 取消点赞
        await redis.srem(likeKey, id);
        await Comment.findByIdAndUpdate(id, { $inc: { likes: -1 } });
        
        res.json({
          success: true,
          message: '取消点赞成功',
          data: { liked: false, likes: comment.likes - 1 }
        } as ApiResponse);
      } else {
        // 添加点赞
        await redis.sadd(likeKey, id);
        await redis.expire(likeKey, 30 * 24 * 60 * 60); // 保存30天
        
        let likesIncrement = 1;
        let dislikesIncrement = 0;

        // 如果之前点了踩，取消踩
        if (hasDisliked) {
          await redis.srem(dislikeKey, id);
          dislikesIncrement = -1;
        }

        await Comment.findByIdAndUpdate(id, {
          $inc: { 
            likes: likesIncrement,
            dislikes: dislikesIncrement
          }
        });

        res.json({
          success: true,
          message: '点赞成功',
          data: { 
            liked: true, 
            likes: comment.likes + likesIncrement,
            dislikes: comment.dislikes + dislikesIncrement
          }
        } as ApiResponse);
      }

    } catch (error) {
      console.error('点赞评论失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 踩/取消踩评论
   * POST /api/comments/:id/dislike
   */
  public async dislikeComment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: '无效的评论ID'
        } as ApiResponse);
        return;
      }

      const comment = await Comment.findById(id);
      if (!comment) {
        res.status(404).json({
          success: false,
          message: '评论不存在'
        } as ApiResponse);
        return;
      }

      const likeKey = `comment_likes:${userId}`;
      const dislikeKey = `comment_dislikes:${userId}`;
      
      const hasLiked = await redis.sismember(likeKey, id);
      const hasDisliked = await redis.sismember(dislikeKey, id);

      if (hasDisliked) {
        // 取消踩
        await redis.srem(dislikeKey, id);
        await Comment.findByIdAndUpdate(id, { $inc: { dislikes: -1 } });
        
        res.json({
          success: true,
          message: '取消踩成功',
          data: { disliked: false, dislikes: comment.dislikes - 1 }
        } as ApiResponse);
      } else {
        // 添加踩
        await redis.sadd(dislikeKey, id);
        await redis.expire(dislikeKey, 30 * 24 * 60 * 60); // 保存30天
        
        let likesIncrement = 0;
        let dislikesIncrement = 1;

        // 如果之前点了赞，取消赞
        if (hasLiked) {
          await redis.srem(likeKey, id);
          likesIncrement = -1;
        }

        await Comment.findByIdAndUpdate(id, {
          $inc: { 
            likes: likesIncrement,
            dislikes: dislikesIncrement
          }
        });

        res.json({
          success: true,
          message: '踩成功',
          data: { 
            disliked: true, 
            likes: comment.likes + likesIncrement,
            dislikes: comment.dislikes + dislikesIncrement
          }
        } as ApiResponse);
      }

    } catch (error) {
      console.error('踩评论失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 编辑评论
   * PUT /api/comments/:id
   */
  public async updateComment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { content } = req.body;
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
          message: '无效的评论ID'
        } as ApiResponse);
        return;
      }

      const comment = await Comment.findById(id);
      if (!comment) {
        res.status(404).json({
          success: false,
          message: '评论不存在'
        } as ApiResponse);
        return;
      }

      // 检查权限 - 只有作者可以编辑
      if (comment.userId.toString() !== userId) {
        res.status(403).json({
          success: false,
          message: '无权编辑此评论'
        } as ApiResponse);
        return;
      }

      // 检查评论创建时间 - 只能在15分钟内编辑
      const timeDiff = new Date().getTime() - comment.createdAt.getTime();
      const maxEditTime = 15 * 60 * 1000; // 15分钟

      if (timeDiff > maxEditTime) {
        res.status(403).json({
          success: false,
          message: '评论发布超过15分钟，无法编辑'
        } as ApiResponse);
        return;
      }

      // 更新评论内容
      await comment.markAsEdited(content);

      const updatedComment = await Comment.findById(id)
        .populate('userId', 'username nickname avatar verified')
        .lean();

      res.json({
        success: true,
        message: '评论编辑成功',
        data: { comment: updatedComment }
      } as ApiResponse);

    } catch (error) {
      console.error('编辑评论失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 删除评论
   * DELETE /api/comments/:id
   */
  public async deleteComment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: '无效的评论ID'
        } as ApiResponse);
        return;
      }

      const comment = await Comment.findById(id);
      if (!comment) {
        res.status(404).json({
          success: false,
          message: '评论不存在'
        } as ApiResponse);
        return;
      }

      // 检查权限 - 作者或管理员可以删除
      const canDelete = comment.userId.toString() === userId;
      
      if (!canDelete) {
        const user = await User.findById(userId);
        if (!user || user.role !== 'admin') {
          res.status(403).json({
            success: false,
            message: '无权删除此评论'
          } as ApiResponse);
          return;
        }
      }

      // 软删除评论
      await comment.softDelete();

      // 更新视频评论数
      await Video.findByIdAndUpdate(comment.videoId, {
        $inc: { 'stats.comments': -1 }
      });

      // 如果有父评论，减少回复数
      if (comment.parentId) {
        await Comment.findByIdAndUpdate(comment.parentId, {
          $inc: { replies: -1 }
        });
      }

      res.json({
        success: true,
        message: '评论删除成功'
      } as ApiResponse);

    } catch (error) {
      console.error('删除评论失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 举报评论
   * POST /api/comments/:id/report
   */
  public async reportComment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason, description } = req.body;
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
          message: '无效的评论ID'
        } as ApiResponse);
        return;
      }

      const comment = await Comment.findById(id);
      if (!comment) {
        res.status(404).json({
          success: false,
          message: '评论不存在'
        } as ApiResponse);
        return;
      }

      // 检查是否已经举报过
      const reportKey = `comment_reports:${userId}`;
      const hasReported = await redis.sismember(reportKey, id);

      if (hasReported) {
        res.status(409).json({
          success: false,
          message: '您已经举报过此评论'
        } as ApiResponse);
        return;
      }

      // 记录举报
      await redis.sadd(reportKey, id);
      await redis.expire(reportKey, 30 * 24 * 60 * 60); // 保存30天

      // 增加举报计数
      const reportCountKey = `comment_report_count:${id}`;
      const reportCount = await redis.incr(reportCountKey);
      await redis.expire(reportCountKey, 7 * 24 * 60 * 60); // 保存7天

      // 记录举报详情
      const reportDetailKey = `comment_report_details:${id}`;
      const reportDetail = {
        userId,
        reason,
        description,
        reportedAt: new Date().toISOString(),
        ip: getClientIP(req)
      };
      
      await redis.lpush(reportDetailKey, JSON.stringify(reportDetail));
      await redis.expire(reportDetailKey, 30 * 24 * 60 * 60);

      // 如果举报数量达到阈值，自动隐藏评论
      if (reportCount >= 5) {
        await Comment.findByIdAndUpdate(id, {
          status: CommentStatus.HIDDEN,
          moderationFlags: [reason]
        });
      }

      res.json({
        success: true,
        message: '举报提交成功，我们会及时处理'
      } as ApiResponse);

    } catch (error) {
      console.error('举报评论失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 获取用户评论历史
   * GET /api/comments/user/:userId
   */
  public async getUserComments(req: Request, res: Response): Promise<void> {
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

      // 只有自己或管理员可以查看完整评论历史
      const isOwnComments = currentUserId === userId;
      const isAdmin = req.user && await User.findById(currentUserId).then(u => u?.role === 'admin');

      if (!isOwnComments && !isAdmin) {
        res.status(403).json({
          success: false,
          message: '无权查看该用户的评论历史'
        } as ApiResponse);
        return;
      }

      const comments = await Comment.getUserComments(
        new mongoose.Types.ObjectId(userId),
        page,
        limit
      );

      const total = await Comment.countDocuments({
        userId,
        status: { $ne: CommentStatus.DELETED }
      });

      const pagination = calculatePagination(page, limit, total);

      res.json({
        success: true,
        data: {
          comments,
          pagination,
          user: {
            username: user.username,
            nickname: user.nickname,
            avatar: user.avatar
          }
        }
      } as ApiResponse);

    } catch (error) {
      console.error('获取用户评论失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 获取用户对评论的操作状态
   */
  private async getUserCommentActions(userId: string, commentIds: any[]): Promise<{ [key: string]: any }> {
    if (!commentIds.length) return {};

    const likeKey = `comment_likes:${userId}`;
    const dislikeKey = `comment_dislikes:${userId}`;

    const actions: { [key: string]: any } = {};

    // 批量检查点赞状态
    for (const commentId of commentIds) {
      const [liked, disliked] = await Promise.all([
        redis.sismember(likeKey, commentId.toString()),
        redis.sismember(dislikeKey, commentId.toString())
      ]);

      actions[commentId.toString()] = {
        liked: Boolean(liked),
        disliked: Boolean(disliked)
      };
    }

    return actions;
  }
}

export default new CommentController();