/*
 * 大雄视频平台 - 主题切换组件
 * 提供主题切换按钮功能
 */

import React from 'react';
import styled from 'styled-components';
import { useTheme } from '../../contexts/ThemeContext';

// ============ 样式定义 ============

const ThemeToggleContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
`;

const ThemeToggleButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: var(--border-radius-base);
  background: ${props => props.$active ? 'var(--primary-color)' : 'transparent'};
  color: ${props => props.$active ? 'var(--text-inverse)' : 'var(--text-secondary)'};
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-out);
  font-size: 18px;
  position: relative;
  overflow: hidden;
  
  &:hover {
    background: ${props => props.$active ? 'var(--primary-color)' : 'var(--background-secondary)'};
    color: ${props => props.$active ? 'var(--text-inverse)' : 'var(--text-primary)'};
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 20px;
    height: 20px;
    background: var(--primary-color);
    border-radius: 50%;
    transform: translate(-50%, -50%) scale(0);
    transition: transform var(--duration-base) var(--ease-bounce);
    z-index: -1;
  }
  
  &:hover::before {
    transform: translate(-50%, -50%) scale(${props => props.$active ? 0 : 1});
  }
`;

const ThemeDropdown = styled.div<{ $visible?: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: var(--space-xs);
  background: var(--background-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--space-xs);
  min-width: 120px;
  opacity: ${props => props.$visible ? 1 : 0};
  visibility: ${props => props.$visible ? 'visible' : 'hidden'};
  transform: translateY(${props => props.$visible ? 0 : -10}px);
  transition: all var(--duration-base) var(--ease-out);
  z-index: 1000;
  backdrop-filter: blur(8px);
`;

const ThemeOption = styled.button<{ $active?: boolean }>`
  width: 100%;
  padding: var(--space-sm);
  border: none;
  background: ${props => props.$active ? 'var(--primary-color)' : 'transparent'};
  color: ${props => props.$active ? 'var(--text-inverse)' : 'var(--text-secondary)'};
  border-radius: var(--border-radius-base);
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-out);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--font-size-sm);
  
  &:hover {
    background: ${props => props.$active ? 'var(--primary-color)' : 'var(--background-secondary)'};
    color: ${props => props.$active ? 'var(--text-inverse)' : 'var(--text-primary)'};
  }
  
  &:not(:last-child) {
    margin-bottom: var(--space-xs);
  }
`;

const ThemeIcon = styled.span`
  font-size: 16px;
`;

const ThemeLabel = styled.span`
  flex: 1;
  text-align: left;
`;

// ============ 组件实现 ============

interface ThemeToggleProps {
  showDropdown?: boolean;
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  showDropdown = false, 
  className 
}) => {
  const { theme, actualTheme, setTheme, toggleTheme } = useTheme();
  const [dropdownVisible, setDropdownVisible] = React.useState(false);

  const themeOptions = [
    { value: 'light', label: '浅色模式', icon: '☀️' },
    { value: 'dark', label: '深色模式', icon: '🌙' },
    { value: 'auto', label: '跟随系统', icon: '💻' }
  ] as const;

  const currentIcon = actualTheme === 'light' ? '☀️' : '🌙';

  const handleToggleClick = () => {
    if (showDropdown) {
      setDropdownVisible(!dropdownVisible);
    } else {
      toggleTheme();
    }
  };

  const handleThemeSelect = (selectedTheme: 'light' | 'dark' | 'auto') => {
    setTheme(selectedTheme);
    setDropdownVisible(false);
  };

  // 点击外部关闭下拉菜单
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-theme-toggle]')) {
        setDropdownVisible(false);
      }
    };

    if (dropdownVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownVisible]);

  return (
    <ThemeToggleContainer className={className} data-theme-toggle>
      <ThemeToggleButton
        onClick={handleToggleClick}
        title={showDropdown ? '主题设置' : '切换主题'}
        aria-label={showDropdown ? '主题设置' : '切换主题'}
      >
        {currentIcon}
      </ThemeToggleButton>
      
      {showDropdown && (
        <ThemeDropdown $visible={dropdownVisible}>
          {themeOptions.map((option) => (
            <ThemeOption
              key={option.value}
              $active={theme === option.value}
              onClick={() => handleThemeSelect(option.value)}
            >
              <ThemeIcon>{option.icon}</ThemeIcon>
              <ThemeLabel>{option.label}</ThemeLabel>
            </ThemeOption>
          ))}
        </ThemeDropdown>
      )}
    </ThemeToggleContainer>
  );
};

export default ThemeToggle;