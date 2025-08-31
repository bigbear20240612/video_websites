/*
 * 大雄视频平台 - 推荐系统路由
 * 定义推荐相关的API路由
 */

import { Router } from 'express';
import { param, query } from 'express-validator';
import rateLimit from 'express-rate-limit';
import RecommendationController from '../controllers/RecommendationController';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware';

const router = Router();

// 推荐请求限流：每分钟最多30次推荐请求
const recommendationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 30, // 最多30次
  message: {
    success: false,
    message: '推荐请求过于频繁，请稍后重试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `recommendation:${req.user?.id || req.ip}`;
  }
});

// 个性化推荐限流：每分钟最多10次（计算量较大）
const personalizedLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 10, // 最多10次
  message: {
    success: false,
    message: '个性化推荐请求过于频繁，请稍后重试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `personalized:${req.user?.id || req.ip}`;
  }
});

// ==================== 验证规则 ====================

// 视频ID验证
const videoIdValidation = [
  param('videoId')
    .isMongoId()
    .withMessage('无效的视频ID格式')
];

// 分类验证
const categoryValidation = [
  param('category')
    .notEmpty()
    .withMessage('分类不能为空')
    .isIn([
      'music', 'gaming', 'education', 'entertainment', 'news',
      'sports', 'technology', 'travel', 'food', 'lifestyle',
      'comedy', 'animation', 'film', 'science', 'auto'
    ])
    .withMessage('无效的视频分类')
];

// 推荐查询参数验证
const recommendationQueryValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('限制数量必须在1-50之间'),
  
  query('exclude')
    .optional()
    .isString()
    .withMessage('排除列表必须是字符串')
    .custom((value) => {
      if (value) {
        const ids = value.split(',');
        const invalidIds = ids.filter((id: string) => !id.match(/^[0-9a-fA-F]{24}$/));
        if (invalidIds.length > 0) {
          throw new Error('排除列表包含无效的视频ID');
        }
      }
      return true;
    })
];

// 热门推荐查询验证
const trendingQueryValidation = [
  ...recommendationQueryValidation,
  query('timeframe')
    .optional()
    .isIn(['day', 'week', 'month'])
    .withMessage('时间范围只能是 day、week 或 month')
];

// ==================== 路由定义 ====================

/**
 * @route GET /api/recommendations/personalized
 * @desc 获取个性化推荐
 * @access Private
 */
router.get('/personalized',
  authMiddleware,
  personalizedLimiter,
  recommendationQueryValidation,
  RecommendationController.getPersonalizedRecommendations
);

/**
 * @route GET /api/recommendations/trending
 * @desc 获取热门趋势推荐
 * @access Public
 */
router.get('/trending',
  recommendationLimiter,
  trendingQueryValidation,
  RecommendationController.getTrendingRecommendations
);

/**
 * @route GET /api/recommendations/category/:category
 * @desc 获取分类推荐
 * @access Public
 */
router.get('/category/:category',
  recommendationLimiter,
  categoryValidation,
  recommendationQueryValidation,
  RecommendationController.getCategoryRecommendations
);

/**
 * @route GET /api/recommendations/similar/:videoId
 * @desc 获取相似视频推荐
 * @access Public
 */
router.get('/similar/:videoId',
  recommendationLimiter,
  videoIdValidation,
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('限制数量必须在1-20之间'),
  RecommendationController.getSimilarVideoRecommendations
);

/**
 * @route GET /api/recommendations/stats
 * @desc 获取用户推荐统计
 * @access Private
 */
router.get('/stats',
  authMiddleware,
  RecommendationController.getRecommendationStats
);

/**
 * @route POST /api/recommendations/refresh-preferences
 * @desc 刷新用户偏好缓存
 * @access Private
 */
router.post('/refresh-preferences',
  authMiddleware,
  rateLimit({
    windowMs: 5 * 60 * 1000, // 5分钟
    max: 3, // 最多3次
    message: {
      success: false,
      message: '刷新偏好过于频繁，请稍后重试'
    }
  }),
  RecommendationController.refreshUserPreferences
);

/**
 * @route GET /api/recommendations/diversity
 * @desc 获取多样性推荐
 * @access Private
 */
