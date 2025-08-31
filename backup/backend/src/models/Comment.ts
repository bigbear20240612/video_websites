/*
 * 大雄视频平台 - 评论数据模型
 * 处理视频评论、回复、点赞等交互功能
 */

import mongoose, { Schema, Document } from 'mongoose';

export enum CommentStatus {
  ACTIVE = 'active',       // 正常显示
  HIDDEN = 'hidden',       // 隐藏（审核中）
  DELETED = 'deleted',     // 已删除
  BLOCKED = 'blocked'      // 被封禁
}

export interface IComment extends Document {
  _id: mongoose.Types.ObjectId;
  videoId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  
  content: string;
  parentId?: mongoose.Types.ObjectId;  // 父评论ID（用于回复）
  
  likes: number;
  dislikes: number;
  replies: number;
  
  status: CommentStatus;
  
  // 内容管理
  isEdited: boolean;
  editedAt?: Date;
  originalContent?: string;
  
  // 审核信息
  moderationFlags: string[];  // 举报标记
  moderatedBy?: mongoose.Types.ObjectId;
  moderatedAt?: Date;
  moderationReason?: string;
  
  // 时间戳
  createdAt: Date;
  updatedAt: Date;
  
  // 实例方法
  incrementLikes(): Promise<IComment>;
  incrementReplies(): Promise<IComment>;
  softDelete(): Promise<void>;
  markAsEdited(newContent: string): Promise<void>;
}

const CommentSchema = new Schema<IComment>({
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
  
  content: {
    type: String,
    required: [true, '评论内容不能为空'],
    trim: true,
    minlength: [1, '评论内容不能为空'],
    maxlength: [2000, '评论内容不能超过2000个字符']
  },
  
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
    default: null,
    index: true
  },
  
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  
  dislikes: {
    type: Number,
    default: 0,
    min: 0
  },
  
  replies: {
    type: Number,
    default: 0,
    min: 0
  },
  
  status: {
    type: String,
    enum: Object.values(CommentStatus),
    default: CommentStatus.ACTIVE,
    index: true
  },
  
  // 编辑信息
  isEdited: {
    type: Boolean,
    default: false
  },
  
  editedAt: {
    type: Date
  },
  
  originalContent: {
    type: String
  },
  
  // 审核信息
  moderationFlags: [{
    type: String,
    enum: ['spam', 'harassment', 'hate_speech', 'violence', 'adult', 'copyright', 'other']
  }],
  
  moderatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  moderatedAt: {
    type: Date
  },
  
  moderationReason: {
    type: String,
    maxlength: 500
  }
  
}, {
  timestamps: true,
  collection: 'comments'
});

// ==================== 索引优化 ====================

// 复合索引
CommentSchema.index({ videoId: 1, createdAt: -1 });           // 视频评论列表
CommentSchema.index({ parentId: 1, createdAt: 1 });          // 回复列表
CommentSchema.index({ userId: 1, createdAt: -1 });           // 用户评论历史
CommentSchema.index({ status: 1, createdAt: -1 });           // 状态查询
CommentSchema.index({ videoId: 1, parentId: 1, status: 1 }); // 复合查询优化

// 文本搜索索引
CommentSchema.index({ content: 'text' });

// ==================== 实例方法 ====================

/**
 * 增加点赞数
 */
CommentSchema.methods.incrementLikes = async function(): Promise<IComment> {
  this.likes += 1;
  return this.save();
};

/**
 * 增加回复数
 */
CommentSchema.methods.incrementReplies = async function(): Promise<IComment> {
  this.replies += 1;
  return this.save();
};

/**
 * 软删除评论
 */
CommentSchema.methods.softDelete = async function(): Promise<void> {
  this.status = CommentStatus.DELETED;
  this.content = '[此评论已被删除]';
  await this.save();
};

/**
 * 标记为已编辑
 */
CommentSchema.methods.markAsEdited = async function(newContent: string): Promise<void> {
  if (!this.isEdited) {
    this.originalContent = this.content;
    this.isEdited = true;
  }
  this.content = newContent;
  this.editedAt = new Date();
  await this.save();
};

// ==================== 静态方法 ====================

/**
 * 获取视频评论
 */
