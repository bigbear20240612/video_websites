# 设计规范文档 (DESIGN_SPEC.md)

**项目名称：** 大雄视频平台  
**版本：** v1.0  
**更新时间：** 2025-08-25  
**UI/UX设计师：** DAXIONG 设计团队

---

## 1. 设计概述

### 1.1 设计理念
基于腾讯视频、爱奇艺、Bilibili的优秀体验，打造一个**现代简约 + 年轻活力**的综合性视频平台，兼具**专业性**与**社区温度**。

### 1.2 设计原则
- **用户至上**：优化观看体验，减少认知负担
- **内容为王**：突出视频内容，弱化界面干扰
- **社交互动**：强化用户间的互动体验
- **品质一致**：统一的视觉语言和交互标准

### 1.3 目标设备
- **桌面端**：1920x1080、1366x768、2560x1440
- **移动端**：375x667、414x736、390x844
- **平板端**：768x1024、834x1194

---

## 2. 视觉设计系统

### 2.1 品牌色彩系统

#### 主色彩
```css
/* 品牌主色 */
--primary-color: #1890ff;         /* 大雄蓝 - 主品牌色 */
--primary-hover: #40a9ff;         /* 悬停状态 */
--primary-active: #096dd9;        /* 激活状态 */
--primary-disabled: #bae7ff;      /* 禁用状态 */

/* 渐变色 */
--primary-gradient: linear-gradient(135deg, #1890ff 0%, #722ed1 100%);
```

#### 功能色彩
```css
/* VIP会员专用色 */
--vip-color: #722ed1;             /* 紫色系 */
--vip-gradient: linear-gradient(135deg, #722ed1 0%, #eb2f96 100%);

/* 直播专用色 */
--live-color: #ff4d4f;            /* 红色系 */
--live-gradient: linear-gradient(135deg, #ff4d4f 0%, #ff7a45 100%);

/* 状态色彩 */
--success-color: #52c41a;         /* 成功 - 绿色 */
--warning-color: #faad14;         /* 警告 - 橙色 */
--error-color: #ff4d4f;           /* 错误 - 红色 */
--info-color: #1890ff;            /* 信息 - 蓝色 */
```

#### 中性色彩
```css
/* 文字色彩 */
--text-primary: #262626;          /* 主要文字 - 85%透明度 */
--text-secondary: #595959;        /* 次要文字 - 65%透明度 */
--text-tertiary: #8c8c8c;         /* 辅助文字 - 45%透明度 */
--text-disabled: #bfbfbf;         /* 禁用文字 - 25%透明度 */
--text-inverse: #ffffff;          /* 反色文字 */

/* 背景色彩 */
--background-primary: #ffffff;    /* 主背景 */
--background-secondary: #fafafa;  /* 次背景 */
--background-tertiary: #f5f5f5;   /* 三级背景 */
--background-dark: #141414;       /* 深色背景 */

/* 边框色彩 */
--border-color: #d9d9d9;          /* 常规边框 */
--border-light: #f0f0f0;          /* 浅色边框 */
--border-dark: #434343;           /* 深色边框 */
```

#### 弹幕专用色彩
```css
--danmaku-white: #ffffff;         /* 白色弹幕 */
--danmaku-red: #ff6b6b;          /* 红色弹幕 */
--danmaku-orange: #ff9f43;       /* 橙色弹幕 */
--danmaku-yellow: #ffd93d;       /* 黄色弹幕 */
--danmaku-green: #6bcf7f;        /* 绿色弹幕 */
--danmaku-cyan: #4ecdc4;         /* 青色弹幕 */
--danmaku-blue: #45b7d1;         /* 蓝色弹幕 */
--danmaku-purple: #a55eea;       /* 紫色弹幕 */
```

### 2.2 字体系统

#### 字体族定义
```css
/* 中文字体 */
--font-family-zh: 'PingFang SC', 'Microsoft YaHei', '微软雅黑', 
                  'Hiragino Sans GB', sans-serif;

/* 英文字体 */  
--font-family-en: -apple-system, BlinkMacSystemFont, 'Segoe UI', 
                  Roboto, 'Helvetica Neue', Arial, sans-serif;

/* 等宽字体 */
--font-family-mono: 'SFMono-Regular', Consolas, 'Liberation Mono', 
                    Menlo, Courier, monospace;

/* 综合字体族 */
--font-family: var(--font-family-en), var(--font-family-zh);
```

#### 字号规范
```css
/* 标题字号 */
--font-size-h1: 32px;            /* 一级标题 */
--font-size-h2: 24px;            /* 二级标题 */
--font-size-h3: 20px;            /* 三级标题 */
--font-size-h4: 18px;            /* 四级标题 */

/* 正文字号 */
--font-size-lg: 16px;            /* 大号正文 */
--font-size-base: 14px;          /* 基准正文 */
--font-size-sm: 12px;            /* 小号正文 */
--font-size-xs: 10px;            /* 超小字号 */

/* 特殊字号 */
--font-size-display: 48px;       /* 展示标题 */
--font-size-caption: 12px;       /* 说明文字 */
```

