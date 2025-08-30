/*
 * 大雄视频平台 - 文件上传服务
 * 处理用户头像、视频文件、缩略图等文件上传到云存储
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

// 云存储配置接口
interface StorageConfig {
  provider: 'aws' | 'aliyun' | 'tencent' | 'local';
  region: string;
  bucket: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
  cdnDomain?: string;
}

// 上传结果接口
export interface UploadResult {
  url: string;
  key: string;
  size: number;
  contentType?: string;
}

class FileUploadService {
  private config: StorageConfig;
  private s3Client?: S3Client;
  private localUploadDir: string;

  constructor() {
    this.config = {
      provider: (process.env.STORAGE_PROVIDER as any) || 'local',
      region: process.env.STORAGE_REGION || 'us-east-1',
      bucket: process.env.STORAGE_BUCKET || 'daxiong-video',
      accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
      secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
      endpoint: process.env.STORAGE_ENDPOINT,
      cdnDomain: process.env.CDN_DOMAIN
    };

    this.localUploadDir = path.resolve(process.env.LOCAL_UPLOAD_DIR || './uploads');
    
    this.initializeStorage();
  }

  /**
   * 初始化存储服务
   */
  private initializeStorage(): void {
    if (this.config.provider === 'local') {
      this.initializeLocalStorage();
    } else {
      this.initializeCloudStorage();
    }
  }

  /**
   * 初始化本地存储
   */
  private async initializeLocalStorage(): Promise<void> {
    try {
      await fs.mkdir(this.localUploadDir, { recursive: true });
      await fs.mkdir(path.join(this.localUploadDir, 'avatars'), { recursive: true });
      await fs.mkdir(path.join(this.localUploadDir, 'banners'), { recursive: true });
      await fs.mkdir(path.join(this.localUploadDir, 'videos'), { recursive: true });
      await fs.mkdir(path.join(this.localUploadDir, 'thumbnails'), { recursive: true });
      await fs.mkdir(path.join(this.localUploadDir, 'processed'), { recursive: true });
      
      console.log('本地存储初始化完成');
    } catch (error) {
      console.error('本地存储初始化失败:', error);
    }
  }

  /**
   * 初始化云存储
   */
  private initializeCloudStorage(): void {
    if (!this.config.accessKeyId || !this.config.secretAccessKey) {
      console.warn('云存储配置不完整，使用本地存储作为后备');
      this.config.provider = 'local';
      this.initializeLocalStorage();
      return;
    }

    this.s3Client = new S3Client({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey
      },
      ...(this.config.endpoint && { endpoint: this.config.endpoint })
    });

    console.log(`云存储初始化完成: ${this.config.provider}`);
  }

  /**
   * 上传用户头像
   */
  public async uploadAvatar(file: Express.Multer.File, userId: string): Promise<UploadResult> {
    try {
      // 处理图片 - 压缩和裁剪
      const processedBuffer = await sharp(file.buffer)
        .resize(300, 300, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({
          quality: 90,
          progressive: true
        })
        .toBuffer();

      const fileExtension = 'jpg';
      const fileName = `${userId}_${Date.now()}.${fileExtension}`;
      const key = `avatars/${fileName}`;

      if (this.config.provider === 'local') {
        return this.uploadToLocal(processedBuffer, key, 'image/jpeg');
      } else {
        return this.uploadToCloud(processedBuffer, key, 'image/jpeg');
      }

    } catch (error) {
      console.error('头像上传失败:', error);
      throw new Error('头像上传失败');
    }
  }

  /**
   * 上传用户横幅
   */
  public async uploadBanner(file: Express.Multer.File, userId: string): Promise<UploadResult> {
    try {
      // 处理横幅图片 - 16:9比例
      const processedBuffer = await sharp(file.buffer)
        .resize(1920, 1080, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({
          quality: 85,
          progressive: true
        })
        .toBuffer();

      const fileExtension = 'jpg';
      const fileName = `${userId}_${Date.now()}.${fileExtension}`;
      const key = `banners/${fileName}`;

      if (this.config.provider === 'local') {
        return this.uploadToLocal(processedBuffer, key, 'image/jpeg');
      } else {
        return this.uploadToCloud(processedBuffer, key, 'image/jpeg');
      }

    } catch (error) {
      console.error('横幅上传失败:', error);
      throw new Error('横幅上传失败');
    }
  }

  /**
   * 上传视频文件
   */
  public async uploadVideoFile(file: Express.Multer.File, userId: string): Promise<UploadResult> {
    try {
      const fileExtension = path.extname(file.originalname).slice(1) || 'mp4';
      const fileName = `${userId}_${Date.now()}_${this.generateRandomString(8)}.${fileExtension}`;
      const key = `videos/${fileName}`;

      if (this.config.provider === 'local') {
        return this.uploadToLocal(file.buffer, key, file.mimetype);
      } else {
        return this.uploadToCloud(file.buffer, key, file.mimetype);
      }

    } catch (error) {
      console.error('视频上传失败:', error);
      throw new Error('视频上传失败');
    }
  }

  /**
   * 上传处理后的视频文件
   */
  public async uploadProcessedVideo(filePath: string, videoId: string, quality: string): Promise<UploadResult> {
    try {
      const fileBuffer = await fs.readFile(filePath);
      const fileName = `${videoId}_${quality}_${Date.now()}.mp4`;
      const key = `processed/${fileName}`;

      if (this.config.provider === 'local') {
        return this.uploadToLocal(fileBuffer, key, 'video/mp4');
      } else {
        return this.uploadToCloud(fileBuffer, key, 'video/mp4');
      }

    } catch (error) {
      console.error('处理后视频上传失败:', error);
      throw new Error('处理后视频上传失败');
    }
  }

  /**
   * 上传缩略图
   */
  public async uploadThumbnail(filePath: string, videoId: string, index: number): Promise<UploadResult> {
    try {
      // 读取并优化缩略图
      const processedBuffer = await sharp(filePath)
        .resize(320, 180, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({
          quality: 85,
          progressive: true
        })
        .toBuffer();

      const fileName = `${videoId}_thumb_${index}_${Date.now()}.jpg`;
      const key = `thumbnails/${fileName}`;

      if (this.config.provider === 'local') {
        return this.uploadToLocal(processedBuffer, key, 'image/jpeg');
      } else {
        return this.uploadToCloud(processedBuffer, key, 'image/jpeg');
      }

    } catch (error) {
      console.error('缩略图上传失败:', error);
      throw new Error('缩略图上传失败');
    }
  }

  /**
   * 上传到本地存储
   */
  private async uploadToLocal(buffer: Buffer, key: string, contentType: string): Promise<UploadResult> {
    const filePath = path.join(this.localUploadDir, key);
    const dir = path.dirname(filePath);

    // 确保目录存在
    await fs.mkdir(dir, { recursive: true });

    // 写入文件
    await fs.writeFile(filePath, buffer);

    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    
    return {
      url: `${baseUrl}/uploads/${key}`,
      key,
      size: buffer.length,
      contentType
    };
  }

  /**
   * 上传到云存储
   */
  private async uploadToCloud(buffer: Buffer, key: string, contentType: string): Promise<UploadResult> {
    if (!this.s3Client) {
      throw new Error('云存储客户端未初始化');
    }

    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: this.getCacheControl(contentType),
      Metadata: {
        uploadedAt: new Date().toISOString()
      }
    });

    await this.s3Client.send(command);

    // 构建访问URL
    const baseUrl = this.config.cdnDomain || 
      (this.config.endpoint ? 
        `${this.config.endpoint}/${this.config.bucket}` : 
        `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com`);

    return {
      url: `${baseUrl}/${key}`,
      key,
      size: buffer.length,
      contentType
    };
  }

  /**
   * 删除文件
   */
  public async deleteVideoFile(fileUrl: string): Promise<void> {
    try {
      const key = this.extractKeyFromUrl(fileUrl);
      
      if (this.config.provider === 'local') {
        const filePath = path.join(this.localUploadDir, key);
        await fs.unlink(filePath).catch(() => {}); // 忽略文件不存在的错误
      } else if (this.s3Client) {
        const command = new DeleteObjectCommand({
          Bucket: this.config.bucket,
          Key: key
        });
        await this.s3Client.send(command);
      }

      console.log(`文件删除成功: ${key}`);
    } catch (error) {
      console.error('文件删除失败:', error);
    }
  }

  /**
   * 生成预签名URL（用于直接上传）
   */
  public async generatePresignedUrl(key: string, contentType: string, expiresIn: number = 3600): Promise<string> {
    if (this.config.provider === 'local') {
      throw new Error('本地存储不支持预签名URL');
    }

    if (!this.s3Client) {
      throw new Error('云存储客户端未初始化');
    }

    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      ContentType: contentType
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * 生成下载预签名URL
   */
  public async generateDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (this.config.provider === 'local') {
      const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
      return `${baseUrl}/uploads/${key}`;
    }

    if (!this.s3Client) {
      throw new Error('云存储客户端未初始化');
    }

    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: key
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * 批量删除文件
   */
  public async deleteMultipleFiles(urls: string[]): Promise<void> {
    const deletePromises = urls.map(url => this.deleteVideoFile(url));
    await Promise.allSettled(deletePromises);
  }

  // ==================== 辅助方法 ====================

  /**
   * 从URL提取key
   */
  private extractKeyFromUrl(url: string): string {
    if (this.config.provider === 'local') {
      // 本地存储URL格式: http://localhost:3000/uploads/videos/filename.mp4
      const uploadIndex = url.indexOf('/uploads/');
      return uploadIndex !== -1 ? url.substring(uploadIndex + 9) : '';
    } else {
      // 云存储URL格式: https://bucket.s3.region.amazonaws.com/key 或 https://cdn.example.com/key
      const urlParts = url.split('/');
      return urlParts.slice(-2).join('/'); // 取最后两个部分作为key
    }
  }

  /**
   * 获取缓存控制头
   */
  private getCacheControl(contentType: string): string {
    if (contentType.startsWith('image/')) {
      return 'public, max-age=31536000'; // 图片缓存1年
    } else if (contentType.startsWith('video/')) {
      return 'public, max-age=86400';   // 视频缓存1天
    } else {
      return 'public, max-age=3600';    // 其他文件缓存1小时
    }
  }

  /**
   * 生成随机字符串
   */
  private generateRandomString(length: number): string {
    return crypto.randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
  }

  /**
   * 验证文件类型
   */
  public validateFileType(file: Express.Multer.File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.mimetype);
  }

  /**
   * 格式化文件大小
   */
  public formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let unitIndex = 0;
    let size = bytes;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * 获取存储统计信息
   */
  public async getStorageStats(): Promise<any> {
    if (this.config.provider === 'local') {
      try {
        const stats = await fs.stat(this.localUploadDir);
        return {
          provider: 'local',
          totalSpace: 'N/A',
          usedSpace: 'N/A',
          availableSpace: 'N/A',
          lastModified: stats.mtime
        };
      } catch (error) {
        return { provider: 'local', error: 'Failed to get stats' };
      }
    } else {
      return {
        provider: this.config.provider,
        bucket: this.config.bucket,
        region: this.config.region,
        endpoint: this.config.endpoint
      };
    }
  }
}

// 导出单例实例和便捷函数
export const fileUploadService = new FileUploadService();

export const uploadAvatar = (file: Express.Multer.File, userId: string) => 
  fileUploadService.uploadAvatar(file, userId);

export const uploadBanner = (file: Express.Multer.File, userId: string) => 
  fileUploadService.uploadBanner(file, userId);

export const uploadVideoFile = (file: Express.Multer.File, userId: string) => 
  fileUploadService.uploadVideoFile(file, userId);

export const uploadProcessedVideo = (filePath: string, videoId: string, quality: string) => 
  fileUploadService.uploadProcessedVideo(filePath, videoId, quality);

export const uploadThumbnail = (filePath: string, videoId: string, index: number) => 
  fileUploadService.uploadThumbnail(filePath, videoId, index);

export const deleteVideoFile = (fileUrl: string) => 
  fileUploadService.deleteVideoFile(fileUrl);

export const generatePresignedUrl = (key: string, contentType: string, expiresIn?: number) => 
  fileUploadService.generatePresignedUrl(key, contentType, expiresIn);

export default fileUploadService;