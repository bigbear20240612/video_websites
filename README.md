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

### Next.js版本启动 (推荐) 🔥
```bash
# 根目录Next.js项目启动
npm install --force
npm run dev

# 访问：http://localhost:3000
```

---

## 📦 项目结构

```
daxiong-video-platform/
├── 📄 README.md                    # 项目说明文档
├── 📋 package.json                 # Next.js项目配置
├── 🎨 next.config.js              # Next.js配置
├── 🔧 vercel.json                 # Vercel部署配置
├── 📄 tsconfig.json               # TypeScript配置
├── 🎨 tailwind.config.js          # Tailwind CSS配置
├── 🐳 docker-compose.yml          # Docker编排文件
│
├── src/                           # Next.js源代码 🚀
│   ├── app/                       # App Router
│   │   ├── layout.tsx             # 根布局
│   │   ├── page.tsx               # 首页
│   │   ├── globals.css            # 全局样式
│   │   └── api/                   # API Routes
│   │       ├── auth/              # 认证API
│   │       ├── videos/            # 视频API
│   │       └── categories/        # 分类API
│   ├── components/                # React组件
│   │   ├── pages/                 # 页面组件
│   │   └── Providers.tsx          # 全局Provider
│   └── lib/                       # 工具库
│       ├── store.ts               # Redux Store
│       └── features/              # Redux切片
│
├── frontend/                      # Vite前端项目 💻
│   ├── src/                       # Vite源代码
│   │   ├── components/            # 组件库
│   │   ├── pages/                 # 页面组件
│   │   ├── hooks/                 # 自定义Hook
│   │   └── store/                 # 状态管理
│   └── package.json               # Vite依赖配置
│
├── backend/                       # Node.js后端 🖥️
│   ├── src/                       # 后端源代码
│   │   ├── controllers/           # 控制器
│   │   ├── models/                # 数据模型
│   │   ├── services/              # 业务服务
│   │   ├── routes/                # 路由定义
│   │   └── middleware/            # 中间件
│   └── OPERATION_GUIDE.md         # 详细操作指南
│
└── docs/                          # 项目文档 📚
    ├── api/                       # API文档
    ├── deployment/                # 部署文档
    └── development/               # 开发文档
```

---

## 🚀 Vercel部署配置

### 推荐部署架构
**Next.js项目 (根目录)** - 最适合Vercel部署

### 部署配置
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install --force",
  "devCommand": "npm run dev"
}
```

### 环境变量
```bash
JWT_SECRET=your-super-secret-jwt-key
NEXT_PUBLIC_APP_NAME=DAXIONG 视频平台
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_API_URL=https://your-app.vercel.app/api
```

### 部署步骤
1. 连接GitHub仓库到Vercel
2. 选择Next.js框架预设
3. 配置环境变量
4. 一键部署

---

## 🔧 开发指南

### 本地开发
```bash
# Next.js开发模式
npm run dev

# 类型检查
npm run type-check

# 代码检查
npm run lint
```

### 代码提交规范
```bash
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式化
refactor: 代码重构
test: 测试相关
```

### 测试
```bash
# 构建测试
npm run build

# 预览构建结果
npm run start
```

---

## 📚 API文档

### 基础信息
- **Base URL**: `/api`
- **认证方式**: Bearer Token (JWT)
- **数据格式**: JSON

### 主要接口
```http
# 认证相关
POST   /api/auth/login        # 用户登录
POST   /api/auth/register     # 用户注册

# 视频相关
GET    /api/videos            # 获取视频列表
GET    /api/videos/:id        # 获取视频详情
POST   /api/videos            # 上传视频

# 分类相关
GET    /api/categories        # 获取分类列表
```

---

## 🤝 贡献指南

### 如何贡献
1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 创建Pull Request

### 代码规范
- 使用TypeScript
- 遵循ESLint配置
- 编写有意义的提交信息
- 添加必要的测试

---

## 📄 许可证

本项目采用 **MIT 许可证** 开源。

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

---

## 📞 联系我们

### 🔗 项目链接
- **GitHub**: [https://github.com/daxiong-org/video-platform](https://github.com/daxiong-org/video-platform)
- **技术文档**: [https://docs.daxiong.com](https://docs.daxiong.com)
- **在线演示**: [https://demo.daxiong.com](https://demo.daxiong.com)

### 💬 技术支持
- **Bug反馈**: [GitHub Issues](https://github.com/daxiong-org/video-platform/issues)
- **技术咨询**: support@daxiong.com
- **商务合作**: business@daxiong.com

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给我们一个Star！**

**🚀 让我们一起打造更好的视频平台！**

---

*最后更新时间: 2024年8月31日*  
*版本: v1.0.0*  
*文档维护: 大雄技术团队*

</div>