# 🚀 Vercel 部署指南

## 📋 目录

- [🎯 部署概述](#部署概述)
- [⚙️ 部署配置](#部署配置)
- [🔧 详细步骤](#详细步骤)
- [🌍 环境变量配置](#环境变量配置)
- [📊 部署监控](#部署监控)
- [🐛 故障排除](#故障排除)
- [📚 后续操作](#后续操作)

---

## 🎯 部署概述

### 项目架构
本项目包含三种架构，**推荐部署 Next.js 版本**：

| 架构类型 | 位置 | Vercel 兼容性 | 推荐度 |
|---------|------|--------------|--------|
| **Next.js** | 根目录 | ✅ 完美兼容 | ⭐⭐⭐⭐⭐ |
| **Vite** | `frontend/` | ✅ 需配置 | ⭐⭐⭐ |
| **Node.js** | `backend/` | ⚠️ 仅API Routes | ⭐⭐ |

### 部署优势
- ✅ **零配置部署** - Next.js 原生支持
- ✅ **自动 HTTPS** - 免费SSL证书
- ✅ **全球 CDN** - 边缘缓存加速
- ✅ **自动扩展** - 无服务器架构
- ✅ **预览部署** - 每个PR自动预览

---

## ⚙️ 部署配置

### Vercel 控制台配置

#### 1. 项目基础设置

| 配置项 | 推荐值 | 说明 |
|--------|--------|------|
| **Project Name** | `daxiong-video-platform` | 项目名称 |
| **Framework Preset** | **Next.js** | ⚠️ 必须选择 |
| **Root Directory** | `./` | 根目录部署 |

#### 2. 构建设置

| 配置项 | 值 | 说明 |
|--------|-----|------|
| **Build Command** | `npm run build` | 构建命令 |
| **Output Directory** | `.next` | 输出目录 |
| **Install Command** | `npm install --force` | 安装命令 |
| **Dev Command** | `npm run dev` | 开发命令 |

### vercel.json 配置文件

项目已包含 `vercel.json` 配置文件：

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
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/placeholder/:path*",
      "destination": "/api/placeholder"
    }
  ],
  "env": {
    "NEXT_PUBLIC_APP_NAME": "DAXIONG 视频平台",
    "NEXT_PUBLIC_APP_URL": "https://your-app-name.vercel.app"
  }
}
```

---

## 🔧 详细步骤

### 步骤 1: 准备 GitHub 仓库

```bash
# 确保代码已推送到 GitHub
git add .
git commit -m "feat: 准备 Vercel 部署"
git push origin main
```

### 步骤 2: 连接 Vercel

1. 访问 [vercel.com](https://vercel.com)
2. 点击 **"New Project"**
3. 选择 **"Import Git Repository"**
4. 连接你的 GitHub 账号
5. 选择 `video_websites` 仓库

### 步骤 3: 配置项目设置

#### 基础配置
```
Project Name: daxiong-video-platform
Framework: Next.js (重要！)
Root Directory: ./
```

#### 构建配置
```
Build Command: npm run build
Output Directory: .next
Install Command: npm install --force
```

### 步骤 4: 环境变量配置

在 Vercel 控制台的 "Environment Variables" 部分添加：

#### 必需变量 (Required)
```bash
JWT_SECRET=daxiong-jwt-secret-vercel-2025-production
NEXT_PUBLIC_APP_NAME=DAXIONG 视频平台
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
NEXT_PUBLIC_API_URL=https://your-project.vercel.app/api
```

#### 可选变量 (Optional)
```bash
NODE_ENV=production
UPLOAD_MAX_SIZE=100MB
ALLOWED_VIDEO_FORMATS=mp4,avi,mov,wmv,flv,webm
ALLOWED_IMAGE_FORMATS=jpg,jpeg,png,gif,webp
```

### 步骤 5: 部署

1. 点击 **"Deploy"** 按钮
2. 等待构建完成（约 3-5 分钟）
3. 获取部署 URL

---

## 🌍 环境变量配置

### 环境变量详解

| 变量名 | 类型 | 示例值 | 说明 |
|--------|------|--------|------|
| `JWT_SECRET` | **必需** | `your-secret-key-32-chars-min` | JWT加密密钥 |
| `NEXT_PUBLIC_APP_NAME` | **必需** | `DAXIONG 视频平台` | 应用名称 |
| `NEXT_PUBLIC_APP_URL` | **必需** | `https://your-app.vercel.app` | 应用URL |
| `NEXT_PUBLIC_API_URL` | **必需** | `https://your-app.vercel.app/api` | API基础URL |
| `NODE_ENV` | 推荐 | `production` | 环境标识 |
| `UPLOAD_MAX_SIZE` | 可选 | `100MB` | 文件上传限制 |
| `ALLOWED_VIDEO_FORMATS` | 可选 | `mp4,avi,mov,wmv,flv,webm` | 支持的视频格式 |
| `ALLOWED_IMAGE_FORMATS` | 可选 | `jpg,jpeg,png,gif,webp` | 支持的图片格式 |

### 配置步骤

1. **进入项目设置**
   - 部署成功后，进入项目控制台
   - 点击 "Settings" 选项卡

2. **添加环境变量**
   - 点击 "Environment Variables"
   - 逐一添加上述变量

3. **重新部署**
   - 添加环境变量后需要重新部署
   - 点击 "Deployments" → "Redeploy"

### 环境变量安全注意事项

- ❌ **不要** 在代码中硬编码密钥
- ✅ **使用** `NEXT_PUBLIC_` 前缀暴露客户端变量
- ✅ **定期更换** JWT 密钥
- ✅ **使用强密码** (至少32字符)

---

## 📊 部署监控

### 构建日志监控

部署过程中，关注以下关键日志：

```bash
# 1. 依赖安装
✓ Installing dependencies...
npm install --force

# 2. Next.js 构建
✓ Creating an optimized production build...
Route (app)                        Size     First Load JS
┌ ○ /                             1.23 kB    87.2 kB
├ ○ /api/auth/login               0 B            0 B
└ ○ /api/videos                   0 B            0 B

# 3. 部署成功
✓ Deployment completed
🎉 Assigned to https://your-project.vercel.app
```

### 性能指标

部署后检查以下性能指标：

| 指标 | 目标值 | 检查方法 |
|------|--------|----------|
| **首屏加载时间** | < 2秒 | Lighthouse |
| **构建时间** | < 5分钟 | Vercel 控制台 |
| **Bundle 大小** | < 500KB | 构建日志 |
| **API 响应时间** | < 1秒 | Network 面板 |

### 健康检查

```bash
# 检查主页
curl -I https://your-project.vercel.app
# 预期: HTTP/2 200

# 检查 API
curl https://your-project.vercel.app/api/videos
# 预期: JSON 响应

# 检查静态资源
curl -I https://your-project.vercel.app/_next/static/
# 预期: HTTP/2 200
```

---

## 🐛 故障排除

### 常见问题及解决方案

#### 1. 构建失败

**问题**: `Build failed with exit code 1`

**解决方案**:
```bash
# 检查 package.json 中的构建脚本
"scripts": {
  "build": "next build",
  "start": "next start"
}

# 本地测试构建
npm run build
```

#### 2. 依赖安装错误

**问题**: `npm install failed`

**解决方案**:
- 使用 `npm install --force`
- 检查 Node.js 版本兼容性
- 清理 `node_modules` 重新安装

#### 3. API 路由不工作

**问题**: `API routes return 404`

**解决方案**:
```typescript
// 确保 API 路由文件结构正确
src/app/api/
├── auth/
│   └── login/
│       └── route.ts
└── videos/
    └── route.ts
```

#### 4. 环境变量未生效

**问题**: `Environment variables undefined`

**解决方案**:
1. 检查变量名拼写
2. 客户端变量需要 `NEXT_PUBLIC_` 前缀
3. 添加变量后重新部署

#### 5. CSS/样式问题

**问题**: `Styles not loading correctly`

**解决方案**:
```javascript
// next.config.js
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  compiler: {
    styledComponents: true, // 确保 styled-components 配置
  }
}
```

### 调试工具

#### Vercel CLI
```bash
# 安装 Vercel CLI
npm i -g vercel

# 本地预览
vercel dev

# 查看部署状态
vercel ls

# 查看部署日志
vercel logs [deployment-url]
```

#### 日志分析
```bash
# 实时日志
vercel logs --follow

# 特定函数日志
vercel logs [deployment-url] --since=1h
```

---

## 📚 后续操作

### 自定义域名配置

1. **购买域名**
   - 推荐: Namecheap, GoDaddy
   - 或使用现有域名

2. **在 Vercel 添加域名**
   ```
   项目设置 → Domains → Add Domain
   输入: yourdomain.com
   ```

3. **配置 DNS**
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   
   Type: A
   Name: @
   Value: 76.76.19.61
   ```

### 自动部署配置

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### 性能优化

#### 1. 图片优化
```typescript
import Image from 'next/image'

export default function VideoThumbnail({ src, alt }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={320}
      height={180}
      priority
      placeholder="blur"
    />
  )
}
```

#### 2. 代码分割
```typescript
import dynamic from 'next/dynamic'

const VideoPlayer = dynamic(() => import('./VideoPlayer'), {
  loading: () => <div>Loading player...</div>,
  ssr: false
})
```

#### 3. 缓存策略
```javascript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 's-maxage=1, stale-while-revalidate=59',
          },
        ],
      },
    ]
  },
}
```

### 监控与分析

#### 1. 集成分析工具
```javascript
// next.config.js
const nextConfig = {
  experimental: {
    optimizeCss: true,
  },
  webpack: (config) => {
    config.optimization.splitChunks = {
      chunks: 'all',
    }
    return config
  }
}
```

#### 2. 错误监控
```typescript
// 集成 Sentry
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
})
```

### 扩展功能

#### 1. 数据库集成
- **Vercel Postgres** - 官方数据库
- **PlanetScale** - 无服务器 MySQL
- **MongoDB Atlas** - 文档数据库
- **Supabase** - 开源替代方案

#### 2. 存储集成
- **Vercel Blob** - 文件存储
- **AWS S3** - 对象存储
- **Cloudinary** - 图片/视频处理

#### 3. 认证集成
- **NextAuth.js** - 认证框架
- **Auth0** - 身份验证服务
- **Clerk** - 用户管理

---

## 🎉 部署成功检查清单

### ✅ 基础功能测试

- [ ] 主页正常加载
- [ ] API 路由响应正常
- [ ] 静态资源加载成功
- [ ] 环境变量正确配置

### ✅ 性能检查

- [ ] Lighthouse 分数 > 90
- [ ] 首屏加载时间 < 3秒
- [ ] Core Web Vitals 达标
- [ ] 移动端适配正常

### ✅ 功能验证

- [ ] 用户认证流程
- [ ] API 接口调用
- [ ] 视频播放功能
- [ ] 响应式设计

### ✅ 安全检查

- [ ] HTTPS 正常启用
- [ ] 敏感信息未暴露
- [ ] CORS 配置正确
- [ ] API 限流配置

---

## 📞 获取支持

### 官方资源
- **Vercel 文档**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js 文档**: [nextjs.org/docs](https://nextjs.org/docs)
- **Vercel 社区**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)

### 项目支持
- **GitHub Issues**: [项目Issues页面]
- **技术支持**: support@daxiong.com
- **开发文档**: 查看项目 `README.md`

---

<div align="center">

**🎉 恭喜！您已成功部署 DAXIONG 视频平台到 Vercel！**

**🚀 享受无服务器部署的强大威力！**

---

*最后更新: 2024年8月31日*  
*版本: v1.0.0*  
*维护: DAXIONG 技术团队*

</div>