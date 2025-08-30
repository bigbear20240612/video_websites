/*
 * 响应式设计工具
 * 提供统一的断点和响应式样式工具
 */

// 断点定义
export const breakpoints = {
  xs: 320,    // 小手机
  sm: 576,    // 大手机
  md: 768,    // 平板
  lg: 992,    // 小桌面
  xl: 1200,   // 桌面
  xxl: 1400   // 大桌面
} as const;

// 媒体查询生成器
export const mediaQuery = {
  up: (breakpoint: keyof typeof breakpoints) => 
    `@media (min-width: ${breakpoints[breakpoint]}px)`,
  
  down: (breakpoint: keyof typeof breakpoints) => 
    `@media (max-width: ${breakpoints[breakpoint] - 1}px)`,
  
  between: (min: keyof typeof breakpoints, max: keyof typeof breakpoints) =>
    `@media (min-width: ${breakpoints[min]}px) and (max-width: ${breakpoints[max] - 1}px)`,
  
  only: (breakpoint: keyof typeof breakpoints) => {
    const keys = Object.keys(breakpoints) as (keyof typeof breakpoints)[];
    const index = keys.indexOf(breakpoint);
    
    if (index === 0) {
      return `@media (max-width: ${breakpoints[keys[1]] - 1}px)`;
    } else if (index === keys.length - 1) {
      return `@media (min-width: ${breakpoints[breakpoint]}px)`;
    } else {
      return `@media (min-width: ${breakpoints[breakpoint]}px) and (max-width: ${breakpoints[keys[index + 1]] - 1}px)`;
    }
  }
};

// 常用响应式样式
export const responsiveStyles = {
  // 容器样式 - 有最大宽度限制
  container: `
    width: 100%;
    max-width: var(--container-xl);
    margin: 0 auto;
    padding: 0 var(--space-md);
    
    ${mediaQuery.up('sm')} {
      padding: 0 var(--space-lg);
    }
    
    ${mediaQuery.up('lg')} {
      padding: 0 var(--space-xl);
    }
  `,
  
  // 全宽度容器样式 - 无最大宽度限制
  fullWidthContainer: `
    width: 100%;
    padding: 0 var(--space-md);
    
    ${mediaQuery.up('sm')} {
      padding: 0 var(--space-lg);
    }
    
    ${mediaQuery.up('lg')} {
      padding: 0 var(--space-xl);
    }
  `,
  
  // 真正的零边距全屏容器 - 完全无padding
  trueFullScreenContainer: `
    width: 100%;
    padding: 0;
    margin: 0;
  `,
  
  // 网格自适应
  gridResponsive: (columns: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number }) => `
    display: grid;
    gap: var(--space-md);
    grid-template-columns: repeat(${columns.xs || 1}, 1fr);
    
    ${columns.sm ? `${mediaQuery.up('sm')} { grid-template-columns: repeat(${columns.sm}, 1fr); }` : ''}
    ${columns.md ? `${mediaQuery.up('md')} { grid-template-columns: repeat(${columns.md}, 1fr); }` : ''}
    ${columns.lg ? `${mediaQuery.up('lg')} { grid-template-columns: repeat(${columns.lg}, 1fr); }` : ''}
    ${columns.xl ? `${mediaQuery.up('xl')} { grid-template-columns: repeat(${columns.xl}, 1fr); }` : ''}
  `,
  
  // Flexbox响应式
  flexResponsive: `
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    
    ${mediaQuery.up('md')} {
      flex-direction: row;
      align-items: center;
    }
  `,
  
  // 文本响应式
  textResponsive: `
    font-size: var(--font-size-sm);
    
    ${mediaQuery.up('sm')} {
      font-size: var(--font-size-base);
    }
    
    ${mediaQuery.up('md')} {
      font-size: var(--font-size-lg);
    }
  `,
  
  // 间距响应式
  spacingResponsive: (property: 'margin' | 'padding') => `
    ${property}: var(--space-sm);
    
    ${mediaQuery.up('sm')} {
      ${property}: var(--space-md);
    }
    
    ${mediaQuery.up('lg')} {
      ${property}: var(--space-lg);
    }
  `,
  
  // 隐藏/显示
  hideOnMobile: `
    display: none;
    
    ${mediaQuery.up('md')} {
      display: block;
    }
  `,
  
  hideOnDesktop: `
    display: block;
    
    ${mediaQuery.up('md')} {
      display: none;
    }
  `,
  
  // 视口单位安全处理
  fullHeight: `
    height: 100vh;
    height: 100dvh; /* 动态视口高度 */
    
    ${mediaQuery.down('md')} {
      /* 在移动端使用更安全的高度计算 */
      min-height: 100vh;
      min-height: calc(var(--vh, 1vh) * 100);
    }
  `
};

// 设备检测
export const isDevice = {
  mobile: () => window.innerWidth < breakpoints.md,
  tablet: () => window.innerWidth >= breakpoints.md && window.innerWidth < breakpoints.lg,
  desktop: () => window.innerWidth >= breakpoints.lg,
  touch: () => 'ontouchstart' in window || navigator.maxTouchPoints > 0
};

// 视口高度修复（移动端地址栏问题）
export const fixViewportHeight = () => {
  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  
  setVH();
  window.addEventListener('resize', setVH);
  window.addEventListener('orientationchange', () => {
    setTimeout(setVH, 100);
  });
};

// 响应式字体大小计算
export const fluidFontSize = (minSize: number, maxSize: number, minVw = 320, maxVw = 1200) => {
  return `clamp(${minSize}px, ${minSize}px + ${maxSize - minSize} * ((100vw - ${minVw}px) / ${maxVw - minVw}), ${maxSize}px)`;
};

// 响应式间距计算
export const fluidSpacing = (minSpacing: number, maxSpacing: number, minVw = 320, maxVw = 1200) => {
  return `clamp(${minSpacing}rem, ${minSpacing}rem + ${maxSpacing - minSpacing} * ((100vw - ${minVw}px) / ${maxVw - minVw}), ${maxSpacing}rem)`;
};