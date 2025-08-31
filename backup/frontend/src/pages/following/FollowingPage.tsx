/*
 * 大雄视频平台 - 关注页面
 * 展示关注的用户动态和最新视频
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Header from '../../components/layout/Header';
import VideoCard from '../../components/video/VideoCard';
import Button from '../../components/common/Button';
import { useTheme } from '../../contexts/ThemeContext';
import { mediaQuery, responsiveStyles } from '../../utils/responsive';

// ============ 类型定义 ============

interface User {
  id: string;
  username: string;
  nickname: string;
  avatar: string;
  banner?: string;
  isVip: boolean;
  verified: boolean;
  description: string;
  followers: number;
  videoCount: number;
  isFollowing: boolean;
  lastActiveTime: string;
  category: string;
}

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
  author: User;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Activity {
  id: string;
  type: 'video_upload' | 'live_start' | 'follow' | 'like' | 'comment';
  user: User;
  content: string;
  targetVideo?: Video;
  targetUser?: User;
  timestamp: string;
}

type TabType = 'videos' | 'activities' | 'live';

// ============ 样式定义 ============

const PageContainer = styled.div`
  ${responsiveStyles.fullHeight}
  background: var(--background-primary);
  overflow-x: hidden;
`;

const MainContent = styled.main`
  ${responsiveStyles.trueFullScreenContainer}
  padding: var(--space-lg);
  
  ${mediaQuery.down('md')} {
    padding: var(--space-md);
  }
  
  ${mediaQuery.down('sm')} {
    padding: var(--space-sm);
  }
`;

const PageHeader = styled.div`
  margin-bottom: var(--space-xl);
`;

const PageTitle = styled.h1`
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0 0 var(--space-sm) 0;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  
  @media (max-width: 768px) {
    font-size: var(--font-size-h2);
  }
`;

const PageSubtitle = styled.p`
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  margin: 0;
`;

const TabsContainer = styled.div`
  background: var(--background-secondary);
  border-radius: var(--border-radius-lg);
  padding: var(--space-md);
  margin-bottom: var(--space-xl);
`;

const TabsList = styled.div`
  display: flex;
  gap: var(--space-sm);
  border-bottom: 1px solid var(--border-light);
  margin-bottom: var(--space-lg);
`;

const TabButton = styled.button<{ $active: boolean }>`
  padding: var(--space-md) var(--space-lg);
  background: transparent;
  border: none;
  color: ${props => props.$active ? 'var(--primary-color)' : 'var(--text-secondary)'};
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  position: relative;
  white-space: nowrap;
  transition: all var(--duration-base) var(--ease-out);
  
  &:hover {
    color: var(--primary-color);
  }
  
  ${props => props.$active && `
    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--primary-color);
      border-radius: 1px;
    }
  `}
`;

const ContentContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: var(--space-xl);
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    gap: var(--space-lg);
  }
`;

const MainColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
`;

const VideoGrid = styled.div`
  display: grid;
  gap: var(--space-lg);
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  
  @media (max-width: 992px) {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-md);
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const ActivityFeed = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
`;

const ActivityItem = styled.div`
  background: var(--background-secondary);
  border-radius: var(--border-radius-lg);
  padding: var(--space-lg);
  display: flex;
  gap: var(--space-md);
  transition: all var(--duration-base) var(--ease-out);
  
  &:hover {
    background: var(--background-tertiary);
  }
`;

const ActivityAvatar = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
`;

const ActivityContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
`;

const ActivityHeader = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-sm);
`;

const ActivityUser = styled.span`
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  cursor: pointer;
  
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

const ActivityTime = styled.span`
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
`;

const ActivityText = styled.div`
  color: var(--text-secondary);
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
`;

const ActivityVideo = styled.div`
  margin-top: var(--space-sm);
  padding: var(--space-md);
  background: var(--background-primary);
  border-radius: var(--border-radius-base);
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-out);
  
  &:hover {
    background: var(--background-tertiary);
  }
`;

const VideoPreview = styled.div`
  display: flex;
  gap: var(--space-md);
`;

const VideoThumbnail = styled.img`
  width: 120px;
  height: 68px;
  object-fit: cover;
  border-radius: var(--border-radius-sm);
  flex-shrink: 0;
`;

const VideoInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
`;

const VideoTitle = styled.div`
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-tight);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const VideoMeta = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--text-tertiary);
  font-size: var(--font-size-xs);
`;

const Sidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  
  @media (max-width: 1200px) {
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

const FollowingList = styled.div`
  max-height: 400px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: var(--background-tertiary);
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 2px;
  }
`;

const FollowingItem = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  cursor: pointer;
  transition: background var(--duration-base) var(--ease-out);
  
  &:hover {
    background: var(--background-tertiary);
  }
`;

const FollowingAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
`;

const FollowingInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const FollowingName = styled.div`
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FollowingMeta = styled.div`
  color: var(--text-tertiary);
  font-size: var(--font-size-xs);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
`;

const OnlineIndicator = styled.div<{ $online: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.$online ? 'var(--success-color)' : 'var(--text-tertiary)'};
  margin-left: auto;
  flex-shrink: 0;
`;

const LoadMoreButton = styled(Button)`
  margin-top: var(--space-lg);
`;

const EmptyState = styled.div`
  text-align: center;
  padding: var(--space-xxxl) var(--space-lg);
  color: var(--text-tertiary);
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: var(--space-lg);
  opacity: 0.5;
`;

const EmptyText = styled.div`
  font-size: var(--font-size-lg);
  margin-bottom: var(--space-sm);
`;

const EmptySubtext = styled.div`
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
  margin-bottom: var(--space-lg);
`;

// ============ Mock 数据 ============

const mockFollowingUsers: User[] = Array.from({ length: 15 }, (_, i) => ({
  id: `following-user-${i + 1}`,
  username: `creator${i + 1}`,
  nickname: `创作者${i + 1}`,
  avatar: `https://picsum.photos/120/120?random=following-${i}`,
  banner: `https://picsum.photos/800/200?random=banner-${i}`,
  isVip: Math.random() > 0.6,
  verified: Math.random() > 0.7,
  description: `这是创作者${i + 1}的个人简介`,
  followers: Math.floor(Math.random() * 100000) + 1000,
  videoCount: Math.floor(Math.random() * 200) + 10,
  isFollowing: true,
  lastActiveTime: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
  category: ['科技', '游戏', '生活', '音乐', '教育'][Math.floor(Math.random() * 5)]
}));

const generateMockVideos = (count: number = 20): Video[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `following-video-${i + 1}`,
    title: `关注UP主的精彩视频 ${i + 1} - 不容错过的优质内容`,
    description: `这是来自关注UP主的优质视频内容 ${i + 1}`,
    cover: `https://picsum.photos/320/180?random=following-video-${i}`,
    url: '',
    duration: Math.floor(Math.random() * 1800) + 300,
    viewCount: Math.floor(Math.random() * 100000) + 1000,
    likeCount: Math.floor(Math.random() * 10000) + 100,
    commentCount: Math.floor(Math.random() * 1000) + 10,
    shareCount: Math.floor(Math.random() * 500) + 5,
    isLiked: Math.random() > 0.8,
    isCollected: Math.random() > 0.9,
    author: mockFollowingUsers[i % mockFollowingUsers.length],
    tags: ['推荐', '精品', '必看', '热门', '优质'].slice(0, Math.floor(Math.random() * 3) + 1),
    createdAt: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
    updatedAt: new Date().toISOString()
  }));
};

const generateMockActivities = (count: number = 15): Activity[] => {
  const activityTypes: Activity['type'][] = ['video_upload', 'live_start', 'follow', 'like', 'comment'];
  
  return Array.from({ length: count }, (_, i) => {
    const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    const user = mockFollowingUsers[i % mockFollowingUsers.length];
    
    let content = '';
    let targetVideo: Video | undefined;
    
    switch (type) {
      case 'video_upload':
        content = '发布了新视频';
        targetVideo = generateMockVideos(1)[0];
        break;
      case 'live_start':
        content = '开始直播了';
        break;
      case 'follow':
        content = '关注了新的UP主';
        break;
      case 'like':
        content = '点赞了视频';
        targetVideo = generateMockVideos(1)[0];
        break;
      case 'comment':
        content = '评论了视频';
        targetVideo = generateMockVideos(1)[0];
        break;
    }
    
    return {
      id: `activity-${i + 1}`,
      type,
      user,
      content,
      targetVideo,
      timestamp: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString()
    };
  });
};

// ============ 工具函数 ============

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return date.toLocaleDateString('zh-CN');
};

const formatNumber = (num: number): string => {
  if (num >= 100000000) return `${(num / 100000000).toFixed(1)}亿`;
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`;
  return num.toString();
};

const isUserOnline = (lastActiveTime: string): boolean => {
  const diff = Date.now() - new Date(lastActiveTime).getTime();
  return diff < 30 * 60 * 1000; // 30分钟内活跃视为在线
};

// ============ 组件实现 ============

const FollowingPage: React.FC = () => {
  const navigate = useNavigate();
  const { actualTheme } = useTheme();
  
  const [activeTab, setActiveTab] = useState<TabType>('videos');
  const [videos, setVideos] = useState<Video[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [followingUsers] = useState(mockFollowingUsers);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  // 初始化数据
  useEffect(() => {
    loadInitialData();
  }, [activeTab]);
  
  const loadInitialData = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (activeTab === 'videos') {
        setVideos(generateMockVideos(12));
      } else if (activeTab === 'activities') {
        setActivities(generateMockActivities(15));
      }
      
      setHasMore(true);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadMore = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (activeTab === 'videos') {
        const newVideos = generateMockVideos(8);
        setVideos(prev => [...prev, ...newVideos]);
      } else if (activeTab === 'activities') {
        const newActivities = generateMockActivities(10);
        setActivities(prev => [...prev, ...newActivities]);
      }
      
      // 模拟数据加载完毕
      setHasMore(videos.length < 60);
    } catch (error) {
      console.error('加载更多失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleVideoClick = (video: Video) => {
    navigate(`/video/${video.id}`);
  };
  
  const handleUserClick = (user: User) => {
    navigate(`/user/${user.id}`);
  };
  
  const handleActivityVideoClick = (video: Video) => {
    navigate(`/video/${video.id}`);
  };
  
  const getActivityIcon = (type: Activity['type']): string => {
    switch (type) {
      case 'video_upload': return '📹';
      case 'live_start': return '🔴';
      case 'follow': return '➕';
      case 'like': return '👍';
      case 'comment': return '💬';
      default: return '📝';
    }
  };
  
  const renderTabContent = () => {
    if (activeTab === 'videos') {
      return videos.length > 0 ? (
        <VideoGrid>
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onClick={handleVideoClick}
              showAuthor={true}
              showStats={true}
            />
          ))}
        </VideoGrid>
      ) : (
        <EmptyState>
          <EmptyIcon>📺</EmptyIcon>
          <EmptyText>暂无视频更新</EmptyText>
          <EmptySubtext>关注更多UP主，获得精彩内容推荐</EmptySubtext>
          <Button type="primary" onClick={() => navigate('/')}>
            去首页发现
          </Button>
        </EmptyState>
      );
    }
    
    if (activeTab === 'activities') {
      return activities.length > 0 ? (
        <ActivityFeed>
          {activities.map((activity) => (
            <ActivityItem key={activity.id}>
              <ActivityAvatar 
                src={activity.user.avatar} 
                alt={activity.user.nickname}
                onClick={() => handleUserClick(activity.user)}
              />
              <ActivityContent>
                <ActivityHeader>
                  <ActivityUser onClick={() => handleUserClick(activity.user)}>
                    {activity.user.nickname}
                  </ActivityUser>
                  {activity.user.isVip && <VipBadge>VIP</VipBadge>}
                  <ActivityTime>{formatTime(activity.timestamp)}</ActivityTime>
                </ActivityHeader>
                <ActivityText>
                  {getActivityIcon(activity.type)} {activity.content}
                </ActivityText>
                {activity.targetVideo && (
                  <ActivityVideo onClick={() => handleActivityVideoClick(activity.targetVideo!)}>
                    <VideoPreview>
                      <VideoThumbnail src={activity.targetVideo.cover} alt={activity.targetVideo.title} />
                      <VideoInfo>
                        <VideoTitle>{activity.targetVideo.title}</VideoTitle>
                        <VideoMeta>
                          <span>{formatNumber(activity.targetVideo.viewCount)} 播放</span>
                          <span>•</span>
                          <span>{formatTime(activity.targetVideo.createdAt)}</span>
                        </VideoMeta>
                      </VideoInfo>
                    </VideoPreview>
                  </ActivityVideo>
                )}
              </ActivityContent>
            </ActivityItem>
          ))}
        </ActivityFeed>
      ) : (
        <EmptyState>
          <EmptyIcon>📱</EmptyIcon>
          <EmptyText>暂无动态</EmptyText>
          <EmptySubtext>关注的UP主还没有新动态</EmptySubtext>
        </EmptyState>
      );
    }
    
    return (
      <EmptyState>
        <EmptyIcon>🔴</EmptyIcon>
        <EmptyText>暂无直播</EmptyText>
        <EmptySubtext>关注的UP主暂时没有在直播</EmptySubtext>
        <Button type="primary" onClick={() => navigate('/live')}>
          去直播广场
        </Button>
      </EmptyState>
    );
  };
  
  return (
    <PageContainer>
      <Header />
      
      <MainContent>
        <PageHeader>
          <PageTitle>
            <span>👥</span>
            <span>关注</span>
          </PageTitle>
          <PageSubtitle>查看你关注的UP主的最新动态和视频作品</PageSubtitle>
        </PageHeader>
        
        <TabsContainer>
          <TabsList>
            <TabButton $active={activeTab === 'videos'} onClick={() => setActiveTab('videos')}>
              最新视频
            </TabButton>
            <TabButton $active={activeTab === 'activities'} onClick={() => setActiveTab('activities')}>
              动态
            </TabButton>
            <TabButton $active={activeTab === 'live'} onClick={() => setActiveTab('live')}>
              直播中
            </TabButton>
          </TabsList>
        </TabsContainer>
        
        <ContentContainer>
          <MainColumn>
            {renderTabContent()}
            
            {hasMore && (activeTab === 'videos' || activeTab === 'activities') && (
              <LoadMoreButton
                type="secondary"
                size="large"
                onClick={loadMore}
                disabled={loading}
                style={{ alignSelf: 'center' }}
              >
                {loading ? '加载中...' : '加载更多'}
              </LoadMoreButton>
            )}
          </MainColumn>
          
          <Sidebar>
            <SidebarSection>
              <SidebarTitle>
                <span>👥</span>
                <span>我的关注 ({followingUsers.length})</span>
              </SidebarTitle>
              <FollowingList>
                {followingUsers.map((user) => (
                  <FollowingItem key={user.id} onClick={() => handleUserClick(user)}>
                    <FollowingAvatar src={user.avatar} alt={user.nickname} />
                    <FollowingInfo>
                      <FollowingName>{user.nickname}</FollowingName>
                      <FollowingMeta>
                        <span>{user.category}</span>
                        <span>•</span>
                        <span>{formatNumber(user.followers)} 粉丝</span>
                      </FollowingMeta>
                    </FollowingInfo>
                    <OnlineIndicator $online={isUserOnline(user.lastActiveTime)} />
                  </FollowingItem>
                ))}
              </FollowingList>
            </SidebarSection>
            
            <SidebarSection>
              <SidebarTitle>
                <span>📊</span>
                <span>数据统计</span>
              </SidebarTitle>
              <div style={{ padding: 'var(--space-md)' }}>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 'var(--space-md)',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--text-secondary)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>关注总数:</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 'var(--font-weight-medium)' }}>
                      {followingUsers.length}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>在线人数:</span>
                    <span style={{ color: 'var(--success-color)', fontWeight: 'var(--font-weight-medium)' }}>
                      {followingUsers.filter(user => isUserOnline(user.lastActiveTime)).length}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>今日更新:</span>
                    <span style={{ color: 'var(--primary-color)', fontWeight: 'var(--font-weight-medium)' }}>
                      {videos.filter(video => {
                        const diff = Date.now() - new Date(video.createdAt).getTime();
                        return diff < 24 * 60 * 60 * 1000;
                      }).length}
                    </span>
                  </div>
                </div>
              </div>
            </SidebarSection>
          </Sidebar>
        </ContentContainer>
      </MainContent>
    </PageContainer>
  );
};

export default FollowingPage;