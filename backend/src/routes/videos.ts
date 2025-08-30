/*
 * 大雄视频平台 - 视频管理路由
 * 定义视频上传、管理、播放相关的API路由
 */

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import VideoController from '../controllers/VideoController';
import { authMiddleware, adminMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware';

const router = Router();

// 视频文件上传配置
const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2GB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv',
      'video/flv', 'video/webm', 'video/mkv', 'video/m4v'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的视频格式'));
    }
  }
});

// 上传限流：每小时最多10次上传
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 10, // 最多10次
  message: {
    success: false,
    message: '上传过于频繁，请稍后重试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // 基于用户ID进行限流
    return `upload:${req.user?.id || req.ip}`;
  }
});

// 搜索限流：每分钟最多30次搜索
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 30, // 最多30次
  message: {
    success: false,
    message: '搜索过于频繁，请稍后重试'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ==================== 验证规则 ====================

// 视频ID验证
const videoIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('无效的视频ID格式')
];

// 用户ID验证
const userIdValidation = [
  param('userId')
    .isMongoId()
    .withMessage('无效的用户ID格式')
];

// 视频上传验证
const videoUploadValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('视频标题不能为空')
    .isLength({ min: 1, max: 200 })
    .withMessage('标题长度必须在1-200个字符之间'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('描述不能超过5000个字符'),
  
  body('category')
    .notEmpty()
    .withMessage('请选择视频分类')
    .isIn([
      'music', 'gaming', 'education', 'entertainment', 'news',
      'sports', 'technology', 'travel', 'food', 'lifestyle',
      'comedy', 'animation', 'film', 'science', 'auto'
    ])
    .withMessage('无效的视频分类'),
  
  body('tags')
    .optional()
    .isString()
    .withMessage('标签必须是字符串')
    .custom((value) => {
      if (value) {
        const tags = value.split(',');
        if (tags.length > 20) {
          throw new Error('标签数量不能超过20个');
        }
        const invalidTags = tags.filter((tag: string) => tag.trim().length > 50);
        if (invalidTags.length > 0) {
          throw new Error('单个标签长度不能超过50个字符');
        }
      }
      return true;
    }),
  
  body('visibility')
    .optional()
    .isIn(['public', 'unlisted', 'private'])
    .withMessage('可见性设置无效'),
  
  body('isAgeRestricted')
    .optional()
    .isBoolean()
    .withMessage('年龄限制必须是布尔值'),
  
  body('language')
    .optional()
    .isIn(['zh-CN', 'zh-TW', 'en-US', 'ja-JP', 'ko-KR', 'es-ES', 'fr-FR', 'de-DE', 'ru-RU'])
    .withMessage('不支持的语言'),
  
  body('contentWarnings')
    .optional()
    .isArray()
    .withMessage('内容警告必须是数组')
    .custom((warnings) => {
      const validWarnings = ['violence', 'adult', 'disturbing', 'flashing', 'loud'];
      const invalidWarnings = warnings.filter((w: string) => !validWarnings.includes(w));
      if (invalidWarnings.length > 0) {
        throw new Error('包含无效的内容警告类型');
      }
      return true;
    })
];

// 视频更新验证
const videoUpdateValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('标题长度必须在1-200个字符之间'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('描述不能超过5000个字符'),
  
  body('category')
    .optional()
    .isIn([
      'music', 'gaming', 'education', 'entertainment', 'news',
      'sports', 'technology', 'travel', 'food', 'lifestyle',
      'comedy', 'animation', 'film', 'science', 'auto'
    ])
    .withMessage('无效的视频分类'),
  
  body('tags')
    .optional()
    .custom((value) => {
      if (Array.isArray(value)) {
        if (value.length > 20) {
          throw new Error('标签数量不能超过20个');
        }
        const invalidTags = value.filter(tag => typeof tag !== 'string' || tag.length > 50);
        if (invalidTags.length > 0) {
          throw new Error('标签格式无效或长度超限');
        }
      } else if (typeof value === 'string') {
        const tags = value.split(',');
        if (tags.length > 20) {
          throw new Error('标签数量不能超过20个');
        }
      }
      return true;
    }),
  
  body('visibility')
    .optional()
    .isIn(['public', 'unlisted', 'private'])
    .withMessage('可见性设置无效'),
  
  body('isAgeRestricted')
    .optional()
    .isBoolean()
    .withMessage('年龄限制必须是布尔值'),
  
  body('language')
    .optional()
    .isIn(['zh-CN', 'zh-TW', 'en-US', 'ja-JP', 'ko-KR', 'es-ES', 'fr-FR', 'de-DE', 'ru-RU'])
    .withMessage('不支持的语言'),
  
  body('contentWarnings')
    .optional()
    .isArray()
    .withMessage('内容警告必须是数组')
    .custom((warnings) => {
      const validWarnings = ['violence', 'adult', 'disturbing', 'flashing', 'loud'];
      const invalidWarnings = warnings.filter((w: string) => !validWarnings.includes(w));
      if (invalidWarnings.length > 0) {
        throw new Error('包含无效的内容警告类型');
      }
      return true;
    })
];

