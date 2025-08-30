# 📖 大雄视频平台完整操作指南

## 📋 目录
- [系统概述](#系统概述)
- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [详细安装](#详细安装)
- [配置说明](#配置说明)
- [API接口文档](#api接口文档)
- [功能模块使用](#功能模块使用)
- [管理员指南](#管理员指南)
- [开发指南](#开发指南)
- [部署指南](#部署指南)
- [监控运维](#监控运维)
- [故障排除](#故障排除)
- [FAQ常见问题](#faq常见问题)

---

## 🎯 系统概述

大雄视频平台是一个完整的企业级视频分享网站后端系统，采用现代化技术栈构建。

### ✨ 核心功能模块
| 模块 | 功能描述 | 技术特色 |
|------|---------|---------|
| 🔐 **用户认证系统** | JWT认证、邮箱验证、密码安全 | bcrypt加密、刷新令牌 |
| 📹 **视频管理** | 上传、转码、播放、存储管理 | FFmpeg处理、多分辨率 |
| 💬 **评论互动** | 层级评论、点赞、举报功能 | 实时更新、内容审核 |
| 🎯 **智能推荐** | 个性化内容推荐算法 | 协同过滤、用户画像 |
| 🎥 **直播功能** | 实时推流、聊天、礼物系统 | WebSocket、RTMP |
| 🛡️ **内容审核** | AI审核、敏感词过滤 | 多层审核、人工复查 |
| 📊 **数据分析** | 统计报表、用户行为分析 | 实时统计、定时报告 |

### 🏗 技术架构
```
Frontend (Web/Mobile) 
    ↓ HTTPS/WebSocket
API Gateway (Nginx)
    ↓
Node.js + Express + TypeScript
    ↓
MongoDB (主数据) + Redis (缓存)
    ↓
AWS S3 (文件存储) + CDN (内容分发)
    ↓
FFmpeg (视频处理) + Bull (任务队列)
```

---

## 🛠 环境要求

### 最低要求
| 组件 | 版本要求 | 用途 |
|------|---------|------|
| Node.js | >= 16.0.0 | 运行环境 |
| MongoDB | >= 5.0 | 主数据库 |
| Redis | >= 6.0 | 缓存/会话 |
| FFmpeg | >= 4.0 | 视频处理 |

### 推荐配置
| 环境 | CPU | 内存 | 存储 | 带宽 |
|------|-----|------|------|------|
| 开发环境 | 2核 | 4GB | 50GB | 10Mbps |
| 测试环境 | 4核 | 8GB | 100GB | 50Mbps |
| 生产环境 | 8核+ | 16GB+ | 500GB+ | 100Mbps+ |

### 可选服务
```bash
AWS S3 / 阿里云OSS     # 文件存储
SMTP服务器            # 邮件通知
Nginx               # 反向代理
Docker              # 容器化部署
PM2                 # 进程管理
```

---

## 🚀 快速开始

### 一键启动脚本
```bash
#!/bin/bash
# 克隆项目
git clone https://github.com/your-org/daxiong-video-platform.git
cd daxiong-video-platform/backend

# 安装依赖
npm install

# 启动服务
docker-compose up -d mongodb redis
npm run dev
```

### Docker快速部署
```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
      - "8080:8080"
    environment:
      - NODE_ENV=production
    depends_on:
      - mongodb
      - redis
  
  mongodb:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
  
  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"

volumes:
  mongodb_data:
```

---

## 📦 详细安装

### 1. 系统准备
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y curl git build-essential

# CentOS/RHEL
sudo yum update
sudo yum install -y curl git gcc-c++ make

# macOS
brew install git node mongodb redis ffmpeg
```

### 2. Node.js安装
```bash
# 使用nvm安装Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

### 3. MongoDB安装
```bash
# Ubuntu
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# 启动MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 4. Redis安装
```bash
# Ubuntu
sudo apt install -y redis-server

# 配置Redis
sudo nano /etc/redis/redis.conf
# 修改: bind 127.0.0.1 ::1
# 修改: maxmemory 1gb
# 修改: maxmemory-policy allkeys-lru

# 启动Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### 5. FFmpeg安装
```bash
# Ubuntu
sudo apt install -y ffmpeg

# CentOS (需要EPEL)
sudo yum install -y epel-release
sudo yum install -y ffmpeg

# 验证安装
ffmpeg -version
```

### 6. 项目安装
```bash
# 克隆项目
git clone <your-repository-url>
cd shipinwangzhan/backend

# 安装依赖
npm install

# 安装全局工具
npm install -g pm2 nodemon typescript
```

---

## ⚙️ 配置说明

### 环境变量配置
创建 `.env` 文件：
```bash
# ===========================================
# 服务器配置
# ===========================================
PORT=3000
NODE_ENV=development
WEBSOCKET_PORT=8080

# ===========================================
# 数据库配置
# ===========================================
# MongoDB连接字符串
MONGODB_URI=mongodb://localhost:27017/daxiong_video
# MongoDB选项
MONGODB_OPTIONS=retryWrites=true&w=majority

# Redis连接
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=0

# ===========================================
# JWT认证配置
# ===========================================
JWT_SECRET=your-super-secret-jwt-key-at-least-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-different-from-access
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ===========================================
# 文件存储配置 (AWS S3)
# ===========================================
# S3基本配置
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=daxiong-video-bucket

# S3高级配置
AWS_S3_ACL=public-read
AWS_S3_CACHE_CONTROL=max-age=31536000
AWS_CLOUDFRONT_DOMAIN=d1234567890.cloudfront.net

# ===========================================
# 邮件服务配置
# ===========================================
# SMTP基本设置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM=noreply@daxiong.com

# 邮件模板设置
EMAIL_VERIFICATION_TEMPLATE=email-verification
EMAIL_PASSWORD_RESET_TEMPLATE=password-reset
EMAIL_WELCOME_TEMPLATE=welcome

# ===========================================
# AI审核配置
# ===========================================
# 启用AI审核
AI_MODERATION_ENABLED=true
AI_MODERATION_API_URL=https://api.openai.com/v1/moderations
AI_MODERATION_API_KEY=sk-your-openai-api-key

# 图像审核
AI_VISION_API_URL=https://api.example.com/vision/moderate
AI_VISION_API_KEY=your-vision-api-key

# ===========================================
# 推流服务配置
# ===========================================
RTMP_SERVER_IP=127.0.0.1
RTMP_SERVER_PORT=1935
RTMP_ALLOW_ORIGIN=*

# HLS配置
HLS_SEGMENT_DURATION=6
HLS_PLAYLIST_LENGTH=10

# ===========================================
# 第三方服务配置
# ===========================================
# 客户端URL
CLIENT_URL=http://localhost:3001
ADMIN_URL=http://localhost:3002

# CDN配置
CDN_BASE_URL=https://cdn.daxiong.com
CDN_VIDEO_PATH=/videos
CDN_IMAGE_PATH=/images

# ===========================================
# 安全配置
# ===========================================
# CORS设置
CORS_ORIGIN=http://localhost:3001,http://localhost:3002
CORS_CREDENTIALS=true

# 限流配置
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# 文件上传限制
MAX_FILE_SIZE=1073741824
MAX_VIDEO_DURATION=7200
ALLOWED_VIDEO_FORMATS=mp4,avi,mov,mkv,wmv
ALLOWED_IMAGE_FORMATS=jpg,jpeg,png,webp

# ===========================================
# 日志配置
# ===========================================
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5

# ===========================================
# 监控配置
# ===========================================
# 健康检查
HEALTH_CHECK_INTERVAL=30000
HEALTH_CHECK_TIMEOUT=5000

# 统计配置
ANALYTICS_CACHE_TTL=300
ANALYTICS_BATCH_SIZE=100

# ===========================================
# 开发配置
# ===========================================
# 开发模式设置
DEBUG=daxiong:*
MOCK_EXTERNAL_APIS=false
SKIP_EMAIL_VERIFICATION=false
```

### 数据库配置优化
```javascript
// config/database.js
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10, // 连接池大小
  serverSelectionTimeoutMS: 5000, // 服务器选择超时
  socketTimeoutMS: 45000, // Socket超时
  bufferMaxEntries: 0, // 禁用缓冲
  bufferCommands: false, // 禁用命令缓冲
};
```

### Redis配置优化
```bash
# /etc/redis/redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
tcp-keepalive 300
timeout 0
tcp-backlog 511
databases 16
save 900 1
save 300 10
save 60 10000
```

---

## 📚 API接口文档

### 认证相关接口

#### 🔐 用户注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "testuser",        // 用户名 (3-20字符)
  "email": "test@example.com",   // 邮箱地址
  "password": "SecurePass123!",  // 密码 (8-100字符，包含大小写字母数字特殊字符)
  "nickname": "测试用户",         // 昵称 (可选)
  "avatar": "https://..."        // 头像URL (可选)
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "注册成功，请查收验证邮件",
  "data": {
    "user": {
      "id": "64f123abc456def789012345",
      "username": "testuser",
      "email": "test@example.com",
      "nickname": "测试用户",
      "isEmailVerified": false,
      "createdAt": "2024-08-27T10:30:00.000Z"
    }
  }
}
```

#### 🔑 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",     // 邮箱或用户名
  "password": "SecurePass123!",    // 密码
  "rememberMe": true              // 是否记住登录 (可选)
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "64f123abc456def789012345",
      "username": "testuser",
      "email": "test@example.com",
      "nickname": "测试用户",
      "avatar": "https://...",
      "role": "user",
      "level": 1,
      "verified": false
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 900
    }
  }
}
```

#### 🔄 刷新令牌
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### 🚪 用户登出
```http
POST /api/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."  // 可选
}
```

### 视频相关接口

#### 📹 上传视频
```http
POST /api/videos/upload
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: multipart/form-data

Form Data:
- video: (file) 视频文件
- title: 我的精彩视频
- description: 这是一个很棒的视频
- category: entertainment
- tags: ["娱乐", "搞笑", "日常"]
- thumbnail: (file) 缩略图文件 (可选)
- isPrivate: false
```

**响应示例：**
```json
{
  "success": true,
  "message": "视频上传成功，正在处理中",
  "data": {
    "video": {
      "id": "64f456def789012345678901",
      "title": "我的精彩视频",
      "description": "这是一个很棒的视频",
      "status": "processing",
      "uploadProgress": 100,
      "processingProgress": 0,
      "thumbnail": "https://cdn.example.com/thumbnails/video_123.jpg",
      "createdAt": "2024-08-27T11:00:00.000Z"
    }
  }
}
```

#### 📖 获取视频列表
```http
GET /api/videos?page=1&limit=20&category=entertainment&sortBy=latest&quality=720p
```

**查询参数：**
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | number | 1 | 页码 |
| limit | number | 20 | 每页数量 (1-50) |
| category | string | - | 视频分类 |
| sortBy | string | latest | 排序方式 (latest/popular/trending) |
| quality | string | - | 视频质量过滤 |
| search | string | - | 搜索关键词 |

**响应示例：**
```json
{
  "success": true,
  "data": {
    "videos": [
      {
        "id": "64f456def789012345678901",
        "title": "精彩视频标题",
        "description": "视频描述",
        "thumbnail": "https://cdn.example.com/thumbnails/video_1.jpg",
        "duration": 300,
        "category": "entertainment",
        "tags": ["娱乐", "搞笑"],
        "stats": {
          "views": 1234,
          "likes": 89,
          "comments": 45
        },
        "uploader": {
          "id": "64f123abc456def789012345",
          "username": "creator123",
          "nickname": "创作者",
          "avatar": "https://...",
          "verified": true
        },
        "createdAt": "2024-08-27T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 50,
      "totalItems": 1000,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### 🎥 获取视频详情
```http
GET /api/videos/64f456def789012345678901
Authorization: Bearer eyJhbGciOiJIUzI1NiIs... (可选)
```

#### ▶️ 播放视频
```http
POST /api/videos/64f456def789012345678901/play
Authorization: Bearer eyJhbGciOiJIUzI1NiIs... (可选)
Content-Type: application/json

{
  "quality": "720p",              // 播放质量
  "startTime": 0,                 // 开始时间(秒)
  "deviceInfo": {                 // 设备信息(可选)
    "type": "web",
    "browser": "Chrome",
    "os": "Windows"
  }
}
```

### 评论相关接口

#### 💬 添加评论
```http
POST /api/comments
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "videoId": "64f456def789012345678901",
  "content": "这个视频太棒了！",
  "parentId": "64f789012345678901234567"  // 回复评论时使用
}
```

#### 📝 获取评论列表
```http
GET /api/comments/video/64f456def789012345678901?page=1&limit=50&sortBy=newest
```

**查询参数：**
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | number | 1 | 页码 |
| limit | number | 20 | 每页数量 |
| sortBy | string | newest | 排序 (newest/oldest/popular) |
| parentId | string | - | 获取特定评论的回复 |

#### 👍 点赞评论
```http
POST /api/comments/64f789012345678901234567/like
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### 直播相关接口

#### 🎥 创建直播间
```http
POST /api/live/streams
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "title": "我的直播间",
  "description": "欢迎来到我的直播间",
  "category": "gaming",
  "tags": ["游戏", "娱乐"],
  "isPrivate": false,
  "isRecordEnabled": true,
  "isReplayEnabled": true,
  "scheduledStartTime": "2024-08-27T20:00:00.000Z"  // 可选
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "直播间创建成功",
  "data": {
    "stream": {
      "id": "64f789abc012345def678901",
      "title": "我的直播间",
      "status": "preparing",
      "streamKey": "live_sk_1234567890abcdef",
      "rtmpConfig": {
        "pushUrl": "rtmp://live.example.com/live/",
        "streamKey": "live_sk_1234567890abcdef",
        "playUrls": {
          "rtmp": "rtmp://live.example.com/play/stream_123",
          "hls": "https://live.example.com/hls/stream_123.m3u8",
          "flv": "https://live.example.com/flv/stream_123.flv"
        }
      }
    }
  }
}
```

#### ▶️ 开始直播
```http
POST /api/live/streams/64f789abc012345def678901/start
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

#### ⏹️ 结束直播
```http
POST /api/live/streams/64f789abc012345def678901/end
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

#### 📺 获取直播列表
```http
GET /api/live/streams?page=1&limit=20&category=gaming&sortBy=viewers
```

### 数据分析接口

#### 📊 获取数据仪表板
```http
GET /api/analytics/dashboard?timeRange=7d
Authorization: Bearer eyJhbGciOiJIUzI1NiIs... (Admin)
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "timeRange": "7d",
    "timestamp": "2024-08-27T12:00:00.000Z",
    "summary": {
      "totalUsers": 10000,
      "totalVideos": 5000,
      "totalViews": 1000000,
      "totalRevenue": 50000,
      "activeStreams": 25
    },
    "userBehavior": {
      "totalUsers": 10000,
      "activeUsers": 3000,
      "newUsers": 500,
      "userRetention": 75.5,
      "avgSessionDuration": 1800
    },
    "videoPerformance": {
      "totalVideos": 5000,
      "totalViews": 1000000,
      "totalLikes": 100000,
      "avgWatchTime": 240
    }
  }
}
```

#### 📈 记录用户行为
```http
POST /api/analytics/track
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "action": "video_play",
  "metadata": {
    "videoId": "64f456def789012345678901",
    "quality": "720p",
    "duration": 120,
    "watchTime": 95,
    "source": "recommended"
  }
}
```

---

## 💡 功能模块使用

### 1. 用户认证系统

#### 注册流程详解
```mermaid
sequenceDiagram
    participant U as 用户
    participant C as 客户端
    participant S as 服务器
    participant D as 数据库
    participant E as 邮件服务

    U->>C: 填写注册信息
    C->>S: POST /api/auth/register
    S->>D: 检查邮箱是否存在
    D->>S: 返回检查结果
    S->>S: 验证密码强度
    S->>S: 加密密码 (bcrypt)
    S->>D: 保存用户信息
    S->>E: 发送验证邮件
    S->>C: 返回成功响应
    C->>U: 显示注册成功，提示查收邮件
```

#### JWT令牌机制
```javascript
// 访问令牌结构
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "id": "64f123abc456def789012345",
    "username": "testuser",
    "email": "test@example.com",
    "role": "user",
    "iat": 1692345600,
    "exp": 1692346500  // 15分钟后过期
  }
}

// 刷新令牌结构
{
  "payload": {
    "id": "64f123abc456def789012345",
    "type": "refresh",
    "iat": 1692345600,
    "exp": 1693296000  // 7天后过期
  }
}
```

### 2. 视频管理系统

#### 视频上传处理流程
```mermaid
flowchart TD
    A[用户上传视频] --> B[文件验证]
    B --> C{验证通过?}
    C -->|否| D[返回错误信息]
    C -->|是| E[保存到临时目录]
    E --> F[内容审核检查]
    F --> G{审核通过?}
    G -->|否| H[标记为待审核]
    G -->|是| I[添加到转码队列]
    I --> J[FFmpeg转码处理]
    J --> K[生成多种分辨率]
    K --> L[上传到云存储]
    L --> M[生成缩略图]
    M --> N[更新数据库状态]
    N --> O[发送处理完成通知]
```

#### 支持的视频格式配置
```javascript
// 视频格式配置
const videoConfig = {
  // 输入格式
  inputFormats: ['mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', '3gp'],
  
  // 输出分辨率
  outputResolutions: [
    { name: '480p', width: 854, height: 480, bitrate: '1000k' },
    { name: '720p', width: 1280, height: 720, bitrate: '2500k' },
    { name: '1080p', width: 1920, height: 1080, bitrate: '5000k' },
    { name: '4K', width: 3840, height: 2160, bitrate: '15000k' }
  ],
  
  // 编码设置
  videoCodec: 'libx264',
  audioCodec: 'aac',
  containerFormat: 'mp4',
  
  // 文件限制
  maxFileSize: '2GB',
  maxDuration: 7200, // 2小时
  minDuration: 5     // 5秒
};
```

### 3. 直播系统使用

#### RTMP推流配置
```bash
# OBS Studio 推流设置
服务器: rtmp://your-domain.com/live/
推流密钥: live_sk_1234567890abcdef

# FFmpeg 推流命令
ffmpeg -re -i input.mp4 -c:v libx264 -c:a aac -f flv rtmp://your-domain.com/live/live_sk_1234567890abcdef
```

#### WebSocket客户端接入
```javascript
// 前端WebSocket连接示例
class LiveStreamClient {
  constructor(streamId, userId, token) {
    this.streamId = streamId;
    this.userId = userId;
    this.token = token;
    this.ws = null;
  }

  connect() {
    this.ws = new WebSocket('ws://localhost:8080');
    
    this.ws.onopen = () => {
      // 加入直播间
      this.sendMessage({
        type: 'join_stream',
        streamId: this.streamId,
        userId: this.userId,
        token: this.token
      });
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
  }

  sendMessage(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  sendChatMessage(content) {
    this.sendMessage({
      type: 'chat_message',
      content: content
    });
  }

  sendGift(giftId, quantity = 1) {
    this.sendMessage({
      type: 'gift_message',
      giftId: giftId,
      quantity: quantity
    });
  }

  handleMessage(message) {
    switch (message.type) {
      case 'new_message':
        this.displayChatMessage(message.message);
        break;
      case 'gift_message':
        this.displayGiftAnimation(message.message);
        break;
      case 'viewer_count':
        this.updateViewerCount(message.count);
        break;
      // ... 其他消息处理
    }
  }
}

// 使用示例
const client = new LiveStreamClient('stream_id', 'user_id', 'jwt_token');
client.connect();
```

### 4. 内容审核机制

#### 审核规则配置
```javascript
// 审核规则示例
const moderationRules = [
  // 严重违禁词 - 直接拒绝
  {
    type: 'keyword',
    keywords: ['暴力', '色情', '赌博', '毒品', '恐怖主义'],
    severity: 'critical',
    action: 'reject',
    description: '包含严重违禁内容'
  },
  
  // 一般敏感词 - 人工审核
  {
    type: 'keyword', 
    keywords: ['垃圾', '广告', '推广', '加微信'],
    severity: 'medium',
    action: 'review',
    description: '疑似垃圾内容'
  },
  
  // 正则表达式规则
  {
    type: 'regex',
    pattern: '/微信号?[:：\\s]*[a-zA-Z0-9_-]+/',
    severity: 'medium', 
    action: 'review',
    description: '包含联系方式'
  },
  
  // AI审核规则
  {
    type: 'ai',
    severity: 'high',
    action: 'review', 
    description: 'AI检测到可能的违规内容'
  }
];
```

#### 审核流程图
```mermaid
flowchart TD
    A[内容提交] --> B[基础验证]
    B --> C[敏感词检测]
    C --> D{发现敏感词?}
    D -->|是| E[记录违规信息]
    D -->|否| F[正则表达式检测]
    F --> G{匹配违规模式?}
    G -->|是| E
    G -->|否| H[AI内容检测]
    H --> I{AI检测违规?}
    I -->|是| E
    I -->|否| J[内容通过]
    E --> K{严重程度}
    K -->|Critical| L[直接拒绝]
    K -->|High/Medium| M[转人工审核]
    K -->|Low| N[自动通过但标记]
```

---

## 👨‍💼 管理员指南

### 1. 管理员权限设置

#### 创建管理员账户
```bash
# 方法1: 使用脚本创建
node scripts/create-admin.js --email admin@example.com --password AdminPass123!

# 方法2: 直接修改数据库
mongo
use daxiong_video
db.users.updateOne(
  {email: "admin@example.com"}, 
  {$set: {role: "admin", isEmailVerified: true}}
)
```

#### 权限级别说明
| 角色 | 权限说明 | 功能范围 |
|------|---------|---------|
| admin | 超级管理员 | 所有功能，系统配置 |
| moderator | 内容审核员 | 内容审核，用户管理 |
| creator | 创作者 | 视频上传，直播 |
| user | 普通用户 | 观看，评论，互动 |

### 2. 内容管理操作

#### 批量内容审核
```bash
# 获取待审核内容列表
curl -H "Authorization: Bearer admin_token" \
  "http://localhost:3000/api/admin/content/pending?type=video&page=1&limit=50"

# 批量审核操作
curl -X POST -H "Authorization: Bearer admin_token" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"id": "content_id_1", "action": "approve"},
      {"id": "content_id_2", "action": "reject", "reason": "不当内容"}
    ]
  }' \
  "http://localhost:3000/api/admin/content/batch-moderate"
```

#### 视频管理操作
```javascript
// 删除违规视频
const deleteVideo = async (videoId, reason) => {
  const response = await fetch(`/api/admin/videos/${videoId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reason })
  });
  return response.json();
};

// 批量操作视频
const batchVideoOperation = async (videoIds, action) => {
  const response = await fetch('/api/admin/videos/batch', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ videoIds, action })
  });
  return response.json();
};
```

### 3. 用户管理

#### 用户封禁操作
```http
POST /api/admin/users/64f123abc456def789012345/ban
Authorization: Bearer admin_jwt_token
Content-Type: application/json

{
  "reason": "发布违规内容",
  "duration": 7,           // 封禁天数，-1为永久
  "type": "temporary",     // temporary 或 permanent
  "banScopes": ["upload", "comment", "live"]  // 封禁范围
}
```

#### 用户数据导出
```bash
# 导出用户数据
curl -H "Authorization: Bearer admin_token" \
  "http://localhost:3000/api/admin/users/export?format=csv&startDate=2024-01-01&endDate=2024-08-27" \
  -o users_export.csv
```

### 4. 系统监控

#### 系统状态检查脚本
```bash
#!/bin/bash
# system-check.sh

echo "=== 大雄视频平台系统状态检查 ==="
echo "检查时间: $(date)"
echo

# 检查服务状态
echo "1. 服务状态检查:"
systemctl is-active --quiet mongod && echo "✓ MongoDB: 运行中" || echo "✗ MongoDB: 停止"
systemctl is-active --quiet redis && echo "✓ Redis: 运行中" || echo "✗ Redis: 停止"
pgrep -f "node.*app.js" > /dev/null && echo "✓ Node.js: 运行中" || echo "✗ Node.js: 停止"

# 检查端口
echo
echo "2. 端口检查:"
netstat -tlnp | grep :3000 > /dev/null && echo "✓ API服务 (3000): 监听中" || echo "✗ API服务 (3000): 未监听"
netstat -tlnp | grep :8080 > /dev/null && echo "✓ WebSocket (8080): 监听中" || echo "✗ WebSocket (8080): 未监听"

# 检查磁盘空间
echo
echo "3. 磁盘空间:"
df -h | grep -E "/$|/var|/tmp" | while read line; do
  usage=$(echo $line | awk '{print $5}' | sed 's/%//')
  if [ $usage -gt 80 ]; then
    echo "⚠ $line (使用率过高)"
  else
    echo "✓ $line"
  fi
done

# 检查内存使用
echo
echo "4. 内存使用:"
free -h | grep "Mem:" | awk '{print "内存使用: "$3"/"$2" ("int($3/$2*100)"%)"}'

# 检查API健康
echo
echo "5. API健康检查:"
curl -s -f http://localhost:3000/api/health > /dev/null && echo "✓ API健康检查: 通过" || echo "✗ API健康检查: 失败"
```

---

## 🔧 开发指南

### 1. 开发环境搭建

#### 推荐开发工具
```bash
# VS Code 扩展
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-vscode.vscode-json
code --install-extension formulahendry.auto-rename-tag
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-eslint

# Chrome 扩展
# - JSON Viewer
# - Redux DevTools
# - React Developer Tools
```

#### Git提交规范
```bash
# 提交类型
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式化
refactor: 代码重构
test: 测试相关
chore: 构建过程或辅助工具的变动

# 提交示例
git commit -m "feat(video): 添加视频转码进度显示功能"
git commit -m "fix(auth): 修复JWT令牌过期时间计算错误"
git commit -m "docs(api): 更新视频上传接口文档"
```

### 2. 代码规范

#### TypeScript配置
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

#### ESLint配置
```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "no-console": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### 3. 添加新功能模块

#### 创建新模型示例
```typescript
// models/Notification.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isRead: boolean;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  
  type: {
    type: String,
    enum: ['info', 'warning', 'success', 'error'],
    default: 'info'
  },
  
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  
  metadata: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true,
  collection: 'notifications'
});

// 索引优化
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });

// TTL索引 - 已读通知30天后自动删除
NotificationSchema.index(
  { updatedAt: 1 },
  { 
    expireAfterSeconds: 30 * 24 * 60 * 60,
    partialFilterExpression: { isRead: true }
  }
);

export default mongoose.model<INotification>('Notification', NotificationSchema);
```

#### 创建服务层
```typescript
// services/NotificationService.ts
import Notification, { INotification } from '../models/Notification';
import User from '../models/User';
import redis from '../config/redis';

export class NotificationService {
  
  /**
   * 发送通知
   */
  public async sendNotification(
    userId: string,
    title: string,
    content: string,
    type: 'info' | 'warning' | 'success' | 'error' = 'info',
    metadata?: any
  ): Promise<INotification> {
    
    const notification = new Notification({
      userId,
      title,
      content,
      type,
      metadata
    });
    
    await notification.save();
    
    // 更新未读计数
    await this.updateUnreadCount(userId);
    
    // 实时推送 (通过WebSocket)
    await this.pushNotification(userId, notification);
    
    return notification;
  }
  
  /**
   * 获取用户通知列表
   */
  public async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    isRead?: boolean
  ) {
    const query: any = { userId };
    if (isRead !== undefined) {
      query.isRead = isRead;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();
    
    const total = await Notification.countDocuments(query);
    
    return {
      notifications,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }
  
  /**
   * 标记为已读
   */
  public async markAsRead(userId: string, notificationIds: string[]): Promise<void> {
    await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        userId,
        isRead: false
      },
      {
        isRead: true,
        updatedAt: new Date()
      }
    );
    
    await this.updateUnreadCount(userId);
  }
  
  /**
   * 获取未读数量
   */
  public async getUnreadCount(userId: string): Promise<number> {
    const cached = await redis.get(`notification_count:${userId}`);
    if (cached !== null) {
      return parseInt(cached);
    }
    
    const count = await Notification.countDocuments({
      userId,
      isRead: false
    });
    
    await redis.setex(`notification_count:${userId}`, 300, count.toString()); // 5分钟缓存
    return count;
  }
  
  /**
   * 更新未读计数缓存
   */
  private async updateUnreadCount(userId: string): Promise<void> {
    const count = await Notification.countDocuments({
      userId,
      isRead: false
    });
    
    await redis.setex(`notification_count:${userId}`, 300, count.toString());
  }
  
  /**
   * 实时推送通知
   */
  private async pushNotification(userId: string, notification: INotification): Promise<void> {
    // 通过WebSocket推送给在线用户
    // 这里需要与LiveStreamService集成
    const message = {
      type: 'new_notification',
      data: {
        id: notification._id,
        title: notification.title,
        content: notification.content,
        type: notification.type,
        createdAt: notification.createdAt
      }
    };
    
    // 发送给特定用户
    await redis.publish(`user_notifications:${userId}`, JSON.stringify(message));
  }
}

export default new NotificationService();
```

### 4. 测试编写

#### 单元测试示例
```typescript
// tests/services/NotificationService.test.ts
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import NotificationService from '../../src/services/NotificationService';
import User from '../../src/models/User';
import Notification from '../../src/models/Notification';

describe('NotificationService', () => {
  let testUser: any;
  
  beforeEach(async () => {
    // 创建测试用户
    testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword'
    });
    await testUser.save();
  });
  
  afterEach(async () => {
    // 清理测试数据
    await Notification.deleteMany({});
    await User.deleteMany({});
  });
  
  test('应该能够发送通知', async () => {
    const notification = await NotificationService.sendNotification(
      testUser._id.toString(),
      '测试通知',
      '这是一个测试通知',
      'info'
    );
    
    expect(notification).toBeDefined();
    expect(notification.title).toBe('测试通知');
    expect(notification.content).toBe('这是一个测试通知');
    expect(notification.type).toBe('info');
    expect(notification.isRead).toBe(false);
  });
  
  test('应该能够获取用户通知列表', async () => {
    // 创建测试通知
    await NotificationService.sendNotification(
      testUser._id.toString(),
      '通知1',
      '内容1'
    );
    
    await NotificationService.sendNotification(
      testUser._id.toString(),
      '通知2',
      '内容2'
    );
    
    const result = await NotificationService.getUserNotifications(
      testUser._id.toString(),
      1,
      10
    );
    
    expect(result.notifications).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.notifications[0].title).toBe('通知2'); // 最新的在前
  });
  
  test('应该能够标记通知为已读', async () => {
    const notification = await NotificationService.sendNotification(
      testUser._id.toString(),
      '测试通知',
      '内容'
    );
    
    await NotificationService.markAsRead(
      testUser._id.toString(),
      [notification._id.toString()]
    );
    
    const updated = await Notification.findById(notification._id);
    expect(updated?.isRead).toBe(true);
  });
});
```

#### 集成测试示例
```typescript
// tests/integration/api.test.ts
import request from 'supertest';
import app from '../../src/app';
import { setupTestDB, cleanupTestDB } from '../helpers/database';

describe('API Integration Tests', () => {
  let authToken: string;
  
  beforeAll(async () => {
    await setupTestDB();
  });
  
  afterAll(async () => {
    await cleanupTestDB();
  });
  
  describe('Auth API', () => {
    test('用户注册', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'SecurePass123!',
          nickname: '测试用户'
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe('testuser');
    });
    
    test('用户登录', async () => {
      // 先注册用户
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'loginuser',
          email: 'login@example.com',
          password: 'SecurePass123!'
        });
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'SecurePass123!'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      
      authToken = response.body.data.tokens.accessToken;
    });
  });
  
  describe('Video API', () => {
    test('获取视频列表', async () => {
      const response = await request(app)
        .get('/api/videos?page=1&limit=20');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.videos).toBeDefined();
    });
    
    test('需要认证的接口应该返回401', async () => {
      const response = await request(app)
        .post('/api/videos/upload');
      
      expect(response.status).toBe(401);
    });
  });
});
```

---

## 🚀 部署指南

### 1. Docker部署

#### Dockerfile
```dockerfile
# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# 生产阶段
FROM node:18-alpine AS production

# 安装系统依赖
RUN apk add --no-cache \
    ffmpeg \
    curl \
    && rm -rf /var/cache/apk/*

# 创建应用用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S daxiong -u 1001

WORKDIR /app

# 复制依赖和构建产物
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# 创建必要目录
RUN mkdir -p uploads logs tmp && \
    chown -R daxiong:nodejs /app

USER daxiong

EXPOSE 3000 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "dist/app.js"]
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: 
      context: .
      target: production
    ports:
      - "3000:3000"
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/daxiong_video
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongodb
      - redis
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    restart: unless-stopped
    networks:
      - daxiong-network

  mongodb:
    image: mongo:6.0
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
      MONGO_INITDB_DATABASE: daxiong_video
    volumes:
      - mongodb_data:/data/db
      - ./scripts/init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js:ro
    networks:
      - daxiong-network

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes --maxmemory 1gb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    networks:
      - daxiong-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/ssl/certs:ro
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - daxiong-network

volumes:
  mongodb_data:
  redis_data:

networks:
  daxiong-network:
    driver: bridge
```

#### Nginx配置
```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream daxiong_app {
        server app:3000;
    }
    
    upstream daxiong_websocket {
        server app:8080;
    }
    
    # 限流配置
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=upload:10m rate=2r/s;
    
    server {
        listen 80;
        server_name your-domain.com;
        
        # HTTPS重定向
        return 301 https://$server_name$request_uri;
    }
    
    server {
        listen 443 ssl http2;
        server_name your-domain.com;
        
        ssl_certificate /etc/ssl/certs/cert.pem;
        ssl_certificate_key /etc/ssl/certs/key.pem;
        
        # 安全头
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
        
        # API代理
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://daxiong_app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # 文件上传代理
        location /api/videos/upload {
            limit_req zone=upload burst=5 nodelay;
            client_max_body_size 2G;
            proxy_read_timeout 300s;
            proxy_pass http://daxiong_app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        # WebSocket代理
        location /ws/ {
            proxy_pass http://daxiong_websocket;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        # 静态文件缓存
        location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header Vary Accept-Encoding;
            gzip_static on;
        }
        
        # 视频文件优化
        location ~* \.(mp4|webm|ogg|avi|mov)$ {
            expires 30d;
            add_header Cache-Control "public, no-transform";
            sendfile on;
            tcp_nopush on;
            aio threads;
        }
    }
}
```

### 2. Kubernetes部署

#### 部署清单
```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: daxiong-video-api
  labels:
    app: daxiong-video-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: daxiong-video-api
  template:
    metadata:
      labels:
        app: daxiong-video-api
    spec:
      containers:
      - name: api
        image: daxiong/video-platform:latest
        ports:
        - containerPort: 3000
        - containerPort: 8080
        env:
        - name: NODE_ENV
          value: "production"
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: daxiong-secrets
              key: mongodb-uri
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: daxiong-secrets
              key: redis-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: daxiong-video-api-service
spec:
  selector:
    app: daxiong-video-api
  ports:
  - name: http
    port: 80
    targetPort: 3000
  - name: websocket
    port: 8080
    targetPort: 8080
  type: LoadBalancer

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: daxiong-video-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/proxy-body-size: 2g
spec:
  tls:
  - hosts:
    - api.daxiong.com
    secretName: daxiong-tls
  rules:
  - host: api.daxiong.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: daxiong-video-api-service
            port:
              number: 80
```

### 3. 生产环境优化

#### PM2配置
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'daxiong-api',
      script: 'dist/app.js',
      instances: 'max', // 使用所有CPU核心
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // 监控配置
      monitoring: false,
      pmx: false,
      
      // 重启策略
      autorestart: true,
      max_restarts: 5,
      min_uptime: '10s',
      
      // 日志配置
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      
      // 内存监控
      max_memory_restart: '1G',
      
      // 忽略监听文件
      ignore_watch: [
        'node_modules',
        'logs',
        'uploads',
        'tmp'
      ],
      
      // 环境变量
      env_file: '.env'
    },
    
    // WebSocket服务单独部署
    {
      name: 'daxiong-websocket',
      script: 'dist/websocket.js',
      instances: 1, // WebSocket服务通常不需要集群
      env: {
        NODE_ENV: 'production',
        WEBSOCKET_PORT: 8080
      }
    }
  ]
};
```

#### 性能优化配置
```javascript
// config/production.js
export const productionConfig = {
  // 数据库连接池
  mongodb: {
    maxPoolSize: 20,
    minPoolSize: 5,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  },
  
  // Redis连接池
  redis: {
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
    lazyConnect: true,
    keepAlive: 30000,
    family: 4,
    db: 0
  },
  
  // 缓存策略
  cache: {
    defaultTTL: 300, // 5分钟
    checkPeriod: 60,  // 1分钟检查过期
    maxKeys: 100000   // 最大缓存键数
  },
  
  // 限流配置
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 1000, // 每个IP最多1000请求
    standardHeaders: true,
    legacyHeaders: false,
  },
  
  // 文件上传
  upload: {
    maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
    maxFiles: 5,
    tempDir: '/tmp/uploads',
    cleanupInterval: 60 * 60 * 1000, // 1小时清理一次
  }
};
```

---

## 📊 监控运维

### 1. 日志管理

#### Winston日志配置
```javascript
// config/logger.js
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'daxiong-video-api' },
  transports: [
    // 错误日志
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
    }),
    
    // 综合日志
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true
    }),
    
    // 访问日志
    new DailyRotateFile({
      filename: 'logs/access-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      maxSize: '50m',
      maxFiles: '7d',
      zippedArchive: true
    })
  ],
  
  exceptionHandlers: [
    new DailyRotateFile({
      filename: 'logs/exceptions-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d'
    })
  ],
  
  rejectionHandlers: [
    new DailyRotateFile({
      filename: 'logs/rejections-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d'
    })
  ]
});

