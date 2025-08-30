# 🎬 大雄视频平台 (DAXIONG Video Platform)

<div align="center">

![版本](https://img.shields.io/badge/版本-v1.0.0-blue.svg)
![许可证](https://img.shields.io/badge/许可证-MIT-green.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![React](https://img.shields.io/badge/React-19.1.1-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)

**一个现代化、可扩展的企业级视频分享平台**

融合腾讯视频的长视频内容、爱奇艺的付费会员模式以及Bilibili的社区互动特色

[在线演示](https://demo.daxiong.com) · [API文档](https://api-docs.daxiong.com) · [技术文档](./docs/) · [问题反馈](https://github.com/daxiong-org/video-platform/issues)

</div>

---

## 📋 目录

- [✨ 特性](#特性)
- [🏗️ 架构设计](#架构设计)
- [🛠️ 技术栈](#技术栈)
- [🚀 快速开始](#快速开始)
- [📦 安装指南](#安装指南)
- [🔧 配置说明](#配置说明)
- [📚 API文档](#api文档)
- [🎯 功能模块](#功能模块)
- [📱 项目结构](#项目结构)
- [🔄 开发指南](#开发指南)
- [🚀 部署指南](#部署指南)
- [📊 监控运维](#监控运维)
- [🤝 贡献指南](#贡献指南)
- [📄 许可证](#许可证)

---

## ✨ 特性

### 🎯 核心功能
- **视频管理** - 上传、转码、多分辨率播放、智能压缩
- **用户系统** - 注册登录、会员体系、权限管理
- **直播功能** - RTMP推流、实时聊天、礼物打赏
- **社交互动** - 多级评论、点赞收藏、关注粉丝
- **内容推荐** - 协同过滤、个性化算法、智能推荐
- **内容审核** - AI审核、敏感词过滤、人工复查
- **数据分析** - 实时统计、用户画像、运营报表

### 🎨 界面特色
- **现代设计** - 基于Ant Design 5.0，简约美观
- **响应式** - 完美适配桌面端、平板、移动端
- **主题切换** - 支持明暗主题无缝切换
- **弹幕系统** - 实时弹幕互动，自定义样式
- **播放体验** - 多码率自适应、画中画、倍速播放

### ⚡ 性能优势
- **高并发** - 支持10000+并发用户
- **快速加载** - 视频加载时间 < 3秒
- **智能缓存** - Redis缓存 + CDN分发
- **异步处理** - 队列化视频处理，不阻塞用户操作
- **弹性扩展** - 微服务架构，支持水平扩展

---

## 🏗️ 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                    用户访问层                              │
│  Web浏览器  │  移动端APP  │  桌面应用(Electron)             │
└─────────────┬───────────────────────────────────────────┘
              │ HTTPS/WebSocket
┌─────────────▼───────────────────────────────────────────┐
│                  CDN + 负载均衡                           │
│           Nginx/Apache + CloudFlare                    │
└─────────────┬───────────────────────────────────────────┘
              │ RESTful API
┌─────────────▼───────────────────────────────────────────┐
│                    前端应用层                             │
│     React 19 + TypeScript + Ant Design                │
└─────────────┬───────────────────────────────────────────┘
              │ HTTP/WebSocket
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
│  MongoDB 6.0+  │  Redis 7.0+  │  MinIO/AWS S3          │
│  (核心数据)     │   (缓存)      │  (文件存储)             │
└─────────────┬───────────────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────────────┐
│                  基础设施层                               │
│  FFmpeg视频处理 │ WebRTC直播 │ Bull队列 │ 监控日志        │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ 技术栈

### 前端技术
```json
{
  "框架": "React 19.1.1 + TypeScript 5.8.3",
  "UI库": "Ant Design 5.27.1 + Styled Components 6.1.19",
  "状态管理": "Redux Toolkit 2.8.2",
  "路由": "React Router 7.8.2",
  "视频播放": "Video.js 8.23.4",
  "构建工具": "Vite 7.1.2",
  "HTTP客户端": "Axios 1.11.0"
}
```

### 后端技术
```json
{
  "运行环境": "Node.js 18+ + Express 4.18",
  "开发语言": "TypeScript 5.8.3",
  "数据库": "MongoDB 6.0+ (主库) + Redis 7.0+ (缓存)",
  "认证授权": "JWT + bcrypt",
  "文件存储": "AWS S3 / 阿里云OSS / MinIO",
  "视频处理": "FFmpeg 4.4+",
  "实时通信": "WebSocket + Socket.IO",
  "任务队列": "Bull Queue",
  "进程管理": "PM2"
}
```

### 基础设施
```json
{
  "容器化": "Docker + Docker Compose",
  "编排": "Kubernetes (可选)",
  "反向代理": "Nginx + SSL",
  "CDN": "CloudFlare / AWS CloudFront",
  "监控": "Prometheus + Grafana",
  "日志": "Winston + ELK Stack",
  "CI/CD": "GitHub Actions"
}
```

---

## 🚀 快速开始

### 环境要求
- **Node.js** >= 18.0.0
- **MongoDB** >= 6.0
- **Redis** >= 7.0
- **FFmpeg** >= 4.4
- **Docker** (推荐)

### Docker一键启动 🐳
```bash
# 克隆项目
git clone https://github.com/your-org/daxiong-video-platform.git
cd daxiong-video-platform

# 一键启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 访问应用
# 前端：http://localhost:3001
# 后端API：http://localhost:3000
# WebSocket：ws://localhost:8080
```

### 本地开发启动 💻
```bash
# 1. 启动数据库服务
docker-compose up -d mongodb redis

# 2. 启动后端服务
cd backend
npm install
npm run dev

# 3. 启动前端服务 (新终端)
cd frontend  
npm install
npm run dev
```

---

## 📦 安装指南

### 系统依赖安装

#### Ubuntu/Debian
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装基础依赖
sudo apt install -y curl git build-essential

# 安装Node.js (使用NodeSource仓库)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# 安装Redis
sudo apt install -y redis-server

# 安装FFmpeg
sudo apt install -y ffmpeg

# 启动服务
sudo systemctl start mongod redis-server
sudo systemctl enable mongod redis-server
```

#### CentOS/RHEL
```bash
# 安装EPEL仓库
sudo yum install -y epel-release

# 安装Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 安装MongoDB
sudo tee /etc/yum.repos.d/mongodb-org-6.0.repo<<EOF
[mongodb-org-6.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/8/mongodb-org/6.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-6.0.asc
EOF
sudo yum install -y mongodb-org

# 安装Redis和FFmpeg
sudo yum install -y redis ffmpeg

# 启动服务
sudo systemctl start mongod redis
sudo systemctl enable mongod redis
```

#### macOS
```bash
# 安装Homebrew (如果未安装)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装所有依赖
brew install node@18 mongodb-community redis ffmpeg

# 启动服务
brew services start mongodb-community
brew services start redis
```

### 项目安装
```bash
# 克隆项目
git clone https://github.com/your-org/daxiong-video-platform.git
cd daxiong-video-platform

# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install

# 安装全局工具
npm install -g pm2 nodemon typescript
```

---

## 🔧 配置说明

### 环境变量配置

创建 `backend/.env` 文件：

```bash
# ===========================================
# 基础配置
# ===========================================
PORT=3000
WEBSOCKET_PORT=8080
NODE_ENV=development

# ===========================================
# 数据库配置
# ===========================================
MONGODB_URI=mongodb://localhost:27017/daxiong_video
REDIS_URL=redis://localhost:6379

# ===========================================
# JWT配置
# ===========================================
JWT_SECRET=your-super-secret-jwt-key-at-least-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-different-from-access
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ===========================================
# 文件存储 (AWS S3)
# ===========================================
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=daxiong-video-bucket

# ===========================================
# 邮件服务 (SMTP)
# ===========================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@daxiong.com

# ===========================================
# 可选服务
# ===========================================
# CDN配置
CDN_BASE_URL=https://cdn.daxiong.com
CDN_VIDEO_PATH=/videos
CDN_IMAGE_PATH=/images

# 客户端URL
CLIENT_URL=http://localhost:3001
ADMIN_URL=http://localhost:3002

# AI审核API
AI_MODERATION_ENABLED=false
AI_MODERATION_API_KEY=your-openai-api-key

# 安全配置
CORS_ORIGIN=http://localhost:3001,http://localhost:3002
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=2147483648
```

### 数据库初始化
```bash
# MongoDB索引创建
node scripts/create-indexes.js

# 创建管理员账户
node scripts/create-admin.js --email admin@example.com --password Admin123!

# 导入测试数据 (可选)
node scripts/seed-data.js
```

---

## 📚 API文档

### 基础信息
- **Base URL**: `http://localhost:3000/api`
- **认证方式**: Bearer Token (JWT)
- **数据格式**: JSON
- **字符编码**: UTF-8

### 主要接口分类

#### 🔐 用户认证
```http
POST   /api/auth/register     # 用户注册
POST   /api/auth/login        # 用户登录
POST   /api/auth/refresh      # 刷新令牌
POST   /api/auth/logout       # 用户登出
GET    /api/auth/verify/:code # 邮箱验证
POST   /api/auth/forgot       # 忘记密码
POST   /api/auth/reset        # 重置密码
```

#### 📹 视频管理
```http
GET    /api/videos            # 获取视频列表
GET    /api/videos/:id        # 获取视频详情
POST   /api/videos/upload     # 上传视频
PUT    /api/videos/:id        # 更新视频信息
DELETE /api/videos/:id        # 删除视频
POST   /api/videos/:id/play   # 播放视频
GET    /api/videos/:id/stats  # 视频统计
```

#### 💬 评论系统
```http
GET    /api/comments/video/:videoId    # 获取评论列表
POST   /api/comments                  # 添加评论
PUT    /api/comments/:id              # 更新评论
DELETE /api/comments/:id              # 删除评论
POST   /api/comments/:id/like         # 点赞评论
POST   /api/comments/:id/report       # 举报评论
```

#### 🎥 直播功能
```http
GET    /api/live/streams       # 获取直播列表
POST   /api/live/streams       # 创建直播间
GET    /api/live/streams/:id   # 获取直播详情
POST   /api/live/streams/:id/start   # 开始直播
POST   /api/live/streams/:id/end     # 结束直播
WebSocket: ws://localhost:8080        # 直播聊天
```

#### 📊 数据分析
```http
GET    /api/analytics/dashboard       # 数据仪表板
GET    /api/analytics/videos         # 视频统计
GET    /api/analytics/users          # 用户统计
POST   /api/analytics/track          # 记录用户行为
```

### 请求示例

#### 用户注册
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "SecurePass123!",
    "nickname": "测试用户"
  }'
```

#### 视频上传
```bash
curl -X POST http://localhost:3000/api/videos/upload \
  -H "Authorization: Bearer your-jwt-token" \
  -F "video=@/path/to/video.mp4" \
  -F "title=我的视频" \
  -F "description=视频描述" \
  -F "category=entertainment"
```

### 响应格式
```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    // 响应数据
  },
  "pagination": {  // 列表接口包含
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 100,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 🎯 功能模块

### 📹 视频管理系统
- **多格式支持**: MP4, AVI, MOV, MKV, WMV, FLV等
- **智能转码**: 自动生成480p/720p/1080p/4K多种分辨率
- **缩略图生成**: 自动提取关键帧生成封面
- **上传进度**: 实时显示上传和处理进度
- **断点续传**: 支持大文件分片上传
- **CDN分发**: 全球加速，降低延迟

### 🔐 用户系统
- **多种登录**: 邮箱、用户名、第三方登录
- **安全验证**: 邮箱验证、双因子认证
- **权限管理**: 角色权限控制，细粒度权限
- **会员体系**: 免费用户、VIP、超级VIP
- **个人中心**: 资料管理、观看历史、收藏夹

### 🎥 直播系统
- **推流支持**: RTMP/WebRTC推流协议
- **多码率**: 自动适配网络带宽
- **实时聊天**: WebSocket即时通讯
- **礼物打赏**: 虚拟礼物系统
- **直播回放**: 自动录制回放功能

### 💬 社交互动
- **多级评论**: 支持楼中楼回复
- **表情包**: 丰富的表情包系统
- **点赞收藏**: 一键点赞收藏分享
- **关注系统**: 关注喜欢的UP主
- **弹幕系统**: 实时弹幕互动

### 🎯 推荐算法
- **协同过滤**: 基于用户行为的推荐
- **内容推荐**: 基于标签和分类的推荐
- **实时推荐**: 根据当前浏览调整推荐
- **冷启动**: 新用户和新内容的推荐策略
- **A/B测试**: 算法效果对比测试

### 🛡️内容审核
- **AI审核**: 智能识别违规内容
- **敏感词**: 可配置敏感词库
- **人工审核**: 管理员审核工作流
- **用户举报**: 社区监督机制
- **版权保护**: 内容指纹识别

### 📊 数据分析
- **实时统计**: 播放量、用户数等实时数据
- **用户画像**: 用户行为分析建模
- **运营报表**: 日报、周报、月报
- **A/B实验**: 功能效果测试
- **预警监控**: 异常数据告警

---

## 📱 项目结构

```
daxiong-video-platform/
├── 📄 README.md                    # 项目说明文档
├── 📋 PRD.md                       # 产品需求文档
├── 🎨 DESIGN_SPEC.md              # UI/UX设计规范
├── 🏗️ TECH_ARCHITECTURE.md        # 技术架构文档
├── 🐳 docker-compose.yml          # Docker编排文件
├── 📄 LICENSE                     # 开源许可证
│
├── backend/                       # 后端项目 🖥️
│   ├── src/                      # 源代码目录
│   │   ├── controllers/          # 控制器层
│   │   │   ├── AuthController.ts          # 认证控制器
│   │   │   ├── UserController.ts          # 用户控制器  
│   │   │   ├── VideoController.ts         # 视频控制器
│   │   │   ├── CommentController.ts       # 评论控制器
│   │   │   ├── LiveStreamController.ts    # 直播控制器
│   │   │   ├── RecommendationController.ts # 推荐控制器
│   │   │   └── AnalyticsController.ts     # 分析控制器
│   │   │
│   │   ├── models/              # 数据模型
│   │   │   ├── User.ts          # 用户模型
│   │   │   ├── Video.ts         # 视频模型
│   │   │   ├── Comment.ts       # 评论模型
│   │   │   ├── LiveStream.ts    # 直播模型
│   │   │   ├── RefreshToken.ts  # 令牌模型
│   │   │   └── ...
│   │   │
│   │   ├── services/            # 业务逻辑层
│   │   │   ├── VideoProcessingService.ts  # 视频处理
│   │   │   ├── FileUploadService.ts       # 文件上传
│   │   │   ├── ContentModerationService.ts # 内容审核
│   │   │   ├── RecommendationService.ts   # 推荐算法
│   │   │   ├── LiveStreamService.ts       # 直播服务
│   │   │   ├── EmailService.ts            # 邮件服务
│   │   │   └── ...
│   │   │
│   │   ├── routes/              # 路由定义
│   │   │   ├── auth.ts          # 认证路由
│   │   │   ├── users.ts         # 用户路由
│   │   │   ├── videos.ts        # 视频路由
│   │   │   ├── comments.ts      # 评论路由
│   │   │   ├── live.ts          # 直播路由
│   │   │   └── ...
│   │   │
│   │   ├── middleware/          # 中间件
│   │   │   ├── authMiddleware.ts        # 认证中间件
│   │   │   └── securityMiddleware.ts    # 安全中间件
│   │   │
│   │   ├── utils/               # 工具函数
│   │   │   └── helpers.ts       # 辅助函数
│   │   │
│   │   └── types/               # 类型定义
│   │       └── ApiResponse.ts   # API响应类型
│   │
│   ├── 📖 OPERATION_GUIDE.md    # 详细操作指南(3000+行)
│   ├── package.json             # 依赖配置
│   ├── tsconfig.json            # TypeScript配置
│   └── .env.example             # 环境变量示例
│
├── frontend/                    # 前端项目 💻
│   ├── public/                  # 静态资源
│   │   ├── index.html           # HTML模板
│   │   └── vite.svg             # 图标
│   │
│   ├── src/                     # 源代码目录
│   │   ├── components/          # 通用组件
│   │   │   ├── common/          # 基础组件
│   │   │   │   ├── Button.tsx           # 按钮组件
│   │   │   │   ├── LoadingSpinner.tsx   # 加载动画
│   │   │   │   ├── SearchBox.tsx        # 搜索框
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── layout/          # 布局组件
│   │   │   │   ├── Header.tsx   # 页面头部
│   │   │   │   └── ...
│   │   │   │
│   │   │   └── video/           # 视频组件
│   │   │       ├── VideoCard.tsx        # 视频卡片
│   │   │       ├── VideoPlayer.tsx      # 视频播放器
│   │   │       └── DanmakuSystem.tsx    # 弹幕系统
│   │   │
│   │   ├── pages/               # 页面组件
│   │   │   ├── home/            # 首页
│   │   │   │   └── HomePage.tsx
│   │   │   ├── auth/            # 认证页面
│   │   │   │   └── AuthPage.tsx
│   │   │   ├── video/           # 视频页面
│   │   │   │   └── VideoPage.tsx
│   │   │   ├── live/            # 直播页面
│   │   │   │   └── LivePage.tsx
│   │   │   ├── upload/          # 上传页面
│   │   │   │   └── UploadPage.tsx
│   │   │   └── ...
│   │   │
│   │   ├── hooks/               # 自定义Hook
│   │   │   └── useInfiniteScroll.ts
│   │   │
│   │   ├── services/            # API服务
│   │   ├── store/               # Redux状态管理
│   │   │   ├── slices/          # Redux切片
│   │   │   └── types/           # Store类型
│   │   │
│   │   ├── styles/              # 样式文件
│   │   │   ├── global.css       # 全局样式
│   │   │   └── variables.css    # CSS变量
│   │   │
│   │   ├── types/               # TypeScript类型
│   │   │   ├── api.ts           # API类型
│   │   │   ├── components.ts    # 组件类型
│   │   │   └── index.ts         # 导出类型
│   │   │
│   │   ├── utils/               # 工具函数
│   │   │   └── responsive.ts    # 响应式工具
│   │   │
│   │   ├── App.tsx              # 应用入口组件
│   │   └── main.tsx             # 应用启动文件
│   │
│   ├── package.json             # 依赖配置
│   ├── tsconfig.json            # TypeScript配置
│   ├── vite.config.ts           # Vite构建配置
│   └── eslint.config.js         # ESLint配置
│
├── docs/                        # 项目文档 📚
│   ├── api/                     # API文档
│   ├── deployment/              # 部署文档
│   └── development/             # 开发文档
│
├── scripts/                     # 脚本文件 🔧
│   ├── build.sh                 # 构建脚本
│   ├── deploy.sh                # 部署脚本
│   ├── create-admin.js          # 创建管理员
│   └── cleanup.js               # 数据清理
│
└── docker/                      # Docker相关 🐳
    ├── Dockerfile.frontend      # 前端Docker文件
    ├── Dockerfile.backend       # 后端Docker文件
    └── nginx.conf               # Nginx配置
```

---

## 🔄 开发指南

### 开发环境配置

#### 1. 代码编辑器推荐
- **VS Code** (推荐) + 以下插件：
  ```bash
  # 安装推荐插件
  code --install-extension ms-vscode.vscode-typescript-next
  code --install-extension bradlc.vscode-tailwindcss
  code --install-extension esbenp.prettier-vscode
  code --install-extension ms-vscode.vscode-eslint
  code --install-extension formulahendry.auto-rename-tag
  ```

#### 2. Git提交规范
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
```

#### 3. 代码规范
```bash
# 代码格式化
npm run format

# 代码检查
npm run lint
npm run lint:fix

# 类型检查
npm run type-check
```

### 开发流程

#### 1. 功能开发流程
```bash
# 1. 创建功能分支
git checkout -b feature/video-recommendation

# 2. 开发功能
# - 编写代码
# - 添加测试
# - 更新文档

# 3. 提交代码
git add .
git commit -m "feat(recommend): 实现视频推荐算法"

# 4. 推送分支
git push origin feature/video-recommendation

# 5. 创建Pull Request
# 在GitHub/GitLab上创建PR，等待代码审核
```

#### 2. 本地调试
```bash
# 后端调试
cd backend
npm run dev          # 启动开发服务器
npm run debug        # 启动调试模式

# 前端调试
cd frontend
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run preview      # 预览生产版本
```

#### 3. 测试执行
```bash
# 单元测试
npm run test

# 测试覆盖率
npm run test:coverage

# 端到端测试
npm run test:e2e
```

### 添加新功能模块

#### 1. 后端API开发
```typescript
// 1. 创建模型 (models/NewFeature.ts)
import mongoose, { Schema, Document } from 'mongoose';

export interface INewFeature extends Document {
  name: string;
  description: string;
}

const NewFeatureSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model<INewFeature>('NewFeature', NewFeatureSchema);

// 2. 创建服务 (services/NewFeatureService.ts)
export class NewFeatureService {
  async create(data: any) {
    // 业务逻辑
  }
}

// 3. 创建控制器 (controllers/NewFeatureController.ts)
export class NewFeatureController {
  async create(req: Request, res: Response) {
    // 处理HTTP请求
  }
}

// 4. 创建路由 (routes/newFeature.ts)
import { Router } from 'express';
const router = Router();
router.post('/', NewFeatureController.create);
export default router;
```

#### 2. 前端组件开发
```typescript
// 1. 创建类型 (types/newFeature.ts)
export interface NewFeature {
  id: string;
  name: string;
  description: string;
}

// 2. 创建API服务 (services/newFeatureAPI.ts)
export const newFeatureAPI = {
  create: (data: CreateNewFeatureRequest) => 
    api.post<NewFeature>('/new-features', data),
  list: () => 
    api.get<NewFeature[]>('/new-features')
};

// 3. 创建Redux切片 (store/slices/newFeatureSlice.ts)
export const newFeatureSlice = createSlice({
  name: 'newFeature',
  initialState,
  reducers: {
    // reducer逻辑
  }
});

// 4. 创建组件 (components/NewFeature.tsx)
export const NewFeature: React.FC = () => {
  // 组件逻辑
  return <div>New Feature Component</div>;
};
```

---

## 🚀 部署指南

### Docker部署 (推荐)

#### 1. 生产环境一键部署
```bash
# 克隆项目
git clone https://github.com/your-org/daxiong-video-platform.git
cd daxiong-video-platform

# 配置环境变量
cp backend/.env.example backend/.env
# 编辑 .env 文件，填入生产环境配置

# 构建并启动所有服务
docker-compose -f docker-compose.prod.yml up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f app
```

#### 2. Docker Compose配置
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build: 
      context: ./backend
      target: production
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    depends_on:
      - mongodb
      - redis
    
  frontend:
    build: ./frontend
    restart: unless-stopped
    depends_on:
      - app
    
  mongodb:
    image: mongo:6.0
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${DB_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${DB_PASS}
    volumes:
      - mongodb_data:/data/db
    
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes --maxmemory 1gb
    volumes:
      - redis_data:/data
    
  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - app
      - frontend

volumes:
  mongodb_data:
  redis_data:
```

### 传统部署方式

#### 1. 服务器准备
```bash
# 系统要求：Ubuntu 20.04+ / CentOS 8+
# 最低配置：4核CPU, 8GB内存, 100GB存储

# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装PM2
sudo npm install -g pm2

# 安装Nginx
sudo apt install nginx

# 配置防火墙
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable
```

#### 2. 应用部署
```bash
# 1. 部署后端
cd backend
npm ci --production
npm run build

# 使用PM2启动应用
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# 2. 部署前端
cd ../frontend
npm ci
npm run build

# 将构建文件复制到Nginx目录
sudo cp -r dist/* /var/www/html/

# 3. 配置Nginx
sudo cp docker/nginx.conf /etc/nginx/sites-available/daxiong
sudo ln -s /etc/nginx/sites-available/daxiong /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL证书配置

#### 1. Let's Encrypt免费证书
```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### 2. Nginx SSL配置
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    
    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
}
```

### Kubernetes部署 (可选)

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: daxiong-video-api
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
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

---

## 📊 监控运维

### 系统监控

#### 1. Prometheus + Grafana
```yaml
# monitoring/docker-compose.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    
  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  prometheus_data:
  grafana_data:
```

#### 2. 健康检查
```bash
# 健康检查脚本
curl -f http://localhost:3000/api/health || exit 1

# 系统状态检查
#!/bin/bash
echo "=== 系统状态检查 ==="
echo "时间: $(date)"

# 检查服务状态
systemctl is-active --quiet mongod && echo "✓ MongoDB: 运行中" || echo "✗ MongoDB: 停止"
systemctl is-active --quiet redis && echo "✓ Redis: 运行中" || echo "✗ Redis: 停止" 
pm2 list | grep online > /dev/null && echo "✓ Node.js: 运行中" || echo "✗ Node.js: 停止"

# 检查端口
netstat -tlnp | grep :3000 > /dev/null && echo "✓ API服务: 正常" || echo "✗ API服务: 异常"
```

#### 3. 日志管理
```javascript
// 日志配置 (config/logger.js)
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d'
    }),
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d'
    })
  ]
});

export default logger;
```

### 性能优化

#### 1. 数据库优化
```javascript
// MongoDB索引创建
db.videos.createIndex({ "uploader": 1, "createdAt": -1 });
db.videos.createIndex({ "category": 1, "status": 1 });
db.comments.createIndex({ "videoId": 1, "createdAt": -1 });
db.users.createIndex({ "email": 1 }, { unique: true });

// 查询优化
const videos = await Video.find({ category: 'entertainment' })
  .sort({ createdAt: -1 })
  .limit(20)
  .select('title thumbnail stats')
  .populate('uploader', 'username nickname avatar')
  .lean(); // 返回普通对象，提升性能
```

#### 2. 缓存策略
```javascript
// Redis缓存配置
const cacheConfig = {
  // 热点视频缓存 1小时
  hotVideos: { ttl: 3600 },
  // 用户信息缓存 30分钟  
  userInfo: { ttl: 1800 },
  // 推荐结果缓存 15分钟
  recommendations: { ttl: 900 }
};

// 缓存使用示例
const getCachedVideoList = async (category) => {
  const cacheKey = `videos:${category}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const videos = await Video.find({ category }).lean();
  await redis.setex(cacheKey, 3600, JSON.stringify(videos));
  
  return videos;
};
```

### 备份恢复

#### 1. 数据库备份
```bash
#!/bin/bash
# backup.sh - 数据库备份脚本

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup"
DB_NAME="daxiong_video"

# MongoDB备份
mongodump --db $DB_NAME --out $BACKUP_DIR/mongodb_$DATE

# 压缩备份文件
tar -czf $BACKUP_DIR/mongodb_$DATE.tar.gz -C $BACKUP_DIR mongodb_$DATE
rm -rf $BACKUP_DIR/mongodb_$DATE

# 删除7天前的备份
find $BACKUP_DIR -name "mongodb_*.tar.gz" -mtime +7 -delete

echo "备份完成: $BACKUP_DIR/mongodb_$DATE.tar.gz"
```

#### 2. 自动备份计划
```bash
# 添加到crontab
crontab -e

# 每天凌晨2点备份
0 2 * * * /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1

# 每周日备份文件到云存储
0 3 * * 0 aws s3 cp /backup/ s3://daxiong-backups/ --recursive --exclude "*" --include "*.tar.gz"
```

---

## 🤝 贡献指南

### 如何贡献

我们欢迎各种形式的贡献！无论是：
- 🐛 **Bug报告** - 发现问题并创建Issue
- 💡 **功能建议** - 提出新功能想法
- 🔧 **代码贡献** - 提交Pull Request
- 📚 **文档改进** - 完善项目文档
- 🌐 **翻译** - 帮助项目国际化

### 贡献流程

#### 1. 准备工作
```bash
# Fork项目到你的GitHub账号
# 克隆Fork的项目
git clone https://github.com/your-username/daxiong-video-platform.git
cd daxiong-video-platform

# 添加upstream远程仓库
git remote add upstream https://github.com/original-org/daxiong-video-platform.git

# 安装依赖
npm install
```

#### 2. 开发新功能
```bash
# 创建功能分支
git checkout -b feature/your-feature-name

# 进行开发
# - 编写代码
# - 添加测试
# - 更新文档

# 提交更改
git add .
git commit -m "feat: 添加您的功能描述"

# 推送到您的Fork
git push origin feature/your-feature-name
```

#### 3. 提交Pull Request
1. 在GitHub上创建Pull Request
2. 填写PR模板，详细描述改动
3. 等待代码审核和反馈
4. 根据反馈修改代码
5. PR被合并后，删除功能分支

### 代码规范

#### 提交信息规范
```bash
# 格式: type(scope): description
feat(video): 添加视频自动转码功能
fix(auth): 修复登录状态异常问题
docs(readme): 更新安装指南
style(ui): 调整按钮样式
refactor(api): 重构用户认证逻辑
test(unit): 添加视频上传测试用例
chore(deps): 更新依赖包版本
```

#### 代码风格
- 使用TypeScript编写所有新代码
- 遵循ESLint和Prettier配置
- 编写有意义的变量和函数名
- 添加必要的注释和文档
- 保持函数简洁，单一职责

#### 测试要求
```bash
# 运行测试
npm run test

# 检查测试覆盖率 (要求 > 80%)
npm run test:coverage

# 运行端到端测试
npm run test:e2e
```

### Issue指南

#### Bug报告模板
```markdown
**Bug描述**
简洁清晰地描述这个bug

**复现步骤**
1. 进入 '...'
2. 点击 '....'
3. 滚动到 '....'
4. 看到错误

**期望行为**
清晰简洁地描述您期望发生什么

**截图**
如果适用，请添加截图以帮助解释您的问题

**环境信息:**
- 操作系统: [例如 Windows 10]
- 浏览器: [例如 Chrome 91.0]
- 版本: [例如 v1.0.0]

**其他上下文**
在此处添加有关问题的任何其他上下文
```

#### 功能请求模板
```markdown
**功能描述**
简洁清晰地描述您希望实现的功能

**解决的问题**
这个功能解决什么问题？

**建议的解决方案**
您希望如何实现这个功能？

**替代方案**
您考虑过的其他替代解决方案

**其他信息**
添加任何其他关于功能请求的信息或截图
```

### 社区准则

- **尊重他人** - 保持友善和专业的沟通方式
- **建设性反馈** - 提供有用的建议和批评
- **包容性** - 欢迎不同背景的贡献者
- **耐心** - 理解每个人的经验水平不同
- **协作** - 共同努力改进项目

### 获得帮助

如果您在贡献过程中遇到问题：

1. **查看文档** - 首先查看README和相关文档
2. **搜索Issue** - 查看是否有类似的问题已被讨论
3. **创建Issue** - 如果找不到答案，创建新的Issue
4. **联系维护者** - 通过邮件或即时通讯工具联系

### 贡献者列表

感谢所有为这个项目做出贡献的开发者！

<!-- 这里会自动生成贡献者列表 -->

---

## 📄 许可证

本项目采用 **MIT 许可证** 开源。

### MIT License

```
MIT License

Copyright (c) 2024 DAXIONG Video Platform

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### 许可证说明

这意味着您可以：
- ✅ **商业使用** - 在商业项目中使用
- ✅ **修改** - 修改源代码
- ✅ **分发** - 分发原始或修改后的代码
- ✅ **私人使用** - 在私人项目中使用
- ✅ **专利使用** - 使用任何贡献者的专利权

但需要：
- 📋 **包含许可证** - 在所有副本中包含许可证
- 📋 **包含版权声明** - 保留原始版权声明

不提供：
- ❌ **责任** - 作者不承担任何责任
- ❌ **保证** - 不提供任何形式的保证

---

## 📞 联系我们

### 🔗 项目链接
- **官方网站**: [https://daxiong.com](https://daxiong.com)
- **GitHub**: [https://github.com/daxiong-org/video-platform](https://github.com/daxiong-org/video-platform)
- **技术文档**: [https://docs.daxiong.com](https://docs.daxiong.com)
- **API文档**: [https://api-docs.daxiong.com](https://api-docs.daxiong.com)
- **在线演示**: [https://demo.daxiong.com](https://demo.daxiong.com)

### 💬 社区支持
- **QQ技术群**: 123456789
- **微信群**: 扫描二维码加入
- **Discord**: [https://discord.gg/daxiong](https://discord.gg/daxiong)
- **邮件列表**: [dev@daxiong.com](mailto:dev@daxiong.com)

### 📧 技术支持
- **Bug反馈**: [GitHub Issues](https://github.com/daxiong-org/video-platform/issues)
- **技术咨询**: [support@daxiong.com](mailto:support@daxiong.com)
- **商务合作**: [business@daxiong.com](mailto:business@daxiong.com)

### 📚 学习资源
- [MongoDB官方文档](https://docs.mongodb.com/)
- [Redis官方文档](https://redis.io/documentation)
- [Node.js最佳实践](https://github.com/goldbergyoni/nodebestpractices)
- [React官方文档](https://react.dev/)
- [TypeScript官方文档](https://www.typescriptlang.org/docs/)

---

## 🎉 致谢

### 开源项目致谢
感谢以下开源项目为本项目提供的支持：

- [React](https://react.dev/) - 用户界面构建
- [Node.js](https://nodejs.org/) - 服务器端运行环境
- [MongoDB](https://www.mongodb.com/) - 文档数据库
- [Redis](https://redis.io/) - 内存数据库
- [Ant Design](https://ant.design/) - 企业级UI设计语言
- [TypeScript](https://www.typescriptlang.org/) - JavaScript的超集
- [FFmpeg](https://ffmpeg.org/) - 多媒体框架
- [Video.js](https://videojs.com/) - 视频播放器

### 技术顾问
- 感谢所有为项目提供技术指导的专家
- 感谢社区贡献者的宝贵建议
- 感谢Beta测试用户的反馈

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给我们一个Star！**

**🚀 让我们一起打造更好的视频平台！**

---

*最后更新时间: 2024年8月30日*  
*版本: v1.0.0*  
*文档维护: 大雄技术团队*

</div>#   v i d e o _ w e b s i t e s  
 