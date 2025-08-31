/*
 * 大雄视频平台 - 推荐算法服务
 * 基于用户行为、内容特征和协同过滤的视频推荐系统
 */

import mongoose from 'mongoose';
import Video, { IVideo } from '../models/Video';
import User, { IUser } from '../models/User';
import redis from '../config/redis';

// 推荐策略枚举
export enum RecommendationStrategy {
  COLLABORATIVE_FILTERING = 'collaborative_filtering',   // 协同过滤
  CONTENT_BASED = 'content_based',                      // 基于内容
  HYBRID = 'hybrid',                                    // 混合推荐
  TRENDING = 'trending',                                // 热门趋势
  PERSONALIZED = 'personalized'                        // 个性化推荐
}

// 用户行为权重配置
interface UserActionWeights {
  view: number;
  like: number;
  share: number;
  comment: number;
  favorite: number;
  subscribe: number;
}

// 内容特征权重配置
interface ContentFeatureWeights {
  category: number;
  tags: number;
  duration: number;
  quality: number;
  recency: number;
}

// 推荐结果接口
export interface RecommendationResult {
  videoId: string;
  score: number;
  reason: string;
  strategy: RecommendationStrategy;
}

export class RecommendationService {
  private readonly userActionWeights: UserActionWeights = {
    view: 1.0,
    like: 3.0,
    share: 5.0,
    comment: 4.0,
    favorite: 6.0,
    subscribe: 8.0
  };

  private readonly contentFeatureWeights: ContentFeatureWeights = {
    category: 2.0,
    tags: 1.5,
    duration: 0.5,
    quality: 1.0,
    recency: 0.8
  };

  /**
   * 获取用户个性化推荐
   */
  public async getPersonalizedRecommendations(
    userId: string,
    limit: number = 20,
    excludeVideoIds: string[] = []
  ): Promise<RecommendationResult[]> {
    try {
      // 获取用户偏好数据
      const userPreferences = await this.getUserPreferences(userId);
      
      // 如果用户偏好数据不足，返回热门推荐
      if (!userPreferences.hasEnoughData) {
        return this.getTrendingRecommendations(limit, excludeVideoIds);
      }

      // 使用混合推荐策略
      const [collaborativeResults, contentBasedResults, trendingResults] = await Promise.all([
        this.getCollaborativeFilteringRecommendations(userId, Math.ceil(limit * 0.4)),
        this.getContentBasedRecommendations(userId, Math.ceil(limit * 0.4)),
        this.getTrendingRecommendations(Math.ceil(limit * 0.2), excludeVideoIds)
      ]);

      // 合并和去重推荐结果
      const allResults = [...collaborativeResults, ...contentBasedResults, ...trendingResults];
      const uniqueResults = this.deduplicateRecommendations(allResults, excludeVideoIds);

      // 按分数排序并返回指定数量
      return uniqueResults
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      console.error('获取个性化推荐失败:', error);
      // 出错时返回热门推荐作为fallback
      return this.getTrendingRecommendations(limit, excludeVideoIds);
    }
  }

  /**
   * 协同过滤推荐
   */
  public async getCollaborativeFilteringRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<RecommendationResult[]> {
    try {
      // 获取用户的观看历史
      const userHistory = await this.getUserWatchHistory(userId);
      if (userHistory.length < 5) {
        return []; // 历史数据不足
      }

      // 找到相似用户
      const similarUsers = await this.findSimilarUsers(userId, 50);
      
      // 获取相似用户喜欢但当前用户未看过的视频
      const recommendations: Map<string, { score: number; count: number }> = new Map();

      for (const similarUser of similarUsers) {
        const similarUserHistory = await this.getUserWatchHistory(similarUser.userId);
        
        for (const video of similarUserHistory) {
          // 跳过当前用户已经看过的视频
          if (userHistory.some(v => v.videoId === video.videoId)) {
            continue;
          }

          const videoId = video.videoId;
          const currentData = recommendations.get(videoId) || { score: 0, count: 0 };
          
          // 根据用户相似度和视频互动强度计算分数
          const interactionScore = this.calculateInteractionScore(video);
          const weightedScore = interactionScore * similarUser.similarity;
          
          recommendations.set(videoId, {
            score: currentData.score + weightedScore,
            count: currentData.count + 1
          });
        }
      }

      // 转换为推荐结果
      const results: RecommendationResult[] = [];
      for (const [videoId, data] of recommendations) {
        // 平均分数，考虑推荐来源数量
        const normalizedScore = data.score / Math.max(data.count, 1);
        
        results.push({
          videoId,
          score: normalizedScore * 0.8, // 协同过滤权重
          reason: `${data.count}个相似用户喜欢此视频`,
          strategy: RecommendationStrategy.COLLABORATIVE_FILTERING
        });
      }

      return results
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      console.error('协同过滤推荐失败:', error);
      return [];
    }
  }

