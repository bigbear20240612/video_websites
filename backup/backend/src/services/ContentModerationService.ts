/*
 * 大雄视频平台 - 内容审核服务
 * 处理视频、评论、直播等内容的自动化和人工审核
 */

import mongoose from 'mongoose';
import axios from 'axios';
import Video, { IVideo, VideoStatus } from '../models/Video';
import Comment, { IComment, CommentStatus } from '../models/Comment';
import LiveStream, { ILiveStream } from '../models/LiveStream';
import LiveMessage, { ILiveMessage, MessageStatus } from '../models/LiveMessage';
import User, { IUser } from '../models/User';
import redis from '../config/redis';

// 审核结果枚举
export enum ModerationResult {
  PASS = 'pass',               // 通过
  REJECT = 'reject',           // 拒绝
  REVIEW = 'review',           // 人工审核
  BLOCK = 'block'              // 封禁
}

// 审核类型枚举
export enum ModerationType {
  VIDEO = 'video',
  COMMENT = 'comment',
  LIVE_MESSAGE = 'live_message',
  USER_PROFILE = 'user_profile',
  LIVE_STREAM = 'live_stream'
}

// 审核规则配置
interface ModerationRule {
  type: 'keyword' | 'regex' | 'ai' | 'image' | 'video' | 'audio';
  pattern?: string;
  keywords?: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: ModerationResult;
  description: string;
}

// 审核结果接口
export interface ModerationResponse {
  result: ModerationResult;
  confidence: number;          // 置信度 0-1
  reasons: string[];           // 审核原因
  details?: any;               // 详细信息
  suggestions?: string[];       // 建议
}

export class ContentModerationService {
  private moderationRules: ModerationRule[] = [];
  private aiModerationEnabled: boolean;
  private sensitiveWords: Set<string> = new Set();

  constructor() {
    this.aiModerationEnabled = process.env.AI_MODERATION_ENABLED === 'true';
    this.initializeModerationRules();
    this.loadSensitiveWords();
  }

  /**
   * 初始化审核规则
   */
  private initializeModerationRules(): void {
    this.moderationRules = [
      // 关键词规则
      {
        type: 'keyword',
        keywords: ['暴力', '色情', '赌博', '毒品', '政治敏感'],
        severity: 'critical',
        action: ModerationResult.REJECT,
        description: '包含严重违禁内容'
      },
      {
        type: 'keyword',
        keywords: ['垃圾', '广告', '推广', '加微信'],
        severity: 'medium',
        action: ModerationResult.REVIEW,
        description: '疑似垃圾内容'
      },
      
      // 正则表达式规则
      {
        type: 'regex',
        pattern: '/微信号?[:：\\s]*[a-zA-Z0-9_-]+/',
        severity: 'medium',
        action: ModerationResult.REVIEW,
        description: '包含联系方式'
      },
      {
        type: 'regex',
        pattern: '/QQ[号群]?[:：\\s]*[0-9]+/',
        severity: 'medium',
        action: ModerationResult.REVIEW,
        description: '包含QQ信息'
      },
      
      // AI审核规则
      {
        type: 'ai',
        severity: 'high',
        action: ModerationResult.REVIEW,
        description: 'AI检测到可能的违规内容'
      }
    ];
  }

  /**
   * 加载敏感词库
   */
  private async loadSensitiveWords(): Promise<void> {
    try {
      // 从Redis或数据库加载敏感词
      const cachedWords = await redis.smembers('sensitive_words');
      
      if (cachedWords.length > 0) {
        cachedWords.forEach(word => this.sensitiveWords.add(word));
      } else {
        // 默认敏感词列表
        const defaultWords = [
          '傻逼', '白痴', '智障', '垃圾', '废物', '混蛋',
          '政治', '敏感', '暴力', '色情', '赌博', '毒品',
          '法轮功', '六四', '天安门', 'Falun', '1989',
          '黄色', '色情', '成人', '裸体', '性感',
          '赌博', '博彩', '彩票', '投注', '下注',
          '毒品', '大麻', '海洛因', '冰毒', '摇头丸'
        ];
        
        defaultWords.forEach(word => this.sensitiveWords.add(word));
        
        // 缓存到Redis
        if (defaultWords.length > 0) {
          await redis.sadd('sensitive_words', ...defaultWords);
          await redis.expire('sensitive_words', 24 * 60 * 60); // 24小时过期
        }
      }
      
      console.log(`加载了 ${this.sensitiveWords.size} 个敏感词`);
    } catch (error) {
      console.error('加载敏感词失败:', error);
    }
  }

