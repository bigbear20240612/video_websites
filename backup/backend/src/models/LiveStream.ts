/*
 * 大雄视频平台 - 直播数据模型
 * 处理直播间管理、状态控制、观众互动等功能
 */

import mongoose, { Schema, Document } from 'mongoose';

export enum StreamStatus {
  OFFLINE = 'offline',     // 离线
  PREPARING = 'preparing', // 准备中
  LIVE = 'live',          // 直播中
  PAUSED = 'paused',      // 暂停
  ENDED = 'ended'         // 已结束
}

export enum StreamQuality {
  LOW = '480p',
  MEDIUM = '720p', 
  HIGH = '1080p',
  ULTRA = '2160p'
}

// 直播统计信息
export interface StreamStats {
  currentViewers: number;    // 当前观众数
  maxViewers: number;        // 最高观众数
  totalViews: number;        // 总观看次数
  likes: number;             // 点赞数
  shares: number;            // 分享数
  messages: number;          // 聊天消息数
  duration: number;          // 直播时长（秒）
}

// 直播设置
export interface StreamSettings {
  title: string;
  description: string;
  category: string;
  tags: string[];
  isRecordEnabled: boolean;    // 是否录制
  isReplayEnabled: boolean;    // 是否允许回放
  maxViewers?: number;         // 最大观众数限制
  allowComments: boolean;      // 是否允许评论
  moderationMode: 'auto' | 'manual' | 'disabled'; // 审核模式
}

// RTMP配置
export interface RTMPConfig {
  ingestUrl: string;          // 推流地址
  streamKey: string;          // 推流密钥
  playbackUrl: string;        // 播放地址
  hlsUrl?: string;            // HLS播放地址
  dashUrl?: string;           // DASH播放地址
}

export interface ILiveStream extends Document {
  _id: mongoose.Types.ObjectId;
  streamerId: mongoose.Types.ObjectId;
  
  // 基础信息
  streamKey: string;          // 唯一的推流密钥
  title: string;
  description: string;
  category: string;
  tags: string[];
  thumbnail?: string;
  
  // 状态管理
  status: StreamStatus;
  isPrivate: boolean;
  isRecordEnabled: boolean;
  isReplayEnabled: boolean;
  
  // 技术配置
  rtmpConfig: RTMPConfig;
  supportedQualities: StreamQuality[];
  currentQuality: StreamQuality;
  
  // 统计信息
  stats: StreamStats;
  
  // 时间记录
  scheduledStartTime?: Date;   // 预定开始时间
  actualStartTime?: Date;      // 实际开始时间
  endTime?: Date;             // 结束时间
  lastHeartbeat?: Date;       // 最后心跳时间
  
  // 审核信息
  moderationFlags: string[];
  isBanned: boolean;
  banReason?: string;
  bannedUntil?: Date;
  
  // 时间戳
  createdAt: Date;
  updatedAt: Date;
  
  // 实例方法
  startStream(): Promise<void>;
  endStream(): Promise<void>;
  updateViewerCount(count: number): Promise<void>;
  generateStreamUrls(): RTMPConfig;
  isStreamActive(): boolean;
}

