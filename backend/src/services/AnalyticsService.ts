/*
 * 大雄视频平台 - 数据分析服务
 * 提供用户行为分析、视频统计、直播数据、收入分析等功能
 */

import mongoose from 'mongoose';
import Video, { IVideo } from '../models/Video';
import User, { IUser } from '../models/User';
import Comment, { IComment } from '../models/Comment';
import LiveStream, { ILiveStream } from '../models/LiveStream';
import LiveMessage, { ILiveMessage, MessageType } from '../models/LiveMessage';
import redis from '../config/redis';

// 数据分析类型枚举
export enum AnalyticsType {
  USER_BEHAVIOR = 'user_behavior',
  VIDEO_PERFORMANCE = 'video_performance',
  LIVE_STREAMING = 'live_streaming',
  CONTENT_MODERATION = 'content_moderation',
  REVENUE = 'revenue',
  ENGAGEMENT = 'engagement'
}

// 时间范围枚举
export enum TimeRange {
  HOUR = '1h',
  DAY = '1d',
  WEEK = '7d',
  MONTH = '30d',
  YEAR = '365d'
}

// 用户行为统计接口
export interface UserBehaviorStats {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  userRetention: number;
  avgSessionDuration: number;
  topUserActions: Array<{
    action: string;
    count: number;
  }>;
}

// 视频性能统计接口
export interface VideoPerformanceStats {
  totalVideos: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  avgWatchTime: number;
  topVideos: Array<{
    videoId: string;
    title: string;
    views: number;
    likes: number;
  }>;
  categoryStats: Array<{
    category: string;
    count: number;
    views: number;
  }>;
}

// 直播统计接口
export interface LiveStreamingStats {
  totalStreams: number;
  activeStreams: number;
  totalViewers: number;
  avgViewersPerStream: number;
  totalRevenue: number;
  topStreamers: Array<{
    streamerId: string;
    username: string;
    totalViewers: number;
    revenue: number;
  }>;
}

// 收入统计接口
export interface RevenueStats {
  totalRevenue: number;
  subscriptionRevenue: number;
  giftRevenue: number;
  adRevenue: number;
  monthlyGrowth: number;
  topRevenueUsers: Array<{
    userId: string;
    username: string;
    revenue: number;
  }>;
}

export class AnalyticsService {
  private cacheExpiry = 300; // 5分钟缓存

