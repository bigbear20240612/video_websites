/*
 * 大雄视频平台 - 验证码数据模型
 * 管理邮箱验证、手机验证、密码重置等验证码
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IVerificationCode extends Document {
  identifier: string; // 邮箱或手机号
  code: string;
  type: 'email_verify' | 'phone_verify' | 'password_reset' | 'login_verify';
  expiresAt: Date;
  isUsed: boolean;
  usedAt?: Date;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  updatedAt: Date;
  
  // 方法
  isExpired(): boolean;
  isValid(): boolean;
  canAttempt(): boolean;
  incrementAttempts(): void;
}

const VerificationCodeSchema: Schema = new Schema({
  identifier: {
    type: String,
    required: true,
    index: true
  },
  code: {
    type: String,
    required: true,
    length: 6
  },
  type: {
    type: String,
    required: true,
    enum: ['email_verify', 'phone_verify', 'password_reset', 'login_verify'],
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  isUsed: {
    type: Boolean,
    default: false,
    index: true
  },
  usedAt: {
    type: Date
  },
  attempts: {
    type: Number,
    default: 0,
    min: 0
  },
  maxAttempts: {
    type: Number,
    default: 5,
    min: 1
  }
}, {
  timestamps: true,
  collection: 'verification_codes'
});

// 复合索引优化查询
VerificationCodeSchema.index({ identifier: 1, type: 1, isUsed: 1 });
VerificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL索引

// 检查验证码是否过期
VerificationCodeSchema.methods.isExpired = function(): boolean {
  return Date.now() >= this.expiresAt.getTime();
};

// 检查验证码是否有效
VerificationCodeSchema.methods.isValid = function(): boolean {
  return !this.isUsed && !this.isExpired() && this.canAttempt();
};

// 检查是否还能尝试验证
VerificationCodeSchema.methods.canAttempt = function(): boolean {
  return this.attempts < this.maxAttempts;
};

// 增加尝试次数
VerificationCodeSchema.methods.incrementAttempts = function(): void {
  this.attempts += 1;
  this.save();
};

export default mongoose.model<IVerificationCode>('VerificationCode', VerificationCodeSchema);