#### 行高系统
```css
--line-height-tight: 1.2;       /* 紧密行高 - 标题使用 */
--line-height-base: 1.5;        /* 基准行高 - 正文使用 */
--line-height-loose: 1.8;       /* 宽松行高 - 长文本使用 */
```

#### 字重规范
```css
--font-weight-light: 300;       /* 细体 */
--font-weight-normal: 400;      /* 常规 */
--font-weight-medium: 500;      /* 中等 */
--font-weight-semibold: 600;    /* 半粗体 */
--font-weight-bold: 700;        /* 粗体 */
```

### 2.3 间距系统

#### 基础间距 (8px 网格系统)
```css
--space-xs: 4px;                /* 超小间距 */
--space-sm: 8px;                /* 小间距 */
--space-md: 16px;               /* 中等间距 */
--space-lg: 24px;               /* 大间距 */  
--space-xl: 32px;               /* 超大间距 */
--space-xxl: 48px;              /* 巨大间距 */
--space-xxxl: 64px;             /* 最大间距 */

/* 组件内部间距 */
--padding-xs: 4px 8px;          /* 小按钮内边距 */
--padding-sm: 8px 16px;         /* 常规按钮内边距 */
--padding-md: 12px 20px;        /* 大按钮内边距 */
--padding-lg: 16px 24px;        /* 超大按钮内边距 */
```

#### 容器宽度
```css
--container-xs: 480px;          /* 超小容器 */
--container-sm: 576px;          /* 小容器 */
--container-md: 768px;          /* 中等容器 */
--container-lg: 992px;          /* 大容器 */
--container-xl: 1200px;         /* 超大容器 */
--container-xxl: 1600px;        /* 巨大容器 */

/* 内容最大宽度 */
--max-width-content: 1200px;    /* 主要内容区域 */
--max-width-reading: 800px;     /* 阅读最佳宽度 */
```

### 2.4 圆角与阴影系统

#### 圆角系统
```css
--border-radius-xs: 2px;        /* 超小圆角 */
--border-radius-sm: 4px;        /* 小圆角 - 按钮、输入框 */
--border-radius-base: 8px;      /* 基础圆角 - 卡片 */
--border-radius-lg: 12px;       /* 大圆角 - 大卡片 */
--border-radius-xl: 16px;       /* 超大圆角 - 模态框 */
--border-radius-full: 50%;      /* 圆形 - 头像、图标 */
```

#### 阴影系统
```css
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.03), 
             0 1px 6px rgba(0, 0, 0, 0.03);
             
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.03), 
             0 2px 8px rgba(0, 0, 0, 0.06);
             
--shadow-base: 0 2px 4px rgba(0, 0, 0, 0.03), 
               0 4px 12px rgba(0, 0, 0, 0.08);
               
--shadow-lg: 0 4px 8px rgba(0, 0, 0, 0.04), 
             0 8px 24px rgba(0, 0, 0, 0.12);
             
--shadow-xl: 0 8px 16px rgba(0, 0, 0, 0.06), 
             0 16px 48px rgba(0, 0, 0, 0.16);

/* 特殊阴影 */
--shadow-inset: inset 0 2px 4px rgba(0, 0, 0, 0.05);
--shadow-colored: 0 4px 12px rgba(24, 144, 255, 0.15);
```

### 2.5 动画系统

#### 动画时长
```css
--duration-fast: 100ms;         /* 快速动画 - 按钮反馈 */
--duration-base: 200ms;         /* 基础动画 - 悬停效果 */
--duration-slow: 300ms;         /* 慢速动画 - 页面转场 */
--duration-slower: 500ms;       /* 更慢动画 - 复杂转场 */
```

#### 动画曲线
```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

---

## 3. 组件设计规范

### 3.1 按钮组件

#### 主要按钮
```css
.btn-primary {
  background: var(--primary-color);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--border-radius-sm);
  padding: var(--padding-sm);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  transition: all var(--duration-base) var(--ease-out);
}

.btn-primary:hover {
  background: var(--primary-hover);
  box-shadow: var(--shadow-colored);
  transform: translateY(-1px);
}

.btn-primary:active {
  background: var(--primary-active);
  transform: translateY(0);
}
```

#### 按钮尺寸
```css
/* 小按钮 */
.btn-sm {
  padding: 4px 12px;
  font-size: 12px;
  min-height: 24px;
}

/* 常规按钮 */
.btn-base {
  padding: 8px 16px;
  font-size: 14px;
  min-height: 32px;
}

