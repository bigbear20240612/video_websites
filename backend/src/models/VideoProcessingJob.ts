/*
 * 大雄视频平台 - 视频处理任务模型
 * 管理视频转码、缩略图生成等后台任务
 */

import mongoose, { Schema, Document } from 'mongoose';

export enum JobStatus {
  PENDING = 'pending',       // 等待处理
  PROCESSING = 'processing', // 处理中
  COMPLETED = 'completed',   // 已完成
  FAILED = 'failed',         // 失败
  CANCELLED = 'cancelled'    // 已取消
}

export enum JobType {
  TRANSCODE = 'transcode',           // 视频转码
  THUMBNAIL = 'thumbnail',           // 缩略图生成
  PREVIEW = 'preview',               // 预览图生成
  AUDIO_EXTRACT = 'audio_extract',   // 音频提取
  WATERMARK = 'watermark',           // 水印添加
  COMPRESS = 'compress'              // 视频压缩
}

export interface ProcessingSettings {
  // 转码设置
  outputFormat?: string;
  outputResolution?: string;
  outputBitrate?: number;
  outputFps?: number;
  
  // 缩略图设置
  thumbnailCount?: number;
  thumbnailSize?: string;
  thumbnailTimes?: number[];
  
  // 水印设置
  watermarkUrl?: string;
  watermarkPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  watermarkOpacity?: number;
}

export interface JobProgress {
  percentage: number;
  currentStep: string;
  message: string;
  estimatedTimeLeft?: number; // 秒
  processedBytes?: number;
  totalBytes?: number;
  startTime: Date;
  endTime?: Date;
}

export interface JobResult {
  outputFiles?: {
    url: string;
    type: string;
    size: number;
    resolution?: string;
    bitrate?: number;
  }[];
  
  videoInfo?: {
    duration: number;
    width: number;
    height: number;
    fps: number;
    bitrate: number;
    format: string;
  };
  
  thumbnails?: string[];
  errors?: string[];
  warnings?: string[];
}

export interface IVideoProcessingJob extends Document {
  _id: mongoose.Types.ObjectId;
  videoId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  
  jobType: JobType;
  status: JobStatus;
  priority: number;
  
  inputFile: string;
  settings: ProcessingSettings;
  
  progress: JobProgress;
  result?: JobResult;
  
  retryCount: number;
  maxRetries: number;
  
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
  
  // 实例方法
  updateProgress(progress: Partial<JobProgress>): Promise<void>;
  markAsCompleted(result: JobResult): Promise<void>;
  markAsFailed(error: string): Promise<void>;
  retry(): Promise<void>;
}

const VideoProcessingJobSchema = new Schema<IVideoProcessingJob>({
  videoId: {
    type: Schema.Types.ObjectId,
    ref: 'Video',
    required: true,
    index: true
  },
  
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  jobType: {
    type: String,
    enum: Object.values(JobType),
    required: true,
    index: true
  },
  
  status: {
    type: String,
    enum: Object.values(JobStatus),
    default: JobStatus.PENDING,
    index: true
  },
  
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
    index: true
  },
  
  inputFile: {
    type: String,
    required: true
  },
  
  settings: {
    // 转码设置
    outputFormat: {
      type: String,
      lowercase: true,
      default: 'mp4'
    },
    outputResolution: String,
    outputBitrate: {
      type: Number,
      min: 100
    },
    outputFps: {
      type: Number,
      min: 1,
      max: 120
    },
    
    // 缩略图设置
    thumbnailCount: {
      type: Number,
      min: 1,
      max: 20,
      default: 5
    },
    thumbnailSize: {
      type: String,
      default: '320x180'
    },
    thumbnailTimes: [Number],
    
    // 水印设置
    watermarkUrl: String,
    watermarkPosition: {
      type: String,
      enum: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'],
      default: 'bottom-right'
    },
    watermarkOpacity: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.8
    }
  },
  
  progress: {
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    currentStep: {
      type: String,
      default: '等待开始'
    },
    message: {
      type: String,
      default: ''
    },
    estimatedTimeLeft: Number,
    processedBytes: Number,
    totalBytes: Number,
    startTime: {
      type: Date,
      default: Date.now
    },
    endTime: Date
  },
  
  result: {
    outputFiles: [{
      url: String,
      type: String,
      size: Number,
      resolution: String,
      bitrate: Number
    }],
    
    videoInfo: {
      duration: Number,
      width: Number,
      height: Number,
      fps: Number,
      bitrate: Number,
      format: String
    },
    
    thumbnails: [String],
    errors: [String],
    warnings: [String]
  },
  
  retryCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  maxRetries: {
    type: Number,
    default: 3,
    min: 0,
    max: 10
  },
  
  scheduledAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  startedAt: Date,
  completedAt: Date
  
}, {
  timestamps: true,
  collection: 'videoProcessingJobs'
});

// ==================== 索引优化 ====================

// 复合索引
VideoProcessingJobSchema.index({ status: 1, priority: -1, scheduledAt: 1 });   // 任务队列
VideoProcessingJobSchema.index({ videoId: 1, jobType: 1 });                    // 视频任务查询
VideoProcessingJobSchema.index({ userId: 1, createdAt: -1 });                  // 用户任务历史
VideoProcessingJobSchema.index({ status: 1, createdAt: -1 });                  // 状态查询

