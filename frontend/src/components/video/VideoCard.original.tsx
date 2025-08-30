/*
 * 大雄视频平台 - 视频卡片组件
 * 用于展示视频缩略图、标题、作者等信息
 */

import React from 'react';
import styled, { css } from 'styled-components';
import { VideoCardProps } from '../../types';

// ============ 样式定义 ============

const CardContainer = styled.div<{ size: 'small' | 'medium' | 'large' }>`
  display: flex;
  flex-direction: column;
  background: var(--background-primary);
  border-radius: var(--video-card-border-radius);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-out);
  box-shadow: var(--shadow-sm);
  
  &:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
  }
  
  ${props => {
    switch (props.size) {
      case 'small':
        return css`
          min-height: 200px;
        `;
      case 'large':
        return css`
          min-height: 300px;
        `;
      default:
        return css`
          min-height: 240px;
        `;
    }
  }}
`;

const CoverContainer = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: var(--video-aspect-ratio);
  overflow: hidden;
  background: var(--background-tertiary);
`;

const CoverImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--duration-slow) var(--ease-out);
  
  ${CardContainer}:hover & {
    transform: scale(1.05);
  }
`;

const CoverOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    transparent 60%,
    rgba(0, 0, 0, 0.3) 100%
  );
  opacity: 0;
  transition: opacity var(--duration-base) var(--ease-out);
  
  ${CardContainer}:hover & {
    opacity: 1;
  }
`;

const PlayIcon = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0);
  width: 60px;
  height: 60px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-inverse);
  font-size: 24px;
  transition: transform var(--duration-base) var(--ease-bounce);
  
  ${CardContainer}:hover & {
    transform: translate(-50%, -50%) scale(1);
  }
  
  &::before {
    content: '▶';
    margin-left: 4px;
  }
`;

const Duration = styled.div`
  position: absolute;
  bottom: var(--space-xs);
  right: var(--space-xs);
  background: rgba(0, 0, 0, 0.8);
  color: var(--text-inverse);
  font-size: var(--font-size-sm);
  padding: 2px var(--space-xs);
  border-radius: var(--border-radius-sm);
  backdrop-filter: blur(4px);
`;

const ContentContainer = styled.div<{ size: 'small' | 'medium' | 'large' }>`
  padding: var(--space-md);
  flex: 1;
  display: flex;
  flex-direction: column;
  
  ${props => {
    switch (props.size) {
      case 'small':
        return css`
          padding: var(--space-sm);
        `;
      case 'large':
        return css`
          padding: var(--space-lg);
        `;
      default:
        return css`
          padding: var(--space-md);
        `;
    }
  }}
`;

const VideoTitle = styled.h3<{ size: 'small' | 'medium' | 'large' }>`
  margin: 0 0 var(--space-xs) 0;
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  line-height: var(--line-height-tight);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color var(--duration-base) var(--ease-out);
  
  ${CardContainer}:hover & {
    color: var(--primary-color);
  }
  
  ${props => {
    switch (props.size) {
      case 'small':
        return css`
          font-size: var(--font-size-sm);
          -webkit-line-clamp: 2;
        `;
      case 'large':
        return css`
          font-size: var(--font-size-lg);
          -webkit-line-clamp: 3;
        `;
      default:
        return css`
          font-size: var(--font-size-base);
          -webkit-line-clamp: 2;
        `;
    }
  }}
`;

const AuthorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-bottom: var(--space-sm);
`;

const AuthorAvatar = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--border-light);
`;

const AuthorName = styled.span`
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  transition: color var(--duration-base) var(--ease-out);
  
  &:hover {
    color: var(--primary-color);
  }
`;

const VipBadge = styled.span`
  background: var(--vip-gradient);
  color: var(--text-inverse);
  font-size: var(--font-size-xs);
  padding: 2px var(--space-xs);
  border-radius: var(--border-radius-sm);
  font-weight: var(--font-weight-medium);
`;

const VideoStats = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  margin-top: auto;
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-xs);
`;

const StatIcon = styled.span`
  font-size: 14px;
`;

// ============ 工具函数 ============

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const formatViewCount = (count: number): string => {
  if (count >= 100000000) {
    return `${(count / 100000000).toFixed(1)}亿`;
  }
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}万`;
  }
  return count.toString();
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays < 30) return `${diffDays}天前`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`;
  return `${Math.floor(diffDays / 365)}年前`;
};

// ============ 组件实现 ============

const VideoCard: React.FC<VideoCardProps> = ({
  video,
  size = 'medium',
  showAuthor = true,
  showStats = true,
  className,
  onClick
}) => {
  const handleClick = () => {
    onClick?.(video);
  };

  const handleAuthorClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    // 处理作者点击事件
  };

  return (
    <CardContainer
      size={size}
      className={className}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <CoverContainer>
        <CoverImage 
          src={video.cover} 
          alt={video.title}
          loading="lazy"
        />
        <CoverOverlay>
          <PlayIcon />
        </CoverOverlay>
        <Duration>{formatDuration(video.duration)}</Duration>
      </CoverContainer>
      
      <ContentContainer size={size}>
        <VideoTitle size={size} title={video.title}>
          {video.title}
        </VideoTitle>
        
        {showAuthor && (
          <AuthorInfo onClick={handleAuthorClick}>
            <AuthorAvatar 
              src={video.author.avatar} 
              alt={video.author.nickname}
            />
            <AuthorName>{video.author.nickname}</AuthorName>
            {video.author.isVip && <VipBadge>VIP</VipBadge>}
          </AuthorInfo>
        )}
        
        {showStats && (
          <VideoStats>
            <StatItem>
              <StatIcon>▶️</StatIcon>
              <span>{formatViewCount(video.viewCount)}</span>
            </StatItem>
            <StatItem>
              <StatIcon>👍</StatIcon>
              <span>{formatViewCount(video.likeCount)}</span>
            </StatItem>
            <StatItem>
              <span>{formatDate(video.createdAt)}</span>
            </StatItem>
          </VideoStats>
        )}
      </ContentContainer>
    </CardContainer>
  );
};

export default VideoCard;