// 开发环境控制台输出
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export default logger;
```

### 2. 性能监控

#### APM监控集成
```javascript
// monitoring/apm.js
import apm from 'elastic-apm-node';

// 在应用启动前初始化
const apmInstance = apm.start({
  serviceName: 'daxiong-video-api',
  secretToken: process.env.ELASTIC_APM_SECRET_TOKEN,
  serverUrl: process.env.ELASTIC_APM_SERVER_URL,
  environment: process.env.NODE_ENV,
  
  // 采样率
  transactionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // 忽略路径
  ignoreUrls: [
    '/health',
    '/metrics',
    '/favicon.ico'
  ],
  
  // 忽略用户代理
  ignoreUserAgents: [
    'curl/*',
    'Wget/*'
  ]
});

// 自定义标签
apm.addLabels({
  datacenter: process.env.DATACENTER || 'unknown',
  version: process.env.APP_VERSION || 'unknown'
});

export default apmInstance;
```

#### Prometheus指标
```javascript
// monitoring/metrics.js
import promClient from 'prom-client';

// 创建指标注册表
const register = new promClient.Registry();

// 收集默认指标
promClient.collectDefaultMetrics({ register });

// 自定义业务指标
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new promClient.Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections'
});

const videoProcessingQueue = new promClient.Gauge({
  name: 'video_processing_queue_size',
  help: 'Number of videos in processing queue'
});

