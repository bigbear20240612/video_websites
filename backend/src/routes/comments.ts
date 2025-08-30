/*
 * 大雄视频平台 - 评论管理路由
 * 定义评论相关的API路由
 */

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import rateLimit from 'express-rate-limit';
import CommentController from '../controllers/CommentController';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware';

const router = Router();

// 评论创建限流：每5分钟最多5条评论
const commentCreateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5分钟
  max: 5, // 最多5条
  message: {
    success: false,
    message: '评论过于频繁，请稍后重试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `comment_create:${req.user?.id || req.ip}`;
  }
});

// 评论操作限流：每分钟最多20次操作（点赞、踩等）
const commentActionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 20, // 最多20次
  message: {
    success: false,
    message: '操作过于频繁，请稍后重试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `comment_action:${req.user?.id || req.ip}`;
  }
});

// 举报限流：每小时最多10次举报
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 10, // 最多10次
  message: {
    success: false,
    message: '举报过于频繁，请稍后重试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `comment_report:${req.user?.id || req.ip}`;
  }
});

// ==================== 验证规则 ====================

// 评论ID验证
const commentIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('无效的评论ID格式')
];

// 视频ID验证
const videoIdValidation = [
  param('videoId')
    .isMongoId()
    .withMessage('无效的视频ID格式')
];

// 用户ID验证
const userIdValidation = [
  param('userId')
    .isMongoId()
    .withMessage('无效的用户ID格式')
];

// 创建评论验证
const createCommentValidation = [
  body('videoId')
    .isMongoId()
    .withMessage('无效的视频ID格式'),
  
  body('content')
    .trim()
    .notEmpty()
    .withMessage('评论内容不能为空')
    .isLength({ min: 1, max: 2000 })
    .withMessage('评论内容长度必须在1-2000个字符之间')
    .custom((value) => {
      // 检查是否全是空白字符或特殊字符
      const meaningfulContent = value.replace(/[\s\n\r\t]/g, '').replace(/[^\w\u4e00-\u9fa5]/g, '');
      if (meaningfulContent.length < 1) {
        throw new Error('评论内容不能全是空白字符或特殊符号');
      }
      return true;
    }),
  
  body('parentId')
    .optional()
    .isMongoId()
    .withMessage('无效的父评论ID格式')
];

// 编辑评论验证
const updateCommentValidation = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('评论内容不能为空')
    .isLength({ min: 1, max: 2000 })
    .withMessage('评论内容长度必须在1-2000个字符之间')
];

// 举报评论验证
const reportCommentValidation = [
  body('reason')
    .notEmpty()
    .withMessage('请选择举报原因')
    .isIn(['spam', 'harassment', 'hate_speech', 'violence', 'adult', 'copyright', 'other'])
    .withMessage('举报原因无效'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('举报描述不能超过500个字符')
];

// 评论列表查询验证
const commentListValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('每页数量必须在1-50之间'),
  
  query('sortBy')
    .optional()
    .isIn(['newest', 'oldest', 'popular'])
    .withMessage('排序方式无效')
];

// ==================== 路由定义 ====================

/**
 * @route POST /api/comments
 * @desc 添加评论
 * @access Private
 */
router.post('/',
  authMiddleware,
  commentCreateLimiter,
  createCommentValidation,
  CommentController.createComment
);

/**
 * @route GET /api/comments/video/:videoId
 * @desc 获取视频评论列表
 * @access Public
 */
router.get('/video/:videoId',
  optionalAuthMiddleware,
  videoIdValidation,
  commentListValidation,
  CommentController.getVideoComments
);

/**
 * @route GET /api/comments/:id/replies
 * @desc 获取评论回复
 * @access Public
 */
router.get('/:id/replies',
  optionalAuthMiddleware,
  commentIdValidation,
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('每页数量必须在1-20之间'),
  CommentController.getCommentReplies
);

/**
 * @route POST /api/comments/:id/like
 * @desc 点赞/取消点赞评论
 * @access Private
 */
router.post('/:id/like',
  authMiddleware,
  commentActionLimiter,
  commentIdValidation,
  CommentController.likeComment
);

/**
 * @route POST /api/comments/:id/dislike
 * @desc 踩/取消踩评论
 * @access Private
 */
