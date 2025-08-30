/*
 * 大雄视频平台 - 用户管理控制器
 * 处理用户资料管理、关注系统、偏好设置等功能
 */

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import User, { IUser } from '../models/User';
import { ApiResponse, ListResponse } from '../types/ApiResponse';
import { calculatePagination, formatFileSize } from '../utils/helpers';
import { uploadAvatar, uploadBanner } from '../services/FileUploadService';

export class UserController {

  /**
   * 获取用户资料
   * GET /api/users/:id
   */
  public async getUserProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const currentUserId = req.user?.id;

      // 验证用户ID格式
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: '无效的用户ID'
        } as ApiResponse);
        return;
      }

      const user = await User.findById(id);
      
      if (!user) {
        res.status(404).json({
          success: false,
          message: '用户不存在'
        } as ApiResponse);
        return;
      }

      // 检查隐私设置
      if (user.profileVisibility === 'private' && currentUserId !== id) {
        res.status(403).json({
          success: false,
          message: '该用户的资料不公开'
        } as ApiResponse);
        return;
      }

      if (user.profileVisibility === 'followers' && currentUserId !== id) {
        // TODO: 检查当前用户是否关注了该用户
        // 这里需要实现关注关系的查询
      }

      const userProfile = user.toPublicJSON();
      
      // 如果是自己查看，返回更多信息
      if (currentUserId === id) {
        const userWithPrivateInfo = user.toObject();
        delete userWithPrivateInfo.password;
        
        res.json({
          success: true,
          data: {
            user: userWithPrivateInfo,
            isOwnProfile: true
          }
        } as ApiResponse);
      } else {
        res.json({
          success: true,
          data: {
            user: userProfile,
            isOwnProfile: false
          }
        } as ApiResponse);
      }

    } catch (error) {
      console.error('获取用户资料失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 更新用户资料
   * PUT /api/users/profile
   */
  public async updateProfile(req: Request, res: Response): Promise<void> {
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

      const userId = req.user!.id;
      const {
        nickname,
        description,
        location,
        website,
        birthday,
        gender,
        profileVisibility,
        allowMessages,
        allowComments
      } = req.body;

      // 检查昵称是否被其他用户使用
      if (nickname) {
        const existingUser = await User.findOne({
          nickname,
          _id: { $ne: userId }
        });
        
        if (existingUser) {
          res.status(409).json({
            success: false,
            message: '该昵称已被使用'
          } as ApiResponse);
          return;
        }
      }

      // 构建更新对象
      const updateData: any = {};
      
      if (nickname !== undefined) updateData.nickname = nickname;
      if (description !== undefined) updateData.description = description;
      if (location !== undefined) updateData.location = location;
      if (website !== undefined) updateData.website = website;
      if (birthday !== undefined) updateData.birthday = birthday;
      if (gender !== undefined) updateData.gender = gender;
      if (profileVisibility !== undefined) updateData.profileVisibility = profileVisibility;
      if (allowMessages !== undefined) updateData.allowMessages = allowMessages;
      if (allowComments !== undefined) updateData.allowComments = allowComments;

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        res.status(404).json({
          success: false,
          message: '用户不存在'
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        message: '资料更新成功',
        data: {
          user: updatedUser.toPublicJSON()
        }
      } as ApiResponse);

    } catch (error) {
      console.error('更新用户资料失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 上传头像
   * POST /api/users/avatar
   */
  public async uploadAvatar(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: '请选择头像文件'
        } as ApiResponse);
        return;
      }

      // 验证文件类型和大小
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        res.status(400).json({
          success: false,
          message: '仅支持 JPEG、PNG、WebP 格式的图片'
        } as ApiResponse);
        return;
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (req.file.size > maxSize) {
        res.status(400).json({
          success: false,
          message: `文件大小不能超过 ${formatFileSize(maxSize)}`
        } as ApiResponse);
        return;
      }

      // 上传头像到云存储
      const avatarUrl = await uploadAvatar(req.file, userId);

      // 更新用户头像
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { avatar: avatarUrl },
        { new: true }
      );

      res.json({
        success: true,
        message: '头像上传成功',
        data: {
          avatar: avatarUrl,
          user: updatedUser?.toPublicJSON()
        }
      } as ApiResponse);

    } catch (error) {
      console.error('上传头像失败:', error);
      res.status(500).json({
        success: false,
        message: '上传失败，请稍后重试'
      } as ApiResponse);
    }
  }

  /**
   * 上传横幅
   * POST /api/users/banner
   */
  public async uploadBanner(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: '请选择横幅文件'
        } as ApiResponse);
        return;
      }

      // 验证文件类型和大小
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        res.status(400).json({
          success: false,
          message: '仅支持 JPEG、PNG、WebP 格式的图片'
        } as ApiResponse);
        return;
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (req.file.size > maxSize) {
        res.status(400).json({
          success: false,
          message: `文件大小不能超过 ${formatFileSize(maxSize)}`
        } as ApiResponse);
        return;
      }

      // 上传横幅到云存储
      const bannerUrl = await uploadBanner(req.file, userId);

      // 更新用户横幅
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { banner: bannerUrl },
        { new: true }
      );

      res.json({
        success: true,
        message: '横幅上传成功',
        data: {
          banner: bannerUrl,
          user: updatedUser?.toPublicJSON()
        }
      } as ApiResponse);

    } catch (error) {
      console.error('上传横幅失败:', error);
      res.status(500).json({
        success: false,
        message: '上传失败，请稍后重试'
      } as ApiResponse);
    }
  }

  /**
   * 修改密码
   * PUT /api/users/password
   */
  public async changePassword(req: Request, res: Response): Promise<void> {
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

      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;

      // 获取用户（包含密码字段）
      const user = await User.findById(userId).select('+password');
      
      if (!user) {
        res.status(404).json({
          success: false,
          message: '用户不存在'
        } as ApiResponse);
        return;
      }

      // 验证当前密码
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        res.status(400).json({
          success: false,
          message: '当前密码错误'
        } as ApiResponse);
        return;
      }

      // 检查新密码是否与当前密码相同
      const isSamePassword = await user.comparePassword(newPassword);
      if (isSamePassword) {
        res.status(400).json({
          success: false,
          message: '新密码不能与当前密码相同'
        } as ApiResponse);
        return;
      }

      // 更新密码
      user.password = newPassword;
      await user.save();

      // TODO: 撤销所有现有的刷新令牌，强制重新登录
      // await RefreshToken.updateMany(
      //   { userId },
      //   { isRevoked: true, revokedAt: new Date() }
      // );

      res.json({
        success: true,
        message: '密码修改成功，请重新登录'
      } as ApiResponse);

    } catch (error) {
      console.error('修改密码失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 获取用户列表
   * GET /api/users
   */
  public async getUserList(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const sort = req.query.sort as string || 'createdAt';
      const order = req.query.order as string === 'asc' ? 1 : -1;

      // 构建查询条件
      const query: any = { isActive: true };
      
      if (search) {
        query.$or = [
          { username: { $regex: search, $options: 'i' } },
          { nickname: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      // 计算分页
      const pagination = calculatePagination(page, limit, 0);
      
      // 获取总数
      const total = await User.countDocuments(query);
      
      // 获取用户列表
      const users = await User.find(query)
        .sort({ [sort]: order })
        .skip(pagination.offset)
        .limit(limit)
        .select('-password');

      // 重新计算分页信息
      const finalPagination = calculatePagination(page, limit, total);

      res.json({
        success: true,
        data: {
          users,
          pagination: finalPagination
        }
      } as ApiResponse<ListResponse<IUser>>);

    } catch (error) {
      console.error('获取用户列表失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 删除用户账号
   * DELETE /api/users/account
   */
  public async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { password, confirmText } = req.body;

      // 验证确认文本
      if (confirmText !== '删除我的账号') {
        res.status(400).json({
          success: false,
          message: '请输入正确的确认文本'
        } as ApiResponse);
        return;
      }

      // 获取用户并验证密码
      const user = await User.findById(userId).select('+password');
      
      if (!user) {
        res.status(404).json({
          success: false,
          message: '用户不存在'
        } as ApiResponse);
        return;
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        res.status(400).json({
          success: false,
          message: '密码错误'
        } as ApiResponse);
        return;
      }

      // 软删除：标记为非活跃状态
      await User.findByIdAndUpdate(userId, {
        isActive: false,
        username: `deleted_${userId}`,
        email: `deleted_${userId}@deleted.com`,
        nickname: '已删除用户'
      });

      // TODO: 清理相关数据
      // - 撤销所有刷新令牌
      // - 删除用户的视频
      // - 清理关注关系
      // - 删除评论和弹幕

      res.json({
        success: true,
        message: '账号删除成功'
      } as ApiResponse);

    } catch (error) {
      console.error('删除账号失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }

  /**
   * 获取用户统计信息
   * GET /api/users/:id/stats
   */
  public async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: '无效的用户ID'
        } as ApiResponse);
        return;
      }

      const user = await User.findById(id);
      
      if (!user) {
        res.status(404).json({
          success: false,
          message: '用户不存在'
        } as ApiResponse);
        return;
      }

      // TODO: 从其他集合获取详细统计信息
      const stats = {
        followers: user.followers,
        following: user.following,
        totalLikes: user.totalLikes,
        totalViews: user.totalViews,
        videoCount: user.videoCount,
        joinDate: user.createdAt,
        userLevel: user.userLevel,
        levelName: (user as any).levelName,
        isVip: user.isVip,
        verified: user.verified
      };

      res.json({
        success: true,
        data: { stats }
      } as ApiResponse);

    } catch (error) {
      console.error('获取用户统计失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      } as ApiResponse);
    }
  }
}

export default new UserController();