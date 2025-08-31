/*
 * 大雄视频平台 - 直播聊天消息模型
 * 处理直播聊天、礼物、互动消息等功能
 */

import mongoose, { Schema, Document } from 'mongoose';

export enum MessageType {
  CHAT = 'chat',           // 普通聊天
  GIFT = 'gift',           // 礼物
  FOLLOW = 'follow',       // 关注
  SHARE = 'share',         // 分享
  LIKE = 'like',           // 点赞
  SYSTEM = 'system',       // 系统消息
  SUPERCHAT = 'superchat'  // 超级聊天（付费消息）
}

export enum MessageStatus {
  ACTIVE = 'active',       // 正常显示
  HIDDEN = 'hidden',       // 隐藏
  DELETED = 'deleted'      // 已删除
}

// 礼物信息
export interface GiftInfo {
  giftId: string;
  giftName: string;
  giftValue: number;       // 礼物价值（虚拟币）
  quantity: number;        // 数量
  animation?: string;      // 动画效果
}

// 超级聊天信息
export interface SuperChatInfo {
  amount: number;          // 付费金额
  currency: string;        // 货币类型
  duration: number;        // 置顶时长（秒）
  backgroundColor: string; // 背景颜色
}

export interface ILiveMessage extends Document {
  _id: mongoose.Types.ObjectId;
  streamId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  
  // 消息内容
  type: MessageType;
  content: string;
  status: MessageStatus;
  
  // 特殊消息信息
  giftInfo?: GiftInfo;
  superChatInfo?: SuperChatInfo;
  
  // 互动信息
  likes: number;
  replies: number;
  
  // 审核信息
  moderationFlags: string[];
  moderatedBy?: mongoose.Types.ObjectId;
  
  // 时间戳
  createdAt: Date;
  updatedAt: Date;
  
  // 实例方法
  hide(): Promise<void>;
  markAsDeleted(): Promise<void>;
}

const LiveMessageSchema = new Schema<ILiveMessage>({
  streamId: {
    type: Schema.Types.ObjectId,
    ref: 'LiveStream',
    required: true,
    index: true
  },
  
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  type: {
    type: String,
    enum: Object.values(MessageType),
    default: MessageType.CHAT,
    index: true
  },
  
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: [500, '消息内容不能超过500个字符']
  },
  
  status: {
    type: String,
    enum: Object.values(MessageStatus),
    default: MessageStatus.ACTIVE,
    index: true
  },
  
  // 礼物信息
  giftInfo: {
    giftId: String,
    giftName: String,
    giftValue: {
      type: Number,
      min: 0
    },
    quantity: {
      type: Number,
      min: 1,
      default: 1
    },
    animation: String
  },
  
  // 超级聊天信息
  superChatInfo: {
    amount: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'CNY'
    },
    duration: {
      type: Number,
      min: 30,
      max: 300,
      default: 60
    },
    backgroundColor: {
      type: String,
      default: '#FF4444'
    }
  },
  
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  
  replies: {
    type: Number,
    default: 0,
    min: 0
  },
  
  moderationFlags: [{
    type: String,
    enum: ['spam', 'inappropriate', 'harassment', 'advertising', 'other']
  }],
  
  moderatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
  
}, {
  timestamps: true,
  collection: 'liveMessages'
});

// ==================== 索引优化 ====================

// 复合索引
LiveMessageSchema.index({ streamId: 1, createdAt: -1 });        // 直播消息列表
LiveMessageSchema.index({ userId: 1, createdAt: -1 });          // 用户消息历史
LiveMessageSchema.index({ type: 1, createdAt: -1 });            // 消息类型查询
LiveMessageSchema.index({ streamId: 1, type: 1, status: 1 });   // 特定类型消息

// TTL索引 - 普通聊天消息7天后自动删除
LiveMessageSchema.index(
  { createdAt: 1 },
  { 
    expireAfterSeconds: 7 * 24 * 60 * 60,
    partialFilterExpression: { 
      type: MessageType.CHAT,
      'superChatInfo': { $exists: false }
    }
  }
);

// ==================== 实例方法 ====================

/**
 * 隐藏消息
 */
LiveMessageSchema.methods.hide = async function(): Promise<void> {
  this.status = MessageStatus.HIDDEN;
  await this.save();
};

