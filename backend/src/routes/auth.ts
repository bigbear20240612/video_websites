/*
 * 大雄视频平台 - 认证路由
 * 定义用户认证相关的API路由和验证规则
 */

import { Router } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import AuthController from '../controllers/AuthController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// 注册限流：每15分钟最多5次注册尝试
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 最多5次尝试
  message: {
    success: false,
    message: '注册尝试次数过多，请稍后重试'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 登录限流：每15分钟最多10次登录尝试
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 10, // 最多10次尝试
  message: {
    success: false,
    message: '登录尝试次数过多，请稍后重试'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 验证码限流：每5分钟最多3次
const verificationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5分钟
  max: 3, // 最多3次
  message: {
    success: false,
    message: '验证码发送过于频繁，请稍后重试'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 用户注册验证规则
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('用户名长度必须在3-30个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线')
    .custom(async (value) => {
      // 检查是否包含敏感词
      const sensitiveWords = ['admin', 'root', 'system', 'test', '管理员'];
      if (sensitiveWords.some(word => value.toLowerCase().includes(word))) {
        throw new Error('用户名包含敏感词汇');
      }
      return true;
    }),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail()
    .custom(async (value) => {
      // 检查邮箱域名白名单
      const allowedDomains = ['gmail.com', 'qq.com', '163.com', '126.com', 'sina.com', 'hotmail.com', 'outlook.com'];
      const domain = value.split('@')[1];
      if (!allowedDomains.includes(domain)) {
        // 可以选择是否严格限制域名
        console.warn(`注册使用了非常见邮箱域名: ${domain}`);
      }
      return true;
    }),
  
  body('password')
    .isLength({ min: 6, max: 50 })
    .withMessage('密码长度必须在6-50个字符之间')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('密码必须包含大小写字母、数字和特殊字符'),
  
  body('nickname')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('昵称长度不能超过50个字符')
    .custom(async (value) => {
      if (value) {
        // 检查昵称敏感词
        const sensitiveWords = ['管理员', '客服', '系统'];
        if (sensitiveWords.some(word => value.includes(word))) {
          throw new Error('昵称包含敏感词汇');
        }
      }
      return true;
    }),
  
  body('phone')
    .optional()
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('请输入有效的中国大陆手机号码')
];

// 用户登录验证规则
const loginValidation = [
  body('identifier')
    .trim()
    .notEmpty()
    .withMessage('请输入用户名、邮箱或手机号'),
  
  body('password')
    .notEmpty()
    .withMessage('请输入密码'),
  
  body('loginType')
    .optional()
    .isIn(['password', 'sms', 'email'])
    .withMessage('登录方式无效')
];

// 邮箱验证规则
const emailVerificationValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail()
];

// 验证码验证规则
const verifyCodeValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  
  body('code')
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('验证码必须是6位数字')
    .isNumeric()
    .withMessage('验证码只能包含数字')
];

// ==================== 路由定义 ====================

/**
 * @route POST /api/auth/register
 * @desc 用户注册
 * @access Public
 */
router.post('/register', 
  registerLimiter,
  registerValidation,
  AuthController.register
);

/**
 * @route POST /api/auth/login
 * @desc 用户登录
 * @access Public
 */
router.post('/login',
  loginLimiter,
  loginValidation,
  AuthController.login
);

/**
 * @route POST /api/auth/refresh-token
 * @desc 刷新访问令牌
 * @access Public (需要刷新令牌)
 */
router.post('/refresh-token',
  AuthController.refreshToken
);

/**
 * @route POST /api/auth/logout
 * @desc 用户注销
 * @access Private
 */
router.post('/logout',
  AuthController.logout
);

/**
 * @route POST /api/auth/send-email-verification
 * @desc 发送邮箱验证码
 * @access Private
 */
router.post('/send-email-verification',
  verificationLimiter,
  authMiddleware,
  emailVerificationValidation,
  AuthController.sendEmailVerification
);

/**
 * @route POST /api/auth/verify-email
 * @desc 验证邮箱
 * @access Private
 */
router.post('/verify-email',
  authMiddleware,
  verifyCodeValidation,
  AuthController.verifyEmail
);

// ==================== 额外的认证路由 ====================

/**
 * @route GET /api/auth/me
 * @desc 获取当前用户信息
 * @access Private
 */
router.get('/me',
  authMiddleware,
  async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      res.json({
        success: true,
        data: {
          user: user.toPublicJSON()
        }
      });
    } catch (error) {
      console.error('获取用户信息失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

/**
 * @route POST /api/auth/check-username
 * @desc 检查用户名是否可用
 * @access Public
 */
router.post('/check-username',
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('用户名长度必须在3-30个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '用户名格式不正确',
          errors: errors.array()
        });
      }

      const { username } = req.body;
      const existingUser = await User.findOne({ username });

      res.json({
        success: true,
        data: {
          available: !existingUser,
          message: existingUser ? '用户名已被使用' : '用户名可用'
        }
      });
    } catch (error) {
      console.error('检查用户名失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

export default router;