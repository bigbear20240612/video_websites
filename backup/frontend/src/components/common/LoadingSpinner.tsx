/*
 * 大雄视频平台 - 加载动画组件
 * 统一的加载指示器，支持多种样式和大小
 */

import React from 'react';
import styled, { keyframes, css } from 'styled-components';

// ============ 类型定义 ============

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'dots' | 'pulse' | 'wave';
  color?: string;
  text?: string;
  className?: string;
}

// ============ 动画定义 ============

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.7; }
`;

const wave = keyframes`
  0%, 60%, 100% { transform: initial; }
  30% { transform: translateY(-15px); }
`;

const fadeInOut = keyframes`
  0%, 100% { opacity: 0.2; }
  50% { opacity: 1; }
`;

// ============ 样式定义 ============

const SpinnerContainer = styled.div<{ $size: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  
  ${props => {
    switch (props.$size) {
      case 'small':
        return css`width: 32px; height: 32px;`;
      case 'large':
        return css`width: 64px; height: 64px;`;
      default:
        return css`width: 48px; height: 48px;`;
    }
  }}
`;

// 默认旋转加载器
const DefaultSpinner = styled.div<{ $size: string; $color: string }>`
  width: 100%;
  height: 100%;
  border: ${props => {
    switch (props.$size) {
      case 'small': return '2px';
      case 'large': return '4px';
      default: return '3px';
    }
  }} solid rgba(255, 255, 255, 0.3);
  border-top-color: ${props => props.$color};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

// 圆点加载器
const DotsContainer = styled.div<{ $size: string }>`
  display: flex;
  gap: ${props => {
    switch (props.$size) {
      case 'small': return '4px';
      case 'large': return '8px';
      default: return '6px';
    }
  }};
`;

const Dot = styled.div<{ $size: string; $color: string; $delay: number }>`
  width: ${props => {
    switch (props.$size) {
      case 'small': return '6px';
      case 'large': return '12px';
      default: return '8px';
    }
  }};
  height: ${props => {
    switch (props.$size) {
      case 'small': return '6px';
      case 'large': return '12px';
      default: return '8px';
    }
  }};
  background: ${props => props.$color};
  border-radius: 50%;
  animation: ${fadeInOut} 1.4s ease-in-out infinite;
  animation-delay: ${props => props.$delay}s;
`;

// 脉冲加载器
const PulseSpinner = styled.div<{ $size: string; $color: string }>`
  width: 100%;
  height: 100%;
  background: ${props => props.$color};
  border-radius: 50%;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

// 波浪加载器
const WaveContainer = styled.div<{ $size: string }>`
  display: flex;
  justify-content: space-between;
  width: 100%;
  height: 100%;
`;

const WaveBar = styled.div<{ $size: string; $color: string; $delay: number }>`
  width: ${props => {
    switch (props.$size) {
      case 'small': return '3px';
      case 'large': return '6px';
      default: return '4px';
    }
  }};
  height: 100%;
  background: ${props => props.$color};
  border-radius: 2px;
  animation: ${wave} 1.2s ease-in-out infinite;
  animation-delay: ${props => props.$delay}s;
`;

const LoadingText = styled.div<{ $size: string; $color: string }>`
  font-size: ${props => {
    switch (props.$size) {
      case 'small': return 'var(--font-size-sm)';
      case 'large': return 'var(--font-size-lg)';
      default: return 'var(--font-size-base)';
    }
  }};
  color: ${props => props.$color};
  font-weight: var(--font-weight-medium);
  text-align: center;
  margin-top: var(--space-xs);
`;

// ============ 组件实现 ============

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  variant = 'default',
  color = 'var(--primary-color)',
  text,
  className
}) => {
  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <DotsContainer $size={size}>
            <Dot $size={size} $color={color} $delay={0} />
            <Dot $size={size} $color={color} $delay={0.2} />
            <Dot $size={size} $color={color} $delay={0.4} />
          </DotsContainer>
        );
      
      case 'pulse':
        return <PulseSpinner $size={size} $color={color} />;
      
      case 'wave':
        return (
          <WaveContainer $size={size}>
            <WaveBar $size={size} $color={color} $delay={0} />
            <WaveBar $size={size} $color={color} $delay={0.1} />
            <WaveBar $size={size} $color={color} $delay={0.2} />
            <WaveBar $size={size} $color={color} $delay={0.3} />
            <WaveBar $size={size} $color={color} $delay={0.4} />
          </WaveContainer>
        );
      
      default:
        return <DefaultSpinner $size={size} $color={color} />;
    }
  };

  return (
    <SpinnerContainer $size={size} className={className}>
      {renderSpinner()}
      {text && <LoadingText $size={size} $color={color}>{text}</LoadingText>}
    </SpinnerContainer>
  );
};

export default LoadingSpinner;