/* 大按钮 */
.btn-lg {
  padding: 12px 20px;
  font-size: 16px;
  min-height: 40px;
}
```

### 3.2 视频卡片组件

#### 标准视频卡片
```css
.video-card {
  background: var(--background-primary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: all var(--duration-base) var(--ease-out);
  cursor: pointer;
}

.video-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.video-card-cover {
  width: 100%;
  aspect-ratio: 16/9;
  position: relative;
  overflow: hidden;
}

.video-card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--duration-slow) var(--ease-out);
}

.video-card:hover .video-card-cover img {
  transform: scale(1.05);
}
```

#### 视频信息区域
```css
.video-card-info {
  padding: var(--space-md);
}

.video-card-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  line-height: var(--line-height-tight);
  margin-bottom: var(--space-xs);
  
  /* 多行截断 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-card-meta {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}
```

### 3.3 播放器组件

#### 播放器容器
```css
.video-player {
  position: relative;
  width: 100%;
  background: #000;
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}

.video-player-video {
  width: 100%;
  height: 100%;
  display: block;
}

/* 控制栏 */
.video-player-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: var(--space-lg) var(--space-md) var(--space-md);
  transform: translateY(100%);
  transition: transform var(--duration-base) var(--ease-out);
}

.video-player:hover .video-player-controls {
  transform: translateY(0);
}
```

#### 弹幕容器
```css
.danmaku-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 60px; /* 预留控制栏空间 */
  pointer-events: none;
  overflow: hidden;
}

.danmaku-item {
  position: absolute;
  white-space: nowrap;
  font-size: 18px;
  font-weight: var(--font-weight-medium);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  animation: danmaku-move 8s linear infinite;
}

@keyframes danmaku-move {
  from {
    transform: translateX(100vw);
  }
  to {
    transform: translateX(-100%);
  }
}
```

### 3.4 评论组件

#### 评论项设计
```css
.comment-item {
  padding: var(--space-md) 0;
  border-bottom: 1px solid var(--border-light);
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--border-radius-full);
  margin-right: var(--space-md);
}

.comment-content {
  flex: 1;
}

.comment-author {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.comment-text {
  color: var(--text-primary);
  line-height: var(--line-height-base);
  margin-bottom: var(--space-sm);
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}
```

---

## 4. 页面布局规范

### 4.1 首页布局

#### 桌面端布局 (≥1200px)
```css
.homepage-layout {
  max-width: var(--container-xxl);
  margin: 0 auto;
  padding: 0 var(--space-lg);
}

.homepage-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-light);
}

.homepage-nav {
  height: 48px;
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  border-bottom: 1px solid var(--border-light);
}

.homepage-banner {
  height: 400px;
  margin: var(--space-lg) 0;
  border-radius: var(--border-radius-xl);
  overflow: hidden;
}

.homepage-content {
  display: grid;
  gap: var(--space-xxxl);
}
```

#### 视频网格系统
```css
/* 5列网格 (桌面端) */
.video-grid-desktop {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-lg);
}

/* 3列网格 (平板端) */
.video-grid-tablet {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
}

/* 2列网格 (移动端) */
.video-grid-mobile {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-sm);
}
```

### 4.2 视频播放页布局

#### 播放页主体结构
```css
.video-page-layout {
  max-width: var(--container-xxl);
  margin: 0 auto;
  padding: var(--space-lg);
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: var(--space-xl);
}

.video-main {
  min-width: 0; /* 防止溢出 */
}

.video-sidebar {
  position: sticky;
  top: var(--space-lg);
  height: fit-content;
}
```

#### 播放器区域
```css
.video-player-section {
  background: var(--background-primary);
  border-radius: var(--border-radius-xl);
  overflow: hidden;
  margin-bottom: var(--space-lg);
}

.video-player-wrapper {
  position: relative;
  aspect-ratio: 16/9;
}
```

### 4.3 个人中心布局

#### 个人中心网格
```css
.profile-layout {
  max-width: var(--container-xl);
  margin: 0 auto;
  padding: var(--space-lg);
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: var(--space-xl);
}

.profile-sidebar {
  position: sticky;
  top: var(--space-lg);
  height: fit-content;
}

.profile-main {
  min-width: 0;
}
```

---

## 5. 响应式设计规范

### 5.1 断点系统

#### 断点定义
```css
/* 移动端 */
@media (max-width: 767px) {
  :root {
    --container-padding: var(--space-md);
    --grid-columns: 2;
  }
}

/* 平板端 */
@media (min-width: 768px) and (max-width: 991px) {
  :root {
    --container-padding: var(--space-lg);
    --grid-columns: 3;
  }
}

/* 桌面端 */
@media (min-width: 992px) {
  :root {
    --container-padding: var(--space-lg);
    --grid-columns: 5;
  }
}