const userRegistrations = new promClient.Counter({
  name: 'user_registrations_total',
  help: 'Total number of user registrations'
});

// 注册指标
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(activeConnections);
register.registerMetric(videoProcessingQueue);
register.registerMetric(userRegistrations);

// 中间件函数
export const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration);
    
    httpRequestsTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc();
  });
  
  next();
};

// 指标端点
export const metricsHandler = (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
};

export { register, activeConnections, videoProcessingQueue, userRegistrations };
```

### 3. 健康检查

#### 健康检查服务
```javascript
// services/HealthCheckService.js
import mongoose from 'mongoose';
import redis from '../config/redis';
import { promises as fs } from 'fs';
import os from 'os';

export class HealthCheckService {
  
  /**
   * 综合健康检查
   */
  public async checkHealth(): Promise<any> {
    const startTime = Date.now();
    
    const [
      database,
      cache,
      storage,
      memory,
      disk
    ] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkCache(),
      this.checkStorage(),
      this.checkMemory(),
      this.checkDisk()
    ]);
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: this.determineOverallStatus([database, cache, storage, memory, disk]),
      timestamp: new Date().toISOString(),
      responseTime,
      checks: {
        database: this.formatCheckResult(database),
        cache: this.formatCheckResult(cache),
        storage: this.formatCheckResult(storage),
        memory: this.formatCheckResult(memory),
        disk: this.formatCheckResult(disk)
      }
    };
  }
  
  /**
   * 数据库健康检查
   */
  private async checkDatabase(): Promise<any> {
    const start = Date.now();
    
    try {
      await mongoose.connection.db.admin().ping();
      
      const stats = await mongoose.connection.db.stats();
      const responseTime = Date.now() - start;
      
      return {
        status: 'healthy',
        responseTime,
        details: {
          readyState: mongoose.connection.readyState,
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          databaseName: mongoose.connection.name,
          collections: stats.collections,
          dataSize: stats.dataSize,
          indexSize: stats.indexSize
        }
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - start
      };
    }
  }
  
  /**
   * Redis健康检查
   */
  private async checkCache(): Promise<any> {
    const start = Date.now();
    
    try {
      const pong = await redis.ping();
      const info = await redis.info('memory');
      const responseTime = Date.now() - start;
      
      // 解析内存信息
      const memoryInfo = {};
      info.split('\n').forEach(line => {
        const [key, value] = line.split(':');
        if (key && value) {
          memoryInfo[key.trim()] = value.trim();
        }
      });
      
      return {
        status: pong === 'PONG' ? 'healthy' : 'unhealthy',
        responseTime,
        details: {
          connected: redis.status === 'ready',
          usedMemory: memoryInfo.used_memory_human,
          maxMemory: memoryInfo.maxmemory_human || 'unlimited',
          keyspaceHits: await redis.info('stats').then(stats => 
            stats.match(/keyspace_hits:(\d+)/)?.[1] || '0'
          )
        }
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - start
      };
    }
  }
  
  /**
   * 存储健康检查
   */
  private async checkStorage(): Promise<any> {
    const start = Date.now();
    
    try {
      const testFile = '/tmp/health-check-test.txt';
      const testData = 'health-check-' + Date.now();
      
      // 写入测试
      await fs.writeFile(testFile, testData);
      
      // 读取测试
      const readData = await fs.readFile(testFile, 'utf8');
      
      // 删除测试文件
      await fs.unlink(testFile);
      
      const responseTime = Date.now() - start;
      
      return {
        status: readData === testData ? 'healthy' : 'unhealthy',
        responseTime,
        details: {
          readable: true,
          writable: true,
          testPassed: readData === testData
        }
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - start
      };
    }
  }
  
  /**
   * 内存使用检查
   */
  private async checkMemory(): Promise<any> {
    const memUsage = process.memoryUsage();
    const systemMem = {
      total: os.totalmem(),
      free: os.freemem()
    };
    
    const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    const systemUsedPercent = ((systemMem.total - systemMem.free) / systemMem.total) * 100;
    
    // 内存使用超过85%视为不健康
    const status = heapUsedPercent > 85 || systemUsedPercent > 85 ? 'warning' : 'healthy';
    
    return {
      status,
      details: {
        process: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
          heapUsedPercent: Math.round(heapUsedPercent * 100) / 100,
          external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
        },
        system: {
          total: Math.round(systemMem.total / 1024 / 1024) + ' MB',
          free: Math.round(systemMem.free / 1024 / 1024) + ' MB',
          usedPercent: Math.round(systemUsedPercent * 100) / 100
        }
      }
    };
  }
  
  /**
   * 磁盘空间检查
   */
  private async checkDisk(): Promise<any> {
    try {
      const stats = await fs.statvfs('/');
      const total = stats.blocks * stats.frsize;
      const free = stats.bavail * stats.frsize;
      const used = total - free;
      const usedPercent = (used / total) * 100;
      
      // 磁盘使用超过90%视为警告，95%视为不健康
      let status = 'healthy';
      if (usedPercent > 95) {
        status = 'unhealthy';
      } else if (usedPercent > 90) {
        status = 'warning';
      }
      
      return {
        status,
        details: {
          total: Math.round(total / 1024 / 1024 / 1024 * 100) / 100 + ' GB',
          free: Math.round(free / 1024 / 1024 / 1024 * 100) / 100 + ' GB',
          used: Math.round(used / 1024 / 1024 / 1024 * 100) / 100 + ' GB',
          usedPercent: Math.round(usedPercent * 100) / 100
        }
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
  
  /**
   * 格式化检查结果
   */
  private formatCheckResult(result: PromiseSettledResult<any>): any {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        status: 'error',
        error: result.reason.message
      };
    }
  }
  
  /**
   * 确定整体健康状态
   */
  private determineOverallStatus(results: PromiseSettledResult<any>[]): string {
    const statuses = results.map(result => 
      result.status === 'fulfilled' ? result.value.status : 'error'
    );
    
    if (statuses.includes('unhealthy') || statuses.includes('error')) {
      return 'unhealthy';
    } else if (statuses.includes('warning')) {
      return 'warning';
    } else {
      return 'healthy';
    }
  }
}

