/*
 * 大雄视频平台 - 视频播放页面
 * 包含视频播放器、视频信息、评论区、推荐视频等功能
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Header from '../../components/layout/Header';
import VideoPlayer from '../../components/video/VideoPlayer';
import VideoCard from '../../components/video/VideoCard';
import Button from '../../components/common/Button';
import { useTheme } from '../../contexts/ThemeContext';
import { mediaQuery, responsiveStyles } from '../../utils/responsive';

// ============ 样式定义 ============

const PageContainer = styled.div`
  ${responsiveStyles.fullHeight}
  background: var(--background-primary);
  overflow-x: hidden;
`;

const MainContent = styled.main`
  ${responsiveStyles.trueFullScreenContainer}
  display: grid;
  grid-template-columns: 1fr clamp(280px, 25vw, 360px);
  gap: clamp(var(--space-lg), 3vw, var(--space-xl));
  padding: var(--space-lg);
  
  ${mediaQuery.down('lg')} {
    grid-template-columns: 1fr;
    gap: var(--space-lg);
  }
  
  ${mediaQuery.down('md')} {
    padding: var(--space-md);
  }
  
  ${mediaQuery.down('sm')} {
    gap: var(--space-md);
    padding: var(--space-sm);
  }
`;

const VideoSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
`;

const PlayerWrapper = styled.div`
  width: 100%;
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
`;

const VideoInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
`;

const VideoTitle = styled.h1`
  font-size: clamp(var(--font-size-h3), 4vw, var(--font-size-h2));
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  line-height: var(--line-height-tight);
  margin: 0;
`;

const VideoMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) 0;
  border-bottom: 1px solid var(--border-light);
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
`;

const MetaIcon = styled.span`
  font-size: 16px;
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: clamp(var(--space-xs), 2vw, var(--space-sm));
  margin-left: auto;
  
  ${mediaQuery.down('md')} {
    margin-left: 0;
    width: 100%;
    justify-content: space-between;
  }
`;

const ActionButton = styled(Button)<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  font-size: var(--font-size-sm);
  background: ${props => props.$active ? 'var(--primary-color)' : 'var(--background-secondary)'};
  color: ${props => props.$active ? 'var(--text-inverse)' : 'var(--text-secondary)'};
  border: 1px solid ${props => props.$active ? 'var(--primary-color)' : 'var(--border-light)'};
  
  &:hover {
    background: ${props => props.$active ? 'var(--primary-hover)' : 'var(--background-tertiary)'};
    color: ${props => props.$active ? 'var(--text-inverse)' : 'var(--text-primary)'};
    border-color: ${props => props.$active ? 'var(--primary-hover)' : 'var(--border-color)'};
  }
`;

const AuthorSection = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg);
  background: var(--background-secondary);
  border-radius: var(--border-radius-lg);
`;

const AuthorAvatar = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--border-light);
`;

const AuthorInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
`;

const AuthorName = styled.h3`
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
`;

const VipBadge = styled.span`
  background: var(--vip-gradient);
  color: var(--text-inverse);
  font-size: var(--font-size-xs);
  padding: 2px var(--space-xs);
  border-radius: var(--border-radius-sm);
  font-weight: var(--font-weight-medium);
`;

const AuthorStats = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-md);
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
`;

const FollowButton = styled(Button)`
  padding: var(--space-sm) var(--space-lg);
  font-weight: var(--font-weight-medium);
  
  @media (max-width: 768px) {
    padding: var(--space-xs) var(--space-md);
    font-size: var(--font-size-sm);
  }
`;

const VideoDescription = styled.div`
  padding: var(--space-lg);
  background: var(--background-secondary);
  border-radius: var(--border-radius-lg);
  line-height: var(--line-height-base);
  color: var(--text-secondary);
  white-space: pre-wrap;
  
  h4 {
    color: var(--text-primary);
    margin-bottom: var(--space-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
  }
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-top: var(--space-md);
`;

const Tag = styled.span`
  display: inline-block;
  padding: var(--space-xs) var(--space-sm);
  background: var(--background-tertiary);
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
  border-radius: var(--border-radius-full);
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-out);
  
  &:hover {
    background: var(--primary-color);
    color: var(--text-inverse);
  }
`;

const CommentsSection = styled.section`
  padding: var(--space-lg);
  background: var(--background-secondary);
  border-radius: var(--border-radius-lg);
`;

const CommentsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--border-light);
`;

const CommentsTitle = styled.h3`
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
`;

const CommentInput = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: var(--space-md);
  background: var(--background-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-lg);
  color: var(--text-primary);
  font-family: inherit;
  font-size: var(--font-size-base);
  resize: vertical;
  transition: border-color var(--duration-base) var(--ease-out);
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
  }
  
  &::placeholder {
    color: var(--text-tertiary);
  }
`;

const CommentActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  margin-top: var(--space-md);
`;

const Sidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: clamp(var(--space-md), 2vw, var(--space-lg));
  
  ${mediaQuery.down('lg')} {
    order: -1;
  }
`;

const SidebarSection = styled.section`
  background: var(--background-secondary);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
`;

const SidebarTitle = styled.h3`
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
  padding: var(--space-md);
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
`;

const RecommendedList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-md);
`;

const RecommendedItem = styled.div`
  display: flex;
  gap: var(--space-sm);
  padding: var(--space-sm);
  border-radius: var(--border-radius-base);
  cursor: pointer;
  transition: background var(--duration-base) var(--ease-out);
  
  &:hover {
    background: var(--background-tertiary);
  }
`;

const RecommendedCover = styled.img`
  width: 120px;
  height: 68px;
  object-fit: cover;
  border-radius: var(--border-radius-sm);
  flex-shrink: 0;
`;

const RecommendedContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
`;

const RecommendedTitle = styled.h4`
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin: 0;
  line-height: var(--line-height-tight);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const RecommendedMeta = styled.div`
  color: var(--text-tertiary);
  font-size: var(--font-size-xs);
  line-height: 1.2;
`;

// ============ Mock数据 ============

const mockVideoData = {
  id: '1',
  title: '【React教程】从零开始构建现代化视频平台 - 完整项目实战',
  url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  duration: 596,
  viewCount: 128500,
  likeCount: 8520,
  commentCount: 456,
  shareCount: 123,
  isLiked: false,
  isCollected: false,
  author: {
    id: 'author1',
    username: 'daxiong_dev',
    nickname: '大雄开发者',
    avatar: 'https://picsum.photos/120/120?random=author',
    isVip: true,
    followers: 125000,
    following: 89,
    likes: 2580000,
    createdAt: '2023-01-15T08:00:00Z',
    updatedAt: '2024-12-10T12:00:00Z'
  },
  category: {
    id: 'tech',
    name: '编程技术',
    icon: '💻',
    description: '编程开发相关内容',
    videoCount: 1250
  },
  tags: ['React', 'TypeScript', '前端开发', '教程', '实战项目'],
  description: `🚀 欢迎来到React实战教程！

在这个完整的项目实战中，我们将从零开始构建一个现代化的视频平台，涵盖：

📋 主要内容：
• React 18 + TypeScript 开发环境搭建
• 组件化开发与状态管理
• 自定义Hook的设计与实现  
• 响应式布局与主题系统
• 视频播放器组件开发
• 搜索与筛选功能实现
• 性能优化与最佳实践

🎯 适合人群：
• 有一定JavaScript基础的开发者
• 想要深入学习React的同学
• 希望了解项目实战的朋友

⏰ 时间安排：
00:00 项目介绍与环境搭建
05:30 组件设计与开发
15:20 状态管理实现
25:40 样式系统构建
35:10 功能模块开发
45:30 性能优化技巧

💡 源码获取：
关注并私信"源码"即可获得完整项目代码！

#React #前端开发 #TypeScript #实战教程`,
  qualities: [
    { quality: '480p', url: 'https://example.com/video/480p.mp4', size: 125000000 },
    { quality: '720p', url: 'https://example.com/video/720p.mp4', size: 250000000 },
    { quality: '1080p', url: 'https://example.com/video/1080p.mp4', size: 500000000 }
  ],
  createdAt: '2024-12-10T10:30:00Z',
  updatedAt: '2024-12-10T10:30:00Z'
};

const mockRecommendedVideos = Array.from({ length: 8 }, (_, i) => ({
  id: `rec-${i + 1}`,
  title: `推荐视频标题 ${i + 1} - 这是一个有趣的内容描述`,
  cover: `https://picsum.photos/240/135?random=${i + 50}`,
  author: `UP主${i + 1}`,
  viewCount: Math.floor(Math.random() * 100000) + 1000,
  duration: Math.floor(Math.random() * 600) + 120,
  createdAt: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString()
}));

// ============ 工具函数 ============

const formatViewCount = (count: number): string => {
  if (count >= 100000000) return `${(count / 100000000).toFixed(1)}亿`;
  if (count >= 10000) return `${(count / 10000).toFixed(1)}万`;
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

const VideoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { actualTheme } = useTheme();
  
  const [video] = useState(mockVideoData);
  const [isLiked, setIsLiked] = useState(false);
  const [isCollected, setIsCollected] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [comment, setComment] = useState('');

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  const handleCollect = () => {
    setIsCollected(!isCollected);
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    // 这里可以添加Toast提示
    console.log('链接已复制到剪贴板');
  };

  const handleCommentSubmit = () => {
    if (comment.trim()) {
      console.log('发表评论:', comment);
      setComment('');
      // 这里可以调用API提交评论
    }
  };

  const handleVideoClick = (videoId: string) => {
    navigate(`/video/${videoId}`);
  };

  if (!video) {
    return (
      <PageContainer>
        <Header />
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          视频不存在或已被删除
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header />
      
      <MainContent>
        <VideoSection>
          <PlayerWrapper>
            <VideoPlayer
              video={video}
              danmakuEnabled={true}
              onPlay={() => console.log('视频开始播放')}
              onPause={() => console.log('视频暂停')}
              onTimeUpdate={(time) => console.log('时间更新:', time)}
            />
          </PlayerWrapper>

          <VideoInfo>
            <VideoTitle>{video.title}</VideoTitle>
            
            <VideoMeta>
              <MetaItem>
                <MetaIcon>👁</MetaIcon>
                <span>{formatViewCount(video.viewCount)} 次观看</span>
              </MetaItem>
              
              <MetaItem>
                <MetaIcon>📅</MetaIcon>
                <span>{formatDate(video.createdAt)}</span>
              </MetaItem>
              
              <ActionButtons>
                <ActionButton $active={isLiked} onClick={handleLike}>
                  <span>{isLiked ? '👍' : '👍'}</span>
                  <span>{formatViewCount(video.likeCount + (isLiked ? 1 : 0))}</span>
                </ActionButton>
                
                <ActionButton $active={isCollected} onClick={handleCollect}>
                  <span>{isCollected ? '⭐' : '☆'}</span>
                  <span>收藏</span>
                </ActionButton>
                
                <ActionButton onClick={handleShare}>
                  <span>🔗</span>
                  <span>分享</span>
                </ActionButton>
              </ActionButtons>
            </VideoMeta>

            <AuthorSection>
              <AuthorAvatar src={video.author.avatar} alt={video.author.nickname} />
              <AuthorInfo>
                <AuthorName>
                  {video.author.nickname}
                  {video.author.isVip && <VipBadge>VIP</VipBadge>}
                </AuthorName>
                <AuthorStats>
                  <span>{formatViewCount(video.author.followers)} 粉丝</span>
                  <span>•</span>
                  <span>{formatViewCount(video.author.likes)} 获赞</span>
                </AuthorStats>
              </AuthorInfo>
              <FollowButton
                type={isFollowing ? "secondary" : "primary"}
                onClick={handleFollow}
              >
                {isFollowing ? '已关注' : '关注'}
              </FollowButton>
            </AuthorSection>

            <VideoDescription>
              <h4>📝 视频简介</h4>
              {video.description}
              <TagList>
                {video.tags.map((tag) => (
                  <Tag key={tag}>#{tag}</Tag>
                ))}
              </TagList>
            </VideoDescription>

            <CommentsSection>
              <CommentsHeader>
                <CommentsTitle>
                  <span>💬</span>
                  <span>{formatViewCount(video.commentCount)} 条评论</span>
                </CommentsTitle>
              </CommentsHeader>
              
              <CommentInput
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="发一条友善的评论吧~"
                maxLength={500}
              />
              <CommentActions>
                <Button type="secondary" size="small" onClick={() => setComment('')}>
                  取消
                </Button>
                <Button 
                  type="primary" 
                  size="small" 
                  onClick={handleCommentSubmit}
                  disabled={!comment.trim()}
                >
                  发布评论
                </Button>
              </CommentActions>
            </CommentsSection>
          </VideoInfo>
        </VideoSection>

        <Sidebar>
          <SidebarSection>
            <SidebarTitle>
              <span>🔥</span>
              <span>相关推荐</span>
            </SidebarTitle>
            <RecommendedList>
              {mockRecommendedVideos.map((recVideo) => (
                <RecommendedItem 
                  key={recVideo.id}
                  onClick={() => handleVideoClick(recVideo.id)}
                >
                  <RecommendedCover src={recVideo.cover} alt={recVideo.title} />
                  <RecommendedContent>
                    <RecommendedTitle>{recVideo.title}</RecommendedTitle>
                    <RecommendedMeta>
                      <div>{recVideo.author}</div>
                      <div>{formatViewCount(recVideo.viewCount)} 次观看 • {formatDate(recVideo.createdAt)}</div>
                    </RecommendedMeta>
                  </RecommendedContent>
                </RecommendedItem>
              ))}
            </RecommendedList>
          </SidebarSection>
        </Sidebar>
      </MainContent>
    </PageContainer>
  );
};

export default VideoPage;