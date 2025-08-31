# DAXIONG 视频平台 - Vercel 部署指南

## 🚀 部署概述

本项目已完全适配 Vercel 平台，支持一键部署。项目基于 Next.js 14 构建，采用 App Router 架构，前后端一体化设计。

## 📋 部署前检查清单

- [x] Next.js 14 项目结构
- [x] TypeScript 配置完整
- [x] API Routes 实现
- [x] Vercel 配置文件 (`vercel.json`)
- [x] 环境变量配置
- [x] 构建脚本配置
- [x] 依赖项清理

## 🛠️ 部署方式

### 方式1: GitHub 自动部署 (推荐)

1. **推送代码到 GitHub**
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

2. **连接 Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 使用 GitHub 账号登录
   - 点击 "New Project"
   - 选择你的 GitHub 仓库
   - 点击 "Deploy"

3. **配置环境变量**
   - 在 Vercel 项目设置中添加环境变量
   - 参考 `env.local.example` 文件

### 方式2: Vercel CLI 部署

1. **安装 Vercel CLI**
```bash
npm i -g vercel
```

2. **登录 Vercel**
```bash
vercel login
```

3. **初始化项目**
```bash
vercel
```

4. **生产部署**
```bash
vercel --prod
```

### 方式3: 一键部署按钮

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/daxiong-video-platform)

## ⚙️ 配置详解

### vercel.json 配置

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

### Next.js 配置

```javascript
// next.config.js
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  compiler: {
    styledComponents: true,
  },
  // Vercel 优化配置
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      path: false,
      os: false,
    };
    return config;
  }
}
```

## 🔐 环境变量配置

### 开发环境
创建 `.env.local` 文件：

```bash
# 应用配置
NEXT_PUBLIC_APP_NAME="DAXIONG 视频平台"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# API 配置
NEXT_PUBLIC_API_URL="http://localhost:3000/api"

# JWT 密钥
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
```

### 生产环境
在 Vercel 项目设置中添加：

```bash
# 应用配置
NEXT_PUBLIC_APP_NAME="DAXIONG 视频平台"
NEXT_PUBLIC_APP_URL="https://your-app-name.vercel.app"

# API 配置  
NEXT_PUBLIC_API_URL="https://your-app-name.vercel.app/api"

# JWT 密钥 (使用强密钥)
JWT_SECRET="your-production-secret-key-very-long-and-secure"

# 其他生产环境配置
NODE_ENV="production"
```

## 📊 部署监控

### 构建日志
- Vercel 提供详细的构建日志
- 可以在项目仪表板查看构建状态
- 支持实时日志流

### 性能监控
- 自动生成 Core Web Vitals 报告
- 函数执行时间监控
- 带宽使用统计

### 错误追踪
- 自动捕获运行时错误
- API 错误日志
- 用户体验监控

## 🔧 故障排除

### 常见问题

1. **构建失败**
```bash
# 检查依赖项
npm run build

# 类型检查
npm run type-check

# 修复 lint 问题
npm run lint -- --fix
```

2. **API 路由 404**
- 确保 API 文件在 `src/app/api/` 目录下
- 检查文件命名规范 (`route.ts`)
- 验证导出的 HTTP 方法 (`GET`, `POST` 等)

3. **环境变量未生效**
- 检查变量名拼写
- 确保在 Vercel 设置中正确配置
- 重新部署项目

4. **静态资源加载失败**
- 检查 `public` 目录结构
- 验证文件路径正确性
- 确保文件大小在限制范围内

### 调试技巧

```bash
# 本地测试生产构建
npm run build && npm run start

# 检查构建输出
npm run build -- --debug

# 分析包大小
npm run build -- --analyze
```

## 🎯 性能优化

### 构建优化
- 自动代码分割
- 静态资源压缩
- 图片优化
- 字体优化

### 运行时优化
- Edge Runtime 支持
- 自动缓存策略
- CDN 分发
- Gzip 压缩

### 数据库集成
```bash
# MongoDB Atlas
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/database"

# PostgreSQL (Vercel Postgres)
POSTGRES_URL="postgres://username:password@host:5432/database"

# Redis (Upstash)
REDIS_URL="rediss://username:password@host:6379"
```

## 📈 扩展建议

### 即将添加的功能
1. **真实数据库集成**
   - MongoDB Atlas 或 Vercel Postgres
   - Prisma ORM 集成

2. **文件上传服务**
   - Vercel Blob 存储
   - AWS S3 集成
   - Cloudinary 图片处理

3. **认证服务**
   - NextAuth.js 集成
   - OAuth 提供商支持
   - 用户会话管理

4. **实时功能**
   - Vercel 支持的 WebSocket
   - 实时评论系统
   - 推送通知

## 🚦 部署检查

部署完成后，请检查以下项目：

- [ ] 主页正常加载
- [ ] API 接口正常响应
- [ ] 占位图片生成正常
- [ ] 响应式设计正常
- [ ] 控制台无错误信息
- [ ] 网络请求正常
- [ ] 路由跳转正常

## 📞 技术支持

如遇到部署问题，请：

1. 检查 Vercel 部署日志
2. 查看本项目的 Issues
3. 参考 Vercel 官方文档
4. 联系开发团队

---

**祝您部署顺利！** 🎉

如有问题，欢迎创建 Issue 或联系开发团队。