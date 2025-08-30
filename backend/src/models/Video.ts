/*
 * 大雄视频平台 - 视频数据模型
 * 处理视频基础信息、转码状态、播放数据等
 */

import mongoose, { Schema, Document } from 'mongoose';

// 视频状态枚举
export enum VideoStatus {
  UPLOADING = 'uploading',    // 上传中
  PROCESSING = 'processing',  // 转码中
  READY = 'ready',           // 可播放
  FAILED = 'failed',         // 处理失败
  BLOCKED = 'blocked',       // 被封禁
  DELETED = 'deleted'        // 已删除
}

// 视频可见性枚举
export enum VideoVisibility {
  PUBLIC = 'public',         // 公开
  UNLISTED = 'unlisted',     // 不公开但可通过链接访问
  PRIVATE = 'private'        // 私有
}

// 视频质量选项
export interface VideoQuality {
  resolution: string;        // 分辨率 (720p, 1080p, 4K)
  bitrate: number;          // 码率 (kbps)
  size: number;             // 文件大小 (bytes)
  url: string;              // 播放URL
  format: string;           // 格式 (mp4, webm)
}

// 视频转码进度
export interface ProcessingProgress {
  percentage: number;        // 完成百分比
  currentStep: string;      // 当前步骤
  message: string;          // 状态消息
  updatedAt: Date;
}

// 视频统计信息
export interface VideoStats {
  views: number;            // 播放次数
  likes: number;            // 点赞数
  dislikes: number;         // 踩数
  shares: number;           // 分享数
  comments: number;         // 评论数
  favorites: number;        // 收藏数
  duration: number;         // 时长 (秒)
}

export interface IVideo extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  uploader: mongoose.Types.ObjectId;
  
  // 文件信息
  originalFileName: string;
  originalFileSize: number;
  originalFormat: string;
  originalUrl: string;
  
  // 视频属性
  duration: number;
  thumbnail: string;
  thumbnails: string[];      // 多个预览图
  qualities: VideoQuality[]; // 不同质量版本
  
  // 状态管理
  status: VideoStatus;
  visibility: VideoVisibility;
  processingProgress?: ProcessingProgress;
  
  // 分类和标签
  category: string;
  tags: string[];
  language: string;
  
  // 统计信息
  stats: VideoStats;
  
  // 内容管理
  isAgeRestricted: boolean;
  contentWarnings: string[];
  
  // 时间戳
  uploadedAt: Date;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // 实例方法
  incrementView(): Promise<IVideo>;
  updateProcessingProgress(progress: ProcessingProgress): Promise<void>;
  addQuality(quality: VideoQuality): Promise<void>;
  publish(): Promise<void>;
}