  /**
   * 审核文本内容
   */
  public async moderateText(content: string, type: ModerationType): Promise<ModerationResponse> {
    const reasons: string[] = [];
    let maxSeverity = 'low';
    let result = ModerationResult.PASS;
    let confidence = 0.5;

    try {
      // 1. 敏感词检测
      const keywordResult = this.checkKeywords(content);
      if (keywordResult.detected) {
        reasons.push(...keywordResult.reasons);
        maxSeverity = this.compareSeverity(maxSeverity, keywordResult.severity);
        confidence = Math.max(confidence, 0.9);
      }

      // 2. 正则表达式检测
      const regexResult = this.checkRegexPatterns(content);
      if (regexResult.detected) {
        reasons.push(...regexResult.reasons);
        maxSeverity = this.compareSeverity(maxSeverity, regexResult.severity);
        confidence = Math.max(confidence, 0.8);
      }

      // 3. AI内容审核（如果启用）
      if (this.aiModerationEnabled) {
        const aiResult = await this.aiModerateText(content);
        if (aiResult.detected) {
          reasons.push(...aiResult.reasons);
          maxSeverity = this.compareSeverity(maxSeverity, aiResult.severity);
          confidence = Math.max(confidence, aiResult.confidence);
        }
      }

      // 4. 根据严重程度决定审核结果
      result = this.determineResult(maxSeverity, reasons.length);

      // 5. 记录审核日志
      await this.logModerationResult(type, content, result, reasons, confidence);

      return {
        result,
        confidence,
        reasons,
        suggestions: this.generateSuggestions(reasons)
      };

    } catch (error) {
      console.error('文本审核失败:', error);
      
      return {
        result: ModerationResult.REVIEW, // 出错时转人工审核
        confidence: 0,
        reasons: ['系统错误，转人工审核'],
        suggestions: ['请联系管理员']
      };
    }
  }

  /**
   * 审核视频内容
   */
  public async moderateVideo(video: IVideo): Promise<ModerationResponse> {
    const reasons: string[] = [];
    let confidence = 0.5;
    
    try {
      // 1. 标题和描述审核
      const titleResult = await this.moderateText(video.title, ModerationType.VIDEO);
      const descResult = await this.moderateText(video.description, ModerationType.VIDEO);

      if (titleResult.result !== ModerationResult.PASS) {
        reasons.push('标题违规: ' + titleResult.reasons.join(', '));
      }

      if (descResult.result !== ModerationResult.PASS) {
        reasons.push('描述违规: ' + descResult.reasons.join(', '));
      }

      // 2. 视频时长检查
      if (video.duration < 5) {
        reasons.push('视频时长过短');
        confidence = Math.max(confidence, 0.6);
      } else if (video.duration > 7200) { // 2小时
        reasons.push('视频时长过长，需要审核');
        confidence = Math.max(confidence, 0.7);
      }

      // 3. 缩略图审核（如果有AI服务）
      if (video.thumbnail && this.aiModerationEnabled) {
        const imageResult = await this.aiModerateImage(video.thumbnail);
        if (imageResult.detected) {
          reasons.push('缩略图违规: ' + imageResult.reasons.join(', '));
          confidence = Math.max(confidence, imageResult.confidence);
        }
      }

      // 4. 标签审核
      for (const tag of video.tags) {
        const tagResult = await this.moderateText(tag, ModerationType.VIDEO);
        if (tagResult.result !== ModerationResult.PASS) {
          reasons.push(`标签违规: ${tag}`);
        }
      }

      // 5. 用户历史记录检查
      const userRisk = await this.getUserRiskScore(video.uploader);
      if (userRisk.score > 0.7) {
        reasons.push('上传者风险较高');
        confidence = Math.max(confidence, userRisk.score);
      }

      const result = reasons.length > 0 ? 
        (reasons.some(r => r.includes('严重') || r.includes('色情') || r.includes('暴力')) ? 
          ModerationResult.REJECT : ModerationResult.REVIEW) : 
        ModerationResult.PASS;

      return {
        result,
        confidence,
        reasons,
        suggestions: this.generateVideoSuggestions(reasons)
      };

    } catch (error) {
      console.error('视频审核失败:', error);
      return {
        result: ModerationResult.REVIEW,
        confidence: 0,
        reasons: ['视频审核系统错误'],
        suggestions: ['请稍后重试或联系管理员']
      };
    }
  }

