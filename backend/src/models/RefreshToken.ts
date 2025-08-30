/*
 * 大雄视频平台 - 刷新令牌数据模型
 * 管理用户的刷新令牌，支持令牌轮换和安全退出
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IRefreshToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  isRevoked: boolean;
  createdByIP: string;
  revokedAt?: Date;
  revokedByIP?: string;
  replacedByToken?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // 方法
  isExpired(): boolean;
  isActive(): boolean;
}

const RefreshTokenSchema: Schema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  isRevoked: {
    type: Boolean,
    default: false,
    index: true
  },
  createdByIP: {
    type: String,
    required: true
  },
  revokedAt: {
    type: Date
  },
  revokedByIP: {
    type: String
  },
  replacedByToken: {
    type: String
  }
}, {
  timestamps: true,
  collection: 'refresh_tokens'
});

// 复合索引优化查询
RefreshTokenSchema.index({ userId: 1, isRevoked: 1 });
RefreshTokenSchema.index({ token: 1, isRevoked: 1 });
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL索引

// 检查令牌是否过期
RefreshTokenSchema.methods.isExpired = function(): boolean {
  return Date.now() >= this.expiresAt.getTime();
};

// 检查令牌是否有效
RefreshTokenSchema.methods.isActive = function(): boolean {
  return !this.isRevoked && !this.isExpired();
};

export default mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);