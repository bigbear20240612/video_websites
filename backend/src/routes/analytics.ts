/*
 * 大雄视频平台 - 数据分析路由
 * 定义数据统计和分析相关的API路由
 */

import { Router } from 'express';
import { body, query } from 'express-validator';
import rateLimit from 'express-rate-limit';
import AnalyticsController from '../controllers/AnalyticsController';
import { authMiddleware } from '../middleware/authMiddleware';
import { TimeRange } from '../services/AnalyticsService';

const router = Router();

// 分析接口限流：每分钟最多30次请求
const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 30, // 最多30次
  message: {
    success: false,
    message: '分析请求过于频繁，请稍后重试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `analytics:${req.user?.id || req.ip}`;
  }
});

// 用户行为记录限流：每分钟最多100次
const trackingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 100, // 最多100次
  message: {
    success: false,
    message: '行为记录请求过于频繁'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `tracking:${req.user?.id || req.ip}`;
  }
});

// ==================== 验证规则 ====================

// 时间范围验证
const timeRangeValidation = [
  query('timeRange')
    .optional()
    .isIn(Object.values(TimeRange))
    .withMessage('无效的时间范围，支持: 1h, 1d, 7d, 30d, 365d')
];

// 用户行为追踪验证
const trackingValidation = [
  body('action')
    .notEmpty()
    .withMessage('行为动作不能为空')
    .isLength({ min: 1, max: 50 })
    .withMessage('行为动作长度必须在1-50个字符之间')
    .matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
    .withMessage('行为动作只能包含字母、数字和下划线，且以字母或下划线开头'),
  
  body('metadata')
    .optional()
    .isObject()
    .withMessage('元数据必须是对象')
    .custom((metadata) => {
      if (metadata) {
        const keys = Object.keys(metadata);
        if (keys.length > 20) {
          throw new Error('元数据字段不能超过20个');
        }
        
        for (const key of keys) {
          if (typeof key !== 'string' || key.length > 100) {
            throw new Error('元数据键名必须是字符串且不能超过100个字符');
          }
        }
      }
      return true;
    })
];

// 导出格式验证
const exportValidation = [
  query('format')
    .optional()
    .isIn(['json', 'csv'])
    .withMessage('导出格式只支持 json 或 csv'),
  
  ...timeRangeValidation
];

// ==================== 路由定义 ====================

/**
 * @route GET /api/analytics/dashboard
 * @desc 获取数据仪表板
 * @access Private (Admin/Moderator)
 */
router.get('/dashboard',
  authMiddleware,
  analyticsLimiter,
  timeRangeValidation,
  AnalyticsController.getDashboard
);

/**
 * @route GET /api/analytics/user-behavior
 * @desc 获取用户行为统计
 * @access Private (Admin/Moderator)
 */
router.get('/user-behavior',
  authMiddleware,
  analyticsLimiter,
  timeRangeValidation,
  AnalyticsController.getUserBehaviorStats
);

/**
 * @route GET /api/analytics/video-performance
 * @desc 获取视频性能统计
 * @access Private
 */
router.get('/video-performance',
  authMiddleware,
  analyticsLimiter,
  timeRangeValidation,
  AnalyticsController.getVideoPerformanceStats
);

/**
 * @route GET /api/analytics/live-streaming
 * @desc 获取直播统计
 * @access Private
 */
router.get('/live-streaming',
  authMiddleware,
  analyticsLimiter,
  timeRangeValidation,
  AnalyticsController.getLiveStreamingStats
);

/**
 * @route GET /api/analytics/revenue
 * @desc 获取收入统计
 * @access Private (Admin only)
 */
router.get('/revenue',
  authMiddleware,
  analyticsLimiter,
  timeRangeValidation,
  AnalyticsController.getRevenueStats
);

/**
 * @route GET /api/analytics/moderation
 * @desc 获取内容审核统计
 * @access Private (Admin/Moderator)
 */
router.get('/moderation',
  authMiddleware,
  analyticsLimiter,
  timeRangeValidation,
  AnalyticsController.getModerationStats
);

/**
 * @route GET /api/analytics/my-stats
 * @desc 获取用户个人统计
 * @access Private
 */
router.get('/my-stats',
  authMiddleware,
  analyticsLimiter,
  timeRangeValidation,
  AnalyticsController.getMyStats
);

/**
 * @route POST /api/analytics/track
 * @desc 记录用户行为事件
 * @access Private
 */
router.post('/track',
  authMiddleware,
  trackingLimiter,
  trackingValidation,
  AnalyticsController.trackUserAction
);

/**
 * @route GET /api/analytics/export
 * @desc 导出分析报告
 * @access Private (Admin only)
 */
router.get('/export',
  authMiddleware,
  analyticsLimiter,
  exportValidation,
  AnalyticsController.exportAnalyticsReport
);

// ==================== 特殊路由 ====================

/**
 * @route GET /api/analytics/metrics
 * @desc 获取实时指标（简化版仪表板）
 * @access Private
 */
router.get('/metrics',
  authMiddleware,
  analyticsLimiter,
  async (req, res) => {
    try {
      const { default: User } = await import('../models/User');
      const { default: Video } = await import('../models/Video');
      const { default: LiveStream } = await import('../models/LiveStream');
      const { default: redis } = await import('../config/redis');

      // 获取基础指标
      const [totalUsers, totalVideos, activeStreams] = await Promise.all([
        User.countDocuments({}),
        Video.countDocuments({}),
        LiveStream.countDocuments({ status: 'live' })
      ]);

      // 获取在线用户数（从Redis获取）
      const onlineUsers = await redis.scard('online_users') || 0;

      res.json({
        success: true,
        data: {
          totalUsers,
          totalVideos,
          activeStreams,
          onlineUsers,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('获取实时指标失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

/**
 * @route GET /api/analytics/health
 * @desc 获取系统健康状态
 * @access Private (Admin only)
 */
router.get('/health',
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

      const { default: mongoose } = await import('mongoose');
      const { default: redis } = await import('../config/redis');

      // 检查数据库连接
      const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
      
      // 检查Redis连接
      let redisStatus = 'disconnected';
      try {
        await redis.ping();
        redisStatus = 'connected';
      } catch (error) {
        // Redis连接失败
      }

      // 系统资源信息
      const memUsage = process.memoryUsage();
      const uptime = process.uptime();

      res.json({
        success: true,
        data: {
          database: { status: dbStatus },
          redis: { status: redisStatus },
          server: {
            uptime: Math.floor(uptime),
            memory: {
              used: Math.round(memUsage.heapUsed / 1024 / 1024),
              total: Math.round(memUsage.heapTotal / 1024 / 1024)
            },
            nodeVersion: process.version
          },
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('获取系统健康状态失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

// ==================== 错误处理中间件 ====================

router.use((error: any, req: any, res: any, next: any) => {
  console.error('分析路由错误:', error);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

export default router;