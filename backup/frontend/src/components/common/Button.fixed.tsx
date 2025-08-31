/*
 * 大雄视频平台 - 修复版按钮组件
 * 修复了styled-components属性传递问题
 */

import React from 'react';
import styled, { css } from 'styled-components';

// ============ 类型定义 ============

export interface ButtonProps {
  type?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  block?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

// 只传递给styled-components的样式props
interface StyledButtonProps {
  $buttonType?: string;
  $size?: string;
  $loading?: boolean;
  $block?: boolean;
}

// ============ 样式定义 ============

const ButtonBase = styled.button<StyledButtonProps>`
  /* 基础样式 */
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  font-family: var(--font-family);
  font-weight: var(--font-weight-medium);
  border: none;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  outline: none;
  transition: all var(--duration-base) var(--ease-out);
  white-space: nowrap;
  user-select: none;
  
  /* 尺寸样式 */
  ${props => {
    switch (props.$size) {
      case 'small':
        return css`
          height: 24px;
          padding: 4px 8px;
          font-size: 12px;
        `;
      case 'large':
        return css`
          height: 40px;
          padding: 16px 24px;
          font-size: 16px;
        `;
      default:
        return css`
          height: 32px;
          padding: 8px 16px;
          font-size: 14px;
        `;
    }
  }}
  
  /* 类型样式 */
  ${props => {
    switch (props.$buttonType) {
      case 'primary':
        return css`
          background: var(--primary-color, #1890ff);
          color: var(--text-inverse, #ffffff);
          
          &:hover:not(:disabled) {
            background: var(--primary-hover, #40a9ff);
            box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
            transform: translateY(-1px);
          }
          
          &:active:not(:disabled) {
            background: var(--primary-active, #096dd9);
            transform: translateY(0);
          }
        `;
      
      case 'secondary':
        return css`
          background: var(--background-secondary, #fafafa);
          color: var(--text-primary, #262626);
          border: 1px solid var(--border-color, #d9d9d9);
          
          &:hover:not(:disabled) {
            background: var(--background-tertiary, #f5f5f5);
            border-color: var(--primary-hover, #40a9ff);
            color: var(--primary-hover, #40a9ff);
          }
        `;
      
      case 'danger':
        return css`
          background: var(--error-color, #ff4d4f);
          color: var(--text-inverse, #ffffff);
          
          &:hover:not(:disabled) {
            background: var(--error-hover, #ff7875);
            transform: translateY(-1px);
          }
        `;
      
      case 'ghost':
        return css`
          background: transparent;
          color: var(--primary-color, #1890ff);
          border: 1px solid var(--primary-color, #1890ff);
          
          &:hover:not(:disabled) {
            background: var(--primary-color, #1890ff);
            color: var(--text-inverse, #ffffff);
          }
        `;
      
      case 'link':
        return css`
          background: transparent;
          color: var(--primary-color, #1890ff);
          padding: 4px;
          
          &:hover:not(:disabled) {
            color: var(--primary-hover, #40a9ff);
            text-decoration: underline;
          }
        `;
      
      default:
        return css`
          background: var(--primary-color, #1890ff);
          color: var(--text-inverse, #ffffff);
          
          &:hover:not(:disabled) {
            background: var(--primary-hover, #40a9ff);
            box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
            transform: translateY(-1px);
          }
        `;
    }
  }}
  
  /* 块级按钮 */
  ${props => props.$block && css`
    width: 100%;
  `}
  
  /* 禁用状态 */
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
    transform: none !important;
    
    &:hover {
      transform: none !important;
      box-shadow: none !important;
    }
  }
  
  /* 加载状态 */
  ${props => props.$loading && css`
    cursor: default;
    
    &::before {
      content: '';
      position: absolute;
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top-color: currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `}
  
  /* 焦点样式 */
  &:focus-visible {
    outline: 2px solid var(--primary-color, #1890ff);
    outline-offset: 2px;
  }
`;

const ButtonContent = styled.span<{ $loading?: boolean }>`
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  
  ${props => props.$loading && css`
    opacity: 0;
  `}
`;

const IconWrapper = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 1em;
    height: 1em;
  }
`;

// ============ 组件实现 ============

const Button: React.FC<ButtonProps> = ({
  type = 'primary',
  size = 'medium',
  icon,
  loading = false,
  disabled = false,
  block = false,
  children,
  className,
  onClick,
  ...props
}) => {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <ButtonBase
      $buttonType={type}
      $size={size}
      $loading={loading}
      $block={block}
      disabled={disabled || loading}
      className={className}
      onClick={handleClick}
      {...props}
    >
      <ButtonContent $loading={loading}>
        {icon && <IconWrapper>{icon}</IconWrapper>}
        {children}
      </ButtonContent>
    </ButtonBase>
  );
};

export default Button;