  /**
   * 基于内容的推荐
   */
  public async getContentBasedRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<RecommendationResult[]> {
    try {
      // 获取用户偏好特征
      const userPreferences = await this.getUserPreferences(userId);
      
      // 构建查询条件
      const query: any = {
        status: 'ready',
        visibility: 'public'
      };

      // 基于用户偏好的分类
      if (userPreferences.preferredCategories.length > 0) {
        query.category = { $in: userPreferences.preferredCategories };
      }

      // 获取候选视频
      const candidateVideos = await Video.find(query)
        .limit(limit * 5) // 获取更多候选视频进行筛选
        .populate('uploader', 'username nickname verified')
        .lean();

      const results: RecommendationResult[] = [];

      for (const video of candidateVideos) {
        const contentScore = this.calculateContentSimilarityScore(video, userPreferences);
        
        if (contentScore > 0.3) { // 相似度阈值
          results.push({
            videoId: video._id.toString(),
            score: contentScore * 0.7, // 内容推荐权重
            reason: this.generateContentRecommendationReason(video, userPreferences),
            strategy: RecommendationStrategy.CONTENT_BASED
          });
        }
      }

      return results
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      console.error('基于内容的推荐失败:', error);
      return [];
    }
  }

  /**
   * 热门趋势推荐
   */
  public async getTrendingRecommendations(
    limit: number = 10,
    excludeVideoIds: string[] = []
  ): Promise<RecommendationResult[]> {
    try {
      // 获取最近7天的热门视频
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const trendingVideos = await Video.find({
        status: 'ready',
        visibility: 'public',
        publishedAt: { $gte: sevenDaysAgo },
        _id: { $nin: excludeVideoIds.map(id => new mongoose.Types.ObjectId(id)) }
      })
      .sort({ 
        'stats.views': -1, 
        'stats.likes': -1,
        publishedAt: -1 
      })
      .limit(limit)
      .populate('uploader', 'username nickname verified')
      .lean();

      return trendingVideos.map(video => ({
        videoId: video._id.toString(),
        score: this.calculateTrendingScore(video),
        reason: `热门视频 - ${this.formatNumber(video.stats.views)}次播放`,
        strategy: RecommendationStrategy.TRENDING
      }));

    } catch (error) {
      console.error('获取热门推荐失败:', error);
      return [];
    }
  }

  /**
   * 获取分类推荐
   */
  public async getCategoryRecommendations(
    category: string,
    limit: number = 10,
    excludeVideoIds: string[] = []
  ): Promise<RecommendationResult[]> {
    try {
      const videos = await Video.find({
        status: 'ready',
        visibility: 'public',
        category,
        _id: { $nin: excludeVideoIds.map(id => new mongoose.Types.ObjectId(id)) }
      })
      .sort({ 'stats.views': -1, publishedAt: -1 })
      .limit(limit)
      .populate('uploader', 'username nickname verified')
      .lean();

      return videos.map(video => ({
        videoId: video._id.toString(),
        score: 0.6 + (video.stats.views / 10000) * 0.4, // 基础分数 + 播放量加成
        reason: `${category}分类热门视频`,
        strategy: RecommendationStrategy.CONTENT_BASED
      }));

    } catch (error) {
      console.error('获取分类推荐失败:', error);
      return [];
    }
  }

