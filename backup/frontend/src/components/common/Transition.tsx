/*
 * 大雄视频平台 - 过渡动画组件
 * 统一的页面和组件切换动画
 */

import React, { useState, useEffect } from 'react';
import styled, { css, keyframes } from 'styled-components';

// ============ 类型定义 ============

interface TransitionProps {
  children: React.ReactNode;
  show: boolean;
  type?: 'fade' | 'slide' | 'scale' | 'bounce';
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
  delay?: number;
  className?: string;
  onEnter?: () => void;
  onExit?: () => void;
}

// ============ 动画定义 ============

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const slideInUp = keyframes`
  from { 
    opacity: 0; 
    transform: translateY(30px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
`;

const slideInDown = keyframes`
  from { 
    opacity: 0; 
    transform: translateY(-30px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
`;

const slideInLeft = keyframes`
  from { 
    opacity: 0; 
    transform: translateX(-30px); 
  }
  to { 
    opacity: 1; 
    transform: translateX(0); 
  }
`;

const slideInRight = keyframes`
  from { 
    opacity: 0; 
    transform: translateX(30px); 
  }
  to { 
    opacity: 1; 
    transform: translateX(0); 
  }
`;

const slideOutUp = keyframes`
  from { 
    opacity: 1; 
    transform: translateY(0); 
  }
  to { 
    opacity: 0; 
    transform: translateY(-30px); 
  }
`;

const slideOutDown = keyframes`
  from { 
    opacity: 1; 
    transform: translateY(0); 
  }
  to { 
    opacity: 0; 
    transform: translateY(30px); 
  }
`;

const slideOutLeft = keyframes`
  from { 
    opacity: 1; 
    transform: translateX(0); 
  }
  to { 
    opacity: 0; 
    transform: translateX(-30px); 
  }
`;

const slideOutRight = keyframes`
  from { 
    opacity: 1; 
    transform: translateX(0); 
  }
  to { 
    opacity: 0; 
    transform: translateX(30px); 
  }
`;

const scaleIn = keyframes`
  from { 
    opacity: 0; 
    transform: scale(0.8); 
  }
  to { 
    opacity: 1; 
    transform: scale(1); 
  }
`;

const scaleOut = keyframes`
  from { 
    opacity: 1; 
    transform: scale(1); 
  }
  to { 
    opacity: 0; 
    transform: scale(0.8); 
  }
`;

const bounceIn = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
`;

const bounceOut = keyframes`
  0% {
    opacity: 1;
    transform: scale(1);
  }
  25% {
    transform: scale(0.95);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
  100% {
    opacity: 0;
    transform: scale(0.3);
  }
`;

// ============ 样式定义 ============

const TransitionContainer = styled.div<{
  $show: boolean;
  $type: string;
  $direction: string;
  $duration: number;
  $delay: number;
}>`
  ${props => {
    const { $show, $type, $direction, $duration, $delay } = props;
    
    // 基础样式
    const baseStyles = css`
      animation-duration: ${$duration}ms;
      animation-delay: ${$delay}ms;
      animation-fill-mode: both;
      animation-timing-function: var(--ease-out);
    `;
    
    // 根据类型和显示状态选择动画
    let animationName;
    
    if ($type === 'fade') {
      animationName = $show ? fadeIn : fadeOut;
    } else if ($type === 'slide') {
      if ($show) {
        switch ($direction) {
          case 'up': animationName = slideInUp; break;
          case 'down': animationName = slideInDown; break;
          case 'left': animationName = slideInLeft; break;
          case 'right': animationName = slideInRight; break;
          default: animationName = slideInUp;
        }
      } else {
        switch ($direction) {
          case 'up': animationName = slideOutUp; break;
          case 'down': animationName = slideOutDown; break;
          case 'left': animationName = slideOutLeft; break;
          case 'right': animationName = slideOutRight; break;
          default: animationName = slideOutDown;
        }
      }
    } else if ($type === 'scale') {
      animationName = $show ? scaleIn : scaleOut;
    } else if ($type === 'bounce') {
      animationName = $show ? bounceIn : bounceOut;
      return css`
        ${baseStyles}
        animation-name: ${animationName};
        animation-timing-function: var(--ease-bounce);
      `;
    }
    
    return css`
      ${baseStyles}
      animation-name: ${animationName};
    `;
  }}
  
  // 如果不显示且动画完成，隐藏元素
  ${props => !props.$show && css`
    visibility: hidden;
  `}
`;

// ============ 组件实现 ============

const Transition: React.FC<TransitionProps> = ({
  children,
  show,
  type = 'fade',
  direction = 'up',
  duration = 300,
  delay = 0,
  className,
  onEnter,
  onExit
}) => {
  const [shouldRender, setShouldRender] = useState(show);
  
  useEffect(() => {
    if (show) {
      setShouldRender(true);
      onEnter?.();
    } else {
      onExit?.();
      // 延迟隐藏，等待退出动画完成
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, duration + delay);
      
      return () => clearTimeout(timer);
    }
  }, [show, duration, delay, onEnter, onExit]);
  
  if (!shouldRender && !show) {
    return null;
  }
  
  return (
    <TransitionContainer
      $show={show}
      $type={type}
      $direction={direction}
      $duration={duration}
      $delay={delay}
      className={className}
    >
      {children}
    </TransitionContainer>
  );
};

export default Transition;