  /**
   * 获取用户行为统计
   */
  public async getUserBehaviorStats(timeRange: TimeRange = TimeRange.DAY): Promise<UserBehaviorStats> {
    try {
      const cacheKey = `analytics:user_behavior:${timeRange}`;
      const cachedData = await redis.get(cacheKey);
      
      if (cachedData) {
        return JSON.parse(cachedData);
      }

      const { startDate, endDate } = this.getTimeRangeFilter(timeRange);
      
      // 总用户数
      const totalUsers = await User.countDocuments({});
      
      // 活跃用户数（在时间范围内有活动）
      const activeUsers = await User.countDocuments({
        lastActiveAt: { $gte: startDate, $lte: endDate }
      });
      
      // 新用户数
      const newUsers = await User.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate }
      });
      
      // 用户留存率（7天内再次访问的用户比例）
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const newUsersWeekAgo = await User.countDocuments({
        createdAt: { $gte: weekAgo, $lt: startDate }
      });
      
      const retainedUsers = await User.countDocuments({
        createdAt: { $gte: weekAgo, $lt: startDate },
        lastActiveAt: { $gte: startDate }
      });
      
      const userRetention = newUsersWeekAgo > 0 ? (retainedUsers / newUsersWeekAgo) * 100 : 0;
      
      // 获取用户行为数据（从Redis或日志中获取）
      const userActions = await this.getUserActionStats(startDate, endDate);
      
      const stats: UserBehaviorStats = {
        totalUsers,
        activeUsers,
        newUsers,
        userRetention: Math.round(userRetention * 100) / 100,
        avgSessionDuration: await this.getAvgSessionDuration(startDate, endDate),
        topUserActions: userActions
      };
      
      // 缓存结果
      await redis.setex(cacheKey, this.cacheExpiry, JSON.stringify(stats));
      
      return stats;
      
    } catch (error) {
      console.error('获取用户行为统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取视频性能统计
   */
  public async getVideoPerformanceStats(timeRange: TimeRange = TimeRange.DAY): Promise<VideoPerformanceStats> {
    try {
      const cacheKey = `analytics:video_performance:${timeRange}`;
      const cachedData = await redis.get(cacheKey);
      
      if (cachedData) {
        return JSON.parse(cachedData);
      }

      const { startDate, endDate } = this.getTimeRangeFilter(timeRange);
      
      // 基础视频统计
      const totalVideos = await Video.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate }
      });
      
      const videoStats = await Video.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalViews: { $sum: '$stats.views' },
            totalLikes: { $sum: '$stats.likes' },
            totalComments: { $sum: '$stats.comments' },
            avgWatchTime: { $avg: '$stats.avgWatchTime' }
          }
        }
      ]);
      
      // 热门视频
      const topVideos = await Video.find({
        createdAt: { $gte: startDate, $lte: endDate }
      })
      .sort({ 'stats.views': -1 })
      .limit(10)
      .select('title stats.views stats.likes')
      .lean();
      
      // 分类统计
      const categoryStats = await Video.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            views: { $sum: '$stats.views' }
          }
        },
        {
          $sort: { views: -1 }
        }
      ]);
      
      const baseStats = videoStats[0] || {
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        avgWatchTime: 0
      };
      
      const stats: VideoPerformanceStats = {
        totalVideos,
        totalViews: baseStats.totalViews,
        totalLikes: baseStats.totalLikes,
        totalComments: baseStats.totalComments,
        avgWatchTime: Math.round(baseStats.avgWatchTime),
        topVideos: topVideos.map(video => ({
          videoId: video._id.toString(),
          title: video.title,
          views: video.stats.views,
          likes: video.stats.likes
        })),
        categoryStats: categoryStats.map(cat => ({
          category: cat._id,
          count: cat.count,
          views: cat.views
        }))
      };
      
      await redis.setex(cacheKey, this.cacheExpiry, JSON.stringify(stats));
      return stats;
      
    } catch (error) {
      console.error('获取视频性能统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取直播统计
   */
  public async getLiveStreamingStats(timeRange: TimeRange = TimeRange.DAY): Promise<LiveStreamingStats> {
    try {
      const cacheKey = `analytics:live_streaming:${timeRange}`;
      const cachedData = await redis.get(cacheKey);
      
      if (cachedData) {
        return JSON.parse(cachedData);
      }

      const { startDate, endDate } = this.getTimeRangeFilter(timeRange);
      
      // 直播基础统计
      const totalStreams = await LiveStream.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate }
      });
      
      const activeStreams = await LiveStream.countDocuments({
        status: 'live',
        actualStartTime: { $gte: startDate, $lte: endDate }
      });
      
      // 直播观众和收入统计
      const streamStats = await LiveStream.aggregate([
        {
          $match: {
            actualStartTime: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalViewers: { $sum: '$stats.totalViews' },
            totalGiftValue: { $sum: '$stats.giftValue' }
          }
        }
      ]);
      
      const avgViewersPerStream = totalStreams > 0 ? 
        Math.round((streamStats[0]?.totalViewers || 0) / totalStreams) : 0;
      
      // 顶级主播统计
      const topStreamers = await LiveStream.aggregate([
        {
          $match: {
            actualStartTime: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$streamerId',
            totalViewers: { $sum: '$stats.totalViews' },
            revenue: { $sum: '$stats.giftValue' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'streamer'
          }
        },
        {
          $unwind: '$streamer'
        },
        {
          $project: {
            streamerId: '$_id',
            username: '$streamer.username',
            totalViewers: 1,
            revenue: 1
          }
        },
        {
          $sort: { totalViewers: -1 }
        },
        {
          $limit: 10
        }
      ]);
      
      const stats: LiveStreamingStats = {
        totalStreams,
        activeStreams,
        totalViewers: streamStats[0]?.totalViewers || 0,
        avgViewersPerStream,
        totalRevenue: streamStats[0]?.totalGiftValue || 0,
        topStreamers
      };
      
      await redis.setex(cacheKey, this.cacheExpiry, JSON.stringify(stats));
      return stats;
      
    } catch (error) {
      console.error('获取直播统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取收入统计
   */
  public async getRevenueStats(timeRange: TimeRange = TimeRange.MONTH): Promise<RevenueStats> {
    try {
      const cacheKey = `analytics:revenue:${timeRange}`;
      const cachedData = await redis.get(cacheKey);
      
      if (cachedData) {
        return JSON.parse(cachedData);
      }

      const { startDate, endDate } = this.getTimeRangeFilter(timeRange);
      
      // 礼物收入统计
      const giftRevenue = await LiveMessage.aggregate([
        {
          $match: {
            type: MessageType.GIFT,
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $multiply: ['$giftInfo.giftValue', '$giftInfo.quantity']
              }
            }
          }
        }
      ]);
      
      // 会员订阅收入（假设有会员系统）
      const subscriptionRevenue = await this.getSubscriptionRevenue(startDate, endDate);
      
      // 广告收入（从Redis获取）
      const adRevenue = await this.getAdRevenue(startDate, endDate);
      
      const totalGiftRevenue = giftRevenue[0]?.total || 0;
      const totalRevenue = totalGiftRevenue + subscriptionRevenue + adRevenue;
      
      // 月度增长率
      const lastPeriodRevenue = await this.getLastPeriodRevenue(timeRange);
      const monthlyGrowth = lastPeriodRevenue > 0 ? 
        ((totalRevenue - lastPeriodRevenue) / lastPeriodRevenue) * 100 : 0;
      
      // 收入贡献用户排行
      const topRevenueUsers = await LiveMessage.aggregate([
        {
          $match: {
            type: MessageType.GIFT,
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$userId',
            revenue: {
              $sum: {
                $multiply: ['$giftInfo.giftValue', '$giftInfo.quantity']
              }
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $project: {
            userId: '$_id',
            username: '$user.username',
            revenue: 1
          }
        },
        {
          $sort: { revenue: -1 }
        },
        {
          $limit: 10
        }
      ]);
      
      const stats: RevenueStats = {
        totalRevenue,
        subscriptionRevenue,
        giftRevenue: totalGiftRevenue,
        adRevenue,
        monthlyGrowth: Math.round(monthlyGrowth * 100) / 100,
        topRevenueUsers
      };
      
      await redis.setex(cacheKey, this.cacheExpiry, JSON.stringify(stats));
      return stats;
      
    } catch (error) {
      console.error('获取收入统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取内容审核统计
   */
  public async getModerationStats(timeRange: TimeRange = TimeRange.DAY): Promise<any> {
    try {
      const cacheKey = `analytics:moderation:${timeRange}`;
      const cachedData = await redis.get(cacheKey);
      
      if (cachedData) {
        return JSON.parse(cachedData);
      }

      // 从Redis获取审核日志
      const { startDate, endDate } = this.getTimeRangeFilter(timeRange);
      const dateKeys = this.getDateKeys(startDate, endDate);
      
      let totalModerations = 0;
      let moderationResults = {
        pass: 0,
        reject: 0,
        review: 0,
        block: 0
      };
      
      let moderationTypes = {
        video: 0,
        comment: 0,
        live_message: 0,
        user_profile: 0,
        live_stream: 0
      };
      
      for (const dateKey of dateKeys) {
        const logKey = `moderation_log:${dateKey}`;
        const logs = await redis.lrange(logKey, 0, -1);
        
        for (const logStr of logs) {
          try {
            const log = JSON.parse(logStr);
            const logTime = new Date(log.timestamp);
            
            if (logTime >= startDate && logTime <= endDate) {
              totalModerations++;
              moderationResults[log.result as keyof typeof moderationResults]++;
              moderationTypes[log.type as keyof typeof moderationTypes]++;
            }
          } catch (parseError) {
            // 忽略解析错误的日志
          }
        }
      }
      
      const stats = {
        totalModerations,
        moderationResults,
        moderationTypes,
        rejectionRate: totalModerations > 0 ? 
          (moderationResults.reject / totalModerations) * 100 : 0,
        averageConfidence: await this.getAverageModerationConfidence(startDate, endDate)
      };
      
      await redis.setex(cacheKey, this.cacheExpiry, JSON.stringify(stats));
      return stats;
      
    } catch (error) {
      console.error('获取审核统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取综合数据仪表板
   */
  public async getDashboardData(timeRange: TimeRange = TimeRange.DAY): Promise<any> {
    try {
      const [userStats, videoStats, liveStats, revenueStats, moderationStats] = await Promise.all([
        this.getUserBehaviorStats(timeRange),
        this.getVideoPerformanceStats(timeRange),
        this.getLiveStreamingStats(timeRange),
        this.getRevenueStats(timeRange),
        this.getModerationStats(timeRange)
      ]);
      
      return {
        timeRange,
        timestamp: new Date().toISOString(),
        userBehavior: userStats,
        videoPerformance: videoStats,
        liveStreaming: liveStats,
        revenue: revenueStats,
        moderation: moderationStats,
        summary: {
          totalUsers: userStats.totalUsers,
          totalVideos: videoStats.totalVideos,
          totalViews: videoStats.totalViews,
          totalRevenue: revenueStats.totalRevenue,
          activeStreams: liveStats.activeStreams
        }
      };
      
    } catch (error) {
      console.error('获取仪表板数据失败:', error);
      throw error;
    }
  }

  /**
   * 记录用户行为事件
   */
  public async trackUserAction(
    userId: string,
    action: string,
    metadata?: any
  ): Promise<void> {
    try {
      const event = {
        userId,
        action,
        metadata,
        timestamp: new Date().toISOString(),
        ip: metadata?.ip,
        userAgent: metadata?.userAgent
      };
      
      // 存储到Redis队列中
      const eventKey = `user_actions:${new Date().toISOString().split('T')[0]}`;
      await redis.lpush(eventKey, JSON.stringify(event));
      await redis.expire(eventKey, 30 * 24 * 60 * 60); // 保存30天
      
      // 更新用户活跃时间
      await User.findByIdAndUpdate(userId, {
        lastActiveAt: new Date()
      });
      
    } catch (error) {
      console.error('记录用户行为失败:', error);
    }
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 获取时间范围过滤器
   */
  private getTimeRangeFilter(timeRange: TimeRange): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case TimeRange.HOUR:
        startDate.setHours(endDate.getHours() - 1);
        break;
      case TimeRange.DAY:
        startDate.setDate(endDate.getDate() - 1);
        break;
      case TimeRange.WEEK:
        startDate.setDate(endDate.getDate() - 7);
        break;
      case TimeRange.MONTH:
        startDate.setDate(endDate.getDate() - 30);
        break;
      case TimeRange.YEAR:
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }
    
    return { startDate, endDate };
  }

  /**
   * 获取用户行为统计
   */
  private async getUserActionStats(startDate: Date, endDate: Date): Promise<Array<{ action: string; count: number }>> {
    try {
      const dateKeys = this.getDateKeys(startDate, endDate);
      const actionCounts: { [key: string]: number } = {};
      
      for (const dateKey of dateKeys) {
        const eventKey = `user_actions:${dateKey}`;
        const events = await redis.lrange(eventKey, 0, -1);
        
        for (const eventStr of events) {
          try {
            const event = JSON.parse(eventStr);
            const eventTime = new Date(event.timestamp);
            
            if (eventTime >= startDate && eventTime <= endDate) {
              actionCounts[event.action] = (actionCounts[event.action] || 0) + 1;
            }
          } catch (parseError) {
            // 忽略解析错误的事件
          }
        }
      }
      
      return Object.entries(actionCounts)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
        
    } catch (error) {
      console.error('获取用户行为统计失败:', error);
      return [];
    }
  }

  /**
   * 获取平均会话时长
   */
  private async getAvgSessionDuration(startDate: Date, endDate: Date): Promise<number> {
    try {
      // 从Redis获取会话数据或根据用户行为计算
      const sessionKey = `session_duration:${startDate.toISOString().split('T')[0]}`;
      const sessions = await redis.lrange(sessionKey, 0, -1);
      
      if (sessions.length === 0) return 0;
      
      const durations = sessions
        .map(session => {
          try {
            return JSON.parse(session).duration;
          } catch {
            return 0;
          }
        })
        .filter(duration => duration > 0);
      
      return durations.length > 0 ? 
        Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length) : 0;
        
    } catch (error) {
      console.error('获取平均会话时长失败:', error);
      return 0;
    }
  }

  /**
   * 获取订阅收入
   */
  private async getSubscriptionRevenue(startDate: Date, endDate: Date): Promise<number> {
    try {
      // 假设有订阅表，这里返回模拟数据
      const key = `subscription_revenue:${startDate.toISOString().split('T')[0]}`;
      const revenue = await redis.get(key);
      return revenue ? parseFloat(revenue) : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 获取广告收入
   */
  private async getAdRevenue(startDate: Date, endDate: Date): Promise<number> {
    try {
      const key = `ad_revenue:${startDate.toISOString().split('T')[0]}`;
      const revenue = await redis.get(key);
      return revenue ? parseFloat(revenue) : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 获取上期收入
   */
  private async getLastPeriodRevenue(timeRange: TimeRange): Promise<number> {
    try {
      const { startDate: currentStart } = this.getTimeRangeFilter(timeRange);
      const lastPeriodEnd = new Date(currentStart.getTime() - 1);
      const lastPeriodStart = new Date(lastPeriodEnd);
      
      switch (timeRange) {
        case TimeRange.DAY:
          lastPeriodStart.setDate(lastPeriodEnd.getDate() - 1);
          break;
        case TimeRange.WEEK:
          lastPeriodStart.setDate(lastPeriodEnd.getDate() - 7);
          break;
        case TimeRange.MONTH:
          lastPeriodStart.setDate(lastPeriodEnd.getDate() - 30);
          break;
        default:
          return 0;
      }
      
      const lastPeriodGifts = await LiveMessage.aggregate([
        {
          $match: {
            type: MessageType.GIFT,
            createdAt: { $gte: lastPeriodStart, $lte: lastPeriodEnd }
          }
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $multiply: ['$giftInfo.giftValue', '$giftInfo.quantity']
              }
            }
          }
        }
      ]);
      
      return lastPeriodGifts[0]?.total || 0;
      
    } catch (error) {
      return 0;
    }
  }

  /**
   * 获取审核平均置信度
   */
  private async getAverageModerationConfidence(startDate: Date, endDate: Date): Promise<number> {
    try {
      const dateKeys = this.getDateKeys(startDate, endDate);
      let totalConfidence = 0;
      let count = 0;
      
      for (const dateKey of dateKeys) {
        const logKey = `moderation_log:${dateKey}`;
        const logs = await redis.lrange(logKey, 0, -1);
        
        for (const logStr of logs) {
          try {
            const log = JSON.parse(logStr);
            const logTime = new Date(log.timestamp);
            
            if (logTime >= startDate && logTime <= endDate && log.confidence) {
              totalConfidence += log.confidence;
              count++;
            }
          } catch (parseError) {
            // 忽略解析错误的日志
          }
        }
      }
      
      return count > 0 ? Math.round((totalConfidence / count) * 100) / 100 : 0;
      
    } catch (error) {
      return 0;
    }
  }

  /**
   * 获取日期键数组
   */
  private getDateKeys(startDate: Date, endDate: Date): string[] {
    const keys: string[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      keys.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    
    return keys;
  }
}

export default new AnalyticsService();