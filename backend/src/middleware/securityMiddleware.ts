/*
 * 大雄视频平台 - 安全中间件
 * 实现密码安全、防暴力破解、IP封禁等安全策略
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import helmet from 'helmet';
import cors from 'cors';
import { createHash } from 'crypto';
import redis from '../config/redis';
import { getClientIP } from '../utils/helpers';

// ==================== 基础安全中间件 ====================

/**
 * Helmet 安全头设置
 */
export const helmetSecurity = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "wss:", "ws:"],
      mediaSrc: ["'self'", "https:", "blob:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

/**
 * CORS 跨域设置
 */
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://daxiong.video'
    ];
    
    // 开发环境允许所有来源
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('不允许的跨域请求'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24小时
});

// ==================== 限流中间件 ====================

/**
 * API 全局限流
 */
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 每个IP最多1000次请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后重试',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return getClientIP(req);
  },
  skip: (req) => {
    // 跳过健康检查和静态资源
    return req.path === '/health' || req.path.startsWith('/static');
  }
});

/**
 * 认证相关严格限流
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 20, // 每个IP最多20次认证请求
  message: {
    success: false,
    message: '认证请求过于频繁，请稍后重试',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `auth:${getClientIP(req)}`;
  }
});

/**
 * 慢速响应中间件（防暴力破解）
 */
export const slowDownMiddleware = slowDown({
  windowMs: 15 * 60 * 1000, // 15分钟
  delayAfter: 5, // 5次请求后开始延迟
  delayMs: 500, // 每次延迟500ms
  maxDelayMs: 20000, // 最大延迟20秒
  keyGenerator: (req) => {
    return `slowdown:${getClientIP(req)}`;
  }
});

// ==================== 密码安全策略 ====================

/**
 * 密码强度验证中间件
 */
export const passwordStrengthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const { password } = req.body;
  
  if (!password) {
    res.status(400).json({
      success: false,
      message: '密码不能为空',
      code: 'PASSWORD_REQUIRED'
    });
    return;
  }

  // 密码长度检查
  if (password.length < 8 || password.length > 128) {
    res.status(400).json({
      success: false,
      message: '密码长度必须在8-128个字符之间',
      code: 'PASSWORD_LENGTH_INVALID'
    });
    return;
  }

  // 密码复杂度检查
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  const complexityScore = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  
  if (complexityScore < 3) {
    res.status(400).json({
      success: false,
      message: '密码必须包含至少3种字符类型：大写字母、小写字母、数字、特殊字符',
      code: 'PASSWORD_COMPLEXITY_INSUFFICIENT'
    });
    return;
  }

  // 常见弱密码检查
  const commonPasswords = [
    '12345678', '123456789', '1234567890',
    'password', 'Password', 'password123',
    'qwerty', 'qwerty123', 'abc123',
    'admin', 'admin123', 'root',
    '88888888', '66666666'
  ];
  
  if (commonPasswords.includes(password)) {
    res.status(400).json({
      success: false,
      message: '不能使用常见的弱密码',
      code: 'PASSWORD_TOO_COMMON'
    });
    return;
  }

  // 连续字符检查
  const hasConsecutiveChars = /(.)\1{2,}/.test(password);
  if (hasConsecutiveChars) {
    res.status(400).json({
      success: false,
      message: '密码不能包含3个或更多相同的连续字符',
      code: 'PASSWORD_CONSECUTIVE_CHARS'
    });
    return;
  }

  next();
};

// ==================== IP封禁和异常检测 ====================

/**
 * IP封禁检查中间件
 */
export const ipBanCheckMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const clientIP = getClientIP(req);
    const banKey = `banned:ip:${clientIP}`;
    
    const isBanned = await redis.get(banKey);
    
    if (isBanned) {
      const banInfo = JSON.parse(isBanned);
      
      res.status(403).json({
        success: false,
        message: '您的IP已被临时封禁',
        code: 'IP_BANNED',
        data: {
          reason: banInfo.reason,
          expiresAt: banInfo.expiresAt
        }
      });
      return;
    }

    next();
  } catch (error) {
    console.error('IP封禁检查失败:', error);
    next(); // 出错时不阻断请求
  }
};

/**
 * 失败登录记录中间件
 */
export const loginAttemptMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const clientIP = getClientIP(req);
    const { identifier } = req.body;
    
    // 记录请求信息供后续使用
    (req as any).loginAttempt = {
      ip: clientIP,
      identifier: identifier,
      timestamp: new Date()
    };

    next();
  } catch (error) {
    console.error('登录尝试记录失败:', error);
    next();
  }
};

