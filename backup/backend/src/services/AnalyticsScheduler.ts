/*
 * 大雄视频平台 - 数据分析任务调度器
 * 定期执行数据统计、报告生成、数据清理等任务
 */

import cron from 'node-cron';
import AnalyticsService, { TimeRange } from './AnalyticsService';
import User from '../models/User';
import Video from '../models/Video';
import LiveStream from '../models/LiveStream';
import LiveMessage from '../models/LiveMessage';
import Comment from '../models/Comment';
import redis from '../config/redis';
import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';

export class AnalyticsScheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private isRunning = false;
  private emailTransporter?: nodemailer.Transporter;

  constructor() {
    this.initializeEmailTransporter();
  }

  /**
   * 启动所有定时任务
   */
  public start(): void {
    if (this.isRunning) {
      console.log('数据分析调度器已在运行中');
      return;
    }

    console.log('启动数据分析调度器...');
    
    // 每小时执行一次实时统计缓存更新
    this.scheduleJob('hourly-stats', '0 * * * *', () => {
      this.updateHourlyStats();
    });

    // 每天凌晨2点执行日报生成
    this.scheduleJob('daily-report', '0 2 * * *', () => {
      this.generateDailyReport();
    });

    // 每周一凌晨3点执行周报生成
    this.scheduleJob('weekly-report', '0 3 * * 1', () => {
      this.generateWeeklyReport();
    });

    // 每月1号凌晨4点执行月报生成
    this.scheduleJob('monthly-report', '0 4 1 * *', () => {
      this.generateMonthlyReport();
    });

    // 每天凌晨1点清理过期数据
    this.scheduleJob('data-cleanup', '0 1 * * *', () => {
      this.cleanupExpiredData();
    });

    // 每6小时更新用户活跃度
    this.scheduleJob('user-activity', '0 */6 * * *', () => {
      this.updateUserActivity();
    });

    // 每30分钟更新热门内容缓存
    this.scheduleJob('trending-cache', '*/30 * * * *', () => {
      this.updateTrendingCache();
    });

    // 每5分钟检查系统健康状态
    this.scheduleJob('health-check', '*/5 * * * *', () => {
      this.performHealthCheck();
    });

    this.isRunning = true;
    console.log('数据分析调度器启动完成');
  }

  /**
   * 停止所有定时任务
   */
  public stop(): void {
    if (!this.isRunning) {
      console.log('数据分析调度器未在运行');
      return;
    }

    console.log('停止数据分析调度器...');
    
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`停止任务: ${name}`);
    });
    
    this.jobs.clear();
    this.isRunning = false;
    
    console.log('数据分析调度器已停止');
  }

  /**
   * 获取调度器状态
   */
  public getStatus(): any {
    return {
      isRunning: this.isRunning,
      activeJobs: Array.from(this.jobs.keys()),
      lastRunTime: new Date().toISOString()
    };
  }

  // ==================== 私有方法 ====================

  /**
   * 调度任务
   */
  private scheduleJob(name: string, schedule: string, task: () => void): void {
    const job = cron.schedule(schedule, async () => {
      try {
        console.log(`开始执行任务: ${name}`);
        await task();
        console.log(`任务执行完成: ${name}`);
        
        // 记录任务执行状态
        await redis.hset('scheduler_status', name, new Date().toISOString());
        
      } catch (error) {
        console.error(`任务执行失败 ${name}:`, error);
        
        // 记录错误信息
        await redis.hset('scheduler_errors', name, JSON.stringify({
          error: error.message,
          timestamp: new Date().toISOString()
        }));
      }
    }, {
      scheduled: false
    });

    this.jobs.set(name, job);
    job.start();
    
    console.log(`调度任务已启动: ${name} (${schedule})`);
  }

  /**
   * 初始化邮件传输器
   */
  private initializeEmailTransporter(): void {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.emailTransporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      
      console.log('邮件服务初始化完成');
    } else {
      console.log('邮件服务配置不完整，跳过初始化');
    }
  }

  /**
   * 更新每小时统计
   */
  private async updateHourlyStats(): Promise<void> {
    console.log('开始更新每小时统计...');
    
    // 清理过期缓存
    const keys = await redis.keys('analytics:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    
    // 预热缓存
    await Promise.all([
      AnalyticsService.getUserBehaviorStats(TimeRange.HOUR),
      AnalyticsService.getVideoPerformanceStats(TimeRange.HOUR),
      AnalyticsService.getLiveStreamingStats(TimeRange.HOUR)
    ]);
    
    console.log('每小时统计更新完成');
  }

  /**
   * 生成日报
   */
  private async generateDailyReport(): Promise<void> {
    console.log('开始生成日报...');
    
    const reportData = await AnalyticsService.getDashboardData(TimeRange.DAY);
    const reportDate = new Date().toISOString().split('T')[0];
    
    // 保存报告到Redis
    await redis.setex(
      `daily_report:${reportDate}`,
      30 * 24 * 60 * 60, // 保存30天
      JSON.stringify(reportData)
    );
    
    // 发送邮件报告
    if (this.emailTransporter) {
      await this.sendDailyReportEmail(reportData, reportDate);
    }
    
    console.log(`日报生成完成: ${reportDate}`);
  }

  /**
   * 生成周报
   */
  private async generateWeeklyReport(): Promise<void> {
    console.log('开始生成周报...');
    
    const reportData = await AnalyticsService.getDashboardData(TimeRange.WEEK);
    const reportWeek = this.getWeekNumber(new Date());
    
    // 保存报告
    await redis.setex(
      `weekly_report:${reportWeek}`,
      90 * 24 * 60 * 60, // 保存90天
      JSON.stringify(reportData)
    );
    
    console.log(`周报生成完成: 第${reportWeek}周`);
  }

  /**
   * 生成月报
   */
  private async generateMonthlyReport(): Promise<void> {
    console.log('开始生成月报...');
    
    const reportData = await AnalyticsService.getDashboardData(TimeRange.MONTH);
    const reportMonth = new Date().toISOString().substr(0, 7); // YYYY-MM
    
    // 保存报告
    await redis.setex(
      `monthly_report:${reportMonth}`,
      365 * 24 * 60 * 60, // 保存1年
      JSON.stringify(reportData)
    );
    
    // 发送月报邮件
    if (this.emailTransporter) {
      await this.sendMonthlyReportEmail(reportData, reportMonth);
    }
    
    console.log(`月报生成完成: ${reportMonth}`);
  }

  /**
   * 清理过期数据
   */
  private async cleanupExpiredData(): Promise<void> {
    console.log('开始清理过期数据...');
    
    const cleanupTasks = [
      // 清理过期的聊天消息
      LiveMessage.cleanupExpiredMessages(),
      
      // 清理离线直播
      LiveStream.cleanupOfflineStreams(),
      
      // 清理过期的用户行为记录
      this.cleanupUserActions(),
      
      // 清理过期的统计缓存
      this.cleanupStatsCaches(),
      
      // 清理过期的会话数据
      this.cleanupSessionData()
    ];
    
    const results = await Promise.allSettled(cleanupTasks);
    
    let successCount = 0;
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successCount++;
      } else {
        console.error(`清理任务 ${index} 失败:`, result.reason);
      }
    });
    
    console.log(`数据清理完成: ${successCount}/${results.length} 个任务成功`);
  }

  /**
   * 更新用户活跃度
   */
  private async updateUserActivity(): Promise<void> {
    console.log('开始更新用户活跃度...');
    
    const onlineUserIds = await redis.smembers('online_users');
    
    if (onlineUserIds.length > 0) {
      // 批量更新用户最后活跃时间
      await User.updateMany(
        { _id: { $in: onlineUserIds } },
        { lastActiveAt: new Date() }
      );
      
      console.log(`更新了 ${onlineUserIds.length} 个用户的活跃度`);
    }
    
    // 清理离线用户（超过1小时未活动）
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const offlineUsers = await redis.keys('user_session:*');
    
    for (const sessionKey of offlineUsers) {
      const sessionData = await redis.get(sessionKey);
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData);
          const lastActive = new Date(session.lastActive);
          
          if (lastActive < oneHourAgo) {
            const userId = sessionKey.replace('user_session:', '');
            await redis.srem('online_users', userId);
            await redis.del(sessionKey);
          }
        } catch (error) {
          // 删除无效的会话数据
          await redis.del(sessionKey);
        }
      }
    }
  }

  /**
   * 更新热门内容缓存
   */
  private async updateTrendingCache(): Promise<void> {
    console.log('开始更新热门内容缓存...');
    
    // 获取过去24小时的热门视频
    const trendingVideos = await Video.find({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    })
    .sort({ 'stats.views': -1, 'stats.likes': -1 })
    .limit(50)
    .select('_id title thumbnail stats category uploader')
    .populate('uploader', 'username nickname avatar verified')
    .lean();
    
    // 更新缓存
    await redis.setex(
      'trending_videos',
      30 * 60, // 30分钟
      JSON.stringify(trendingVideos)
    );
    
    // 获取热门直播
    const trendingStreams = await LiveStream.find({
      status: 'live'
    })
    .sort({ 'stats.currentViewers': -1 })
    .limit(20)
    .select('_id title thumbnail category stats streamerId')
    .populate('streamerId', 'username nickname avatar verified')
    .lean();
    
    await redis.setex(
      'trending_streams',
      5 * 60, // 5分钟
      JSON.stringify(trendingStreams)
    );
    
    console.log(`热门内容缓存更新完成: ${trendingVideos.length} 个视频, ${trendingStreams.length} 个直播`);
  }

  /**
   * 执行健康检查
   */
  private async performHealthCheck(): Promise<void> {
    const health = {
      timestamp: new Date().toISOString(),
      database: 'unknown',
      redis: 'unknown',
      diskSpace: 0,
      memoryUsage: process.memoryUsage()
    };
    
    try {
      // 检查数据库连接
      await User.findOne().limit(1);
      health.database = 'healthy';
    } catch (error) {
      health.database = 'unhealthy';
      console.error('数据库健康检查失败:', error);
    }
    
    try {
      // 检查Redis连接
      await redis.ping();
      health.redis = 'healthy';
    } catch (error) {
      health.redis = 'unhealthy';
      console.error('Redis健康检查失败:', error);
    }
    
    // 保存健康检查结果
    await redis.setex('system_health', 300, JSON.stringify(health)); // 5分钟
    
    // 如果有严重问题，发送告警
    if (health.database === 'unhealthy' || health.redis === 'unhealthy') {
      console.warn('系统健康检查发现问题:', health);
      // 这里可以发送告警邮件或推送通知
    }
  }

  /**
   * 清理用户行为记录
   */
  private async cleanupUserActions(): Promise<void> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];
    
    const keys = await redis.keys(`user_actions:*`);
    let deletedCount = 0;
    
    for (const key of keys) {
      const keyDate = key.split(':')[1];
      if (keyDate && keyDate < dateStr) {
        await redis.del(key);
        deletedCount++;
      }
    }
    
    console.log(`清理了 ${deletedCount} 个过期的用户行为记录`);
  }

  /**
   * 清理统计缓存
   */
  private async cleanupStatsCaches(): Promise<void> {
    const keys = await redis.keys('analytics:*');
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`清理了 ${keys.length} 个统计缓存`);
    }
  }

  /**
   * 清理会话数据
   */
  private async cleanupSessionData(): Promise<void> {
    const keys = await redis.keys('session:*');
    let deletedCount = 0;
    
    for (const key of keys) {
      const ttl = await redis.ttl(key);
      if (ttl === -1) { // 没有过期时间的键
        await redis.del(key);
        deletedCount++;
      }
    }
    
    console.log(`清理了 ${deletedCount} 个无效会话`);
  }

  /**
   * 发送日报邮件
   */
  private async sendDailyReportEmail(reportData: any, reportDate: string): Promise<void> {
    if (!this.emailTransporter) return;
    
    try {
      const adminEmails = await this.getAdminEmails();
      if (adminEmails.length === 0) return;
      
      const htmlContent = this.generateReportHTML(reportData, '日报', reportDate);
      
      await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: adminEmails.join(','),
        subject: `大雄视频平台日报 - ${reportDate}`,
        html: htmlContent
      });
      
      console.log(`日报邮件已发送给 ${adminEmails.length} 个管理员`);
      
    } catch (error) {
      console.error('发送日报邮件失败:', error);
    }
  }

  /**
   * 发送月报邮件
   */
  private async sendMonthlyReportEmail(reportData: any, reportMonth: string): Promise<void> {
    if (!this.emailTransporter) return;
    
    try {
      const adminEmails = await this.getAdminEmails();
      if (adminEmails.length === 0) return;
      
      const htmlContent = this.generateReportHTML(reportData, '月报', reportMonth);
      
      await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: adminEmails.join(','),
        subject: `大雄视频平台月报 - ${reportMonth}`,
        html: htmlContent
      });
      
      console.log(`月报邮件已发送给 ${adminEmails.length} 个管理员`);
      
    } catch (error) {
      console.error('发送月报邮件失败:', error);
    }
  }

  /**
   * 获取管理员邮箱列表
   */
  private async getAdminEmails(): Promise<string[]> {
    try {
      const admins = await User.find(
        { role: 'admin', email: { $exists: true, $ne: null } },
        { email: 1 }
      ).lean();
      
      return admins.map(admin => admin.email).filter(Boolean);
    } catch (error) {
      console.error('获取管理员邮箱失败:', error);
      return [];
    }
  }

  /**
   * 生成报告HTML
   */
  private generateReportHTML(reportData: any, reportType: string, reportPeriod: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>大雄视频平台${reportType}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .metric { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
        .metric-title { font-weight: bold; color: #333; }
        .metric-value { font-size: 24px; color: #4CAF50; }
        .footer { margin-top: 30px; padding: 20px; background: #eee; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>大雄视频平台${reportType}</h1>
        <p>报告期间: ${reportPeriod}</p>
      </div>
      
      <div class="content">
        <div class="metric">
          <div class="metric-title">总用户数</div>
          <div class="metric-value">${reportData.userBehavior?.totalUsers || 0}</div>
        </div>
        
        <div class="metric">
          <div class="metric-title">活跃用户数</div>
          <div class="metric-value">${reportData.userBehavior?.activeUsers || 0}</div>
        </div>
        
        <div class="metric">
          <div class="metric-title">总视频数</div>
          <div class="metric-value">${reportData.videoPerformance?.totalVideos || 0}</div>
        </div>
        
        <div class="metric">
          <div class="metric-title">总观看次数</div>
          <div class="metric-value">${reportData.videoPerformance?.totalViews || 0}</div>
        </div>
        
        <div class="metric">
          <div class="metric-title">活跃直播</div>
          <div class="metric-value">${reportData.liveStreaming?.activeStreams || 0}</div>
        </div>
        
        <div class="metric">
          <div class="metric-title">总收入</div>
          <div class="metric-value">¥${reportData.revenue?.totalRevenue || 0}</div>
        </div>
      </div>
      
      <div class="footer">
        <p>此邮件由大雄视频平台数据分析系统自动生成</p>
        <p>生成时间: ${new Date().toLocaleString('zh-CN')}</p>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * 获取周数
   */
  private getWeekNumber(date: Date): string {
    const year = date.getFullYear();
    const start = new Date(year, 0, 1);
    const days = Math.floor((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + start.getDay() + 1) / 7);
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
  }
}

export default new AnalyticsScheduler();