# 技术架构设计文档

**项目名称：** 大雄视频平台  
**版本：** v1.0  
**更新时间：** 2025-08-25  
**架构师：** DAXIONG 产品团队

---

## 1. 整体架构设计

### 1.1 架构图
```
┌─────────────────────────────────────────────────────────┐
│                    用户访问层                              │
│  Web浏览器  │  移动端APP  │  桌面应用(Electron)             │
└─────────────┬───────────────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────────────┐
│                  CDN + 负载均衡                           │
│           Nginx/Apache + CloudFlare                    │
└─────────────┬───────────────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────────────┐
│                    前端应用层                             │
│     React 18 + TypeScript + Ant Design                │
│              SPA单页应用                                │
└─────────────┬───────────────────────────────────────────┘
              │ RESTful API / GraphQL
┌─────────────▼───────────────────────────────────────────┐
│                    后端服务层                             │
│    Node.js + Express + TypeScript                     │
│  ┌─────────┬─────────┬─────────┬─────────┬──────────┐    │
│  │用户服务  │视频服务  │推荐服务  │直播服务  │支付服务   │    │
│  └─────────┴─────────┴─────────┴─────────┴──────────┘    │
└─────────────┬───────────────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────────────┐
│                    数据存储层                             │
│  MySQL 8.0  │  Redis 6.0  │  MongoDB  │  MinIO/OSS     │
│  (核心数据)  │   (缓存)     │ (文档存储) │  (文件存储)     │
└─────────────┬───────────────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────────────┐
│                  基础设施层                               │
│  FFmpeg视频处理 │ WebRTC直播 │ 消息队列 │ 监控日志      │
└─────────────────────────────────────────────────────────┘
```

---

## 2. 技术选型详解

### 2.1 前端技术栈

#### 核心框架
```json
{
  "framework": "React 18.2.0",
  "language": "TypeScript 4.9.0",
  "ui_library": "Ant Design 5.0",
  "state_management": "Redux Toolkit",
  "routing": "React Router 6.0",
  "build_tool": "Vite 4.0",
  "package_manager": "npm"
}
```

#### 视频播放器
```json
{
  "player": "Video.js / DPlayer",
  "features": [
    "多清晰度切换",
    "弹幕系统", 
    "全屏/画中画",
    "倍速播放",
    "键盘快捷键"
  ]
}
```

#### 开发工具
- **IDE**: VS Code + React插件包
- **调试**: React Developer Tools
- **测试**: Jest + React Testing Library
- **代码规范**: ESLint + Prettier

### 2.2 后端技术栈

#### 核心框架
```json
{
  "runtime": "Node.js 18.0",
  "framework": "Express 4.18",
  "language": "TypeScript 4.9",
  "api_style": "RESTful API",
  "auth": "JWT + Passport.js",
  "validation": "Joi",
  "file_upload": "Multer"
}
```

#### 微服务架构
```
用户服务 (User Service)
├── 用户注册/登录
├── 个人资料管理
├── 权限验证
└── 会员体系

视频服务 (Video Service)  
├── 视频上传
├── 转码处理
├── 元数据管理
└── 播放统计

推荐服务 (Recommend Service)
├── 协同过滤算法
├── 内容标签分析  
├── 用户画像构建
└── 实时推荐

直播服务 (Live Service)
├── 推流管理
├── 流媒体处理
├── 聊天室功能
└── 礼物打赏

支付服务 (Payment Service)
├── 会员订阅
├── 单次付费
├── 退款处理
└── 财务统计
```

### 2.3 数据库设计

#### MySQL 8.0 - 主数据库
```sql
-- 核心表结构
Users (用户表)
Videos (视频表)  
Categories (分类表)
User_Videos (用户视频关系)
Follows (关注关系)
Orders (订单表)
```

#### Redis 6.0 - 缓存层
```
缓存策略:
├── 热点视频缓存 (TTL: 1小时)
├── 用户会话缓存 (TTL: 7天)
├── 推荐结果缓存 (TTL: 30分钟)
└── API响应缓存 (TTL: 5分钟)
```

#### MongoDB 5.0 - 文档存储
```javascript
// 评论集合
comments: {
  _id: ObjectId,
  video_id: String,
  user_id: String,
  content: String, 
  replies: Array,
  created_at: Date
}

// 弹幕集合
danmaku: {
  _id: ObjectId,
  video_id: String,
  user_id: String,
  text: String,
  time: Number, // 视频播放时间点
  color: String,
  position: String
}
```

