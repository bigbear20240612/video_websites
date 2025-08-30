/*
 * 大雄视频平台 - 骨架屏组件
 * 用于视频卡片的加载状态展示
 */

import React from 'react';
import styled, { keyframes } from 'styled-components';

// ============ 动画定义 ============

const shimmer = keyframes`
  0% {
    background-position: -468px 0;
  }
  100% {
    background-position: 468px 0;
  }
`;

// ============ 样式定义 ============

const SkeletonCardContainer = styled.div`
  display: flex;
  flex-direction: column;
  background: var(--background-primary);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
`;

const SkeletonCover = styled.div`
  width: 100%;
  aspect-ratio: 16/9;
  background: linear-gradient(
    90deg,
    var(--background-tertiary) 25%,
    var(--background-secondary) 50%,
    var(--background-tertiary) 75%
  );
  background-size: 400% 100%;
  animation: ${shimmer} 1.2s ease-in-out infinite;
`;

const SkeletonContent = styled.div`
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
`;

const SkeletonTitle = styled.div`
  height: 20px;
  background: linear-gradient(
    90deg,
    var(--background-tertiary) 25%,
    var(--background-secondary) 50%,
    var(--background-tertiary) 75%
  );
  background-size: 400% 100%;
  animation: ${shimmer} 1.2s ease-in-out infinite;
  border-radius: var(--border-radius-sm);
  width: 90%;
`;

const SkeletonTitleSecond = styled(SkeletonTitle)`
  width: 60%;
  margin-top: var(--space-xs);
`;

const SkeletonAuthor = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-top: var(--space-sm);
`;

const SkeletonAvatar = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(
    90deg,
    var(--background-tertiary) 25%,
    var(--background-secondary) 50%,
    var(--background-tertiary) 75%
  );
  background-size: 400% 100%;
  animation: ${shimmer} 1.2s ease-in-out infinite;
`;

const SkeletonName = styled.div`
  height: 14px;
  width: 80px;
  background: linear-gradient(
    90deg,
    var(--background-tertiary) 25%,
    var(--background-secondary) 50%,
    var(--background-tertiary) 75%
  );
  background-size: 400% 100%;
  animation: ${shimmer} 1.2s ease-in-out infinite;
  border-radius: var(--border-radius-sm);
`;

const SkeletonStats = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-sm);
`;

const SkeletonStat = styled.div`
  height: 12px;
  width: 40px;
  background: linear-gradient(
    90deg,
    var(--background-tertiary) 25%,
    var(--background-secondary) 50%,
    var(--background-tertiary) 75%
  );
  background-size: 400% 100%;
  animation: ${shimmer} 1.2s ease-in-out infinite;
  border-radius: var(--border-radius-sm);
`;

// ============ 组件实现 ============

interface SkeletonCardProps {
  className?: string;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ className }) => {
  return (
    <SkeletonCardContainer className={className}>
      <SkeletonCover />
      <SkeletonContent>
        <SkeletonTitle />
        <SkeletonTitleSecond />
        <SkeletonAuthor>
          <SkeletonAvatar />
          <SkeletonName />
        </SkeletonAuthor>
        <SkeletonStats>
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
        </SkeletonStats>
      </SkeletonContent>
    </SkeletonCardContainer>
  );
};

export default SkeletonCard;