const VideoSchema = new Schema<IVideo>({
  title: {
    type: String,
    required: [true, '视频标题不能为空'],
    trim: true,
    minlength: [1, '标题至少1个字符'],
    maxlength: [200, '标题不能超过200个字符'],
    index: 'text'
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [5000, '描述不能超过5000个字符'],
    default: ''
  },
  
  uploader: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // 原始文件信息
  originalFileName: {
    type: String,
    required: true
  },
  
  originalFileSize: {
    type: Number,
    required: true,
    min: 0
  },
  
  originalFormat: {
    type: String,
    required: true,
    lowercase: true
  },
  
  originalUrl: {
    type: String,
    required: true
  },
  
  // 视频属性
  duration: {
    type: Number,
    default: 0,
    min: 0
  },
  
  thumbnail: {
    type: String,
    default: ''
  },
  
  thumbnails: [{
    type: String
  }],
  
  qualities: [{
    resolution: {
      type: String,
      required: true
    },
    bitrate: {
      type: Number,
      required: true,
      min: 0
    },
    size: {
      type: Number,
      required: true,
      min: 0
    },
    url: {
      type: String,
      required: true
    },
    format: {
      type: String,
      required: true,
      lowercase: true
    }
  }],
  
  // 状态管理
  status: {
    type: String,
    enum: Object.values(VideoStatus),
    default: VideoStatus.UPLOADING,
    index: true
  },
  
  visibility: {
    type: String,
    enum: Object.values(VideoVisibility),
    default: VideoVisibility.PRIVATE,
    index: true
  },
  
  processingProgress: {
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    currentStep: {
      type: String,
      default: '准备处理'
    },
    message: {
      type: String,
      default: ''
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  
  // 分类和标签
  category: {
    type: String,
    required: true,
    index: true
  },
  
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  
  language: {
    type: String,
    default: 'zh-CN',
    index: true
  },
  
  // 统计信息
  stats: {
    views: { type: Number, default: 0, min: 0 },
    likes: { type: Number, default: 0, min: 0 },
    dislikes: { type: Number, default: 0, min: 0 },
    shares: { type: Number, default: 0, min: 0 },
    comments: { type: Number, default: 0, min: 0 },
    favorites: { type: Number, default: 0, min: 0 },
    duration: { type: Number, default: 0, min: 0 }
  },
  
  // 内容管理
  isAgeRestricted: {
    type: Boolean,
    default: false,
    index: true
  },
  
  contentWarnings: [{
    type: String,
    enum: ['violence', 'adult', 'disturbing', 'flashing', 'loud']
  }],
  
  // 时间戳
  uploadedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  publishedAt: {
    type: Date,
    index: true
  }
  
}, {
  timestamps: true,
  collection: 'videos'
});

// ==================== 索引优化 ====================

// 复合索引
VideoSchema.index({ uploader: 1, createdAt: -1 });           // 用户视频列表
VideoSchema.index({ status: 1, visibility: 1 });            // 状态查询
VideoSchema.index({ category: 1, createdAt: -1 });          // 分类视频
VideoSchema.index({ 'stats.views': -1 });                   // 热门视频
VideoSchema.index({ publishedAt: -1 });                     // 最新发布
VideoSchema.index({ tags: 1 });                             // 标签搜索

// 文本搜索索引
VideoSchema.index({ 
  title: 'text', 
  description: 'text', 
  tags: 'text' 
}, {
  weights: {
    title: 10,
    tags: 5,
    description: 1
  }
});

// ==================== 实例方法 ====================

/**
 * 增加播放次数
 */
VideoSchema.methods.incrementView = async function(): Promise<IVideo> {
  this.stats.views += 1;
  return this.save();
};

/**
 * 更新转码进度
 */
VideoSchema.methods.updateProcessingProgress = async function(progress: ProcessingProgress): Promise<void> {
  this.processingProgress = {
    ...progress,
    updatedAt: new Date()
  };
  await this.save();
};

/**
 * 添加质量版本
 */
VideoSchema.methods.addQuality = async function(quality: VideoQuality): Promise<void> {
  // 检查是否已存在相同分辨率
  const existingIndex = this.qualities.findIndex(q => q.resolution === quality.resolution);
  
  if (existingIndex >= 0) {
    // 更新现有质量
    this.qualities[existingIndex] = quality;
  } else {
    // 添加新质量
    this.qualities.push(quality);
  }
  
  await this.save();
};

/**
 * 发布视频
 */
VideoSchema.methods.publish = async function(): Promise<void> {
  this.visibility = VideoVisibility.PUBLIC;
  this.publishedAt = new Date();
  this.status = VideoStatus.READY;
  await this.save();
};

// ==================== 静态方法 ====================

/**
 * 获取热门视频
 */
VideoSchema.statics.getPopularVideos = function(limit: number = 20) {
  return this.find({
    status: VideoStatus.READY,
    visibility: VideoVisibility.PUBLIC
  })
  .sort({ 'stats.views': -1 })
  .limit(limit)
  .populate('uploader', 'username nickname avatar verified');
};

/**
 * 搜索视频
 */
VideoSchema.statics.searchVideos = function(query: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({
    $text: { $search: query },
    status: VideoStatus.READY,
    visibility: VideoVisibility.PUBLIC
  })
  .sort({ score: { $meta: 'textScore' } })
  .skip(skip)
  .limit(limit)
  .populate('uploader', 'username nickname avatar verified');
};

/**
 * 获取用户视频
 */
VideoSchema.statics.getUserVideos = function(
  userId: mongoose.Types.ObjectId, 
  includePrivate: boolean = false,
  page: number = 1, 
  limit: number = 20
) {
  const skip = (page - 1) * limit;
  
  const query: any = { 
    uploader: userId,
    status: { $ne: VideoStatus.DELETED }
  };
  
  if (!includePrivate) {
    query.visibility = { $in: [VideoVisibility.PUBLIC, VideoVisibility.UNLISTED] };
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// ==================== 中间件 ====================

// 保存前验证
VideoSchema.pre('save', function(next) {
  // 确保发布时间不早于上传时间
  if (this.publishedAt && this.publishedAt < this.uploadedAt) {
    this.publishedAt = this.uploadedAt;
  }
  
  // 标签去重和清理
  if (this.tags && this.tags.length > 0) {
    this.tags = [...new Set(this.tags.filter(tag => tag.trim().length > 0))];
  }
  
  next();
});

// 删除后清理
VideoSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    // TODO: 清理相关的评论、点赞、收藏等数据
    // TODO: 删除存储的视频文件
    console.log(`清理视频相关数据: ${this._id}`);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// ==================== 虚拟字段 ====================

// 格式化时长
VideoSchema.virtual('formattedDuration').get(function() {
  const duration = this.duration;
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = Math.floor(duration % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
});

// 格式化文件大小
VideoSchema.virtual('formattedFileSize').get(function() {
  const size = this.originalFileSize;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let fileSize = size;
  
  while (fileSize >= 1024 && unitIndex < units.length - 1) {
    fileSize /= 1024;
    unitIndex++;
  }
  
  return `${fileSize.toFixed(1)} ${units[unitIndex]}`;
});

// 可用的最高质量
VideoSchema.virtual('bestQuality').get(function() {
  if (!this.qualities || this.qualities.length === 0) return null;
  
  return this.qualities.reduce((best, current) => {
    const bestRes = parseInt(best.resolution);
    const currentRes = parseInt(current.resolution);
    return currentRes > bestRes ? current : best;
  });
});

export default mongoose.model<IVideo>('Video', VideoSchema);