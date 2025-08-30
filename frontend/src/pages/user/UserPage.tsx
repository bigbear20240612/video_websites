/*
 * 大雄视频平台 - 用户个人页面
 * 展示用户信息、视频作品、关注/粉丝等
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Header from '../../components/layout/Header';
import VideoCard from '../../components/video/VideoCard';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Transition from '../../components/common/Transition';
import { useTheme } from '../../contexts/ThemeContext';
import { mediaQuery, responsiveStyles } from '../../utils/responsive';

// ============ 类型定义 ============

interface UserProfile {
  id: string;
  username: string;
  nickname: string;
  avatar: string;
  banner: string;
  isVip: boolean;
  verified: boolean;
  description: string;
  location: string;
  website: string;
  followers: number;
  following: number;
  likes: number;
  videoCount: number;
  joinDate: string;
}

// ============ 样式定义 ============

const PageContainer = styled.div`
  ${responsiveStyles.fullHeight}
  background: var(--background-primary);
  overflow-x: hidden;
`;

const MainContent = styled.main`
  ${responsiveStyles.trueFullScreenContainer}
`;

const ProfileBanner = styled.div`
  position: relative;
  height: clamp(180px, 20vw, 240px);
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  overflow: hidden;
  margin: 0 -var(--space-md);
  
  ${mediaQuery.up('lg')} {
    margin: 0 -var(--space-xl);
  }
`;

const BannerImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.8;
`;

const BannerOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(0, 0, 0, 0.3) 50%,
    rgba(0, 0, 0, 0.7) 100%
  );
`;

const ProfileSection = styled.section`
  position: relative;
  padding: 0 var(--space-md) clamp(var(--space-lg), 4vw, var(--space-xl));
  background: var(--background-primary);
  margin-top: clamp(-40px, -5vw, -60px);
  z-index: 10;
  
  ${mediaQuery.up('lg')} {
    padding: 0 var(--space-xl) var(--space-xl);
  }
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: flex-end;
  gap: clamp(var(--space-md), 3vw, var(--space-lg));
  margin-bottom: clamp(var(--space-lg), 4vw, var(--space-xl));
  
  ${mediaQuery.down('md')} {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
`;

const AvatarWrapper = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const Avatar = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid var(--background-primary);
  box-shadow: var(--shadow-lg);
  object-fit: cover;
  
  @media (max-width: 768px) {
    width: 100px;
    height: 100px;
  }
`;

const VipBadge = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 32px;
  height: 32px;
  background: var(--vip-gradient);
  border-radius: 50%;
  border: 3px solid var(--background-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: var(--font-weight-bold);
  color: var(--text-inverse);
  
  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }
`;

const VerifiedBadge = styled.div`
  position: absolute;
  top: -5px;
  right: -5px;
  width: 30px;
  height: 30px;
  background: var(--primary-color);
  border-radius: 50%;
  border: 3px solid var(--background-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--text-inverse);
  
  @media (max-width: 768px) {
    width: 26px;
    height: 26px;
    font-size: 11px;
  }
`;

const ProfileInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
`;

const UserName = styled.h1`
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  
  @media (max-width: 768px) {
    font-size: var(--font-size-h3);
    justify-content: center;
  }
`;

const UserId = styled.div`
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-normal);
`;

const UserDescription = styled.p`
  color: var(--text-secondary);
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
  margin: 0;
  max-width: 600px;
`;

const UserMeta = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
  
  @media (max-width: 768px) {
    justify-content: center;
    flex-wrap: wrap;
    gap: var(--space-md);
  }
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-xs);
`;

const ProfileActions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;

const StatsSection = styled.section`
  ${responsiveStyles.gridResponsive({
    xs: 2,
    sm: 4
  })}
  gap: clamp(var(--space-md), 3vw, var(--space-lg));
  margin-bottom: clamp(var(--space-lg), 4vw, var(--space-xl));
  padding: clamp(var(--space-md), 3vw, var(--space-lg));
  background: var(--background-secondary);
  border-radius: var(--border-radius-lg);
`;

const StatItem = styled.div`
  text-align: center;
  padding: var(--space-md);
  border-radius: var(--border-radius-base);
  transition: background var(--duration-base) var(--ease-out);
  cursor: pointer;
  
  &:hover {
    background: var(--background-tertiary);
  }
`;

const StatNumber = styled.div`
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-bold);
  color: var(--primary-color);
  margin-bottom: var(--space-xs);
`;

const StatLabel = styled.div`
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
`;

const TabsSection = styled.section`
  margin-bottom: var(--space-xl);
`;

const TabsList = styled.div`
  display: flex;
  border-bottom: 2px solid var(--border-light);
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
`;

const TabButton = styled.button<{ $active: boolean }>`
  padding: var(--space-md) var(--space-lg);
  background: transparent;
  border: none;
  color: ${props => props.$active ? 'var(--primary-color)' : 'var(--text-secondary)'};
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  white-space: nowrap;
  position: relative;
  transition: all var(--duration-base) var(--ease-out);
  
  &:hover {
    color: var(--primary-color);
  }
  
  ${props => props.$active && `
    &::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--primary-color);
      border-radius: 1px;
    }
  `}
`;

const ContentSection = styled.section`
  min-height: 400px;
`;

const VideoGrid = styled.div`
  ${responsiveStyles.gridResponsive({
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5
  })}
  gap: clamp(var(--space-sm), 2vw, var(--space-lg));
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
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
`;

const FollowersModal = styled.div<{ $visible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: ${props => props.$visible ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: var(--background-primary);
  border-radius: var(--border-radius-lg);
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: var(--shadow-xl);
`;

const ModalHeader = styled.div`
  padding: var(--space-lg);
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalTitle = styled.h2`
  font-size: var(--font-size-h4);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
`;

const CloseButton = styled.button`
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 50%;
  color: var(--text-secondary);
  font-size: 18px;
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-out);
  
  &:hover {
    background: var(--background-secondary);
    color: var(--text-primary);
  }
`;

const ModalBody = styled.div`
  padding: var(--space-lg);
  max-height: 400px;
  overflow-y: auto;
`;

const UserItem = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  border-radius: var(--border-radius-base);
  transition: background var(--duration-base) var(--ease-out);
  cursor: pointer;
  
  &:hover {
    background: var(--background-secondary);
  }
`;

const UserItemAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
`;

const UserItemInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
`;

const UserItemName = styled.div`
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
`;

const UserItemStats = styled.div`
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
`;

// ============ Mock 数据 ============

const mockUserProfile: UserProfile = {
  id: 'user123',
  username: 'daxiong_dev',
  nickname: '大雄开发者',
  avatar: 'https://picsum.photos/240/240?random=user',
  banner: 'https://picsum.photos/1200/300?random=banner',
  isVip: true,
  verified: true,
  description: '全栈开发工程师 | React & Node.js 技术分享 | 致力于创造更好的用户体验 💻✨\n\n分享编程技巧、项目实战和技术思考，让编程变得更有趣！',
  location: '北京市',
  website: 'https://daxiong.dev',
  followers: 125600,
  following: 89,
  likes: 2580000,
  videoCount: 156,
  joinDate: '2022-03-15'
};

const mockUserVideos = Array.from({ length: 12 }, (_, i) => ({
  id: `user-video-${i + 1}`,
  title: `用户视频作品 ${i + 1} - 精彩内容分享`,
  description: `这是用户创作的第${i + 1}个视频作品`,
  cover: `https://picsum.photos/320/180?random=${i + 200}`,
  url: '',
  duration: Math.floor(Math.random() * 1800) + 300,
  viewCount: Math.floor(Math.random() * 100000) + 5000,
  likeCount: Math.floor(Math.random() * 10000) + 500,
  commentCount: Math.floor(Math.random() * 1000) + 50,
  shareCount: Math.floor(Math.random() * 500) + 20,
  isLiked: Math.random() > 0.7,
  isCollected: Math.random() > 0.8,
  author: mockUserProfile,
  category: {
    id: 'tech',
    name: '科技',
    icon: '💻',
    description: '科技相关内容',
    videoCount: 1000
  },
  tags: ['教程', '实战', '分享'],
  qualities: [],
  createdAt: new Date(Date.now() - Math.random() * 86400000 * 365).toISOString(),
  updatedAt: new Date().toISOString()
}));

// ============ 工具函数 ============

const formatNumber = (num: number): string => {
  if (num >= 100000000) return `${(num / 100000000).toFixed(1)}亿`;
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`;
  return num.toString();
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// ============ 组件实现 ============

const UserPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { actualTheme } = useTheme();

  const [user] = useState(mockUserProfile);
  const [activeTab, setActiveTab] = useState('videos');
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersType, setFollowersType] = useState<'followers' | 'following'>('followers');

  // 初始加载
  useEffect(() => {
    const loadTimer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(loadTimer);
  }, [id]);

  const handleFollow = async () => {
    setIsFollowing(!isFollowing);
    // 这里可以调用API
    console.log(isFollowing ? '取消关注' : '关注用户', user.nickname);
  };

  const handleShowFollowers = (type: 'followers' | 'following') => {
    setFollowersType(type);
    setShowFollowersModal(true);
  };

  const handleTabChange = async (tabId: string) => {
    if (tabId === activeTab) return;
    
    setContentLoading(true);
    setActiveTab(tabId);
    
    // 模拟加载延时
    await new Promise(resolve => setTimeout(resolve, 800));
    setContentLoading(false);
  };

  const handleVideoClick = (video: any) => {
    navigate(`/video/${video.id}`);
  };

  const handleMessage = () => {
    console.log('发送私信');
    // 这里可以打开私信弹窗
  };

  const tabs = [
    { id: 'videos', label: '投稿视频', count: user.videoCount },
    { id: 'playlists', label: '播放列表', count: 8 },
    { id: 'likes', label: '点赞视频', count: 432 },
    { id: 'collections', label: '收藏夹', count: 15 }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'videos':
        return (
          <VideoGrid>
            {mockUserVideos.map((video, index) => (
              <Transition
                key={video.id}
                show={true}
                type="slide"
                direction="up"
                delay={index * 30}
              >
                <VideoCard
                  video={video}
                  onClick={handleVideoClick}
                  showAuthor={false}
                  showStats={true}
                />
              </Transition>
            ))}
          </VideoGrid>
        );
      case 'playlists':
      case 'likes':
      case 'collections':
        return (
          <EmptyState>
            <EmptyIcon>📝</EmptyIcon>
            <EmptyText>暂无内容</EmptyText>
            <EmptySubtext>该用户还没有{tabs.find(t => t.id === activeTab)?.label}</EmptySubtext>
          </EmptyState>
        );
      default:
        return null;
    }
  };

  // Mock 粉丝/关注数据
  const mockFollowers = Array.from({ length: 20 }, (_, i) => ({
    id: `follower-${i + 1}`,
    nickname: `用户${i + 1}`,
    username: `user${i + 1}`,
    avatar: `https://picsum.photos/80/80?random=${i + 300}`,
    followers: Math.floor(Math.random() * 10000) + 100,
    isVip: Math.random() > 0.7
  }));

  if (!user) {
    return (
      <PageContainer>
        <Header />
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          用户不存在或已被删除
        </div>
      </PageContainer>
    );
  }

  if (loading) {
    return (
      <PageContainer>
        <Header />
        <LoadingContainer>
          <LoadingSpinner size="large" text="加载用户信息中..." />
        </LoadingContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header />
      
      <MainContent>
        <ProfileBanner>
          <BannerImage src={user.banner} alt={`${user.nickname}的主页横幅`} />
          <BannerOverlay />
        </ProfileBanner>

        <ProfileSection>
          <ProfileHeader>
            <AvatarWrapper>
              <Avatar src={user.avatar} alt={user.nickname} />
              {user.isVip && <VipBadge>VIP</VipBadge>}
              {user.verified && <VerifiedBadge>✓</VerifiedBadge>}
            </AvatarWrapper>

            <ProfileInfo>
              <UserName>
                {user.nickname}
                <UserId>@{user.username}</UserId>
              </UserName>
              
              <UserDescription>{user.description}</UserDescription>
              
              <UserMeta>
                <MetaItem>
                  <span>📍</span>
                  <span>{user.location}</span>
                </MetaItem>
                <MetaItem>
                  <span>🔗</span>
                  <a href={user.website} target="_blank" rel="noopener noreferrer">
                    {user.website}
                  </a>
                </MetaItem>
                <MetaItem>
                  <span>📅</span>
                  <span>加入于 {formatDate(user.joinDate)}</span>
                </MetaItem>
              </UserMeta>
            </ProfileInfo>

            <ProfileActions>
              <Button
                type={isFollowing ? "secondary" : "primary"}
                onClick={handleFollow}
                icon={isFollowing ? "✓" : "+"}
              >
                {isFollowing ? '已关注' : '关注'}
              </Button>
              <Button
                type="secondary"
                onClick={handleMessage}
                icon="✉"
              >
                私信
              </Button>
            </ProfileActions>
          </ProfileHeader>

          <StatsSection>
            <StatItem onClick={() => handleShowFollowers('followers')}>
              <StatNumber>{formatNumber(user.followers)}</StatNumber>
              <StatLabel>粉丝</StatLabel>
            </StatItem>
            <StatItem onClick={() => handleShowFollowers('following')}>
              <StatNumber>{formatNumber(user.following)}</StatNumber>
              <StatLabel>关注</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>{formatNumber(user.likes)}</StatNumber>
              <StatLabel>获赞</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>{formatNumber(user.videoCount)}</StatNumber>
              <StatLabel>视频</StatLabel>
            </StatItem>
          </StatsSection>

          <TabsSection>
            <TabsList>
              {tabs.map((tab) => (
                <TabButton
                  key={tab.id}
                  $active={activeTab === tab.id}
                  onClick={() => handleTabChange(tab.id)}
                >
                  {tab.label} ({tab.count})
                </TabButton>
              ))}
            </TabsList>

            <ContentSection>
              {contentLoading ? (
                <LoadingContainer>
                  <LoadingSpinner size="large" text="加载中..." />
                </LoadingContainer>
              ) : (
                <Transition show={!contentLoading} type="fade" duration={300}>
                  {renderContent()}
                </Transition>
              )}
            </ContentSection>
          </TabsSection>
        </ProfileSection>
      </MainContent>

      {/* 粉丝/关注弹窗 */}
      <FollowersModal $visible={showFollowersModal} onClick={() => setShowFollowersModal(false)}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalHeader>
            <ModalTitle>
              {followersType === 'followers' ? '粉丝列表' : '关注列表'}
              ({followersType === 'followers' ? formatNumber(user.followers) : formatNumber(user.following)})
            </ModalTitle>
            <CloseButton onClick={() => setShowFollowersModal(false)}>
              ×
            </CloseButton>
          </ModalHeader>
          <ModalBody>
            {mockFollowers.map((follower, index) => (
              <Transition
                key={follower.id}
                show={showFollowersModal}
                type="slide"
                direction="up"
                delay={index * 20}
              >
                <UserItem onClick={() => navigate(`/user/${follower.id}`)}>
                  <UserItemAvatar src={follower.avatar} alt={follower.nickname} />
                  <UserItemInfo>
                    <UserItemName>
                      {follower.nickname}
                      {follower.isVip && <span style={{ color: 'var(--vip-color)', marginLeft: '4px' }}>VIP</span>}
                    </UserItemName>
                    <UserItemStats>@{follower.username} • {formatNumber(follower.followers)} 粉丝</UserItemStats>
                  </UserItemInfo>
                  <Button size="small" type="ghost">
                    {followersType === 'followers' ? '回关' : '取关'}
                  </Button>
                </UserItem>
              </Transition>
            ))}
          </ModalBody>
        </ModalContent>
      </FollowersModal>
    </PageContainer>
  );
};

export default UserPage;