export default new HealthCheckService();
```

### 4. 告警配置

#### 告警规则
```yaml
# prometheus-rules.yml
groups:
- name: daxiong-video-api
  rules:
  # 高错误率告警
  - alert: HighErrorRate
    expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.1
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "API错误率过高"
      description: "{{ $labels.instance }} 的错误率在过去5分钟内超过10%"
  
  # 响应时间过长
  - alert: HighResponseTime
    expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "API响应时间过长"
      description: "95%的请求响应时间超过2秒"
  
  # 内存使用过高
  - alert: HighMemoryUsage
    expr: (process_resident_memory_bytes / on(instance) node_memory_MemTotal_bytes) > 0.8
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "内存使用率过高"
      description: "{{ $labels.instance }} 内存使用率超过80%"
  
  # 数据库连接异常
  - alert: DatabaseConnectionDown
    expr: up{job="mongodb"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "数据库连接断开"
      description: "MongoDB连接不可用"
  
  # Redis连接异常
  - alert: RedisConnectionDown
    expr: up{job="redis"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Redis连接断开"
      description: "Redis连接不可用"
  
  # 视频处理队列积压
  - alert: VideoProcessingQueueHigh
    expr: video_processing_queue_size > 100
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: "视频处理队列积压"
      description: "视频处理队列中有{{ $value }}个任务等待处理"
```

---

## 🔍 故障排除

### 1. 常见问题及解决方案

#### 数据库相关问题

**问题1: MongoDB连接失败**
```bash
# 症状
MongooseError: Operation `users.findOne()` buffering timed out after 10000ms

# 诊断步骤
1. 检查MongoDB服务状态
sudo systemctl status mongod

2. 检查端口占用
netstat -tlnp | grep 27017

3. 检查连接字符串
echo $MONGODB_URI

4. 测试连接
mongo $MONGODB_URI --eval "db.runCommand('ping')"

# 解决方案
# 重启MongoDB
sudo systemctl restart mongod

# 检查配置文件
sudo nano /etc/mongod.conf
# 确保 bindIp: 0.0.0.0 (生产环境需要限制IP)

# 检查防火墙
sudo ufw allow 27017
```

**问题2: 数据库查询性能问题**
```bash
# 诊断查询性能
db.videos.find({uploader: "user_id"}).explain("executionStats")

# 查看慢查询
db.setProfilingLevel(1, {slowms: 100})
db.system.profile.find({ts: {$gte: new Date(Date.now() - 1000*60*60)}})

# 添加索引
db.videos.createIndex({uploader: 1, createdAt: -1})
db.comments.createIndex({videoId: 1, createdAt: -1})
```

#### Redis相关问题

**问题3: Redis内存不足**
```bash
# 症状
OOM command not allowed when used memory > 'maxmemory'

# 诊断
redis-cli info memory
redis-cli config get maxmemory*

# 解决方案
# 增加内存限制
redis-cli config set maxmemory 2gb
redis-cli config set maxmemory-policy allkeys-lru

# 永久配置
echo "maxmemory 2gb" >> /etc/redis/redis.conf
echo "maxmemory-policy allkeys-lru" >> /etc/redis/redis.conf
sudo systemctl restart redis
```

#### 视频处理问题

**问题4: FFmpeg转码失败**
```bash
# 症状
Error: FFmpeg process failed with exit code 1

# 诊断步骤
1. 检查FFmpeg安装
ffmpeg -version

2. 检查输入文件
ffprobe input.mp4

3. 检查磁盘空间
df -h

4. 检查临时目录权限
ls -la /tmp/uploads

# 解决方案
# 重新安装FFmpeg
sudo apt update
sudo apt install --reinstall ffmpeg

# 创建临时目录
sudo mkdir -p /tmp/uploads
sudo chmod 755 /tmp/uploads
sudo chown $USER:$USER /tmp/uploads

# 测试转码
ffmpeg -i input.mp4 -c:v libx264 -c:a aac output.mp4
```

#### WebSocket连接问题

**问题5: WebSocket连接断开**
```bash
# 症状
WebSocket connection closed unexpectedly

# 诊断步骤
1. 检查WebSocket服务状态
netstat -tlnp | grep 8080

2. 检查防火墙
sudo ufw status
sudo ufw allow 8080

3. 检查Nginx配置（如果使用）
nginx -t
sudo systemctl reload nginx

# 解决方案
# 检查代理配置
location /ws/ {
    proxy_pass http://localhost:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 86400;
}
```

### 2. 性能调优

#### 数据库优化
```javascript
// 连接池优化
const mongoOptions = {
  maxPoolSize: 20,      // 最大连接数
  minPoolSize: 5,       // 最小连接数
  maxIdleTimeMS: 30000, // 空闲连接超时
  bufferMaxEntries: 0,  // 禁用缓冲
  bufferCommands: false,
  useNewUrlParser: true,
  useUnifiedTopology: true
};

// 查询优化
const optimizedQuery = Video.find({category: 'entertainment'})
  .sort({createdAt: -1})
  .limit(20)
  .select('title description thumbnail stats uploader')
  .populate('uploader', 'username nickname avatar verified')
  .lean(); // 返回普通对象而非Mongoose文档
```

#### 内存优化
```javascript
// 启用gzip压缩
app.use(compression({
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// 流式处理大文件
const streamFile = (filePath, res) => {
  const stream = fs.createReadStream(filePath, {highWaterMark: 16 * 1024});
  stream.pipe(res);
};

// 对象池化
class ObjectPool {
  constructor(createFn, resetFn, maxSize = 100) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.pool = [];
    this.maxSize = maxSize;
  }
  
  acquire() {
    return this.pool.length > 0 ? this.pool.pop() : this.createFn();
  }
  
  release(obj) {
    if (this.pool.length < this.maxSize) {
      this.resetFn(obj);
      this.pool.push(obj);
    }
  }
}
```

### 3. 调试技巧

#### 调试工具配置
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "调试API服务器",
      "program": "${workspaceFolder}/src/app.ts",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development",
        "DEBUG": "daxiong:*"
      },
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

#### 日志调试
```javascript
// 使用调试命名空间
import debug from 'debug';

const debugAuth = debug('daxiong:auth');
const debugVideo = debug('daxiong:video');
const debugDB = debug('daxiong:db');

// 在代码中使用
debugAuth('User %s attempting login', email);
debugVideo('Processing video %s', videoId);
debugDB('Query executed in %dms', duration);

// 运行时启用调试
DEBUG=daxiong:* npm run dev
DEBUG=daxiong:auth,daxiong:video npm run dev
```

---

## ❓ FAQ常见问题

### Q1: 如何更改默认端口？
**A:** 修改`.env`文件中的`PORT`变量：
```bash
PORT=3001
WEBSOCKET_PORT=8081
```

### Q2: 如何重置管理员密码？
**A:** 使用MongoDB shell直接修改：
```bash
mongo
use daxiong_video
db.users.updateOne(
  {email: "admin@example.com"}, 
  {$set: {password: "$2b$12$hashed_password_here"}}
)
```

### Q3: 如何清理过期数据？
**A:** 运行清理脚本：
```bash
# 清理过期会话
node scripts/cleanup-expired-sessions.js

# 清理过期文件
node scripts/cleanup-temp-files.js

# 手动清理过期聊天消息
mongo daxiong_video --eval "db.liveMessages.deleteMany({createdAt: {$lt: new Date(Date.now() - 7*24*60*60*1000)}, type: 'chat'})"
```

### Q4: 如何备份数据？
**A:** 使用mongodump备份：
```bash
# 备份整个数据库
mongodump --uri="mongodb://localhost:27017/daxiong_video" --out=/backup/$(date +%Y%m%d)

# 备份特定集合
mongodump --uri="mongodb://localhost:27017/daxiong_video" --collection=users --out=/backup/users_$(date +%Y%m%d)

# 定时备份脚本
echo "0 2 * * * /usr/bin/mongodump --uri=\"mongodb://localhost:27017/daxiong_video\" --out=/backup/$(date +\%Y\%m\%d)" | crontab -
```

### Q5: 如何优化视频加载速度？
**A:** 
1. **启用CDN**: 配置CloudFlare或AWS CloudFront
2. **视频分片**: 实现HLS或DASH协议
3. **预加载策略**: 智能预加载用户可能观看的视频
4. **缓存优化**: 设置适当的HTTP缓存头
```nginx
location ~* \.(mp4|webm|ogg)$ {
    expires 30d;
    add_header Cache-Control "public, no-transform";
    add_header Accept-Ranges bytes;
}
```

### Q6: 如何处理大量并发用户？
**A:**
1. **水平扩展**: 使用负载均衡器分发请求
2. **读写分离**: MongoDB副本集读写分离
3. **缓存策略**: Redis集群 + 应用层缓存
4. **异步处理**: 使用消息队列处理耗时任务
```yaml
# nginx负载均衡配置
upstream daxiong_backend {
    server 127.0.0.1:3001 weight=3;
    server 127.0.0.1:3002 weight=3;
    server 127.0.0.1:3003 weight=2;
}
```

### Q7: 如何实现多语言支持？
**A:** 
```javascript
// 安装i18n
npm install i18n

// 配置多语言
import i18n from 'i18n';

i18n.configure({
  locales: ['zh-CN', 'en-US', 'ja-JP'],
  directory: './locales',
  defaultLocale: 'zh-CN',
  cookie: 'lang',
  queryParameter: 'lang',
  autoReload: true,
  updateFiles: false,
  api: {
    '__': 'translate',
    '__n': 'translateN'
  }
});

// 在响应中使用
res.json({
  success: true,
  message: req.__('USER_CREATED_SUCCESS')
});
```

### Q8: 如何实现内容CDN分发？
**A:**
```javascript
// CDN配置
const cdnConfig = {
  video: process.env.CDN_VIDEO_URL || 'https://video-cdn.daxiong.com',
  image: process.env.CDN_IMAGE_URL || 'https://img-cdn.daxiong.com',
  static: process.env.CDN_STATIC_URL || 'https://static-cdn.daxiong.com'
};

// 生成CDN URLs
const generateCDNUrl = (filePath, type = 'video') => {
  const baseUrl = cdnConfig[type];
  return `${baseUrl}/${filePath}`;
};
```

---

## 📞 技术支持

### 🔗 联系方式
- **官方网站**: https://daxiong.com
- **技术文档**: https://docs.daxiong.com  
- **API文档**: https://api-docs.daxiong.com
- **GitHub仓库**: https://github.com/daxiong-org/video-platform
- **问题反馈**: https://github.com/daxiong-org/video-platform/issues

### 💬 社区支持
- **QQ技术群**: 123456789
- **微信群**: 扫描二维码加入
- **Discord**: https://discord.gg/daxiong
- **邮件列表**: dev@daxiong.com

### 📚 学习资源
- [MongoDB官方文档](https://docs.mongodb.com/)
- [Redis官方文档](https://redis.io/documentation)
- [Node.js最佳实践](https://github.com/goldbergyoni/nodebestpractices)
- [TypeScript官方文档](https://www.typescriptlang.org/docs/)

---

## 🔄 更新日志

### v1.0.0 (2024-08-27)
- ✅ 初始版本发布
- ✅ 完整的用户认证系统
- ✅ 视频上传和处理功能
- ✅ 评论和互动系统
- ✅ 智能推荐算法
- ✅ 直播功能
- ✅ 内容审核机制
- ✅ 数据分析系统

### 即将推出
- 🔄 移动端SDK
- 🔄 实时转码优化
- 🔄 AI智能剪辑
- 🔄 社交功能增强
- 🔄 多租户支持

---

*最后更新时间: 2024年8月27日*  
*版本: v1.0.0*  
*文档维护: 大雄技术团队*