const LiveStreamSchema = new Schema<ILiveStream>({
  streamerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  streamKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  title: {
    type: String,
    required: [true, '直播标题不能为空'],
    trim: true,
    minlength: [1, '标题至少1个字符'],
    maxlength: [200, '标题不能超过200个字符']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [2000, '描述不能超过2000个字符'],
    default: ''
  },
  
  category: {
    type: String,
    required: true,
    enum: [
      'gaming', 'music', 'talk_show', 'education', 'sports',
      'cooking', 'art', 'technology', 'lifestyle', 'entertainment'
    ],
    index: true
  },
  
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  
  thumbnail: {
    type: String,
    default: ''
  },
  
  status: {
    type: String,
    enum: Object.values(StreamStatus),
    default: StreamStatus.OFFLINE,
    index: true
  },
  
  isPrivate: {
    type: Boolean,
    default: false,
    index: true
  },
  
  isRecordEnabled: {
    type: Boolean,
    default: true
  },
  
  isReplayEnabled: {
    type: Boolean,
    default: true
  },
  
  rtmpConfig: {
    ingestUrl: {
      type: String,
      required: true
    },
    streamKey: {
      type: String,
      required: true
    },
    playbackUrl: {
      type: String,
      required: true
    },
    hlsUrl: String,
    dashUrl: String
  },
  
  supportedQualities: [{
    type: String,
    enum: Object.values(StreamQuality)
  }],
  
  currentQuality: {
    type: String,
    enum: Object.values(StreamQuality),
    default: StreamQuality.MEDIUM
  },
  
  stats: {
    currentViewers: { type: Number, default: 0, min: 0 },
    maxViewers: { type: Number, default: 0, min: 0 },
    totalViews: { type: Number, default: 0, min: 0 },
    likes: { type: Number, default: 0, min: 0 },
    shares: { type: Number, default: 0, min: 0 },
    messages: { type: Number, default: 0, min: 0 },
    duration: { type: Number, default: 0, min: 0 }
  },
  
  scheduledStartTime: {
    type: Date,
    index: true
  },
  
  actualStartTime: {
    type: Date,
    index: true
  },
  
  endTime: {
    type: Date,
    index: true
  },
  
  lastHeartbeat: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  moderationFlags: [{
    type: String,
    enum: ['inappropriate_content', 'spam', 'harassment', 'copyright', 'violence', 'adult']
  }],
  
  isBanned: {
    type: Boolean,
    default: false,
    index: true
  },
  
  banReason: {
    type: String,
    maxlength: 500
  },
  
  bannedUntil: {
    type: Date
  }
  
}, {
  timestamps: true,
  collection: 'liveStreams'
});

// ==================== 索引优化 ====================

// 复合索引
LiveStreamSchema.index({ status: 1, isPrivate: 1, createdAt: -1 });    // 公开直播列表
LiveStreamSchema.index({ streamerId: 1, status: 1 });                   // 主播直播状态
LiveStreamSchema.index({ category: 1, status: 1 });                     // 分类直播
LiveStreamSchema.index({ 'stats.currentViewers': -1 });                 // 热门直播
LiveStreamSchema.index({ scheduledStartTime: 1 });                      // 预定直播

// TTL索引 - 自动清理结束超过30天的直播记录
LiveStreamSchema.index(
  { endTime: 1 }, 
  { 
    expireAfterSeconds: 30 * 24 * 60 * 60,
    partialFilterExpression: { status: StreamStatus.ENDED }
  }
);

// ==================== 实例方法 ====================

/**
 * 开始直播
 */
LiveStreamSchema.methods.startStream = async function(): Promise<void> {
  this.status = StreamStatus.LIVE;
  this.actualStartTime = new Date();
  this.lastHeartbeat = new Date();
  await this.save();
};

/**
 * 结束直播
 */
LiveStreamSchema.methods.endStream = async function(): Promise<void> {
  this.status = StreamStatus.ENDED;
  this.endTime = new Date();
  
  // 计算直播时长
  if (this.actualStartTime) {
    this.stats.duration = Math.floor((this.endTime.getTime() - this.actualStartTime.getTime()) / 1000);
  }
  
  await this.save();
};

/**
 * 更新观众数量
 */
LiveStreamSchema.methods.updateViewerCount = async function(count: number): Promise<void> {
  this.stats.currentViewers = count;
  this.stats.maxViewers = Math.max(this.stats.maxViewers, count);
  this.stats.totalViews = Math.max(this.stats.totalViews, count);
  this.lastHeartbeat = new Date();
  await this.save();
};

/**
 * 生成推流和播放URL
 */
LiveStreamSchema.methods.generateStreamUrls = function(): RTMPConfig {
  const baseUrl = process.env.RTMP_SERVER_URL || 'rtmp://localhost:1935';
  const cdnUrl = process.env.CDN_URL || 'http://localhost:8080';
  
  return {
    ingestUrl: `${baseUrl}/live/${this.streamKey}`,
    streamKey: this.streamKey,
    playbackUrl: `${cdnUrl}/live/${this.streamKey}/index.m3u8`,
    hlsUrl: `${cdnUrl}/hls/${this.streamKey}/playlist.m3u8`,
    dashUrl: `${cdnUrl}/dash/${this.streamKey}/manifest.mpd`
  };
};

