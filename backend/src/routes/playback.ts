/*
 * 大雄视频平台 - 视频播放路由
 * 定义视频播放、流媒体、统计相关的API路由
 */

import { Router } from 'express';
import { body, param } from 'express-validator';
import rateLimit from 'express-rate-limit';
import VideoPlaybackController from '../controllers/VideoPlaybackController';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware';

const router = Router();

// 播放限流：每分钟最多60次播放请求
const playbackLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 60, // 最多60次
  message: {
    success: false,
    message: '播放请求过于频繁，请稍后重试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // 基于IP和用户ID进行限流
    const userId = req.user?.id;
    return userId ? `playback:${userId}` : `playback:${req.ip}`;
  }
});

// 进度记录限流：每分钟最多30次进度更新
const progressLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 30, // 最多30次
  message: {
    success: false,
    message: '进度更新过于频繁'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = req.user?.id;
    return userId ? `progress:${userId}` : `progress:${req.ip}`;
  }
});

// ==================== 验证规则 ====================

// 视频ID验证
const videoIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('无效的视频ID格式')
];

// 播放进度验证
const progressValidation = [
  body('currentTime')
    .isFloat({ min: 0 })
    .withMessage('当前播放时间必须是大于等于0的数字'),
  
  body('duration')
    .isFloat({ min: 0.1 })
    .withMessage('视频总时长必须是大于0的数字'),
  
  body('quality')
    .optional()
    .isString()
    .withMessage('视频质量必须是字符串')
    .isIn(['240p', '360p', '480p', '720p', '1080p', '1440p', '2160p'])
    .withMessage('不支持的视频质量')
];

// ==================== 路由定义 ====================

/**
 * @route GET /api/playback/:id/info
 * @desc 获取视频播放信息
 * @access Public/Private (根据视频可见性)
 */
router.get('/:id/info',
  optionalAuthMiddleware,
  playbackLimiter,
  videoIdValidation,
  VideoPlaybackController.getPlaybackInfo
);

/**
 * @route GET /api/playback/:id/stream
 * @desc 视频流播放（支持Range请求）
 * @access Public/Private (根据视频可见性)
 */
router.get('/:id/stream',
  optionalAuthMiddleware,
  playbackLimiter,
  videoIdValidation,
  VideoPlaybackController.streamVideo
);

/**
 * @route POST /api/playback/:id/progress
 * @desc 记录播放进度
 * @access Private
 */
router.post('/:id/progress',
  authMiddleware,
  progressLimiter,
  videoIdValidation,
  progressValidation,
  VideoPlaybackController.recordProgress
);

/**
 * @route GET /api/playback/:id/progress
 * @desc 获取播放进度
 * @access Private
 */
router.get('/:id/progress',
  authMiddleware,
  videoIdValidation,
  VideoPlaybackController.getProgress
);

/**
 * @route GET /api/playback/:id/stats
 * @desc 获取播放统计（视频作者或管理员）
 * @access Private (Author/Admin)
 */
router.get('/:id/stats',
  authMiddleware,
  videoIdValidation,
  VideoPlaybackController.getPlaybackStats
);

// ==================== 特殊路由 ====================

/**
 * @route GET /api/playback/m3u8/:id/:quality
 * @desc HLS播放列表（用于自适应码率播放）
 * @access Public/Private
 */
router.get('/m3u8/:id/:quality', async (req, res) => {
  try {
    const { id, quality } = req.params;
    
    // 这里应该生成HLS播放列表
    // 暂时返回简单的m3u8格式
    const m3u8Content = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:10.0,
/api/playback/${id}/stream?quality=${quality}&segment=0
#EXT-X-ENDLIST`;
    
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(m3u8Content);
    
  } catch (error) {
    console.error('生成HLS播放列表失败:', error);
    res.status(500).json({
      success: false,
      message: '播放列表生成失败'
    });
  }
});

/**
 * @route GET /api/playback/mpd/:id
 * @desc DASH清单文件（用于DASH播放）
 * @access Public/Private
 */
router.get('/mpd/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 这里应该生成DASH MPD文件
    // 暂时返回简单的XML格式
    const mpdContent = `<?xml version="1.0" encoding="UTF-8"?>
<MPD xmlns="urn:mpeg:dash:schema:mpd:2011" 
     type="static" 
     mediaPresentationDuration="PT0S"
     profiles="urn:mpeg:dash:profile:isoff-main:2011">
  <Period>
    <AdaptationSet mimeType="video/mp4">
      <Representation id="720p" bandwidth="2500000" width="1280" height="720">
        <BaseURL>/api/playback/${id}/stream?quality=720p</BaseURL>
      </Representation>
      <Representation id="1080p" bandwidth="5000000" width="1920" height="1080">
        <BaseURL>/api/playback/${id}/stream?quality=1080p</BaseURL>
      </Representation>
    </AdaptationSet>
  </Period>
</MPD>`;
    
    res.setHeader('Content-Type', 'application/dash+xml');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(mpdContent);
    
  } catch (error) {
    console.error('生成DASH清单失败:', error);
    res.status(500).json({
      success: false,
      message: '播放清单生成失败'
    });
  }
});

/**
 * @route POST /api/playback/:id/like
 * @desc 点赞视频
 * @access Private
 */
