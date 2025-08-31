/*
 * 大雄视频平台 - 主题上下文
 * 提供深色模式/浅色模式切换功能
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// ============ 类型定义 ============

type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: Theme;
  actualTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// ============ 上下文创建 ============

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ============ 主题提供者组件 ============

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // 从 localStorage 读取保存的主题设置，默认为 auto
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('daxiong-theme') as Theme;
    return savedTheme || 'auto';
  });

  // 获取系统主题偏好
  const getSystemTheme = (): 'light' | 'dark' => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // 计算实际应该使用的主题
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>(() => {
    if (theme === 'auto') {
      return getSystemTheme();
    }
    return theme;
  });

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'auto') {
        setActualTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // 更新主题
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('daxiong-theme', newTheme);
    
    if (newTheme === 'auto') {
      setActualTheme(getSystemTheme());
    } else {
      setActualTheme(newTheme);
    }
  };

  // 切换主题（在 light 和 dark 之间切换）
  const toggleTheme = () => {
    const newTheme = actualTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // 应用主题到 document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', actualTheme);
    document.documentElement.className = actualTheme;
  }, [actualTheme]);

  const value: ThemeContextType = {
    theme,
    actualTheme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// ============ Hook ============

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;