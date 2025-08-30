/*
 * 大雄视频平台 - 推荐控制器
 * 处理视频推荐、个性化内容、热门趋势等功能
 */

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Video from '../models/Video';
import User from '../models/User';
import { ApiResponse } from '../types/ApiResponse';
import RecommendationService, { RecommendationStrategy } from '../services/RecommendationService';
import redis from '../config/redis';

export class RecommendationController {

  /**
   * 获取个性化推荐
   * GET /api/recommendations/personalized
   */
  public async getPersonalizedRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const exclude = (req.query.exclude as string)?.split(',') || [];

      // 获取推荐结果
      const recommendations = await RecommendationService.getPersonalizedRecommendations(
        userId,
        limit,
        exclude
      );

      // 获取推荐视频的详细信息
      const videoIds = recommendations.map(rec => rec.videoId);
      const videos = await Video.find({
        _id: { $in: videoIds.map(id => new mongoose.Types.ObjectId(id)) },
        status: 'ready',
        visibility: 'public'
      })
      .populate('uploader', 'username nickname avatar verified')
      .lean();

      // 将推荐分数和原因附加到视频信息上
      const enrichedVideos = videos.map(video => {
        const recommendation = recommendations.find(rec => rec.videoId === video._id.toString());
        return {
          ...video,
          recommendation: recommendation ? {
            score: recommendation.score,
            reason: recommendation.reason,
            strategy: recommendation.strategy
          } : null
        };
      })
      .filter(video => video.recommendation) // 过滤掉没有推荐信息的视频
      .sort((a, b) => (b.recommendation?.score || 0) - (a.recommendation?.score || 0));