/**
 * 处理登录失败的中间件
 */
export const handleLoginFailure = async (ip: string, identifier: string, reason: string = 'invalid_credentials'): Promise<void> => {
  try {
    const ipKey = `login_attempts:ip:${ip}`;
    const userKey = `login_attempts:user:${identifier}`;
    
    // 记录IP失败次数
    const ipAttempts = await redis.incr(ipKey);
    await redis.expire(ipKey, 3600); // 1小时过期
    
    // 记录用户失败次数
    const userAttempts = await redis.incr(userKey);
    await redis.expire(userKey, 3600); // 1小时过期
    
    // IP失败次数过多时临时封禁
    if (ipAttempts >= 20) {
      const banKey = `banned:ip:${ip}`;
      const banInfo = {
        reason: '登录失败次数过多',
        bannedAt: new Date(),
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2小时
      };
      
      await redis.setex(banKey, 7200, JSON.stringify(banInfo)); // 2小时
      console.warn(`IP ${ip} 已被封禁 - 登录失败${ipAttempts}次`);
    }
    
    // 用户失败次数过多时锁定账户（需要在User模型中实现）
    if (userAttempts >= 10) {
      console.warn(`用户 ${identifier} 登录失败${userAttempts}次，建议锁定账户`);
      // TODO: 实现用户账户锁定逻辑
    }
    
    // 记录安全日志
    const logEntry = {
      type: 'login_failure',
      ip: ip,
      identifier: identifier,
      reason: reason,
      attempts: { ip: ipAttempts, user: userAttempts },
      timestamp: new Date()
    };
    
    // 这里可以写入日志文件或数据库
    console.warn('登录失败记录:', JSON.stringify(logEntry));
    
  } catch (error) {
    console.error('处理登录失败记录时出错:', error);
  }
};

/**
 * 处理登录成功的中间件
 */
export const handleLoginSuccess = async (ip: string, identifier: string): Promise<void> => {
  try {
    // 清除失败记录
    const ipKey = `login_attempts:ip:${ip}`;
    const userKey = `login_attempts:user:${identifier}`;
    
    await redis.del(ipKey);
    await redis.del(userKey);
    
    // 记录成功登录日志
    const logEntry = {
      type: 'login_success',
      ip: ip,
      identifier: identifier,
      timestamp: new Date()
    };
    
    console.info('登录成功记录:', JSON.stringify(logEntry));
    
  } catch (error) {
    console.error('处理登录成功记录时出错:', error);
  }
};

// ==================== 请求验证中间件 ====================

/**
 * 请求体大小限制中间件
 */
export const bodySizeLimit = (maxSize: number = 10 * 1024 * 1024) => { // 默认10MB
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.get('content-length') || '0');
    
    if (contentLength > maxSize) {
      res.status(413).json({
        success: false,
        message: '请求体过大',
        code: 'PAYLOAD_TOO_LARGE'
      });
      return;
    }
    
    next();
  };
};

/**
 * 用户代理验证中间件
 */
export const userAgentValidation = (req: Request, res: Response, next: NextFunction): void => {
  const userAgent = req.get('User-Agent');
  
  if (!userAgent) {
    res.status(400).json({
      success: false,
      message: '缺少User-Agent头',
      code: 'MISSING_USER_AGENT'
    });
    return;
  }
  
  // 检查可疑的User-Agent
  const suspiciousAgents = [
    'bot', 'crawler', 'spider', 'scraper',
    'python-requests', 'curl/', 'wget'
  ];
  
  const lowerAgent = userAgent.toLowerCase();
  const isSuspicious = suspiciousAgents.some(agent => lowerAgent.includes(agent));
  
  if (isSuspicious && process.env.NODE_ENV === 'production') {
    // 在生产环境中可以选择阻止或标记可疑请求
    console.warn(`可疑User-Agent: ${userAgent} from ${getClientIP(req)}`);
    
    // 可以选择返回403或继续处理
    // res.status(403).json({
    //   success: false,
    //   message: '不允许的客户端',
    //   code: 'FORBIDDEN_CLIENT'
    // });
    // return;
  }
  
  next();
};

// ==================== 导出安全中间件集合 ====================

/**
 * 基础安全中间件集合
 */
export const basicSecurityMiddleware = [
  helmetSecurity,
  corsMiddleware,
  ipBanCheckMiddleware,
  userAgentValidation,
  bodySizeLimit()
];

/**
 * 认证安全中间件集合
 */
export const authSecurityMiddleware = [
  authRateLimit,
  slowDownMiddleware,
  loginAttemptMiddleware,
  passwordStrengthMiddleware
];