router.post('/:id/like',
  authMiddleware,
  videoIdValidation,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      const { default: Video } = await import('../models/Video');
      const { default: redis } = await import('../config/redis');
      
      // 检查是否已经点赞
      const likeKey = `user_likes:${userId}`;
      const hasLiked = await redis.sismember(likeKey, id);
      
      if (hasLiked) {
        // 取消点赞
        await redis.srem(likeKey, id);
        await Video.findByIdAndUpdate(id, { $inc: { 'stats.likes': -1 } });
        
        res.json({
          success: true,
          message: '取消点赞成功',
          data: { liked: false }
        });
      } else {
        // 添加点赞
        await redis.sadd(likeKey, id);
        await redis.expire(likeKey, 365 * 24 * 60 * 60); // 保存1年
        await Video.findByIdAndUpdate(id, { $inc: { 'stats.likes': 1 } });
        
        // 检查是否之前点了踩
        const dislikeKey = `user_dislikes:${userId}`;
        const hasDisliked = await redis.sismember(dislikeKey, id);
        if (hasDisliked) {
          await redis.srem(dislikeKey, id);
          await Video.findByIdAndUpdate(id, { $inc: { 'stats.dislikes': -1 } });
        }
        
        res.json({
          success: true,
          message: '点赞成功',
          data: { liked: true }
        });
      }
      
    } catch (error) {
      console.error('点赞操作失败:', error);
      res.status(500).json({
        success: false,
        message: '操作失败'
      });
    }
  }
);

/**
 * @route POST /api/playback/:id/dislike
 * @desc 踩视频
 * @access Private
 */
router.post('/:id/dislike',
  authMiddleware,
  videoIdValidation,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      const { default: Video } = await import('../models/Video');
      const { default: redis } = await import('../config/redis');
      
      // 检查是否已经踩过
      const dislikeKey = `user_dislikes:${userId}`;
      const hasDisliked = await redis.sismember(dislikeKey, id);
      
      if (hasDisliked) {
        // 取消踩
        await redis.srem(dislikeKey, id);
        await Video.findByIdAndUpdate(id, { $inc: { 'stats.dislikes': -1 } });
        
        res.json({
          success: true,
          message: '取消踩成功',
          data: { disliked: false }
        });
      } else {
        // 添加踩
        await redis.sadd(dislikeKey, id);
        await redis.expire(dislikeKey, 365 * 24 * 60 * 60); // 保存1年
        await Video.findByIdAndUpdate(id, { $inc: { 'stats.dislikes': 1 } });
        
        // 检查是否之前点了赞
        const likeKey = `user_likes:${userId}`;
        const hasLiked = await redis.sismember(likeKey, id);
        if (hasLiked) {
          await redis.srem(likeKey, id);
          await Video.findByIdAndUpdate(id, { $inc: { 'stats.likes': -1 } });
        }
        
        res.json({
          success: true,
          message: '踩成功',
          data: { disliked: true }
        });
      }
      
    } catch (error) {
      console.error('踩操作失败:', error);
      res.status(500).json({
        success: false,
        message: '操作失败'
      });
    }
  }
);

/**
 * @route POST /api/playback/:id/favorite
 * @desc 收藏/取消收藏视频
 * @access Private
 */
router.post('/:id/favorite',
  authMiddleware,
  videoIdValidation,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      const { default: Video } = await import('../models/Video');
      const { default: redis } = await import('../config/redis');
      
      // 检查是否已经收藏
      const favoriteKey = `user_favorites:${userId}`;
      const hasFavorited = await redis.sismember(favoriteKey, id);
      
      if (hasFavorited) {
        // 取消收藏
        await redis.srem(favoriteKey, id);
        await Video.findByIdAndUpdate(id, { $inc: { 'stats.favorites': -1 } });
        
        res.json({
          success: true,
          message: '取消收藏成功',
          data: { favorited: false }
        });
      } else {
        // 添加收藏
        await redis.sadd(favoriteKey, id);
        await redis.expire(favoriteKey, 365 * 24 * 60 * 60); // 保存1年
        await Video.findByIdAndUpdate(id, { $inc: { 'stats.favorites': 1 } });
        
        res.json({
          success: true,
          message: '收藏成功',
          data: { favorited: true }
        });
      }
      
    } catch (error) {
      console.error('收藏操作失败:', error);
      res.status(500).json({
        success: false,
        message: '操作失败'
      });
    }
  }
);

/**
 * @route GET /api/playback/:id/user-actions
 * @desc 获取用户对视频的操作状态（点赞、踩、收藏）
 * @access Private
 */
router.get('/:id/user-actions',
  authMiddleware,
  videoIdValidation,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      const { default: redis } = await import('../config/redis');
      
      const [liked, disliked, favorited] = await Promise.all([
        redis.sismember(`user_likes:${userId}`, id),
        redis.sismember(`user_dislikes:${userId}`, id),
        redis.sismember(`user_favorites:${userId}`, id)
      ]);
      
      res.json({
        success: true,
        data: {
          liked: Boolean(liked),
          disliked: Boolean(disliked),
          favorited: Boolean(favorited)
        }
      });
      
    } catch (error) {
      console.error('获取用户操作状态失败:', error);
      res.status(500).json({
        success: false,
        message: '获取状态失败'
      });
    }
  }
);

// ==================== 错误处理中间件 ====================

router.use((error: any, req: any, res: any, next: any) => {
  console.error('播放路由错误:', error);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

export default router;