// TTL索引 - 自动删除完成的任务（30天后）
VideoProcessingJobSchema.index(
  { completedAt: 1 }, 
  { 
    expireAfterSeconds: 30 * 24 * 60 * 60, // 30天
    partialFilterExpression: { 
      status: { $in: [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED] }
    }
  }
);

// ==================== 实例方法 ====================

/**
 * 更新处理进度
 */
VideoProcessingJobSchema.methods.updateProgress = async function(progressUpdate: Partial<JobProgress>): Promise<void> {
  this.progress = {
    ...this.progress,
    ...progressUpdate
  };
  
  this.status = JobStatus.PROCESSING;
  
  if (!this.startedAt) {
    this.startedAt = new Date();
  }
  
  await this.save();
};

/**
 * 标记任务完成
 */
VideoProcessingJobSchema.methods.markAsCompleted = async function(result: JobResult): Promise<void> {
  this.status = JobStatus.COMPLETED;
  this.result = result;
  this.completedAt = new Date();
  this.progress.percentage = 100;
  this.progress.endTime = new Date();
  this.progress.message = '处理完成';
  
  await this.save();
};

/**
 * 标记任务失败
 */
VideoProcessingJobSchema.methods.markAsFailed = async function(error: string): Promise<void> {
  this.status = JobStatus.FAILED;
  this.completedAt = new Date();
  this.progress.endTime = new Date();
  this.progress.message = `处理失败: ${error}`;
  
  if (!this.result) {
    this.result = { errors: [] };
  }
  if (!this.result.errors) {
    this.result.errors = [];
  }
  this.result.errors.push(error);
  
  await this.save();
};

/**
 * 重试任务
 */
VideoProcessingJobSchema.methods.retry = async function(): Promise<void> {
  if (this.retryCount >= this.maxRetries) {
    throw new Error('已达到最大重试次数');
  }
  
  this.retryCount += 1;
  this.status = JobStatus.PENDING;
  this.scheduledAt = new Date();
  this.startedAt = undefined;
  this.completedAt = undefined;
  
  // 重置进度
  this.progress = {
    percentage: 0,
    currentStep: '等待重试',
    message: `第 ${this.retryCount} 次重试`,
    startTime: new Date()
  };
  
  await this.save();
};

// ==================== 静态方法 ====================

/**
 * 获取待处理任务
 */
VideoProcessingJobSchema.statics.getNextJob = function() {
  return this.findOne({
    status: JobStatus.PENDING,
    scheduledAt: { $lte: new Date() }
  })
  .sort({ priority: -1, scheduledAt: 1 })
  .populate('videoId', 'title uploader')
  .populate('userId', 'username');
};

/**
 * 获取处理中的任务数量
 */
VideoProcessingJobSchema.statics.getProcessingCount = function() {
  return this.countDocuments({
    status: JobStatus.PROCESSING
  });
};

/**
 * 清理失败任务
 */
VideoProcessingJobSchema.statics.cleanupFailedJobs = function(olderThanDays: number = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
  
  return this.deleteMany({
    status: JobStatus.FAILED,
    completedAt: { $lt: cutoffDate }
  });
};

/**
 * 获取任务统计信息
 */
VideoProcessingJobSchema.statics.getJobStats = function(userId?: mongoose.Types.ObjectId) {
  const matchStage = userId ? { userId } : {};
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgProcessingTime: {
          $avg: {
            $cond: {
              if: { $and: [
                { $ne: ['$startedAt', null] },
                { $ne: ['$completedAt', null] }
              ]},
              then: { $subtract: ['$completedAt', '$startedAt'] },
              else: null
            }
          }
        }
      }
    }
  ]);
};

// ==================== 中间件 ====================

// 保存前验证
VideoProcessingJobSchema.pre('save', function(next) {
  // 确保进度百分比在有效范围内
  if (this.progress.percentage < 0) {
    this.progress.percentage = 0;
  } else if (this.progress.percentage > 100) {
    this.progress.percentage = 100;
  }
  
  // 自动设置开始时间
  if (this.status === JobStatus.PROCESSING && !this.startedAt) {
    this.startedAt = new Date();
  }
  
  // 自动设置完成时间
  if ((this.status === JobStatus.COMPLETED || 
       this.status === JobStatus.FAILED || 
       this.status === JobStatus.CANCELLED) && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  next();
});

// ==================== 虚拟字段 ====================

// 处理耗时
VideoProcessingJobSchema.virtual('processingDuration').get(function() {
  if (!this.startedAt) return 0;
  
  const endTime = this.completedAt || new Date();
  return Math.floor((endTime.getTime() - this.startedAt.getTime()) / 1000);
});

// 等待时间
VideoProcessingJobSchema.virtual('waitingDuration').get(function() {
  if (!this.startedAt) {
    return Math.floor((new Date().getTime() - this.scheduledAt.getTime()) / 1000);
  }
  
  return Math.floor((this.startedAt.getTime() - this.scheduledAt.getTime()) / 1000);
});

export default mongoose.model<IVideoProcessingJob>('VideoProcessingJob', VideoProcessingJobSchema);