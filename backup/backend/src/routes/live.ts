/*
 * 大雄视频平台 - 直播管理路由
 * 定义直播相关的API路由
 */

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import rateLimit from 'express-rate-limit';
import LiveStreamController from '../controllers/LiveStreamController';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware';

const router = Router();

// 直播创建限流：每小时最多创建3个直播间
const streamCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 3, // 最多3个
  message: {
    success: false,
    message: '直播间创建过于频繁，请稍后重试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `stream_create:${req.user?.id}`;
  }
});

// 直播操作限流：每分钟最多20次操作
const streamActionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 20, // 最多20次
  message: {
    success: false,
    message: '直播操作过于频繁，请稍后重试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `stream_action:${req.user?.id || req.ip}`;
  }
});

// 心跳限流：每分钟最多60次心跳
const heartbeatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 60, // 最多60次
  message: {
    success: false,
    message: '心跳请求过于频繁'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // 跳过来自推流服务器的请求
    const trustedIPs = ['127.0.0.1', '::1', process.env.RTMP_SERVER_IP].filter(Boolean);
    return trustedIPs.includes(req.ip);
  }
});

// ==================== 验证规则 ====================

// 直播间ID验证
const streamIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('无效的直播间ID格式')
];

// 用户ID验证
const userIdValidation = [
  param('userId')
    .isMongoId()
    .withMessage('无效的用户ID格式')
];

// 创建直播间验证
const createStreamValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('直播标题不能为空')
    .isLength({ min: 1, max: 200 })
    .withMessage('标题长度必须在1-200个字符之间'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('描述不能超过2000个字符'),
  
  body('category')
    .notEmpty()
    .withMessage('请选择直播分类')
    .isIn(['gaming', 'music', 'talk_show', 'education', 'sports', 'cooking', 'art', 'technology', 'lifestyle', 'entertainment'])
    .withMessage('无效的直播分类'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是数组')
    .custom((tags) => {
      if (tags && tags.length > 10) {
        throw new Error('标签数量不能超过10个');
      }
      if (tags && tags.some((tag: any) => typeof tag !== 'string' || tag.length > 50)) {
        throw new Error('单个标签长度不能超过50个字符');
      }
      return true;
    }),
  
  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('私密设置必须是布尔值'),
  
  body('isRecordEnabled')
    .optional()
    .isBoolean()
    .withMessage('录制设置必须是布尔值'),
  
  body('isReplayEnabled')
    .optional()
    .isBoolean()
    .withMessage('回放设置必须是布尔值'),
  
  body('scheduledStartTime')
    .optional()
    .isISO8601()
    .withMessage('预定开始时间格式无效')
    .custom((value) => {
      if (value) {
        const scheduledTime = new Date(value);
        const now = new Date();
        const maxFuture = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 最多7天后
        
        if (scheduledTime <= now) {
          throw new Error('预定时间必须是将来的时间');
        }
        
        if (scheduledTime > maxFuture) {
          throw new Error('预定时间不能超过7天后');
        }
      }
      return true;
    })
];

// 更新直播间验证
const updateStreamValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('标题长度必须在1-200个字符之间'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('描述不能超过2000个字符'),
  
  body('category')
    .optional()
    .isIn(['gaming', 'music', 'talk_show', 'education', 'sports', 'cooking', 'art', 'technology', 'lifestyle', 'entertainment'])
    .withMessage('无效的直播分类'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是数组')
    .custom((tags) => {
      if (tags && tags.length > 10) {
        throw new Error('标签数量不能超过10个');
      }
      if (tags && tags.some((tag: any) => typeof tag !== 'string' || tag.length > 50)) {
        throw new Error('单个标签长度不能超过50个字符');
      }
      return true;
    }),
  
  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('私密设置必须是布尔值'),
  
  body('isRecordEnabled')
    .optional()
    .isBoolean()
    .withMessage('录制设置必须是布尔值'),
  
  body('isReplayEnabled')
    .optional()
    .isBoolean()
    .withMessage('回放设置必须是布尔值')
];

// 直播列表查询验证
const streamListValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('每页数量必须在1-50之间'),
  
  query('category')
    .optional()
    .isIn(['gaming', 'music', 'talk_show', 'education', 'sports', 'cooking', 'art', 'technology', 'lifestyle', 'entertainment'])
    .withMessage('无效的直播分类'),
  
  query('sortBy')
    .optional()
    .isIn(['viewers', 'recent'])
    .withMessage('排序方式只能是 viewers 或 recent')
];

// 聊天记录查询验证
const messageListValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('消息数量限制必须在1-100之间'),
  
  query('before')
    .optional()
    .isISO8601()
    .withMessage('时间格式无效'),
  
  query('types')
    .optional()
    .isString()
    .withMessage('消息类型必须是字符串')
    .custom((value) => {
      if (value) {
        const validTypes = ['chat', 'gift', 'follow', 'share', 'like', 'system', 'superchat'];
        const types = value.split(',');
        const invalidTypes = types.filter((type: string) => !validTypes.includes(type));
        if (invalidTypes.length > 0) {
          throw new Error(`无效的消息类型: ${invalidTypes.join(', ')}`);
        }
      }
      return true;
    })
];