// 视频列表查询验证
const videoListValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间'),
  
  query('category')
    .optional()
    .isIn([
      'music', 'gaming', 'education', 'entertainment', 'news',
      'sports', 'technology', 'travel', 'food', 'lifestyle',
      'comedy', 'animation', 'film', 'science', 'auto'
    ])
    .withMessage('无效的视频分类'),
  
  query('tags')
    .optional()
    .isString()
    .withMessage('标签必须是字符串'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('搜索关键词长度必须在1-100个字符之间'),
  
  query('sort')
    .optional()
    .isIn(['createdAt', 'publishedAt', 'views', 'likes', 'duration'])
    .withMessage('排序字段无效'),
  
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('排序方式只能是 asc 或 desc')
];

// ==================== 路由定义 ====================

/**
 * @route POST /api/videos/upload/init
 * @desc 初始化视频上传
 * @access Private
 */
router.post('/upload/init',
  authMiddleware,
  uploadLimiter,
  videoUpload.single('video'),
  videoUploadValidation,
  VideoController.initializeUpload
);

/**
 * @route GET /api/videos/:id
 * @desc 获取视频详情
 * @access Public/Private (根据视频可见性)
 */
router.get('/:id',
  optionalAuthMiddleware,
  videoIdValidation,
  VideoController.getVideoDetails
);

/**
 * @route PUT /api/videos/:id
 * @desc 更新视频信息
 * @access Private (作者或管理员)
 */
router.put('/:id',
  authMiddleware,
  videoIdValidation,
  videoUpdateValidation,
  VideoController.updateVideo
);

/**
 * @route DELETE /api/videos/:id
 * @desc 删除视频
 * @access Private (作者或管理员)
 */
router.delete('/:id',
  authMiddleware,
  videoIdValidation,
  VideoController.deleteVideo
);

/**
 * @route GET /api/videos
 * @desc 获取视频列表
 * @access Public
 */
router.get('/',
  searchLimiter,
  videoListValidation,
  VideoController.getVideoList
);

/**
 * @route GET /api/videos/user/:userId
 * @desc 获取用户视频列表
 * @access Public/Private
 */
router.get('/user/:userId',
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
  VideoController.getUserVideos
);

/**
 * @route GET /api/videos/:id/processing-status
 * @desc 获取视频处理状态
 * @access Private (作者)
 */
router.get('/:id/processing-status',
  authMiddleware,
  videoIdValidation,
  VideoController.getProcessingStatus
);

// ==================== 特殊路由 ====================

/**
 * @route GET /api/videos/popular/trending
 * @desc 获取热门/趋势视频
 * @access Public
 */
router.get('/popular/trending', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const timeframe = req.query.timeframe as string || 'week'; // day, week, month
    
    let dateFilter = {};
    const now = new Date();
    
    switch (timeframe) {
      case 'day':
        dateFilter = { publishedAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } };
        break;
      case 'week':
        dateFilter = { publishedAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case 'month':
        dateFilter = { publishedAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
        break;
    }
    
    const { default: Video } = await import('../models/Video');
    
    const videos = await Video.find({
      status: 'ready',
      visibility: 'public',
      ...dateFilter
    })
    .sort({ 'stats.views': -1, 'stats.likes': -1 })
    .limit(limit)
    .populate('uploader', 'username nickname avatar verified')
    .select('-originalUrl -qualities.url');
    
    res.json({
      success: true,
      data: { videos }
    });
  } catch (error) {
    console.error('获取热门视频失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * @route GET /api/videos/categories/list
 * @desc 获取视频分类列表
 * @access Public
 */
router.get('/categories/list', (req, res) => {
  const categories = [
    { id: 'music', name: '音乐', icon: '🎵' },
    { id: 'gaming', name: '游戏', icon: '🎮' },
    { id: 'education', name: '教育', icon: '📚' },
    { id: 'entertainment', name: '娱乐', icon: '🎭' },
    { id: 'news', name: '新闻', icon: '📰' },
    { id: 'sports', name: '体育', icon: '⚽' },
    { id: 'technology', name: '科技', icon: '💻' },
    { id: 'travel', name: '旅行', icon: '✈️' },
    { id: 'food', name: '美食', icon: '🍔' },
    { id: 'lifestyle', name: '生活', icon: '🏠' },
    { id: 'comedy', name: '喜剧', icon: '😂' },
    { id: 'animation', name: '动画', icon: '🎨' },
    { id: 'film', name: '电影', icon: '🎬' },
    { id: 'science', name: '科学', icon: '🔬' },
    { id: 'auto', name: '汽车', icon: '🚗' }
  ];
  
  res.json({
    success: true,
    data: { categories }
  });
});

// ==================== 错误处理中间件 ====================

router.use((error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '视频文件过大，请选择小于2GB的文件'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: '只能上传一个视频文件'
      });
    }
  }
  
  if (error.message && error.message.includes('视频格式')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  console.error('视频路由错误:', error);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

export default router;