router.post('/:id/dislike',
  authMiddleware,
  commentActionLimiter,
  commentIdValidation,
  CommentController.dislikeComment
);

/**
 * @route PUT /api/comments/:id
 * @desc 编辑评论
 * @access Private (Author)
 */
router.put('/:id',
  authMiddleware,
  commentIdValidation,
  updateCommentValidation,
  CommentController.updateComment
);

/**
 * @route DELETE /api/comments/:id
 * @desc 删除评论
 * @access Private (Author/Admin)
 */
router.delete('/:id',
  authMiddleware,
  commentIdValidation,
  CommentController.deleteComment
);

/**
 * @route POST /api/comments/:id/report
 * @desc 举报评论
 * @access Private
 */
router.post('/:id/report',
  authMiddleware,
  reportLimiter,
  commentIdValidation,
  reportCommentValidation,
  CommentController.reportComment
);

/**
 * @route GET /api/comments/user/:userId
 * @desc 获取用户评论历史
 * @access Private (Self/Admin)
 */
router.get('/user/:userId',
  authMiddleware,
  userIdValidation,
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('每页数量必须在1-50之间'),
  CommentController.getUserComments
);

// ==================== 特殊路由 ====================

/**
 * @route GET /api/comments/popular/:videoId
 * @desc 获取视频热门评论
 * @access Public
 */
router.get('/popular/:videoId',
  optionalAuthMiddleware,
  videoIdValidation,
  async (req, res) => {
    try {
      const { videoId } = req.params;
      const limit = Math.min(parseInt(req.query.limit as string) || 5, 10);
      
      const { default: Comment } = await import('../models/Comment');
      const { default: mongoose } = await import('mongoose');
      
      const comments = await Comment.getPopularComments(
        new mongoose.Types.ObjectId(videoId),
        limit
      );
      
      res.json({
        success: true,
        data: { comments }
      });
    } catch (error) {
      console.error('获取热门评论失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

/**
 * @route GET /api/comments/search
 * @desc 搜索评论
 * @access Public
 */
router.get('/search',
  query('q')
    .trim()
    .notEmpty()
    .withMessage('搜索关键词不能为空')
    .isLength({ min: 1, max: 100 })
    .withMessage('搜索关键词长度必须在1-100个字符之间'),
  query('videoId')
    .optional()
    .isMongoId()
    .withMessage('无效的视频ID格式'),
  commentListValidation,
  async (req, res) => {
    try {
      const query = req.query.q as string;
      const videoId = req.query.videoId as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      
      const { default: Comment } = await import('../models/Comment');
      const { default: mongoose } = await import('mongoose');
      
      const comments = await Comment.searchComments(
        query,
        videoId ? new mongoose.Types.ObjectId(videoId) : undefined,
        page,
        limit
      );
      
      // 获取搜索结果总数（简化版）
      const total = comments.length;
      
      res.json({
        success: true,
        data: {
          comments,
          query,
          total
        }
      });
    } catch (error) {
      console.error('搜索评论失败:', error);
      res.status(500).json({
        success: false,
        message: '搜索失败'
      });
    }
  }
);

/**
 * @route GET /api/comments/stats/:videoId
 * @desc 获取视频评论统计信息
 * @access Public
 */
router.get('/stats/:videoId',
  videoIdValidation,
  async (req, res) => {
    try {
      const { videoId } = req.params;
      
      const { default: Comment, CommentStatus } = await import('../models/Comment');
      
      const stats = await Comment.aggregate([
        {
          $match: {
            videoId: new mongoose.Types.ObjectId(videoId),
            status: CommentStatus.ACTIVE
          }
        },
        {
          $group: {
            _id: null,
            totalComments: { $sum: 1 },
            totalLikes: { $sum: '$likes' },
            totalReplies: { $sum: '$replies' },
            avgLikes: { $avg: '$likes' }
          }
        }
      ]);
      
      const result = stats[0] || {
        totalComments: 0,
        totalLikes: 0,
        totalReplies: 0,
        avgLikes: 0
      };
      
      res.json({
        success: true,
        data: { stats: result }
      });
    } catch (error) {
      console.error('获取评论统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取统计信息失败'
      });
    }
  }
);

// ==================== 错误处理中间件 ====================

router.use((error: any, req: any, res: any, next: any) => {
  console.error('评论路由错误:', error);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

export default router;