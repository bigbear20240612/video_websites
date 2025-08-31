/*
 * 大雄视频平台 - 认证控制器
 * 处理用户注册、登录、注销等认证相关请求
 */

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import RefreshToken from '../models/RefreshToken';
import VerificationCode from '../models/VerificationCode';
import { sendEmail } from '../services/EmailService';
import { sendSMS } from '../services/SMSService';
import { ApiResponse } from '../types/ApiResponse';
import { generateRandomCode } from '../utils/helpers';
import rateLimit from 'express-rate-limit';

export class AuthController {
  
  /**
   * 用户注册
   * POST /api/auth/register
   */
  public async register(req: Request, res: Response): Promise<void> {
    try {
      // 验证输入参数
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: '输入参数有误',
          errors: errors.array()
        } as ApiResponse);
        return;
      }

      const { username, email, password, nickname, phone } = req.body;

      // 检查用户名是否已存在
      const existingUser = await User.findOne({
        $or: [
          { username },
          { email },
          ...(phone ? [{ phone }] : [])
        ]
      });

      if (existingUser) {
        let message = '该账号已被注册';
        if (existingUser.username === username) {
          message = '用户名已被使用';
        } else if (existingUser.email === email) {
          message = '邮箱已被注册';
        } else if (existingUser.phone === phone) {
          message = '手机号已被注册';
        }

        res.status(409).json({
          success: false,
          message
        } as ApiResponse);
        return;
      }

      // 创建新用户
      const user = new User({
        username,
        email,
        password,
        nickname: nickname || username,
        phone,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      });

      await user.save();

      // 发送邮箱验证码
      const verificationCode = generateRandomCode(6);
      const emailVerification = new VerificationCode({
        identifier: email,
        code: verificationCode,
        type: 'email_verify',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10分钟有效期
      });
      
      await emailVerification.save();
      
      // 发送验证邮件
      try {
        await sendEmail({
          to: email,
          subject: '大雄视频 - 邮箱验证',
          template: 'email-verification',
          data: {
            nickname: user.nickname,
            code: verificationCode,
            expireMinutes: 10
          }
        });
      } catch (emailError) {
        console.error('发送验证邮件失败:', emailError);
        // 不阻断注册流程，可以稍后重新发送
      }

      // 生成认证令牌
      const token = user.generateAuthToken();
      
      // 生成刷新令牌
      const refreshToken = this.generateRefreshToken();
      const refreshTokenDoc = new RefreshToken({
        userId: user._id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天
        createdByIP: req.ip
      });
      
      await refreshTokenDoc.save();

      // 设置 HTTP-only Cookie
      this.setTokenCookie(res, refreshToken);

      res.status(201).json({
        success: true,
        message: '注册成功',
        data: {
          user: user.toPublicJSON(),
          token,
          needEmailVerification: !user.isEmailVerified
        }
      } as ApiResponse);

    } catch (error) {
      console.error('注册失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误，请稍后重试'
      } as ApiResponse);
    }
  }

  /**
   * 用户登录
   * POST /api/auth/login
   */
  public async login(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: '输入参数有误',
          errors: errors.array()
        } as ApiResponse);
        return;
      }

      const { identifier, password, loginType = 'password' } = req.body;

      // 查找用户（支持用户名、邮箱、手机号登录）
      const user = await User.findOne({
        $or: [
          { username: identifier },
          { email: identifier },
          { phone: identifier }
        ]
      }).select('+password');

      if (!user) {
        res.status(401).json({
          success: false,
          message: '用户不存在'
        } as ApiResponse);
        return;
      }

      // 检查用户状态
      if (!user.isActive) {
        res.status(403).json({
          success: false,
          message: '账号已被禁用，请联系客服'
        } as ApiResponse);
        return;
      }

      // 验证密码
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: '密码错误'
        } as ApiResponse);
        return;
      }

      // 更新最后登录信息
      user.lastLoginAt = new Date();
      user.lastLoginIP = req.ip;
      await user.save();

      // 撤销旧的刷新令牌
      await RefreshToken.updateMany(
        { userId: user._id, isRevoked: false },
        { 
          isRevoked: true,
          revokedAt: new Date(),
          revokedByIP: req.ip
        }
      );

      // 生成新的认证令牌
      const token = user.generateAuthToken();
      
      // 生成新的刷新令牌
      const refreshToken = this.generateRefreshToken();
      const refreshTokenDoc = new RefreshToken({
        userId: user._id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天
        createdByIP: req.ip
      });
      
      await refreshTokenDoc.save();

      // 设置 HTTP-only Cookie
      this.setTokenCookie(res, refreshToken);

      res.json({
        success: true,
        message: '登录成功',
        data: {
          user: user.toPublicJSON(),
          token
        }
      } as ApiResponse);

    } catch (error) {
      console.error('登录失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误，请稍后重试'
      } as ApiResponse);
    }
  }

  /**
   * 刷新令牌
   * POST /api/auth/refresh-token
   */
  public async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const token = req.cookies.refreshToken || req.body.refreshToken;
      
      if (!token) {
        res.status(401).json({
          success: false,
          message: '刷新令牌缺失'
        } as ApiResponse);
        return;
      }

      const refreshToken = await RefreshToken.findOne({ token }).populate('userId');
      
      if (!refreshToken || !refreshToken.isActive()) {
        res.status(401).json({
          success: false,
          message: '刷新令牌无效或已过期'
        } as ApiResponse);
        return;
      }

      const user = refreshToken.userId as any;

      // 检查用户状态
      if (!user.isActive) {
        res.status(403).json({
          success: false,
          message: '账号已被禁用'
        } as ApiResponse);
        return;
      }

      // 撤销当前刷新令牌
      refreshToken.isRevoked = true;
      refreshToken.revokedAt = new Date();
      refreshToken.revokedByIP = req.ip;

      // 生成新的令牌对
      const newAccessToken = user.generateAuthToken();
      const newRefreshToken = this.generateRefreshToken();
      
      // 更新刷新令牌记录
      refreshToken.replacedByToken = newRefreshToken;
      await refreshToken.save();

      // 创建新的刷新令牌记录
      const newRefreshTokenDoc = new RefreshToken({
        userId: user._id,
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdByIP: req.ip
      });
      
      await newRefreshTokenDoc.save();

      // 设置新的 Cookie
      this.setTokenCookie(res, newRefreshToken);

      res.json({
        success: true,
        message: '令牌刷新成功',
        data: {
          token: newAccessToken,
          user: user.toPublicJSON()
        }
      } as ApiResponse);

    } catch (error) {
      console.error('令牌刷新失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 用户注销
   * POST /api/auth/logout
   */
  public async logout(req: Request, res: Response): Promise<void> {
    try {
      const token = req.cookies.refreshToken;
      
      if (token) {
        // 撤销刷新令牌
        await RefreshToken.updateOne(
          { token },
          { 
            isRevoked: true,
            revokedAt: new Date(),
            revokedByIP: req.ip
          }
        );
      }

      // 清除 Cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      res.json({
        success: true,
        message: '注销成功'
      } as ApiResponse);

    } catch (error) {
      console.error('注销失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 发送邮箱验证码
   * POST /api/auth/send-email-verification
   */
  public async sendEmailVerification(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      const userId = (req as any).user?.id;

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: '用户不存在'
        } as ApiResponse);
        return;
      }

      if (user.isEmailVerified) {
        res.status(400).json({
          success: false,
          message: '邮箱已验证'
        } as ApiResponse);
        return;
      }

      // 生成验证码
      const verificationCode = generateRandomCode(6);
      
      // 删除旧的验证码
      await VerificationCode.deleteMany({
        identifier: email,
        type: 'email_verify'
      });

      // 创建新的验证码记录
      const emailVerification = new VerificationCode({
        identifier: email,
        code: verificationCode,
        type: 'email_verify',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10分钟
      });
      
      await emailVerification.save();

      // 发送验证邮件
      await sendEmail({
        to: email,
        subject: '大雄视频 - 邮箱验证',
        template: 'email-verification',
        data: {
          nickname: user.nickname,
          code: verificationCode,
          expireMinutes: 10
        }
      });

      res.json({
        success: true,
        message: '验证码已发送到邮箱'
      } as ApiResponse);

    } catch (error) {
      console.error('发送邮箱验证码失败:', error);
      res.status(500).json({
        success: false,
        message: '发送失败，请稍后重试'
      } as ApiResponse);
    }
  }

  /**
   * 验证邮箱
   * POST /api/auth/verify-email
   */
  public async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email, code } = req.body;
      const userId = (req as any).user?.id;

      const verification = await VerificationCode.findOne({
        identifier: email,
        type: 'email_verify',
        isUsed: false
      });

      if (!verification || !verification.isValid()) {
        res.status(400).json({
          success: false,
          message: '验证码无效或已过期'
        } as ApiResponse);
        return;
      }

      if (verification.code !== code) {
        verification.incrementAttempts();
        res.status(400).json({
          success: false,
          message: '验证码错误'
        } as ApiResponse);
        return;
      }

      // 更新用户邮箱验证状态
      await User.findByIdAndUpdate(userId, {
        isEmailVerified: true
      });

      // 标记验证码为已使用
      verification.isUsed = true;
      verification.usedAt = new Date();
      await verification.save();

      res.json({
        success: true,
        message: '邮箱验证成功'
      } as ApiResponse);

    } catch (error) {
      console.error('邮箱验证失败:', error);
      res.status(500).json({
        success: false,
        message: '验证失败，请稍后重试'
      } as ApiResponse);
    }
  }

  /**
   * 生成刷新令牌
   */
  private generateRefreshToken(): string {
    return crypto.randomBytes(40).toString('hex');
  }

  /**
   * 设置令牌 Cookie
   */
  private setTokenCookie(res: Response, token: string): void {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30天
    };

    res.cookie('refreshToken', token, cookieOptions);
  }
}

export default new AuthController();