/*
 * 大雄视频平台 - 数据分析控制器
 * 提供数据统计和分析的API接口
 */

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import AnalyticsService, { TimeRange } from '../services/AnalyticsService';
import User from '../models/User';
import { ApiResponse } from '../types/ApiResponse';

export class AnalyticsController {

  /**
   * 获取数据仪表板
   * GET /api/analytics/dashboard
   */
  public async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const timeRange = (req.query.timeRange as TimeRange) || TimeRange.DAY;
      const currentUserId = req.user!.id;

      // 检查权限
      const user = await User.findById(currentUserId);
      if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
        res.status(403).json({
          success: false,
          message: '需要管理员权限'
        } as ApiResponse);
        return;
      }

      const dashboardData = await AnalyticsService.getDashboardData(timeRange);

      res.json({
        success: true,
        data: dashboardData
      } as ApiResponse);

    } catch (error) {
      console.error('获取仪表板数据失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 获取用户行为统计
   * GET /api/analytics/user-behavior
   */
  public async getUserBehaviorStats(req: Request, res: Response): Promise<void> {
    try {
      const timeRange = (req.query.timeRange as TimeRange) || TimeRange.DAY;
      const currentUserId = req.user!.id;

      // 检查权限
      const user = await User.findById(currentUserId);
      if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
        res.status(403).json({
          success: false,
          message: '需要管理员权限'
        } as ApiResponse);
        return;
      }

      const stats = await AnalyticsService.getUserBehaviorStats(timeRange);

      res.json({
        success: true,
        data: { stats }
      } as ApiResponse);

    } catch (error) {
      console.error('获取用户行为统计失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 获取视频性能统计
   * GET /api/analytics/video-performance
   */
  public async getVideoPerformanceStats(req: Request, res: Response): Promise<void> {
    try {
      const timeRange = (req.query.timeRange as TimeRange) || TimeRange.DAY;
      const currentUserId = req.user!.id;

      // 检查权限 - 视频创作者可以查看自己的统计，管理员可以查看全部
      const user = await User.findById(currentUserId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: '用户不存在'
        } as ApiResponse);
        return;
      }

      const stats = await AnalyticsService.getVideoPerformanceStats(timeRange);

      res.json({
        success: true,
        data: { stats }
      } as ApiResponse);

    } catch (error) {
      console.error('获取视频性能统计失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 获取直播统计
   * GET /api/analytics/live-streaming
   */
  public async getLiveStreamingStats(req: Request, res: Response): Promise<void> {
    try {
      const timeRange = (req.query.timeRange as TimeRange) || TimeRange.DAY;
      const currentUserId = req.user!.id;

      const user = await User.findById(currentUserId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: '用户不存在'
        } as ApiResponse);
        return;
      }

      const stats = await AnalyticsService.getLiveStreamingStats(timeRange);

      res.json({
        success: true,
        data: { stats }
      } as ApiResponse);

    } catch (error) {
      console.error('获取直播统计失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 获取收入统计
   * GET /api/analytics/revenue
   */
  public async getRevenueStats(req: Request, res: Response): Promise<void> {
    try {
      const timeRange = (req.query.timeRange as TimeRange) || TimeRange.MONTH;
      const currentUserId = req.user!.id;

      // 检查权限 - 只有管理员可以查看收入统计
      const user = await User.findById(currentUserId);
      if (!user || user.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: '需要管理员权限'
        } as ApiResponse);
        return;
      }

      const stats = await AnalyticsService.getRevenueStats(timeRange);

      res.json({
        success: true,
        data: { stats }
      } as ApiResponse);

    } catch (error) {
      console.error('获取收入统计失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 获取内容审核统计
   * GET /api/analytics/moderation
   */
  public async getModerationStats(req: Request, res: Response): Promise<void> {
    try {
      const timeRange = (req.query.timeRange as TimeRange) || TimeRange.DAY;
      const currentUserId = req.user!.id;

      // 检查权限
      const user = await User.findById(currentUserId);
      if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
        res.status(403).json({
          success: false,
          message: '需要管理员或审核员权限'
        } as ApiResponse);
        return;
      }

      const stats = await AnalyticsService.getModerationStats(timeRange);

      res.json({
        success: true,
        data: { stats }
      } as ApiResponse);

    } catch (error) {
      console.error('获取审核统计失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 记录用户行为事件
   * POST /api/analytics/track
   */
  public async trackUserAction(req: Request, res: Response): Promise<void> {
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

      const { action, metadata } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: '用户未登录'
        } as ApiResponse);
        return;
      }

      // 添加请求元数据
      const requestMetadata = {
        ...metadata,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer')
      };

      await AnalyticsService.trackUserAction(userId, action, requestMetadata);

      res.json({
        success: true,
        message: '用户行为记录成功'
      } as ApiResponse);

    } catch (error) {
      console.error('记录用户行为失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 获取用户个人统计（创作者可查看自己的数据）
   * GET /api/analytics/my-stats
   */
  public async getMyStats(req: Request, res: Response): Promise<void> {
    try {
      const timeRange = (req.query.timeRange as TimeRange) || TimeRange.MONTH;
      const currentUserId = req.user!.id;

      const user = await User.findById(currentUserId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: '用户不存在'
        } as ApiResponse);
        return;
      }

      // 获取用户相关的统计数据
      const stats = await this.getUserPersonalStats(currentUserId, timeRange);

      res.json({
        success: true,
        data: { stats }
      } as ApiResponse);

    } catch (error) {
      console.error('获取个人统计失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 导出分析报告
   * GET /api/analytics/export
   */
  public async exportAnalyticsReport(req: Request, res: Response): Promise<void> {
    try {
      const timeRange = (req.query.timeRange as TimeRange) || TimeRange.MONTH;
      const format = (req.query.format as string) || 'json';
      const currentUserId = req.user!.id;

      // 检查权限
      const user = await User.findById(currentUserId);
      if (!user || user.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: '需要管理员权限'
        } as ApiResponse);
        return;
      }

      const reportData = await AnalyticsService.getDashboardData(timeRange);
      
      if (format === 'csv') {
        // 生成CSV格式
        const csvData = this.convertToCSV(reportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=analytics_report_${timeRange}.csv`);
        res.send(csvData);
      } else {
        // 默认JSON格式
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=analytics_report_${timeRange}.json`);
        res.json(reportData);
      }

    } catch (error) {
      console.error('导出分析报告失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 获取用户个人统计
   */
  private async getUserPersonalStats(userId: string, timeRange: TimeRange): Promise<any> {
    try {
      // 获取用户的视频统计、直播统计等
      const { Video, LiveStream, Comment } = await import('../models');
      const { startDate, endDate } = this.getTimeRangeFilter(timeRange);

      const videoStats = await Video.aggregate([
        {
          $match: {
            uploader: userId,
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalVideos: { $sum: 1 },
            totalViews: { $sum: '$stats.views' },
            totalLikes: { $sum: '$stats.likes' },
            totalComments: { $sum: '$stats.comments' }
          }
        }
      ]);

      const liveStats = await LiveStream.aggregate([
        {
          $match: {
            streamerId: userId,
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalStreams: { $sum: 1 },
            totalViewers: { $sum: '$stats.totalViews' },
            totalRevenue: { $sum: '$stats.giftValue' }
          }
        }
      ]);

      return {
        videos: videoStats[0] || { totalVideos: 0, totalViews: 0, totalLikes: 0, totalComments: 0 },
        liveStreams: liveStats[0] || { totalStreams: 0, totalViewers: 0, totalRevenue: 0 }
      };

    } catch (error) {
      console.error('获取用户个人统计失败:', error);
      return {};
    }
  }

  /**
   * 转换为CSV格式
   */
  private convertToCSV(data: any): string {
    try {
      const lines: string[] = [];
      
      // 添加标题行
      lines.push('指标,数值,时间范围');
      
      // 添加数据行
      lines.push(`总用户数,${data.userBehavior.totalUsers},${data.timeRange}`);
      lines.push(`活跃用户数,${data.userBehavior.activeUsers},${data.timeRange}`);
      lines.push(`总视频数,${data.videoPerformance.totalVideos},${data.timeRange}`);
      lines.push(`总观看数,${data.videoPerformance.totalViews},${data.timeRange}`);
      lines.push(`总收入,${data.revenue.totalRevenue},${data.timeRange}`);
      lines.push(`活跃直播,${data.liveStreaming.activeStreams},${data.timeRange}`);
      
      return lines.join('\n');
    } catch (error) {
      console.error('转换CSV失败:', error);
      return '';
    }
  }

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
}

export default new AnalyticsController();