/* 大屏桌面端 */
@media (min-width: 1600px) {
  :root {
    --container-padding: var(--space-xl);
    --grid-columns: 6;
  }
}
```

### 5.2 移动端适配

#### 移动端导航
```css
.mobile-header {
  height: 56px;
  padding: 0 var(--space-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--background-primary);
  border-bottom: 1px solid var(--border-light);
}

.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: var(--background-primary);
  border-top: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 1000;
}
```

#### 移动端播放器
```css
.mobile-video-player {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;
  z-index: 9999;
}

.mobile-video-player.portrait {
  position: relative;
  height: 240px;
}

.mobile-video-player.landscape {
  transform: rotate(90deg);
  transform-origin: center;
}
```

---

## 6. 交互设计规范

### 6.1 基础交互状态

#### 悬停状态 (Hover)
```css
/* 按钮悬停 */
.interactive:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}

/* 卡片悬停 */
.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl);
}

/* 链接悬停 */
.link:hover {
  color: var(--primary-hover);
  text-decoration: underline;
}
```

#### 激活状态 (Active)
```css
.interactive:active {
  transform: scale(0.98);
  transition: transform var(--duration-fast) var(--ease-out);
}
```

#### 焦点状态 (Focus)
```css
.focusable:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}
```

### 6.2 动画效果规范

#### 页面加载动画
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in-up {
  animation: fadeInUp var(--duration-slow) var(--ease-out);
}
```

#### 点赞动画
```css
@keyframes heartBeat {
  0% { transform: scale(1); }
  25% { transform: scale(1.2); }
  50% { transform: scale(1.1); }
  75% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

.like-button.liked {
  color: var(--error-color);
  animation: heartBeat var(--duration-slower) var(--ease-bounce);
}
```

### 6.3 手势交互 (移动端)

#### 滑动手势
```css
/* 左右滑动切换 */
.swipeable {
  touch-action: pan-y;
  overflow-x: hidden;
}

/* 上下滑动刷新 */
.pull-to-refresh {
  touch-action: pan-x;
  overflow-y: auto;
}
```

---

## 7. 可访问性设计

### 7.1 颜色对比度
所有文字与背景的对比度必须满足 WCAG 2.1 AA 标准：
- 正常文字：对比度 ≥ 4.5:1
- 大字体（18px+）：对比度 ≥ 3:1

### 7.2 键盘导航
```css
/* 跳过导航链接 */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--primary-color);
  color: var(--text-inverse);
  padding: 8px;
  border-radius: var(--border-radius-sm);
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 6px;
}

/* 焦点指示器 */
.focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}
```

### 7.3 屏幕阅读器支持
```html
<!-- 语义化标签示例 -->
<nav aria-label="主导航">
<main aria-label="主要内容">
<section aria-labelledby="recommended-heading">
<button aria-label="播放视频" aria-pressed="false">
<img alt="视频封面：编程教程第一集">
```

---

## 8. 设计资源与工具

### 8.1 设计工具推荐
- **原型设计**：Figma、Sketch
- **图标资源**：Ant Design Icons、Feather Icons
- **配色工具**：Coolors.co、Adobe Color
- **字体资源**：Google Fonts、Adobe Fonts

### 8.2 开发工具集成
```css
/* CSS 变量导出 */
:export {
  primaryColor: #1890ff;
  secondaryColor: #722ed1;
  borderRadius: 8px;
  spacingMd: 16px;
}
```

### 8.3 设计令牌 (Design Tokens)
```json
{
  "color": {
    "primary": {
      "50": "#e6f7ff",
      "100": "#bae7ff", 
      "500": "#1890ff",
      "900": "#003a8c"
    }
  },
  "spacing": {
    "xs": "4px",
    "sm": "8px", 
    "md": "16px",
    "lg": "24px"
  }
}
```

---

## 9. 品质检查清单

### 9.1 视觉检查
- [ ] 色彩搭配符合品牌调性
- [ ] 字体大小层次清晰
- [ ] 间距使用8px网格系统
- [ ] 圆角和阴影保持一致
- [ ] 图标风格统一

### 9.2 交互检查  
- [ ] 悬停状态反馈明确
- [ ] 点击响应及时流畅
- [ ] 加载状态有提示
- [ ] 错误提示友好清晰
- [ ] 键盘导航完整

### 9.3 响应式检查
- [ ] 移动端适配良好
- [ ] 平板端布局合理
- [ ] 大屏显示优化
- [ ] 触摸目标足够大
- [ ] 横屏模式支持

---

**下一步操作建议：**
输入 **/前端** 启动前端开发工程师，开始代码实现
或输入 **/后端** 启动后端工程师，搭建服务架构

---
*文档由 DAXIONG UI/UX 设计师生成 | 版本 v1.0 | 2025-08-25*