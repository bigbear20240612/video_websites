# 🌍 环境变量配置指南

## 📋 目录

- [🎯 配置概述](#配置概述)
- [🚀 Vercel部署配置](#vercel部署配置)
- [🏠 本地开发配置](#本地开发配置)
- [🔀 多环境配置策略](#多环境配置策略)
- [⚙️ 高级配置模式](#高级配置模式)
- [🔧 配置验证](#配置验证)
- [🐛 常见问题](#常见问题)

---

## 🎯 配置概述

### 关键环境变量说明

| 变量名 | 作用域 | 说明 |
|--------|--------|------|
| `NEXT_PUBLIC_APP_URL` | 客户端 | 应用的完整URL，用于SEO、分享、重定向 |
| `NEXT_PUBLIC_API_URL` | 客户端 | API接口的基础URL，前端请求时使用 |

### 配置原则

1. **开发环境** - 使用本地地址，便于调试
2. **预览环境** - 使用临时Vercel URL，测试功能
3. **生产环境** - 使用自定义域名，提升品牌形象
4. **API分离** - API可以与前端使用不同域名

---

## 🚀 Vercel部署配置

### 情况1: 单一应用部署（推荐）

前端和API都部署在同一个Vercel项目中（Next.js App Router）

```bash
# 生产环境
NEXT_PUBLIC_APP_URL=https://daxiong-video.vercel.app
NEXT_PUBLIC_API_URL=https://daxiong-video.vercel.app/api

# 或使用自定义域名
NEXT_PUBLIC_APP_URL=https://video.daxiong.com
NEXT_PUBLIC_API_URL=https://video.daxiong.com/api
```

**适用场景**:
- ✅ Next.js 全栈应用
- ✅ API Routes + 前端
- ✅ 简单部署，易维护

### 情况2: 使用Vercel自动分配域名

Vercel会自动分配一个域名，格式通常为项目名+随机字符

```bash
# Vercel自动分配的域名示例
NEXT_PUBLIC_APP_URL=https://video-websites-cksn.vercel.app
NEXT_PUBLIC_API_URL=https://video-websites-cksn.vercel.app/api

# 或者更规范的命名
NEXT_PUBLIC_APP_URL=https://daxiong-video-platform.vercel.app
NEXT_PUBLIC_API_URL=https://daxiong-video-platform.vercel.app/api
```

**配置步骤**:
1. 部署完成后，Vercel会提供URL
2. 将此URL配置到环境变量
3. 重新部署使配置生效

### 情况3: 自定义域名配置

```bash
# 主域名配置
NEXT_PUBLIC_APP_URL=https://daxiong.video
NEXT_PUBLIC_API_URL=https://daxiong.video/api

# 或子域名配置
NEXT_PUBLIC_APP_URL=https://app.daxiong.com
NEXT_PUBLIC_API_URL=https://app.daxiong.com/api

# 或API独立子域名
NEXT_PUBLIC_APP_URL=https://daxiong.video
NEXT_PUBLIC_API_URL=https://api.daxiong.video
```

**DNS配置**:
```dns
# 主域名
Type: A
Name: @
Value: 76.76.19.61

# www子域名
Type: CNAME  
Name: www
Value: cname.vercel-dns.com

# API子域名（如果独立）
Type: CNAME
Name: api  
Value: cname.vercel-dns.com
```

### 情况4: 多区域部署

```bash
# 全球主站
NEXT_PUBLIC_APP_URL=https://video.daxiong.com
NEXT_PUBLIC_API_URL=https://api.daxiong.com

# 中国区域（如果需要）
NEXT_PUBLIC_APP_URL=https://video.daxiong.cn
NEXT_PUBLIC_API_URL=https://api.daxiong.cn

# 开发/测试环境
NEXT_PUBLIC_APP_URL=https://dev-video.daxiong.com
NEXT_PUBLIC_API_URL=https://dev-api.daxiong.com
```

---

## 🏠 本地开发配置

### 标准本地开发

```bash
# .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 本地网络调试

```bash
# 局域网访问（手机测试等）
NEXT_PUBLIC_APP_URL=http://192.168.1.100:3000
NEXT_PUBLIC_API_URL=http://192.168.1.100:3000/api

# 或使用内网穿透工具
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
NEXT_PUBLIC_API_URL=https://abc123.ngrok.io/api
```

### 本地 + 远程API

```bash
# 前端本地开发，API使用远程
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=https://api.daxiong.com

# 前端本地开发，API使用测试环境
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=https://dev-api.daxiong.com
```

---

## 🔀 多环境配置策略

### 方案1: 环境变量区分

```bash
# 开发环境 (.env.development)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# 测试环境 (.env.test)  
NEXT_PUBLIC_APP_URL=https://test-video.daxiong.com
NEXT_PUBLIC_API_URL=https://test-api.daxiong.com

# 预生产环境 (.env.staging)
NEXT_PUBLIC_APP_URL=https://staging-video.daxiong.com
NEXT_PUBLIC_API_URL=https://staging-api.daxiong.com

# 生产环境 (.env.production)
NEXT_PUBLIC_APP_URL=https://video.daxiong.com
NEXT_PUBLIC_API_URL=https://api.daxiong.com
```

### 方案2: Git分支部署

```bash
# main分支 (生产环境)
NEXT_PUBLIC_APP_URL=https://video.daxiong.com
NEXT_PUBLIC_API_URL=https://api.daxiong.com

# develop分支 (测试环境)  
NEXT_PUBLIC_APP_URL=https://dev-video.daxiong.com
NEXT_PUBLIC_API_URL=https://dev-api.daxiong.com

# feature分支 (预览环境)
NEXT_PUBLIC_APP_URL=https://pr-123-video.daxiong.com
NEXT_PUBLIC_API_URL=https://pr-123-api.daxiong.com
```

### 方案3: Vercel预览部署

```bash
# 生产部署
NEXT_PUBLIC_APP_URL=https://video.daxiong.com
NEXT_PUBLIC_API_URL=https://video.daxiong.com/api

# 预览部署（自动生成）
NEXT_PUBLIC_APP_URL=https://video-websites-git-feature-abc-username.vercel.app
NEXT_PUBLIC_API_URL=https://video-websites-git-feature-abc-username.vercel.app/api
```

---

## ⚙️ 高级配置模式

### 动态配置（推荐）

创建配置文件 `src/config/index.ts`:

```typescript
// src/config/index.ts
interface Config {
  APP_URL: string;
  API_URL: string;
  ENVIRONMENT: 'development' | 'test' | 'staging' | 'production';
}

function getConfig(): Config {
  // 优先使用环境变量
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return {
      APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      API_URL: process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_APP_URL + '/api',
      ENVIRONMENT: process.env.NODE_ENV as any || 'development'
    };
  }

  // 根据hostname自动检测环境
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return {
      APP_URL: 'http://localhost:3000',
      API_URL: 'http://localhost:3000/api',
      ENVIRONMENT: 'development'
    };
  }
  
  if (hostname.includes('staging') || hostname.includes('test')) {
    return {
      APP_URL: `https://${hostname}`,
      API_URL: `https://${hostname}/api`,
      ENVIRONMENT: 'staging'
    };
  }
  
  if (hostname.includes('vercel.app')) {
    return {
      APP_URL: `https://${hostname}`,
      API_URL: `https://${hostname}/api`,
      ENVIRONMENT: 'production'
    };
  }

  // 默认生产环境配置
  return {
    APP_URL: 'https://video.daxiong.com',
    API_URL: 'https://api.daxiong.com',
    ENVIRONMENT: 'production'
  };
}

export const config = getConfig();
export default config;
```

### 使用配置文件

```typescript
// 在组件中使用
import config from '@/config';

export default function VideoCard() {
  const shareUrl = `${config.APP_URL}/video/123`;
  
  const fetchVideo = async () => {
    const response = await fetch(`${config.API_URL}/videos/123`);
    return response.json();
  };
  
  return <div>Video Component</div>;
}
```

### 环境检测Hook

```typescript
// src/hooks/useEnvironment.ts
import { useEffect, useState } from 'react';
import config from '@/config';

export function useEnvironment() {
  const [env, setEnv] = useState<{
    isDevelopment: boolean;
    isStaging: boolean;
    isProduction: boolean;
    appUrl: string;
    apiUrl: string;
  }>({
    isDevelopment: false,
    isStaging: false,
    isProduction: false,
    appUrl: '',
    apiUrl: ''
  });

  useEffect(() => {
    setEnv({
      isDevelopment: config.ENVIRONMENT === 'development',
      isStaging: config.ENVIRONMENT === 'staging',
      isProduction: config.ENVIRONMENT === 'production',
      appUrl: config.APP_URL,
      apiUrl: config.API_URL
    });
  }, []);

  return env;
}
```

---

## 🔧 配置验证

### 验证脚本

创建验证脚本 `scripts/validate-env.js`:

```javascript
#!/usr/bin/env node

const requiredVars = [
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_API_URL'
];

const optionalVars = [
  'JWT_SECRET',
  'NODE_ENV',
  'UPLOAD_MAX_SIZE'
];

console.log('🔍 验证环境变量配置...\n');

// 检查必需变量
let hasErrors = false;
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ 缺少必需变量: ${varName}`);
    hasErrors = true;
  } else {
    console.log(`✅ ${varName}: ${value}`);
  }
});

// 检查可选变量
console.log('\n📋 可选变量:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`⚪ ${varName}: 未设置`);
  }
});

// URL格式验证
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

if (appUrl) {
  try {
    new URL(appUrl);
    console.log(`✅ APP_URL 格式正确`);
  } catch (e) {
    console.log(`❌ APP_URL 格式错误: ${appUrl}`);
    hasErrors = true;
  }
}

if (apiUrl) {
  try {
    new URL(apiUrl);
    console.log(`✅ API_URL 格式正确`);
  } catch (e) {
    console.log(`❌ API_URL 格式错误: ${apiUrl}`);
    hasErrors = true;
  }
}

if (hasErrors) {
  console.log('\n❌ 配置验证失败，请检查上述错误');
  process.exit(1);
} else {
  console.log('\n🎉 环境变量配置验证通过！');
}
```

### 添加到package.json

```json
{
  "scripts": {
    "validate:env": "node scripts/validate-env.js",
    "dev": "npm run validate:env && next dev",
    "build": "npm run validate:env && next build"
  }
}
```

### 运行时验证组件

```typescript
// src/components/EnvChecker.tsx
'use client';

import { useEffect, useState } from 'react';

export default function EnvChecker() {
  const [envStatus, setEnvStatus] = useState<{
    appUrl: string;
    apiUrl: string;
    isValid: boolean;
  }>({
    appUrl: '',
    apiUrl: '',
    isValid: false
  });

  useEffect(() => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    
    setEnvStatus({
      appUrl,
      apiUrl,
      isValid: !!(appUrl && apiUrl)
    });
  }, []);

  if (process.env.NODE_ENV === 'production') {
    return null; // 生产环境不显示
  }

  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: envStatus.isValid ? '#d4edda' : '#f8d7da',
      border: `1px solid ${envStatus.isValid ? '#c3e6cb' : '#f5c6cb'}`,
      borderRadius: 4,
      padding: '8px 12px',
      fontSize: 12,
      zIndex: 9999
    }}>
      <div><strong>环境配置状态</strong></div>
      <div>APP_URL: {envStatus.appUrl || '❌ 未配置'}</div>
      <div>API_URL: {envStatus.apiUrl || '❌ 未配置'}</div>
      <div>状态: {envStatus.isValid ? '✅ 正常' : '❌ 异常'}</div>
    </div>
  );
}
```

---

## 🐛 常见问题

### 问题1: API请求失败

**症状**: 前端无法调用API接口

**原因分析**:
```bash
# 错误配置示例
NEXT_PUBLIC_API_URL=http://localhost:3000/api  # 生产环境仍使用localhost
```

**解决方案**:
```bash
# 正确配置
NEXT_PUBLIC_API_URL=https://your-app.vercel.app/api
```

### 问题2: CORS跨域错误

**症状**: `Access-Control-Allow-Origin` 错误

**原因**: API_URL与APP_URL域名不一致

**解决方案**:
```javascript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_APP_URL || '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
        ],
      },
    ];
  },
};
```

### 问题3: 环境变量不生效

**症状**: 代码中获取到 undefined

**常见原因**:
1. 变量名拼写错误
2. 缺少 `NEXT_PUBLIC_` 前缀
3. 部署后未重启

**解决方案**:
```typescript
// 调试用代码
console.log('APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
console.log('API_URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('所有环境变量:', Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')));
```

### 问题4: 本地开发与生产不一致

**症状**: 本地正常，部署后异常

**解决方案**: 使用条件配置
```typescript
const getApiUrl = () => {
  if (typeof window === 'undefined') {
    // 服务器端
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  }
  
  // 客户端
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:3000/api';
  }
  
  return process.env.NEXT_PUBLIC_API_URL || `${window.location.origin}/api`;
};
```

---

## 📋 配置检查清单

### ✅ 配置前检查

- [ ] 确认部署平台（Vercel/Netlify/自建）
- [ ] 确认域名策略（使用默认/自定义域名）
- [ ] 确认API架构（同域/跨域）
- [ ] 确认环境数量（开发/测试/生产）

### ✅ 配置后验证

- [ ] 本地开发环境正常工作
- [ ] API接口调用成功
- [ ] 生产环境部署成功
- [ ] 跨域问题已解决
- [ ] URL分享功能正常

### ✅ 最佳实践

- [ ] 使用HTTPS（生产环境）
- [ ] 域名简洁易记
- [ ] 环境变量命名规范
- [ ] 配置文档完善
- [ ] 有配置验证机制

---

## 🎯 推荐配置方案总结

### 🥇 最佳方案（单应用部署）

```bash
# Vercel环境变量配置
NEXT_PUBLIC_APP_URL=https://video.daxiong.com
NEXT_PUBLIC_API_URL=https://video.daxiong.com/api
JWT_SECRET=your-super-secret-key-32-chars
NODE_ENV=production
```

**优势**: 
- ✅ 配置简单
- ✅ 无跨域问题  
- ✅ SEO友好
- ✅ 维护方便

### 🥈 备选方案（API分离）

```bash
# 前端应用
NEXT_PUBLIC_APP_URL=https://app.daxiong.com
NEXT_PUBLIC_API_URL=https://api.daxiong.com

# API服务
CORS_ORIGIN=https://app.daxiong.com
```

**适用**: 微服务架构，API需要独立扩展

### 🥉 临时方案（使用Vercel域名）

```bash
NEXT_PUBLIC_APP_URL=https://daxiong-video-platform.vercel.app  
NEXT_PUBLIC_API_URL=https://daxiong-video-platform.vercel.app/api
```

**适用**: 快速部署，后续可升级为自定义域名

---

<div align="center">

**🌟 选择适合你的配置方案，开始你的视频平台之旅！**

**📞 需要帮助？查看故障排除章节或联系技术支持**

---

*最后更新: 2024年8月31日*  
*版本: v1.0.0*  
*维护: DAXIONG 技术团队*

</div>