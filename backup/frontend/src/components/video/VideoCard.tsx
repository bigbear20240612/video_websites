// 修复版VideoCard组件 - 简化类型定义
import React, { useState } from 'react';
import styled from 'styled-components';

// ============ 本地类型定义 ============
interface Video {
  id: string;
  title: string;
  description: string;
  cover: string;
  url: string;
  duration: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isLiked: boolean;
  isCollected: boolean;
  author: {
    id: string;
    username: string;
    nickname: string;
    avatar: string;
    isVip: boolean;
    followers: number;
    following: number;
    likes: number;
    createdAt: string;
    updatedAt: string;
  };
  category: {
    id: string;
    name: string;
    icon: string;
    description: string;
    videoCount: number;
  };
  tags: string[];
  qualities: any[];
  createdAt: string;
  updatedAt: string;
}

interface VideoCardProps {
  video: Video;
  size?: 'small' | 'medium' | 'large';
  showAuthor?: boolean;
  showStats?: boolean;
  className?: string;
  onClick?: (video: Video) => void;
}

// ============ 样式定义 ============

const CardContainer = styled.div`
  display: flex;
  flex-direction: column;
  background: var(--background-primary);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-out);
  box-shadow: var(--shadow-sm);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: 2px solid transparent;
    border-radius: var(--border-radius-lg);
    background: linear-gradient(45deg, var(--primary-color), var(--secondary-color)) border-box;
    -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    opacity: 0;
    transition: opacity var(--duration-base) var(--ease-out);
  }
  
  &:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-4px) scale(1.02);
    
    &::before {
      opacity: 1;
    }
  }
  
  &:active {
    transform: translateY(-2px) scale(1.01);
    transition-duration: 0.1s;
  }
`;

const CoverContainer = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  overflow: hidden;
  background: var(--background-tertiary);
`;

const PreviewVideo = styled.video`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity var(--duration-base) var(--ease-out);
  
  &.show {
    opacity: 1;
  }
`;

const CoverImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all var(--duration-slow) var(--ease-out);
  
  ${CardContainer}:hover & {
    transform: scale(1.08);
    filter: brightness(1.1) saturate(1.2);
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
  transition: all var(--duration-base) var(--ease-bounce);
  backdrop-filter: blur(8px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  
  ${CardContainer}:hover & {
    transform: translate(-50%, -50%) scale(1);
    background: var(--primary-color);
    box-shadow: 0 8px 32px rgba(24, 144, 255, 0.3);
  }
  
  &::before {
    content: '▶';
    margin-left: 4px;
    filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.3));
  }
  
  &:active {
    transform: translate(-50%, -50%) scale(0.95);
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

const ContentContainer = styled.div`
  padding: var(--space-md);
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const VideoTitle = styled.h3`
  margin: 0 0 var(--space-xs) 0;
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  line-height: var(--line-height-tight);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color var(--duration-base) var(--ease-out);
  font-size: var(--font-size-base);
  
  ${CardContainer}:hover & {
    color: var(--primary-color);
  }
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
  const [isHovered, setIsHovered] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTimer, setPreviewTimer] = useState<NodeJS.Timeout | null>(null);
  
  const handleClick = () => {
    onClick?.(video);
  };

  const handleAuthorClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    console.log('点击作者:', video.author.nickname);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    // 延迟显示预览视频，避免快速划过时触发
    const timer = setTimeout(() => {
      setShowPreview(true);
    }, 800);
    setPreviewTimer(timer);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowPreview(false);
    if (previewTimer) {
      clearTimeout(previewTimer);
      setPreviewTimer(null);
    }
  };

  return (
    <CardContainer
      className={className}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><rect width="320" height="180" fill="%23f0f0f0"/><text x="160" y="90" text-anchor="middle" font-size="14" fill="%23999">📹</text></svg>';
          }}
        />
        
        {/* 预览视频 - 使用示例视频URL */}
        <PreviewVideo
          className={showPreview ? 'show' : ''}
          muted
          autoPlay={showPreview}
          loop
          playsInline
          preload="none"
        >
          <source src="https://sample-videos.com/zip/10/mp4/SampleVideo_360x240_1mb.mp4" type="video/mp4" />
          <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
        </PreviewVideo>
        
        <PlayIcon />
        <Duration>{formatDuration(video.duration)}</Duration>
      </CoverContainer>
      
      <ContentContainer>
        <VideoTitle title={video.title}>
          {video.title}
        </VideoTitle>
        
        {showAuthor && (
          <AuthorInfo onClick={handleAuthorClick}>
            <AuthorAvatar 
              src={video.author.avatar} 
              alt={video.author.nickname}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="%23ddd"/><text x="12" y="16" text-anchor="middle" font-size="10" fill="%23666">👤</text></svg>';
              }}
            />
            <AuthorName>{video.author.nickname}</AuthorName>
            {video.author.isVip && <VipBadge>VIP</VipBadge>}
          </AuthorInfo>
        )}
        
        {showStats && (
          <VideoStats>
            <StatItem>
              <span>▶️</span>
              <span>{formatViewCount(video.viewCount)}</span>
            </StatItem>
            <StatItem>
              <span>👍</span>
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