// 心跳验证
const heartbeatValidation = [
  body('streamKey')
    .notEmpty()
    .withMessage('推流密钥不能为空')
    .isLength({ min: 10 })
    .withMessage('无效的推流密钥'),
  
  body('viewerCount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('观众数必须是非负整数')
];

// ==================== 路由定义 ====================

/**
 * @route POST /api/live/streams
 * @desc 创建直播间
 * @access Private
 */
router.post('/streams',
  authMiddleware,
  streamCreateLimiter,
  createStreamValidation,
  LiveStreamController.createStream
);

/**
 * @route GET /api/live/streams/:id
 * @desc 获取直播间信息
 * @access Public/Private
 */
router.get('/streams/:id',
  optionalAuthMiddleware,
  streamIdValidation,
  LiveStreamController.getStreamInfo
);

/**
 * @route PUT /api/live/streams/:id
 * @desc 更新直播间信息
 * @access Private (Owner)
 */
router.put('/streams/:id',
  authMiddleware,
  streamActionLimiter,
  streamIdValidation,
  updateStreamValidation,
  LiveStreamController.updateStream
);

/**
 * @route DELETE /api/live/streams/:id
 * @desc 删除直播间
 * @access Private (Owner)
 */
router.delete('/streams/:id',
  authMiddleware,
  streamActionLimiter,
  streamIdValidation,
  LiveStreamController.deleteStream
);

/**
 * @route POST /api/live/streams/:id/start
 * @desc 开始直播
 * @access Private (Owner)
 */
router.post('/streams/:id/start',
  authMiddleware,
  streamActionLimiter,
  streamIdValidation,
  LiveStreamController.startStream
);

/**
 * @route POST /api/live/streams/:id/end
 * @desc 结束直播
 * @access Private (Owner)
 */
router.post('/streams/:id/end',
  authMiddleware,
  streamActionLimiter,
  streamIdValidation,
  LiveStreamController.endStream
);

/**
 * @route GET /api/live/streams
 * @desc 获取正在直播的列表
 * @access Public
 */
router.get('/streams',
  streamListValidation,
  LiveStreamController.getLiveStreams
);

/**
 * @route GET /api/live/streams/user/:userId
 * @desc 获取用户的直播列表
 * @access Public/Private
 */
router.get('/streams/user/:userId',
  optionalAuthMiddleware,
  userIdValidation,
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('每页数量必须在1-50之间'),
  LiveStreamController.getUserStreams
);

/**
 * @route GET /api/live/streams/:id/messages
 * @desc 获取直播间聊天记录
 * @access Public
 */
router.get('/streams/:id/messages',
  streamIdValidation,
  messageListValidation,
  LiveStreamController.getStreamMessages
);

/**
 * @route GET /api/live/streams/:id/stats
 * @desc 获取直播统计信息
 * @access Private (Owner)
 */
router.get('/streams/:id/stats',
  authMiddleware,
  streamIdValidation,
  LiveStreamController.getStreamStats
);

/**
 * @route POST /api/live/streams/:id/heartbeat
 * @desc 推流心跳接口
 * @access Public (但需要验证推流密钥)
 */
router.post('/streams/:id/heartbeat',
  heartbeatLimiter,
  streamIdValidation,
  heartbeatValidation,
  LiveStreamController.streamHeartbeat
);

// ==================== 特殊路由 ====================

/**
 * @route GET /api/live/categories
 * @desc 获取直播分类列表
 * @access Public
 */
router.get('/categories', (req, res) => {
  const categories = [
    { id: 'gaming', name: '游戏直播', icon: '🎮', description: '各类游戏直播内容' },
    { id: 'music', name: '音乐表演', icon: '🎵', description: '音乐演奏、演唱等' },
    { id: 'talk_show', name: '脱口秀', icon: '🎙️', description: '聊天、访谈节目' },
    { id: 'education', name: '教育培训', icon: '📚', description: '知识分享、在线教学' },
    { id: 'sports', name: '体育运动', icon: '⚽', description: '体育赛事、健身等' },
    { id: 'cooking', name: '美食烹饪', icon: '🍳', description: '烹饪教学、美食分享' },
    { id: 'art', name: '艺术创作', icon: '🎨', description: '绘画、手工、设计等' },
    { id: 'technology', name: '科技数码', icon: '💻', description: '科技产品、编程等' },
    { id: 'lifestyle', name: '生活方式', icon: '🏠', description: '日常生活、时尚等' },
    { id: 'entertainment', name: '娱乐综艺', icon: '🎭', description: '娱乐节目、表演等' }
  ];

  res.json({
    success: true,
    data: { categories }
  });
});

/**
 * @route GET /api/live/popular
 * @desc 获取热门直播
 * @access Public
 */
router.get('/popular',
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('限制数量必须在1-20之间'),
  async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);
      
      const { default: LiveStream, StreamStatus } = await import('../models/LiveStream');
      
      const popularStreams = await LiveStream.find({
        status: StreamStatus.LIVE,
        isPrivate: false,
        isBanned: false,
        'stats.currentViewers': { $gte: 10 } // 至少10个观众
      })
      .sort({ 
        'stats.currentViewers': -1, 
        'stats.likes': -1 
      })
      .limit(limit)
      .populate('streamerId', 'username nickname avatar verified')
      .lean();

      res.json({
        success: true,
        data: { streams: popularStreams }
      });
    } catch (error) {
      console.error('获取热门直播失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

/**
 * @route GET /api/live/service/status
 * @desc 获取直播服务状态（管理员）
 * @access Private (Admin)
 */
router.get('/service/status',
  authMiddleware,
  async (req, res) => {
    try {
      // 检查管理员权限
      const { default: User } = await import('../models/User');
      const currentUser = await User.findById(req.user!.id);
      
      if (!currentUser || currentUser.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: '需要管理员权限'
        });
        return;
      }

      // 获取直播服务状态
      const { default: liveStreamService } = await import('../services/LiveStreamService');
      const serviceStatus = liveStreamService.getServiceStatus();

      // 获取数据库统计
      const { default: LiveStream } = await import('../models/LiveStream');
      const dbStats = await LiveStream.getStreamStats();

      res.json({
        success: true,
        data: {
          service: serviceStatus,
          database: dbStats
        }
      });
    } catch (error) {
      console.error('获取直播服务状态失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

// ==================== 错误处理中间件 ====================

router.use((error: any, req: any, res: any, next: any) => {
  console.error('直播路由错误:', error);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

export default router;