  /**
   * 审核评论内容
   */
  public async moderateComment(comment: IComment): Promise<ModerationResponse> {
    const textResult = await this.moderateText(comment.content, ModerationType.COMMENT);
    
    // 评论特殊规则
    const reasons = [...textResult.reasons];
    let confidence = textResult.confidence;
    
    // 检查重复内容（可能是刷评论）
    const duplicateCheck = await this.checkDuplicateContent(
      comment.userId, 
      comment.content, 
      'comment'
    );
    
    if (duplicateCheck.isDuplicate) {
      reasons.push('疑似刷评论行为');
      confidence = Math.max(confidence, 0.8);
    }
    
    // 检查发言频率
    const rateCheck = await this.checkCommentRate(comment.userId);
    if (rateCheck.tooFast) {
      reasons.push('评论过于频繁');
      confidence = Math.max(confidence, 0.7);
    }
    
    const result = reasons.length > textResult.reasons.length ? 
      ModerationResult.REVIEW : textResult.result;
    
    return {
      result,
      confidence,
      reasons,
      suggestions: this.generateCommentSuggestions(reasons)
    };
  }

  /**
   * 审核直播消息
   */
  public async moderateLiveMessage(message: ILiveMessage): Promise<ModerationResponse> {
    const textResult = await this.moderateText(message.content, ModerationType.LIVE_MESSAGE);
    
    // 直播消息特殊处理 - 更严格
    if (textResult.result === ModerationResult.REVIEW && textResult.confidence > 0.6) {
      textResult.result = ModerationResult.REJECT; // 直播消息不允许人工审核延迟
    }
    
    return textResult;
  }

  /**
   * 批量审核内容
   */
  public async batchModerate(
    items: Array<{ id: string; content: string; type: ModerationType }>,
    batchSize: number = 10
  ): Promise<Map<string, ModerationResponse>> {
    const results = new Map<string, ModerationResponse>();
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (item) => {
        const result = await this.moderateText(item.content, item.type);
        return { id: item.id, result };
      });
      
      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(({ id, result }) => {
        results.set(id, result);
      });
      
      // 批次间延迟，避免过载
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  // ==================== 私有方法 ====================

  /**
   * 检查关键词
   */
  private checkKeywords(content: string): { detected: boolean; reasons: string[]; severity: string } {
    const reasons: string[] = [];
    let maxSeverity = 'low';
    
    const lowerContent = content.toLowerCase();
    
    for (const rule of this.moderationRules) {
      if (rule.type === 'keyword' && rule.keywords) {
        const foundWords = rule.keywords.filter(keyword => 
          lowerContent.includes(keyword.toLowerCase())
        );
        
        if (foundWords.length > 0) {
          reasons.push(`包含敏感词: ${foundWords.join(', ')}`);
          maxSeverity = this.compareSeverity(maxSeverity, rule.severity);
        }
      }
    }
    
    // 检查自定义敏感词库
    for (const word of this.sensitiveWords) {
      if (lowerContent.includes(word.toLowerCase())) {
        reasons.push(`包含敏感词: ${word}`);
        maxSeverity = this.compareSeverity(maxSeverity, 'medium');
      }
    }
    
    return {
      detected: reasons.length > 0,
      reasons,
      severity: maxSeverity
    };
  }

  /**
   * 检查正则表达式模式
   */
  private checkRegexPatterns(content: string): { detected: boolean; reasons: string[]; severity: string } {
    const reasons: string[] = [];
    let maxSeverity = 'low';
    
    for (const rule of this.moderationRules) {
      if (rule.type === 'regex' && rule.pattern) {
        try {
          const regex = new RegExp(rule.pattern.slice(1, -1), 'gi'); // 去掉前后的斜杠
          if (regex.test(content)) {
            reasons.push(rule.description);
            maxSeverity = this.compareSeverity(maxSeverity, rule.severity);
          }
        } catch (error) {
          console.error('正则表达式错误:', rule.pattern, error);
        }
      }
    }
    
    return {
      detected: reasons.length > 0,
      reasons,
      severity: maxSeverity
    };
  }

