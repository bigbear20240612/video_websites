/*
 * 大雄视频平台 - 用户管理路由
 * 定义用户资料管理相关的API路由
 */

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import UserController from '../controllers/UserController';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware';

const router = Router();

// 文件上传配置
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 JPEG、PNG、WebP 格式的图片'));
    }
  }
});

// 上传限流：每小时最多20次上传
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 20, // 最多20次
  message: {
    success: false,
    message: '上传过于频繁，请稍后重试'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 密码修改限流：每小时最多5次
const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 5, // 最多5次
  message: {
    success: false,
    message: '密码修改过于频繁，请稍后重试'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ==================== 验证规则 ====================

// 用户ID验证
const userIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('无效的用户ID格式')
];

// 用户资料更新验证
const profileUpdateValidation = [
  body('nickname')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('昵称长度必须在1-50个字符之间')
    .custom(async (value) => {
      if (value) {
        const sensitiveWords = ['管理员', '客服', '系统', 'admin', 'system'];
        if (sensitiveWords.some(word => value.toLowerCase().includes(word.toLowerCase()))) {
          throw new Error('昵称包含敏感词汇');
        }
      }
      return true;
    }),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('个人简介不能超过500个字符'),
  
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('地址不能超过100个字符'),
  
  body('website')
    .optional()
    .trim()
    .isURL()
    .withMessage('请输入有效的网址')
    .isLength({ max: 200 })
    .withMessage('网址不能超过200个字符'),
  
  body('birthday')
    .optional()
    .isISO8601()
    .withMessage('请输入有效的生日格式')
    .custom((value) => {
      if (value) {
        const birthDate = new Date(value);
        const now = new Date();
        const age = now.getFullYear() - birthDate.getFullYear();
        
        if (age < 13 || age > 120) {
          throw new Error('年龄必须在13-120岁之间');
        }
      }
      return true;
    }),
  
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('性别只能是 male、female 或 other'),
  
  body('profileVisibility')
    .optional()
    .isIn(['public', 'followers', 'private'])
    .withMessage('隐私设置无效'),
  
  body('allowMessages')
    .optional()
    .isBoolean()
    .withMessage('私信设置必须是布尔值'),
  
  body('allowComments')
    .optional()
    .isBoolean()
    .withMessage('评论设置必须是布尔值')
];

// 密码修改验证
const passwordChangeValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('请输入当前密码'),
  
  body('newPassword')
    .isLength({ min: 6, max: 50 })
    .withMessage('新密码长度必须在6-50个字符之间')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('新密码必须包含大小写字母、数字和特殊字符'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('确认密码与新密码不匹配');
      }
      return true;
    })
];

// 用户列表查询验证
const userListValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('搜索关键词长度必须在1-100个字符之间'),
  
  query('sort')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'followers', 'totalLikes', 'videoCount'])
    .withMessage('排序字段无效'),
  
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('排序方式只能是 asc 或 desc')
];

// 账号删除验证
const accountDeleteValidation = [
  body('password')
    .notEmpty()
    .withMessage('请输入密码'),
  
  body('confirmText')
    .equals('删除我的账号')
    .withMessage('请输入正确的确认文本："删除我的账号"')
];

// ==================== 路由定义 ====================

/**
 * @route GET /api/users/:id
 * @desc 获取用户资料
 * @access Public (根据隐私设置)
 */
router.get('/:id',
  userIdValidation,
  UserController.getUserProfile
);

/**
 * @route GET /api/users/:id/stats
 * @desc 获取用户统计信息
 * @access Public
 */
router.get('/:id/stats',
  userIdValidation,
  UserController.getUserStats
);

/**
 * @route GET /api/users
 * @desc 获取用户列表（管理员）
 * @access Private (Admin)
 */
router.get('/',
  authMiddleware,
  adminMiddleware,
  userListValidation,
  UserController.getUserList
);

/**
 * @route PUT /api/users/profile
 * @desc 更新用户资料
 * @access Private
 */
router.put('/profile',
  authMiddleware,
  profileUpdateValidation,
  UserController.updateProfile
);

/**
 * @route POST /api/users/avatar
 * @desc 上传头像
 * @access Private
 */
router.post('/avatar',
  authMiddleware,
  uploadLimiter,
  upload.single('avatar'),
  UserController.uploadAvatar
);

/**
 * @route POST /api/users/banner
 * @desc 上传横幅
 * @access Private
 */
router.post('/banner',
  authMiddleware,
  uploadLimiter,
  upload.single('banner'),
  UserController.uploadBanner
);

/**
 * @route PUT /api/users/password
 * @desc 修改密码
 * @access Private
 */
router.put('/password',
  authMiddleware,
  passwordChangeLimiter,
  passwordChangeValidation,
  UserController.changePassword
);

/**
 * @route DELETE /api/users/account
 * @desc 删除用户账号
 * @access Private
 */
router.delete('/account',
  authMiddleware,
  accountDeleteValidation,
  UserController.deleteAccount
);

// ==================== 错误处理中间件 ====================

router.use((error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '文件大小超出限制'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: '文件数量超出限制'
      });
    }
  }
  
  if (error.message && error.message.includes('图片')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  console.error('用户路由错误:', error);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

export default router;