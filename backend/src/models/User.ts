/*
 * 大雄视频平台 - 用户数据模型
 * 定义用户基础信息和认证相关字段
 */

import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

// 用户基础信息接口
export interface IUser extends Document {
  // 基础信息
  username: string;
  email: string;
  phone?: string;
  password: string;
  nickname: string;
  avatar: string;
  banner: string;
  
  // 认证状态
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  
  // 用户等级和权限
  userLevel: number;
  isVip: boolean;
  vipExpireAt?: Date;
  verified: boolean; // 认证标识
  
  // 个人资料
  description: string;
  location?: string;
  website?: string;
  birthday?: Date;
  gender?: 'male' | 'female' | 'other';
  
  // 统计数据
  followers: number;
  following: number;
  totalLikes: number;
  totalViews: number;
  videoCount: number;
  
  // 隐私设置
  profileVisibility: 'public' | 'followers' | 'private';
  allowMessages: boolean;
  allowComments: boolean;
  
  // 系统字段
  lastLoginAt?: Date;
  lastLoginIP?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // 方法
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
  toPublicJSON(): object;
}

// 用户模式定义
const UserSchema: Schema = new Schema({
  // 基础信息
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-zA-Z0-9_]+$/
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  phone: {
    type: String,
    sparse: true,
    unique: true,
    match: /^1[3-9]\d{9}$/
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false // 默认查询时不返回密码
  },
  nickname: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  avatar: {
    type: String,
    default: 'https://via.placeholder.com/200x200?text=Avatar'
  },
  banner: {
    type: String,
    default: 'https://via.placeholder.com/1200x300?text=Banner'
  },
  
  // 认证状态
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // 用户等级和权限
  userLevel: {
    type: Number,
    default: 1,
    min: 1,
    max: 100
  },
  isVip: {
    type: Boolean,
    default: false
  },
  vipExpireAt: {
    type: Date
  },
  verified: {
    type: Boolean,
    default: false
  },
  
  // 个人资料
  description: {
    type: String,
    maxlength: 500,
    default: '这个人很懒，什么都没写~'
  },
  location: {
    type: String,
    maxlength: 100
  },
  website: {
    type: String,
    maxlength: 200,
    match: /^https?:\/\/.+/
  },
  birthday: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  
  // 统计数据
  followers: {
    type: Number,
    default: 0,
    min: 0
  },
  following: {
    type: Number,
    default: 0,
    min: 0
  },
  totalLikes: {
    type: Number,
    default: 0,
    min: 0
  },
  totalViews: {
    type: Number,
    default: 0,
    min: 0
  },
  videoCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // 隐私设置
  profileVisibility: {
    type: String,
    enum: ['public', 'followers', 'private'],
    default: 'public'
  },
  allowMessages: {
    type: Boolean,
    default: true
  },
  allowComments: {
    type: Boolean,
    default: true
  },
  
  // 系统字段
  lastLoginAt: {
    type: Date
  },
  lastLoginIP: {
    type: String
  }
}, {
  timestamps: true, // 自动添加 createdAt 和 updatedAt
  collection: 'users'
});

// 索引优化
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ followers: -1 });
UserSchema.index({ totalLikes: -1 });

// 密码加密中间件
UserSchema.pre<IUser>('save', async function(next) {
  // 只有密码被修改时才重新加密
  if (!this.isModified('password')) return next();
  
  try {
    // 生成 salt 并加密密码
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// 密码验证方法
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// 生成认证令牌
UserSchema.methods.generateAuthToken = function(): string {
  const jwt = require('jsonwebtoken');
  
  const payload = {
    id: this._id,
    username: this.username,
    email: this.email,
    userLevel: this.userLevel,
    isVip: this.isVip,
    verified: this.verified
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET || 'daxiong_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// 返回公开信息（不包含敏感数据）
UserSchema.methods.toPublicJSON = function(): object {
  const userObject = this.toObject();
  
  // 移除敏感字段
  delete userObject.password;
  delete userObject.lastLoginIP;
  delete userObject.__v;
  
  return userObject;
};

// 虚拟字段：计算用户年龄
UserSchema.virtual('age').get(function() {
  if (!this.birthday) return null;
  const now = new Date();
  const diff = now.getTime() - this.birthday.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
});

// 虚拟字段：用户等级名称
UserSchema.virtual('levelName').get(function() {
  const level = this.userLevel;
  if (level >= 90) return '传说';
  if (level >= 80) return '大师';
  if (level >= 70) return '专家';
  if (level >= 60) return '高手';
  if (level >= 50) return '进阶';
  if (level >= 30) return '熟练';
  if (level >= 10) return '初级';
  return '新手';
});

// 确保虚拟字段在 JSON 序列化时包含
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

export default mongoose.model<IUser>('User', UserSchema);