  /**
   * AI文本审核
   */
  private async aiModerateText(content: string): Promise<{ detected: boolean; reasons: string[]; severity: string; confidence: number }> {
    try {
      if (!process.env.AI_MODERATION_API_URL || !process.env.AI_MODERATION_API_KEY) {
        return { detected: false, reasons: [], severity: 'low', confidence: 0 };
      }
      
      const response = await axios.post(
        process.env.AI_MODERATION_API_URL,
        {
          text: content,
          language: 'zh-CN'
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.AI_MODERATION_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );
      
      const result = response.data;
      
      if (result.flagged) {
        return {
          detected: true,
          reasons: result.categories || ['AI检测到违规内容'],
          severity: result.severity || 'medium',
          confidence: result.confidence || 0.8
        };
      }
      
      return { detected: false, reasons: [], severity: 'low', confidence: 0 };
      
    } catch (error) {
      console.error('AI文本审核失败:', error);
      return { detected: false, reasons: [], severity: 'low', confidence: 0 };
    }
  }

  /**
   * AI图片审核
   */
  private async aiModerateImage(imageUrl: string): Promise<{ detected: boolean; reasons: string[]; confidence: number }> {
    try {
      if (!process.env.AI_VISION_API_URL || !process.env.AI_VISION_API_KEY) {
        return { detected: false, reasons: [], confidence: 0 };
      }
      
      const response = await axios.post(
        process.env.AI_VISION_API_URL,
        {
          image_url: imageUrl,
          features: ['adult', 'violence', 'racy']
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.AI_VISION_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      const result = response.data;
      const reasons: string[] = [];
      let confidence = 0;
      
      if (result.adult && result.adult > 0.7) {
        reasons.push('包含成人内容');
        confidence = Math.max(confidence, result.adult);
      }
      
      if (result.violence && result.violence > 0.7) {
        reasons.push('包含暴力内容');
        confidence = Math.max(confidence, result.violence);
      }
      
      if (result.racy && result.racy > 0.8) {
        reasons.push('包含不当内容');
        confidence = Math.max(confidence, result.racy);
      }
      
      return {
        detected: reasons.length > 0,
        reasons,
        confidence
      };
      
    } catch (error) {
      console.error('AI图片审核失败:', error);
      return { detected: false, reasons: [], confidence: 0 };
    }
  }

  /**
   * 获取用户风险评分
   */
  private async getUserRiskScore(userId: mongoose.Types.ObjectId): Promise<{ score: number; reasons: string[] }> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { score: 0.5, reasons: ['用户不存在'] };
      }
      
      const reasons: string[] = [];
      let score = 0;
      
      // 检查用户注册时间（新用户风险较高）
      const daysSinceRegistration = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceRegistration < 7) {
        score += 0.3;
        reasons.push('新注册用户');
      }
      
      // 检查被举报次数
      const reportCount = await redis.get(`user_reports:${userId}`);
      if (reportCount && parseInt(reportCount) > 5) {
        score += 0.4;
        reasons.push('被举报次数较多');
      }
      
      // 检查违规历史
      const violationCount = await redis.get(`user_violations:${userId}`);
      if (violationCount && parseInt(violationCount) > 2) {
        score += 0.5;
        reasons.push('有违规历史');
      }
      
      return { score: Math.min(score, 1), reasons };
      
    } catch (error) {
      console.error('获取用户风险评分失败:', error);
      return { score: 0.5, reasons: ['评分系统错误'] };
    }
  }

  /**
   * 检查重复内容
   */
  private async checkDuplicateContent(
    userId: mongoose.Types.ObjectId, 
    content: string, 
    type: string
  ): Promise<{ isDuplicate: boolean; count: number }> {
    const contentHash = Buffer.from(content).toString('base64');
    const key = `content_hash:${userId}:${type}:${contentHash}`;
    
    const count = await redis.incr(key);
    await redis.expire(key, 24 * 60 * 60); // 24小时
    
    return {
      isDuplicate: count > 3, // 24小时内相同内容超过3次
      count
    };
  }

  /**
   * 检查评论频率
   */
  private async checkCommentRate(userId: mongoose.Types.ObjectId): Promise<{ tooFast: boolean; count: number }> {
    const key = `comment_rate:${userId}`;
    const count = await redis.incr(key);
    
    if (count === 1) {
      await redis.expire(key, 60); // 1分钟窗口
    }
    
    return {
      tooFast: count > 10, // 1分钟内超过10条评论
      count
    };
  }

  /**
   * 比较严重程度
   */
  private compareSeverity(current: string, newSeverity: string): string {
    const severityOrder = ['low', 'medium', 'high', 'critical'];
    const currentIndex = severityOrder.indexOf(current);
    const newIndex = severityOrder.indexOf(newSeverity);
    
    return newIndex > currentIndex ? newSeverity : current;
  }

  /**
   * 根据严重程度确定结果
   */
  private determineResult(severity: string, reasonCount: number): ModerationResult {
    if (severity === 'critical') {
      return ModerationResult.REJECT;
    } else if (severity === 'high') {
      return ModerationResult.REVIEW;
    } else if (severity === 'medium' && reasonCount >= 2) {
      return ModerationResult.REVIEW;
    } else if (reasonCount > 0) {
      return ModerationResult.REVIEW;
    }
    
    return ModerationResult.PASS;
  }

  /**
   * 生成建议
   */
  private generateSuggestions(reasons: string[]): string[] {
    const suggestions: string[] = [];
    
    if (reasons.some(r => r.includes('敏感词'))) {
      suggestions.push('请检查并修改敏感词汇');
    }
    
    if (reasons.some(r => r.includes('联系方式'))) {
      suggestions.push('请移除个人联系方式');
    }
    
    if (reasons.some(r => r.includes('广告'))) {
      suggestions.push('请避免发布广告内容');
    }
    
    if (suggestions.length === 0) {
      suggestions.push('请遵守社区规范，发布健康内容');
    }
    
    return suggestions;
  }

  /**
   * 生成视频建议
   */
  private generateVideoSuggestions(reasons: string[]): string[] {
    const suggestions = this.generateSuggestions(reasons);
    
    if (reasons.some(r => r.includes('时长'))) {
      suggestions.push('建议视频时长在5秒到2小时之间');
    }
    
    if (reasons.some(r => r.includes('缩略图'))) {
      suggestions.push('请上传合规的缩略图');
    }
    
    return suggestions;
  }

  /**
   * 生成评论建议
   */
  private generateCommentSuggestions(reasons: string[]): string[] {
    const suggestions = this.generateSuggestions(reasons);
    
    if (reasons.some(r => r.includes('频繁'))) {
      suggestions.push('请适度发言，避免刷屏');
    }
    
    if (reasons.some(r => r.includes('重复'))) {
      suggestions.push('请避免重复发送相同内容');
    }
    
    return suggestions;
  }

  /**
   * 记录审核日志
   */
  private async logModerationResult(
    type: ModerationType,
    content: string,
    result: ModerationResult,
    reasons: string[],
    confidence: number
  ): Promise<void> {
    try {
      const logEntry = {
        type,
        content: content.substring(0, 100), // 只记录前100个字符
        result,
        reasons,
        confidence,
        timestamp: new Date().toISOString()
      };
      
      // 记录到Redis（用于统计）
      const logKey = `moderation_log:${new Date().toISOString().split('T')[0]}`;
      await redis.lpush(logKey, JSON.stringify(logEntry));
      await redis.expire(logKey, 30 * 24 * 60 * 60); // 保存30天
      
      // 更新统计信息
      const statsKey = `moderation_stats:${type}:${result}`;
      await redis.incr(statsKey);
      await redis.expire(statsKey, 24 * 60 * 60); // 保存24小时
      
    } catch (error) {
      console.error('记录审核日志失败:', error);
    }
  }

  /**
   * 获取审核统计
   */
  public async getModerationStats(): Promise<any> {
    try {
      const stats: any = {};
      
      for (const type of Object.values(ModerationType)) {
        stats[type] = {};
        for (const result of Object.values(ModerationResult)) {
          const key = `moderation_stats:${type}:${result}`;
          const count = await redis.get(key);
          stats[type][result] = parseInt(count || '0');
        }
      }
      
      return stats;
    } catch (error) {
      console.error('获取审核统计失败:', error);
      return {};
    }
  }

  /**
   * 更新敏感词库
   */
  public async updateSensitiveWords(words: string[]): Promise<void> {
    try {
      // 清空现有敏感词
      await redis.del('sensitive_words');
      this.sensitiveWords.clear();
      
      // 添加新的敏感词
      if (words.length > 0) {
        await redis.sadd('sensitive_words', ...words);
        words.forEach(word => this.sensitiveWords.add(word));
      }
      
      await redis.expire('sensitive_words', 24 * 60 * 60);
      
      console.log(`更新了 ${words.length} 个敏感词`);
    } catch (error) {
      console.error('更新敏感词库失败:', error);
      throw error;
    }
  }
}

export default new ContentModerationService();