---

## 3. 系统架构设计

### 3.1 目录结构
```
daxiong-video-platform/
├── frontend/                   # 前端项目
│   ├── public/
│   ├── src/
│   │   ├── components/         # 通用组件
│   │   ├── pages/             # 页面组件
│   │   ├── hooks/             # 自定义Hook
│   │   ├── services/          # API服务
│   │   ├── store/             # Redux状态管理
│   │   ├── utils/             # 工具函数
│   │   └── types/             # TypeScript类型定义
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                    # 后端项目
│   ├── src/
│   │   ├── controllers/       # 控制器
│   │   ├── services/          # 业务逻辑
│   │   ├── models/            # 数据模型
│   │   ├── routes/            # 路由定义
│   │   ├── middleware/        # 中间件
│   │   ├── config/            # 配置文件
│   │   ├── utils/             # 工具函数
│   │   └── types/             # TypeScript类型
│   ├── package.json
│   └── tsconfig.json
│
├── database/                   # 数据库相关
│   ├── mysql/
│   │   ├── migrations/        # 数据迁移脚本
│   │   └── seeds/             # 种子数据
│   ├── redis/
│   │   └── config/            # Redis配置
│   └── mongodb/
│       └── collections/       # MongoDB集合设计
│
├── video-processing/           # 视频处理服务
│   ├── ffmpeg-scripts/        # FFmpeg脚本
│   ├── thumbnail-generator/   # 缩略图生成
│   └── transcoding/           # 转码服务
│
├── docs/                      # 项目文档
│   ├── api/                   # API文档
│   ├── deployment/            # 部署文档
│   └── development/           # 开发指南
│
├── docker/                    # Docker配置
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   └── docker-compose.yml
│
├── scripts/                   # 构建脚本
│   ├── build.bat             # Windows构建脚本
│   ├── deploy.bat            # Windows部署脚本
│   └── dev-setup.bat         # 开发环境安装
│
└── README.md
```

### 3.2 开发环境配置 (Windows)

#### 环境依赖安装脚本
```batch
@echo off
echo Installing DAXIONG Video Platform Development Environment...

# Node.js 环境检查
node --version || (
    echo Please install Node.js 18+ from https://nodejs.org/
    exit /b 1
)

# MySQL 安装检查  
mysql --version || (
    echo Please install MySQL 8.0 from https://dev.mysql.com/downloads/mysql/
    exit /b 1
)

# Redis 安装（Windows版本）
redis-server --version || (
    echo Installing Redis for Windows...
    # 可以使用 WSL 或者 Memurai 作为 Redis 替代
)

# FFmpeg 安装检查
ffmpeg -version || (
    echo Please install FFmpeg from https://ffmpeg.org/download.html
    echo Add FFmpeg to system PATH
    exit /b 1
)

echo Environment setup completed!
```

---

## 4. 核心功能实现方案

### 4.1 视频上传与处理

#### 上传流程
```typescript
// 前端上传组件
interface VideoUploadProps {
  onSuccess: (videoInfo: VideoInfo) => void;
  onProgress: (progress: number) => void;
}

const VideoUpload: React.FC<VideoUploadProps> = ({ onSuccess, onProgress }) => {
  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('video', file);
    
    const response = await axios.post('/api/videos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(progress);
      }
    });
    
    onSuccess(response.data);
  };
  
  return (
    <Upload.Dragger
      accept="video/*"
      customRequest={({ file }) => handleUpload(file as File)}
    >
      拖拽视频文件到这里上传
    </Upload.Dragger>
  );
};
```

#### 后端处理逻辑
```typescript
// 视频上传控制器
export class VideoController {
  async uploadVideo(req: Request, res: Response) {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: '没有上传文件' });
      }
      
      // 1. 文件基础验证
      const allowedTypes = ['video/mp4', 'video/avi', 'video/mov'];
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ error: '不支持的视频格式' });
      }
      
      // 2. 生成唯一文件名
      const videoId = generateUUID();
      const originalPath = file.path;
      
      // 3. 创建视频记录
      const video = await Video.create({
        id: videoId,
        title: file.originalname,
        original_path: originalPath,
        status: 'processing',
        user_id: req.user.id
      });
      
      // 4. 异步处理视频转码
      videoProcessingQueue.add('transcode', {
        videoId,
        inputPath: originalPath
      });
      
      res.json({ 
        message: '上传成功，正在处理中...', 
        video_id: videoId 
      });
      
    } catch (error) {
      res.status(500).json({ error: '上传失败' });
    }
  }
}
```