/**
 * 标记为已删除
 */
LiveMessageSchema.methods.markAsDeleted = async function(): Promise<void> {
  this.status = MessageStatus.DELETED;
  this.content = '[此消息已被删除]';
  await this.save();
};

// ==================== 静态方法 ====================

/**
 * 获取直播间消息
 */
LiveMessageSchema.statics.getStreamMessages = function(
  streamId: mongoose.Types.ObjectId,
  limit: number = 50,
  before?: Date,
  messageTypes?: MessageType[]
) {
  const query: any = {
    streamId,
    status: MessageStatus.ACTIVE
  };
  
  if (before) {
    query.createdAt = { $lt: before };
  }
  
  if (messageTypes && messageTypes.length > 0) {
    query.type = { $in: messageTypes };
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'username nickname avatar verified level')
    .lean();
};

/**
 * 获取超级聊天消息
 */
LiveMessageSchema.statics.getSuperChats = function(
  streamId: mongoose.Types.ObjectId,
  limit: number = 20
) {
  return this.find({
    streamId,
    type: MessageType.SUPERCHAT,
    status: MessageStatus.ACTIVE
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('userId', 'username nickname avatar verified')
  .lean();
};

/**
 * 获取礼物统计
 */
LiveMessageSchema.statics.getGiftStats = function(streamId: mongoose.Types.ObjectId) {
  return this.aggregate([
    {
      $match: {
        streamId: streamId,
        type: MessageType.GIFT,
        status: MessageStatus.ACTIVE
      }
    },
    {
      $group: {
        _id: '$giftInfo.giftId',
        giftName: { $first: '$giftInfo.giftName' },
        totalQuantity: { $sum: '$giftInfo.quantity' },
        totalValue: { $sum: { $multiply: ['$giftInfo.giftValue', '$giftInfo.quantity'] } },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { totalValue: -1 }
    }
  ]);
};

/**
 * 清理过期消息
 */
LiveMessageSchema.statics.cleanupExpiredMessages = function() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  return this.deleteMany({
    type: MessageType.CHAT,
    createdAt: { $lt: sevenDaysAgo },
    superChatInfo: { $exists: false }
  });
};

// ==================== 中间件 ====================

// 保存前处理
LiveMessageSchema.pre('save', function(next) {
  // 内容敏感词过滤（简单版）
  if (this.type === MessageType.CHAT || this.type === MessageType.SUPERCHAT) {
    const sensitiveWords = ['垃圾', '傻逼', '白痴'];
    let content = this.content;
    
    sensitiveWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      content = content.replace(regex, '*'.repeat(word.length));
    });
    
    this.content = content;
  }
  
  next();
});

// 保存后处理
LiveMessageSchema.post('save', async function() {
  try {
    // 更新直播间消息统计
    await mongoose.model('LiveStream').findByIdAndUpdate(
      this.streamId,
      { $inc: { 'stats.messages': 1 } }
    );
  } catch (error) {
    console.error('更新直播消息统计失败:', error);
  }
});

// ==================== 虚拟字段 ====================

// 消息类型描述
LiveMessageSchema.virtual('typeDescription').get(function() {
  const typeMap = {
    [MessageType.CHAT]: '聊天',
    [MessageType.GIFT]: '礼物',
    [MessageType.FOLLOW]: '关注',
    [MessageType.SHARE]: '分享',
    [MessageType.LIKE]: '点赞',
    [MessageType.SYSTEM]: '系统',
    [MessageType.SUPERCHAT]: '超级聊天'
  };
  
  return typeMap[this.type] || '未知';
});

// 消息重要性等级
LiveMessageSchema.virtual('priority').get(function() {
  switch (this.type) {
    case MessageType.SUPERCHAT:
      return 10;
    case MessageType.GIFT:
      return 8;
    case MessageType.FOLLOW:
      return 6;
    case MessageType.SHARE:
      return 4;
    case MessageType.LIKE:
      return 2;
    case MessageType.CHAT:
      return 1;
    case MessageType.SYSTEM:
      return 5;
    default:
      return 0;
  }
});

export default mongoose.model<ILiveMessage>('LiveMessage', LiveMessageSchema);