/**
 * 检查直播是否活跃
 */
LiveStreamSchema.methods.isStreamActive = function(): boolean {
  if (this.status !== StreamStatus.LIVE) {
    return false;
  }
  
  // 检查心跳时间（5分钟内无心跳认为离线）
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  
  return this.lastHeartbeat && this.lastHeartbeat > fiveMinutesAgo;
};

// ==================== 静态方法 ====================

/**
 * 获取正在直播的流
 */
LiveStreamSchema.statics.getLiveStreams = function(
  page: number = 1,
  limit: number = 20,
  category?: string,
  sortBy: 'viewers' | 'recent' = 'viewers'
) {
  const skip = (page - 1) * limit;
  
  const query: any = {
    status: StreamStatus.LIVE,
    isPrivate: false,
    isBanned: false
  };
  
  if (category) {
    query.category = category;
  }
  
  let sortQuery: any = {};
  switch (sortBy) {
    case 'viewers':
      sortQuery = { 'stats.currentViewers': -1 };
      break;
    case 'recent':
      sortQuery = { actualStartTime: -1 };
      break;
  }
  
  return this.find(query)
    .sort(sortQuery)
    .skip(skip)
    .limit(limit)
    .populate('streamerId', 'username nickname avatar verified')
    .lean();
};

/**
 * 获取用户的直播
 */
LiveStreamSchema.statics.getUserStreams = function(
  streamerId: mongoose.Types.ObjectId,
  includePrivate: boolean = false,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;
  
  const query: any = { streamerId };
  
  if (!includePrivate) {
    query.isPrivate = false;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

/**
 * 清理离线的直播
 */
LiveStreamSchema.statics.cleanupOfflineStreams = function() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  return this.updateMany(
    {
      status: StreamStatus.LIVE,
      lastHeartbeat: { $lt: fiveMinutesAgo }
    },
    {
      status: StreamStatus.ENDED,
      endTime: new Date()
    }
  );
};

/**
 * 获取直播统计
 */
LiveStreamSchema.statics.getStreamStats = function(streamerId?: mongoose.Types.ObjectId) {
  const matchStage = streamerId ? { streamerId } : {};
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalViewers: { $sum: '$stats.totalViews' },
        avgDuration: { $avg: '$stats.duration' },
        totalLikes: { $sum: '$stats.likes' }
      }
    }
  ]);
};

// ==================== 中间件 ====================

// 保存前处理
LiveStreamSchema.pre('save', function(next) {
  // 生成直播密钥（如果不存在）
  if (!this.streamKey) {
    this.streamKey = this.generateStreamKey();
  }
  
  // 更新RTMP配置
  this.rtmpConfig = this.generateStreamUrls();
  
  next();
});

// 生成直播密钥的辅助方法
LiveStreamSchema.methods.generateStreamKey = function(): string {
  const crypto = require('crypto');
  const timestamp = Date.now().toString();
  const random = crypto.randomBytes(8).toString('hex');
  return `${this.streamerId}_${timestamp}_${random}`;
};

// ==================== 虚拟字段 ====================

// 格式化直播时长
LiveStreamSchema.virtual('formattedDuration').get(function() {
  const duration = this.stats.duration;
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = duration % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
});

// 直播状态描述
LiveStreamSchema.virtual('statusDescription').get(function() {
  const statusMap = {
    [StreamStatus.OFFLINE]: '离线',
    [StreamStatus.PREPARING]: '准备中',
    [StreamStatus.LIVE]: '直播中',
    [StreamStatus.PAUSED]: '暂停',
    [StreamStatus.ENDED]: '已结束'
  };
  
  return statusMap[this.status] || '未知状态';
});

// 观众等级（基于当前观众数）
LiveStreamSchema.virtual('popularityLevel').get(function() {
  const viewers = this.stats.currentViewers;
  
  if (viewers >= 10000) return 'viral';
  if (viewers >= 1000) return 'popular';
  if (viewers >= 100) return 'trending';
  if (viewers >= 10) return 'active';
  return 'starting';
});

export default mongoose.model<ILiveStream>('LiveStream', LiveStreamSchema);