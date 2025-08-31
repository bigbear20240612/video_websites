// 简化版VideoCard组件，修复崩溃问题
import React from 'react';
import styled from 'styled-components';
import { VideoCardProps } from '../../types';

const CardContainer = styled.div`
  background: var(--background-primary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-out);

  &:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
  }
`;

const CoverContainer = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  overflow: hidden;
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

const Duration = styled.div`
  position: absolute;
  bottom: var(--space-sm);
  right: var(--space-sm);
  background: rgba(0, 0, 0, 0.8);
  color: var(--text-inverse);
  padding: 2px var(--space-xs);
  border-radius: var(--border-radius-xs);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
`;

const InfoContainer = styled.div`
  padding: var(--space-md);
`;

const Title = styled.h3`
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  line-height: var(--line-height-tight);
  margin-bottom: var(--space-xs);
  
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const AuthorContainer = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-bottom: var(--space-xs);
`;

const Avatar = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
`;

const AuthorName = styled.span`
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
`;

const StatsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-md);
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
`;

const StatItem = styled.span`
  display: flex;
  align-items: center;
  gap: 2px;
`;

// 格式化数字显示
const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}万`;
  }
  return num.toString();
};

// 格式化时长
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const VideoCard: React.FC<VideoCardProps> = ({
  video,
  showAuthor = true,
  showStats = true,
  onClick,
  className
}) => {
  const handleClick = () => {
    onClick?.(video);
  };

  return (
    <CardContainer className={className} onClick={handleClick}>
      <CoverContainer>
        <CoverImage 
          src={video.cover} 
          alt={video.title}
          onError={(e) => {
            // 图片加载失败时的默认处理
            const target = e.target as HTMLImageElement;
            target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><rect width="320" height="180" fill="%23f0f0f0"/><text x="160" y="90" text-anchor="middle" font-size="14" fill="%23999">视频封面</text></svg>';
          }}
        />
        <Duration>{formatDuration(video.duration)}</Duration>
      </CoverContainer>

      <InfoContainer>
        <Title>{video.title}</Title>
        
        {showAuthor && (
          <AuthorContainer>
            <Avatar 
              src={video.author.avatar} 
              alt={video.author.nickname}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="%23ddd"/><text x="12" y="16" text-anchor="middle" font-size="12" fill="%23999">👤</text></svg>';
              }}
            />
            <AuthorName>{video.author.nickname}</AuthorName>
            {video.author.isVip && (
              <span style={{ 
                background: 'var(--vip-gradient)', 
                color: 'var(--text-inverse)',
                padding: '1px 4px',
                borderRadius: '2px',
                fontSize: '10px',
                fontWeight: 'bold'
              }}>
                VIP
              </span>
            )}
          </AuthorContainer>
        )}

        {showStats && (
          <StatsContainer>
            <StatItem>
              👁 {formatNumber(video.viewCount)}
            </StatItem>
            <StatItem>
              👍 {formatNumber(video.likeCount)}
            </StatItem>
            {video.commentCount > 0 && (
              <StatItem>
                💬 {formatNumber(video.commentCount)}
              </StatItem>
            )}
          </StatsContainer>
        )}
      </InfoContainer>
    </CardContainer>
  );
};

export default VideoCard;