CommentSchema.statics.getVideoComments = function(
  videoId: mongoose.Types.ObjectId,
  page: number = 1,
  limit: number = 20,
  sortBy: 'newest' | 'oldest' | 'popular' = 'newest'
) {
  const skip = (page - 1) * limit;
  
  let sortQuery: any = {};
  switch (sortBy) {
    case 'newest':
      sortQuery = { createdAt: -1 };
      break;
    case 'oldest':
      sortQuery = { createdAt: 1 };
      break;
    case 'popular':
      sortQuery = { likes: -1, createdAt: -1 };
      break;
  }
  
  return this.find({
    videoId,
    parentId: null,  // 只获取顶级评论
    status: CommentStatus.ACTIVE
  })
  .sort(sortQuery)
  .skip(skip)
  .limit(limit)
  .populate('userId', 'username nickname avatar verified')
  .lean();
};

/**
 * 获取评论回复
 */
CommentSchema.statics.getCommentReplies = function(
  parentId: mongoose.Types.ObjectId,
  page: number = 1,
  limit: number = 10
) {
  const skip = (page - 1) * limit;
  
  return this.find({
    parentId,
    status: CommentStatus.ACTIVE
  })
  .sort({ createdAt: 1 })  // 回复按时间正序
  .skip(skip)
  .limit(limit)
  .populate('userId', 'username nickname avatar verified')
  .lean();
};

/**
 * 搜索评论
 */
CommentSchema.statics.searchComments = function(
  query: string,
  videoId?: mongoose.Types.ObjectId,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;
  
  const searchQuery: any = {
    $text: { $search: query },
    status: CommentStatus.ACTIVE
  };
  
  if (videoId) {
    searchQuery.videoId = videoId;
  }
  
  return this.find(searchQuery)
    .sort({ score: { $meta: 'textScore' } })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'username nickname avatar verified')
    .populate('videoId', 'title')
    .lean();
};

/**
 * 获取用户评论
 */
CommentSchema.statics.getUserComments = function(
  userId: mongoose.Types.ObjectId,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;
  
  return this.find({
    userId,
    status: { $ne: CommentStatus.DELETED }
  })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .populate('videoId', 'title thumbnail')
  .lean();
};

/**
 * 获取热门评论
 */
CommentSchema.statics.getPopularComments = function(
  videoId: mongoose.Types.ObjectId,
  limit: number = 5
) {
  return this.find({
    videoId,
    status: CommentStatus.ACTIVE,
    likes: { $gte: 5 }  // 至少5个赞
  })
  .sort({ likes: -1, createdAt: -1 })
  .limit(limit)
  .populate('userId', 'username nickname avatar verified')
  .lean();
};

// ==================== 中间件 ====================

// 保存前处理
CommentSchema.pre('save', function(next) {
  // 内容敏感词过滤（简单版）
  const sensitiveWords = ['垃圾', '傻逼', '白痴', '智障'];
  let content = this.content;
  
  sensitiveWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    content = content.replace(regex, '*'.repeat(word.length));
  });
  
  this.content = content;
  next();
});

// 删除后清理
CommentSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    // 删除所有回复
    await mongoose.model('Comment').updateMany(
      { parentId: this._id },
      { status: CommentStatus.DELETED, content: '[此评论已被删除]' }
    );
    
    // 更新视频评论数
    await mongoose.model('Video').findByIdAndUpdate(
      this.videoId,
      { $inc: { 'stats.comments': -1 } }
    );
    
    console.log(`清理评论相关数据: ${this._id}`);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// ==================== 虚拟字段 ====================

// 格式化创建时间
CommentSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now.getTime() - this.createdAt.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (minutes < 60) {
    return `${minutes}分钟前`;
  } else if (hours < 24) {
    return `${hours}小时前`;
  } else if (days < 30) {
    return `${days}天前`;
  } else {
    return this.createdAt.toLocaleDateString('zh-CN');
  }
});

// 点赞率
CommentSchema.virtual('likeRatio').get(function() {
  const total = this.likes + this.dislikes;
  return total > 0 ? (this.likes / total) : 0;
});

// 是否为热门评论
CommentSchema.virtual('isPopular').get(function() {
  return this.likes >= 10 && this.likeRatio >= 0.8;
});

export default mongoose.model<IComment>('Comment', CommentSchema);