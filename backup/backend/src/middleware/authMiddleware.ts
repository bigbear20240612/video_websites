/*
 * 大雄视频平台 - JWT认证中间件
 * 验证用户身份令牌，保护需要认证的路由
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { ApiResponse } from '../types/ApiResponse';

// 扩展 Request 接口以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        email: string;
        userLevel: number;
        isVip: boolean;
        verified: boolean;
      };
    }
  }
}

/**
 * JWT 认证中间件
 * 验证 Authorization 头部的 Bearer Token
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 获取认证头部
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: '访问令牌缺失，请先登录',
        code: 'MISSING_TOKEN'
      } as ApiResponse);
      return;
    }

    // 检查 Bearer 格式
    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: '令牌格式错误',
        code: 'INVALID_TOKEN_FORMAT'
      } as ApiResponse);
      return;
    }

    // 提取令牌
    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀

    if (!token) {
      res.status(401).json({
        success: false,
        message: '访问令牌为空',
        code: 'EMPTY_TOKEN'
      } as ApiResponse);
      return;
    }

    // 验证令牌
    const jwtSecret = process.env.JWT_SECRET || 'daxiong_secret';
    let decoded: any;

    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (jwtError: any) {
      let message = '访问令牌无效';
      let code = 'INVALID_TOKEN';

      if (jwtError.name === 'TokenExpiredError') {
        message = '访问令牌已过期，请刷新令牌';
        code = 'TOKEN_EXPIRED';
      } else if (jwtError.name === 'JsonWebTokenError') {
        message = '访问令牌格式错误';
        code = 'MALFORMED_TOKEN';
      } else if (jwtError.name === 'NotBeforeError') {
        message = '访问令牌尚未生效';
        code = 'TOKEN_NOT_ACTIVE';
      }

      res.status(401).json({
        success: false,
        message,
        code
      } as ApiResponse);
      return;
    }

    // 验证令牌负载
    if (!decoded.id || !decoded.username || !decoded.email) {
      res.status(401).json({
        success: false,
        message: '访问令牌负载无效',
        code: 'INVALID_TOKEN_PAYLOAD'
      } as ApiResponse);
      return;
    }

    // 可选：验证用户是否仍然存在且处于活跃状态
    const user = await User.findById(decoded.id);
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: '用户不存在',
        code: 'USER_NOT_FOUND'
      } as ApiResponse);
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: '用户账号已被禁用',
        code: 'USER_DISABLED'
      } as ApiResponse);
      return;
    }

    // 将用户信息添加到请求对象
    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      userLevel: decoded.userLevel,
      isVip: decoded.isVip,
      verified: decoded.verified
    };

    next();

  } catch (error) {
    console.error('认证中间件错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      code: 'INTERNAL_ERROR'
    } as ApiResponse);
  }
};

/**
 * 可选认证中间件
 * 如果提供了令牌则验证，否则继续执行（用于可选登录的功能）
 */
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // 没有令牌，继续执行但不设置用户信息
      next();
      return;
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      next();
      return;
    }

    try {
      const jwtSecret = process.env.JWT_SECRET || 'daxiong_secret';
      const decoded: any = jwt.verify(token, jwtSecret);

      if (decoded.id && decoded.username && decoded.email) {
        const user = await User.findById(decoded.id);
        
        if (user && user.isActive) {
          req.user = {
            id: decoded.id,
            username: decoded.username,
            email: decoded.email,
            userLevel: decoded.userLevel,
            isVip: decoded.isVip,
            verified: decoded.verified
          };
        }
      }
    } catch (jwtError) {
      // 令牌无效，但不阻断请求
      console.warn('可选认证令牌无效:', jwtError);
    }

    next();

  } catch (error) {
    console.error('可选认证中间件错误:', error);
    next(); // 出错时也继续执行
  }
};

/**
 * VIP 权限中间件
 * 要求用户必须是 VIP 会员
 */
export const vipMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '请先登录',
        code: 'AUTHENTICATION_REQUIRED'
      } as ApiResponse);
      return;
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: '用户不存在',
        code: 'USER_NOT_FOUND'
      } as ApiResponse);
      return;
    }

    if (!user.isVip || (user.vipExpireAt && user.vipExpireAt < new Date())) {
      res.status(403).json({
        success: false,
        message: 'VIP会员功能，请升级会员',
        code: 'VIP_REQUIRED'
      } as ApiResponse);
      return;
    }

    next();

  } catch (error) {
    console.error('VIP权限验证错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      code: 'INTERNAL_ERROR'
    } as ApiResponse);
  }
};

/**
 * 管理员权限中间件
 * 要求用户具有管理员权限（用户等级 >= 90）
 */
export const adminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '请先登录',
        code: 'AUTHENTICATION_REQUIRED'
      } as ApiResponse);
      return;
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: '用户不存在',
        code: 'USER_NOT_FOUND'
      } as ApiResponse);
      return;
    }

    if (user.userLevel < 90) {
      res.status(403).json({
        success: false,
        message: '权限不足，需要管理员权限',
        code: 'ADMIN_REQUIRED'
      } as ApiResponse);
      return;
    }

    next();

  } catch (error) {
    console.error('管理员权限验证错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      code: 'INTERNAL_ERROR'
    } as ApiResponse);
  }
};

/**
 * 用户等级中间件工厂
 * 创建要求特定用户等级的中间件
 */
export const levelMiddleware = (requiredLevel: number) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: '请先登录',
          code: 'AUTHENTICATION_REQUIRED'
        } as ApiResponse);
        return;
      }

      if (req.user.userLevel < requiredLevel) {
        res.status(403).json({
          success: false,
          message: `权限不足，需要等级${requiredLevel}以上`,
          code: 'INSUFFICIENT_LEVEL'
        } as ApiResponse);
        return;
      }

      next();

    } catch (error) {
      console.error('用户等级验证错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 'INTERNAL_ERROR'
      } as ApiResponse);
    }
  };
};