      res.json({
        success: true,
        data: {
          videos: enrichedVideos,
          totalCount: enrichedVideos.length,
          recommendations: recommendations
        }
      } as ApiResponse);

    } catch (error) {
      console.error('获取个性化推荐失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 获取热门趋势
   * GET /api/recommendations/trending
   */
  public async getTrendingRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const timeframe = req.query.timeframe as string || 'week'; // day, week, month
      const exclude = (req.query.exclude as string)?.split(',') || [];

      // 检查缓存
      const cacheKey = `trending:${timeframe}:${limit}`;
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        res.json({
          success: true,
          data: JSON.parse(cached),
          cached: true
        } as ApiResponse);
        return;
      }

      // 获取热门推荐
      const recommendations = await RecommendationService.getTrendingRecommendations(limit, exclude);
      
      // 获取视频详细信息
      const videoIds = recommendations.map(rec => rec.videoId);
      const videos = await Video.find({
        _id: { $in: videoIds.map(id => new mongoose.Types.ObjectId(id)) },
        status: 'ready',
        visibility: 'public'
      })
      .populate('uploader', 'username nickname avatar verified')
      .lean();

      const enrichedVideos = videos.map(video => {
        const recommendation = recommendations.find(rec => rec.videoId === video._id.toString());
        return {
          ...video,
          recommendation: recommendation ? {
            score: recommendation.score,
            reason: recommendation.reason,
            strategy: recommendation.strategy
          } : null
        };
      })
      .filter(video => video.recommendation)
      .sort((a, b) => (b.recommendation?.score || 0) - (a.recommendation?.score || 0));

      const result = {
        videos: enrichedVideos,
        timeframe,
        totalCount: enrichedVideos.length,
        updatedAt: new Date().toISOString()
      };

      // 缓存结果
      await redis.setex(cacheKey, 300, JSON.stringify(result)); // 缓存5分钟

      res.json({
        success: true,
        data: result
      } as ApiResponse);

    } catch (error) {
      console.error('获取热门推荐失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 获取分类推荐
   * GET /api/recommendations/category/:category
   */
  public async getCategoryRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.params;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const exclude = (req.query.exclude as string)?.split(',') || [];

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: '输入参数有误',
          errors: errors.array()
        } as ApiResponse);
        return;
      }

      // 检查缓存
      const cacheKey = `category:${category}:${limit}`;
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        res.json({
          success: true,
          data: JSON.parse(cached),
          cached: true
        } as ApiResponse);
        return;
      }

      // 获取分类推荐
      const recommendations = await RecommendationService.getCategoryRecommendations(
        category,
        limit,
        exclude
      );

      // 获取视频详细信息
      const videoIds = recommendations.map(rec => rec.videoId);
      const videos = await Video.find({
        _id: { $in: videoIds.map(id => new mongoose.Types.ObjectId(id)) }
      })
      .populate('uploader', 'username nickname avatar verified')
      .lean();

      const enrichedVideos = videos.map(video => {
        const recommendation = recommendations.find(rec => rec.videoId === video._id.toString());
        return {
          ...video,
          recommendation: recommendation ? {
            score: recommendation.score,
            reason: recommendation.reason,
            strategy: recommendation.strategy
          } : null
        };
      })
      .filter(video => video.recommendation)
      .sort((a, b) => (b.recommendation?.score || 0) - (a.recommendation?.score || 0));

      const result = {
        videos: enrichedVideos,
        category,
        totalCount: enrichedVideos.length,
        updatedAt: new Date().toISOString()
      };

      // 缓存结果
      await redis.setex(cacheKey, 600, JSON.stringify(result)); // 缓存10分钟

      res.json({
        success: true,
        data: result
      } as ApiResponse);

    } catch (error) {
      console.error('获取分类推荐失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 获取相似视频推荐
   * GET /api/recommendations/similar/:videoId
   */
  public async getSimilarVideoRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { videoId } = req.params;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);

      if (!mongoose.Types.ObjectId.isValid(videoId)) {
        res.status(400).json({
          success: false,
          message: '无效的视频ID'
        } as ApiResponse);
        return;
      }

      // 检查源视频是否存在
      const sourceVideo = await Video.findById(videoId);
      if (!sourceVideo) {
        res.status(404).json({
          success: false,
          message: '视频不存在'
        } as ApiResponse);
        return;
      }

      // 检查缓存
      const cacheKey = `similar:${videoId}:${limit}`;
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        res.json({
          success: true,
          data: JSON.parse(cached),
          cached: true
        } as ApiResponse);
        return;
      }

      // 获取相似视频推荐
      const recommendations = await RecommendationService.getSimilarVideoRecommendations(
        videoId,
        limit
      );

      // 获取视频详细信息
      const videoIds = recommendations.map(rec => rec.videoId);
      const videos = await Video.find({
        _id: { $in: videoIds.map(id => new mongoose.Types.ObjectId(id)) }
      })
      .populate('uploader', 'username nickname avatar verified')
      .lean();

      const enrichedVideos = videos.map(video => {
        const recommendation = recommendations.find(rec => rec.videoId === video._id.toString());
        return {
          ...video,
          recommendation: recommendation ? {
            score: recommendation.score,
            reason: recommendation.reason,
            strategy: recommendation.strategy
          } : null
        };
      })
      .filter(video => video.recommendation)
      .sort((a, b) => (b.recommendation?.score || 0) - (a.recommendation?.score || 0));

      const result = {
        videos: enrichedVideos,
        sourceVideoId: videoId,
        totalCount: enrichedVideos.length,
        updatedAt: new Date().toISOString()
      };

      // 缓存结果
      await redis.setex(cacheKey, 1800, JSON.stringify(result)); // 缓存30分钟

      res.json({
        success: true,
        data: result
      } as ApiResponse);

    } catch (error) {
      console.error('获取相似视频推荐失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 获取用户推荐统计
   * GET /api/recommendations/stats
   */
  public async getRecommendationStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      // 获取用户推荐相关的统计信息
      const [watchHistory, likedVideos, favoritedVideos] = await Promise.all([
        redis.llen(`user_watch_history:${userId}`),
        redis.scard(`user_likes:${userId}`),
        redis.scard(`user_favorites:${userId}`)
      ]);

      // 获取用户偏好分析
      const userPreferencesKey = `user_preferences:${userId}`;
      const preferencesData = await redis.get(userPreferencesKey);
      const preferences = preferencesData ? JSON.parse(preferencesData) : null;

      const stats = {
        userActivity: {
          videosWatched: watchHistory,
          videosLiked: likedVideos,
          videosFavorited: favoritedVideos
        },
        preferences: preferences ? {
          topCategories: preferences.preferredCategories?.slice(0, 5) || [],
          topTags: preferences.preferredTags?.slice(0, 10) || [],
          averageDuration: Math.round(preferences.preferredDuration || 0),
          hasEnoughData: preferences.hasEnoughData
        } : null,
        recommendationReadiness: {
          canUsePersonalized: (preferences?.hasEnoughData || false),
          dataQuality: this.calculateDataQuality(watchHistory, likedVideos, favoritedVideos),
          suggestedActions: this.getSuggestedActions(watchHistory, likedVideos, favoritedVideos)
        }
      };

      res.json({
        success: true,
        data: { stats }
      } as ApiResponse);

    } catch (error) {
      console.error('获取推荐统计失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 刷新用户偏好缓存
   * POST /api/recommendations/refresh-preferences
   */
  public async refreshUserPreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      // 清除现有缓存
      const preferencesKey = `user_preferences:${userId}`;
      await redis.del(preferencesKey);

      // 获取新的个性化推荐（这会重新计算偏好）
      await RecommendationService.getPersonalizedRecommendations(userId, 5);

      res.json({
        success: true,
        message: '用户偏好已刷新'
      } as ApiResponse);

    } catch (error) {
      console.error('刷新用户偏好失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 获取推荐多样性配置
   * GET /api/recommendations/diversity
   */
  public async getRecommendationDiversity(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

      // 使用多种策略获取推荐，确保多样性
      const [personalizedRecs, trendingRecs, categoryRecs] = await Promise.all([
        RecommendationService.getPersonalizedRecommendations(userId, Math.ceil(limit * 0.5)),
        RecommendationService.getTrendingRecommendations(Math.ceil(limit * 0.3)),
        this.getRandomCategoryRecommendations(Math.ceil(limit * 0.2))
      ]);

      // 合并并打乱推荐结果
      const allRecommendations = [
        ...personalizedRecs,
        ...trendingRecs,
        ...categoryRecs
      ];

      // 去重并随机排序以增加多样性
      const uniqueVideoIds = new Set<string>();
      const diverseRecommendations = allRecommendations
        .filter(rec => {
          if (uniqueVideoIds.has(rec.videoId)) {
            return false;
          }
          uniqueVideoIds.add(rec.videoId);
          return true;
        })
        .sort(() => Math.random() - 0.5) // 随机打乱
        .slice(0, limit);

      // 获取视频详细信息
      const videoIds = diverseRecommendations.map(rec => rec.videoId);
      const videos = await Video.find({
        _id: { $in: videoIds.map(id => new mongoose.Types.ObjectId(id)) }
      })
      .populate('uploader', 'username nickname avatar verified')
      .lean();

      const enrichedVideos = videos.map(video => {
        const recommendation = diverseRecommendations.find(rec => rec.videoId === video._id.toString());
        return {
          ...video,
          recommendation: recommendation ? {
            score: recommendation.score,
            reason: recommendation.reason,
            strategy: recommendation.strategy
          } : null
        };
      }).filter(video => video.recommendation);

      res.json({
        success: true,
        data: {
          videos: enrichedVideos,
          diversityMetrics: {
            totalStrategies: 3,
            personalizedCount: personalizedRecs.length,
            trendingCount: trendingRecs.length,
            categoryCount: categoryRecs.length,
            finalCount: enrichedVideos.length
          }
        }
      } as ApiResponse);

    } catch (error) {
      console.error('获取多样性推荐失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 计算数据质量分数
   */
  private calculateDataQuality(watched: number, liked: number, favorited: number): number {
    const maxScore = 100;
    let score = 0;

    // 观看历史权重
    score += Math.min(watched / 20, 1) * 40; // 20个观看记录得满分40分
    
    // 点赞历史权重
    score += Math.min(liked / 10, 1) * 30; // 10个点赞得满分30分
    
    // 收藏历史权重
    score += Math.min(favorited / 5, 1) * 30; // 5个收藏得满分30分

    return Math.round(score);
  }

  /**
   * 获取建议操作
   */
  private getSuggestedActions(watched: number, liked: number, favorited: number): string[] {
    const suggestions: string[] = [];

    if (watched < 5) {
      suggestions.push('观看更多视频以获得更好的推荐');
    }
    
    if (liked < 3) {
      suggestions.push('为您喜欢的视频点赞');
    }
    
    if (favorited < 2) {
      suggestions.push('收藏您感兴趣的视频');
    }

    if (suggestions.length === 0) {
      suggestions.push('继续探索您感兴趣的内容');
    }

    return suggestions;
  }

  /**
   * 获取随机分类推荐
   */
  private async getRandomCategoryRecommendations(limit: number): Promise<any[]> {
    const categories = ['music', 'gaming', 'education', 'entertainment', 'technology'];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    
    return RecommendationService.getCategoryRecommendations(randomCategory, limit);
  }
}

export default new RecommendationController();