  /**
   * 获取相似视频推荐
   */
  public async getSimilarVideoRecommendations(
    videoId: string,
    limit: number = 10
  ): Promise<RecommendationResult[]> {
    try {
      const sourceVideo = await Video.findById(videoId).lean();
      if (!sourceVideo) {
        return [];
      }

      // 基于标签和分类查找相似视频
      const similarVideos = await Video.find({
        _id: { $ne: videoId },
        status: 'ready',
        visibility: 'public',
        $or: [
          { category: sourceVideo.category },
          { tags: { $in: sourceVideo.tags } }
        ]
      })
      .limit(limit * 2)
      .populate('uploader', 'username nickname verified')
      .lean();

      const results: RecommendationResult[] = [];

      for (const video of similarVideos) {
        const similarity = this.calculateVideoSimilarity(sourceVideo, video);
        
        if (similarity > 0.2) {
          results.push({
            videoId: video._id.toString(),
            score: similarity,
            reason: this.generateSimilarVideoReason(sourceVideo, video),
            strategy: RecommendationStrategy.CONTENT_BASED
          });
        }
      }

      return results
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      console.error('获取相似视频推荐失败:', error);
      return [];
    }
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 获取用户偏好数据
   */
  private async getUserPreferences(userId: string): Promise<any> {
    const cacheKey = `user_preferences:${userId}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    // 从用户行为数据计算偏好
    const watchHistory = await this.getUserWatchHistory(userId);
    const likedVideos = await this.getUserLikedVideos(userId);
    const favoritedVideos = await this.getUserFavoritedVideos(userId);

    const preferences = {
      preferredCategories: this.extractPreferredCategories(watchHistory, likedVideos),
      preferredTags: this.extractPreferredTags(watchHistory, likedVideos),
      preferredDuration: this.calculatePreferredDuration(watchHistory),
      preferredUploaders: this.extractPreferredUploaders(watchHistory, likedVideos),
      hasEnoughData: watchHistory.length >= 5
    };

    // 缓存30分钟
    await redis.setex(cacheKey, 1800, JSON.stringify(preferences));
    
    return preferences;
  }

  /**
   * 获取用户观看历史
   */
  private async getUserWatchHistory(userId: string): Promise<any[]> {
    const historyKey = `user_watch_history:${userId}`;
    const history = await redis.lrange(historyKey, 0, 99); // 最近100条
    
    return history.map(item => JSON.parse(item)).filter(item => {
      // 过滤掉30天前的记录
      return Date.now() - item.watchedAt < 30 * 24 * 60 * 60 * 1000;
    });
  }

  /**
   * 获取用户点赞的视频
   */
  private async getUserLikedVideos(userId: string): Promise<string[]> {
    const likeKey = `user_likes:${userId}`;
    return await redis.smembers(likeKey);
  }

  /**
   * 获取用户收藏的视频
   */
  private async getUserFavoritedVideos(userId: string): Promise<string[]> {
    const favoriteKey = `user_favorites:${userId}`;
    return await redis.smembers(favoriteKey);
  }

  /**
   * 找到相似用户
   */
  private async findSimilarUsers(userId: string, limit: number): Promise<Array<{ userId: string; similarity: number }>> {
    // 这里实现简化的用户相似度计算
    // 实际应用中可能需要使用更复杂的算法如余弦相似度
    
    const currentUserHistory = await this.getUserWatchHistory(userId);
    const currentUserLikes = await this.getUserLikedVideos(userId);
    
    // 获取一批活跃用户进行比较（简化实现）
    const activeUsers = await User.find({
      isActive: true,
      _id: { $ne: userId }
    })
    .sort({ lastLoginAt: -1 })
    .limit(500)
    .select('_id')
    .lean();

    const similarities: Array<{ userId: string; similarity: number }> = [];

    for (const user of activeUsers) {
      const otherUserHistory = await this.getUserWatchHistory(user._id.toString());
      const otherUserLikes = await this.getUserLikedVideos(user._id.toString());
      
      const similarity = this.calculateUserSimilarity(
        currentUserHistory,
        currentUserLikes,
        otherUserHistory,
        otherUserLikes
      );

      if (similarity > 0.1) { // 相似度阈值
        similarities.push({
          userId: user._id.toString(),
          similarity
        });
      }
    }

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  /**
   * 计算用户相似度
   */
  private calculateUserSimilarity(
    user1History: any[],
    user1Likes: string[],
    user2History: any[],
    user2Likes: string[]
  ): number {
    // 基于共同观看视频和点赞视频计算相似度
    const user1Videos = new Set(user1History.map(h => h.videoId));
    const user2Videos = new Set(user2History.map(h => h.videoId));
    const user1LikeSet = new Set(user1Likes);
    const user2LikeSet = new Set(user2Likes);

    // 计算交集
    const commonWatched = [...user1Videos].filter(v => user2Videos.has(v)).length;
    const commonLiked = [...user1LikeSet].filter(v => user2LikeSet.has(v)).length;

    // 计算Jaccard相似度
    const watchUnion = user1Videos.size + user2Videos.size - commonWatched;
    const likeUnion = user1LikeSet.size + user2LikeSet.size - commonLiked;

    const watchSimilarity = watchUnion > 0 ? commonWatched / watchUnion : 0;
    const likeSimilarity = likeUnion > 0 ? commonLiked / likeUnion : 0;

    // 加权平均
    return watchSimilarity * 0.4 + likeSimilarity * 0.6;
  }

  /**
   * 计算互动分数
   */
  private calculateInteractionScore(videoHistory: any): number {
    let score = this.userActionWeights.view;
    
    if (videoHistory.liked) score += this.userActionWeights.like;
    if (videoHistory.shared) score += this.userActionWeights.share;
    if (videoHistory.commented) score += this.userActionWeights.comment;
    if (videoHistory.favorited) score += this.userActionWeights.favorite;
    
    return score;
  }

  /**
   * 计算内容相似度分数
   */
  private calculateContentSimilarityScore(video: any, userPreferences: any): number {
    let score = 0;

    // 分类匹配
    if (userPreferences.preferredCategories.includes(video.category)) {
      score += this.contentFeatureWeights.category;
    }

    // 标签匹配
    const tagMatches = video.tags.filter((tag: string) => 
      userPreferences.preferredTags.includes(tag)
    ).length;
    score += (tagMatches / Math.max(video.tags.length, 1)) * this.contentFeatureWeights.tags;

    // 时长偏好
    const durationDiff = Math.abs(video.duration - userPreferences.preferredDuration);
    const durationScore = Math.max(0, 1 - durationDiff / 3600); // 归一化到0-1
    score += durationScore * this.contentFeatureWeights.duration;

    // 视频质量（基于统计数据）
    const qualityScore = Math.min(1, video.stats.views / 10000 + video.stats.likes / 1000);
    score += qualityScore * this.contentFeatureWeights.quality;

    // 新鲜度
    const daysSincePublished = (Date.now() - new Date(video.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 1 - daysSincePublished / 30); // 30天内的视频有加分
    score += recencyScore * this.contentFeatureWeights.recency;

    return Math.min(score / 5, 1); // 归一化到0-1
  }

  /**
   * 计算视频相似度
   */
  private calculateVideoSimilarity(video1: any, video2: any): number {
    let similarity = 0;

    // 分类匹配
    if (video1.category === video2.category) {
      similarity += 0.3;
    }

    // 标签匹配
    const commonTags = video1.tags.filter((tag: string) => video2.tags.includes(tag));
    const tagSimilarity = commonTags.length / Math.max(video1.tags.length, video2.tags.length, 1);
    similarity += tagSimilarity * 0.4;

    // 时长相似度
    const durationDiff = Math.abs(video1.duration - video2.duration);
    const durationSimilarity = Math.max(0, 1 - durationDiff / Math.max(video1.duration, video2.duration));
    similarity += durationSimilarity * 0.2;

    // 上传者匹配
    if (video1.uploader.toString() === video2.uploader.toString()) {
      similarity += 0.1;
    }

    return similarity;
  }

  /**
   * 计算热门分数
   */
  private calculateTrendingScore(video: any): number {
    const views = video.stats.views || 0;
    const likes = video.stats.likes || 0;
    const comments = video.stats.comments || 0;
    
    // 考虑发布时间的权重
    const daysSincePublished = (Date.now() - new Date(video.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
    const timeWeight = Math.max(0.1, 1 - daysSincePublished / 30); // 30天内权重递减
    
    // 综合分数
    const engagementScore = views * 1 + likes * 10 + comments * 5;
    return (engagementScore * timeWeight) / 10000; // 归一化
  }

  /**
   * 去重推荐结果
   */
  private deduplicateRecommendations(
    recommendations: RecommendationResult[],
    excludeVideoIds: string[] = []
  ): RecommendationResult[] {
    const seen = new Set(excludeVideoIds);
    const unique: RecommendationResult[] = [];

    for (const rec of recommendations) {
      if (!seen.has(rec.videoId)) {
        seen.add(rec.videoId);
        unique.push(rec);
      }
    }

    return unique;
  }

  // ==================== 辅助函数 ====================

  private extractPreferredCategories(watchHistory: any[], likedVideos: string[]): string[] {
    // 从观看历史中提取偏好分类（简化实现）
    const categoryCount: { [key: string]: number } = {};
    
    watchHistory.forEach(item => {
      if (item.category) {
        categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
      }
    });

    return Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);
  }

  private extractPreferredTags(watchHistory: any[], likedVideos: string[]): string[] {
    const tagCount: { [key: string]: number } = {};
    
    watchHistory.forEach(item => {
      if (item.tags) {
        item.tags.forEach((tag: string) => {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
      }
    });

    return Object.entries(tagCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag]) => tag);
  }

  private calculatePreferredDuration(watchHistory: any[]): number {
    if (watchHistory.length === 0) return 600; // 默认10分钟

    const durations = watchHistory
      .filter(item => item.duration)
      .map(item => item.duration);

    return durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
  }

  private extractPreferredUploaders(watchHistory: any[], likedVideos: string[]): string[] {
    const uploaderCount: { [key: string]: number } = {};
    
    watchHistory.forEach(item => {
      if (item.uploader) {
        uploaderCount[item.uploader] = (uploaderCount[item.uploader] || 0) + 1;
      }
    });

    return Object.entries(uploaderCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([uploader]) => uploader);
  }

  private generateContentRecommendationReason(video: any, userPreferences: any): string {
    const reasons = [];
    
    if (userPreferences.preferredCategories.includes(video.category)) {
      reasons.push('您喜欢的分类');
    }
    
    const tagMatches = video.tags.filter((tag: string) => 
      userPreferences.preferredTags.includes(tag)
    );
    if (tagMatches.length > 0) {
      reasons.push(`相关标签: ${tagMatches.slice(0, 2).join(', ')}`);
    }

    return reasons.length > 0 ? reasons.join(' · ') : '为您推荐';
  }

  private generateSimilarVideoReason(sourceVideo: any, targetVideo: any): string {
    if (sourceVideo.category === targetVideo.category) {
      return `同分类视频 - ${sourceVideo.category}`;
    }
    
    const commonTags = sourceVideo.tags.filter((tag: string) => targetVideo.tags.includes(tag));
    if (commonTags.length > 0) {
      return `相似标签: ${commonTags.slice(0, 2).join(', ')}`;
    }

    return '相似内容';
  }

  private formatNumber(num: number): string {
    if (num >= 1000000) {
      return Math.floor(num / 100000) / 10 + 'M';
    } else if (num >= 1000) {
      return Math.floor(num / 100) / 10 + 'K';
    }
    return num.toString();
  }
}

export default new RecommendationService();