#### FFmpeg 转码脚本
```typescript
// 视频转码服务
export class VideoTranscodingService {
  async transcodeVideo(videoId: string, inputPath: string) {
    const outputDir = `./storage/videos/${videoId}/`;
    await fs.ensureDir(outputDir);
    
    // 生成多个清晰度版本
    const qualities = [
      { name: '480p', resolution: '854x480', bitrate: '1000k' },
      { name: '720p', resolution: '1280x720', bitrate: '2500k' },  
      { name: '1080p', resolution: '1920x1080', bitrate: '5000k' }
    ];
    
    const promises = qualities.map(quality => {
      return this.transcodeToQuality(inputPath, outputDir, quality);
    });
    
    // 并行转码
    await Promise.all(promises);
    
    // 生成视频缩略图
    await this.generateThumbnail(inputPath, `${outputDir}thumbnail.jpg`);
    
    // 更新数据库状态
    await Video.update({ 
      status: 'completed',
      qualities: qualities.map(q => q.name)
    }, { 
      where: { id: videoId } 
    });
  }
  
  private async transcodeToQuality(input: string, outputDir: string, quality: any) {
    const outputPath = `${outputDir}${quality.name}.mp4`;
    
    return new Promise((resolve, reject) => {
      ffmpeg(input)
        .output(outputPath)
        .videoCodec('libx264')
        .audioCodec('aac') 
        .size(quality.resolution)
        .videoBitrate(quality.bitrate)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  }
}
```

### 4.2 推荐算法实现

```typescript
// 推荐系统服务
export class RecommendationService {
  // 协同过滤推荐
  async getCollaborativeFiltering(userId: string): Promise<Video[]> {
    // 1. 获取用户观看历史
    const userHistory = await WatchHistory.findAll({
      where: { user_id: userId },
      include: [Video]
    });
    
    // 2. 找到相似用户
    const similarUsers = await this.findSimilarUsers(userId);
    
    // 3. 推荐相似用户喜欢的视频
    const recommendations = await this.getRecommendationsByUsers(similarUsers);
    
    return recommendations;
  }
  
  // 基于内容的推荐  
  async getContentBasedRecommendation(userId: string): Promise<Video[]> {
    // 1. 分析用户偏好标签
    const userPreferences = await this.getUserPreferences(userId);
    
    // 2. 找到匹配的视频
    const matchingVideos = await Video.findAll({
      where: {
        tags: {
          [Op.overlap]: userPreferences.tags
        }
      },
      order: [['view_count', 'DESC']],
      limit: 20
    });
    
    return matchingVideos;
  }
}
```

---

## 5. 性能优化方案

### 5.1 前端优化
- **代码分割**: React.lazy() + Suspense
- **图片懒加载**: Intersection Observer API
- **虚拟滚动**: 长列表性能优化
- **缓存策略**: Service Worker + HTTP缓存

### 5.2 后端优化  
- **数据库索引**: 查询关键字段建索引
- **连接池**: MySQL/Redis 连接池管理
- **API限流**: Express-rate-limit
- **CDN加速**: 静态资源分发

### 5.3 视频优化
- **自适应码率**: HLS/DASH 协议
- **预加载策略**: 智能预加载下一个视频片段
- **缓存策略**: 热门视频边缘缓存

---

## 6. 安全方案

### 6.1 认证授权
```typescript
// JWT 认证中间件
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.sendStatus(401);
  }
  
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};
```

### 6.2 数据验证
```typescript
// 请求数据验证
export const validateVideoUpload = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    title: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(1000),
    tags: Joi.array().items(Joi.string()).max(10),
    category_id: Joi.number().integer().required()
  });
  
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  
  next();
};
```

### 6.3 内容安全
- **文件类型检测**: Magic number 验证
- **病毒扫描**: ClamAV 集成
- **内容审核**: 敏感词过滤 + 人工审核
- **CSRF 保护**: CSRF Token 验证

---

**下一步操作建议：**
输入 **/设计** 启动UI/UX设计师Agent，开始界面原型设计
或输入 **/前端** 直接开始前端开发环境搭建

---
*文档由 DAXIONG 架构团队生成 | 版本 v1.0 | 2025-08-25*