router.get('/diversity',
  authMiddleware,
  personalizedLimiter,
  recommendationQueryValidation,
  RecommendationController.getRecommendationDiversity
);

// ==================== 特殊路由 ====================

/**
 * @route GET /api/recommendations/explore
 * @desc 探索推荐 - 随机发现新内容
 * @access Public
 */
router.get('/explore',
  recommendationLimiter,
  query('limit')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('限制数量必须在1-30之间'),
  async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 30);
      
      const { default: Video } = await import('../models/Video');
      
      // 随机获取视频（使用聚合管道的随机采样）
      const randomVideos = await Video.aggregate([
        {
          $match: {
            status: 'ready',
            visibility: 'public',
            'stats.views': { $gte: 100 } // 至少有100次播放
          }
        },
        { $sample: { size: limit } },
        {
          $lookup: {
            from: 'users',
            localField: 'uploader',
            foreignField: '_id',
            as: 'uploader',
            pipeline: [
              { $project: { username: 1, nickname: 1, avatar: 1, verified: 1 } }
            ]
          }
        },
        {
          $unwind: '$uploader'
        }
      ]);

      res.json({
        success: true,
        data: {
          videos: randomVideos.map(video => ({
            ...video,
            recommendation: {
              score: 0.5,
              reason: '随机发现',
              strategy: 'explore'
            }
          })),
          totalCount: randomVideos.length
        }
      });
    } catch (error) {
      console.error('获取探索推荐失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

/**
 * @route GET /api/recommendations/categories
 * @desc 获取所有分类的推荐摘要
 * @access Public
 */
router.get('/categories',
  recommendationLimiter,
  async (req, res) => {
    try {
      const perCategory = Math.min(parseInt(req.query.perCategory as string) || 5, 10);
      
      const { default: Video } = await import('../models/Video');
      
      const categories = [
        'music', 'gaming', 'education', 'entertainment', 'news',
        'sports', 'technology', 'travel', 'food', 'lifestyle'
      ];

      const categoryPromises = categories.map(async (category) => {
        const videos = await Video.find({
          status: 'ready',
          visibility: 'public',
          category
        })
        .sort({ 'stats.views': -1, publishedAt: -1 })
        .limit(perCategory)
        .populate('uploader', 'username nickname avatar verified')
        .lean();

        return {
          category,
          videos: videos.map(video => ({
            ...video,
            recommendation: {
              score: 0.7,
              reason: `${category}分类热门`,
              strategy: 'category'
            }
          }))
        };
      });

      const categoryRecommendations = await Promise.all(categoryPromises);

      res.json({
        success: true,
        data: {
          categories: categoryRecommendations.filter(cat => cat.videos.length > 0),
          totalCategories: categoryRecommendations.length
        }
      });
    } catch (error) {
      console.error('获取分类推荐摘要失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

/**
 * @route GET /api/recommendations/debug/:userId
 * @desc 调试用户推荐数据
 * @access Private (Admin only)
 */
router.get('/debug/:userId',
  authMiddleware,
  param('userId')
    .isMongoId()
    .withMessage('无效的用户ID格式'),
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

      const { userId } = req.params;
      const { default: redis } = await import('../config/redis');

      // 获取调试信息
      const [watchHistory, likes, favorites, preferences] = await Promise.all([
        redis.lrange(`user_watch_history:${userId}`, 0, 19),
        redis.smembers(`user_likes:${userId}`),
        redis.smembers(`user_favorites:${userId}`),
        redis.get(`user_preferences:${userId}`)
      ]);

      const debugData = {
        userId,
        watchHistory: watchHistory.map(h => JSON.parse(h)),
        likedVideos: likes,
        favoritedVideos: favorites,
        preferences: preferences ? JSON.parse(preferences) : null,
        dataQuality: {
          watchHistoryCount: watchHistory.length,
          likesCount: likes.length,
          favoritesCount: favorites.length,
          hasPreferences: !!preferences
        }
      };

      res.json({
        success: true,
        data: { debug: debugData }
      });
    } catch (error) {
      console.error('获取推荐调试信息失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

// ==================== 错误处理中间件 ====================

router.use((error: any, req: any, res: any, next: any) => {
  console.error('推荐路由错误:', error);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

export default router;