/*
 * 大雄视频平台 - 首页组件
 * 包含轮播图、推荐视频、热门直播等功能模块
 */

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Header from '../../components/layout/Header';
import VideoCard from '../../components/video/VideoCard';
import Button from '../../components/common/Button';
import { Video, LiveStream, Category } from '../../types';

// ============ 样式定义 ============

const PageContainer = styled.div`
  min-height: 100vh;
  background: var(--background-primary);
`;

const MainContent = styled.main`
  max-width: var(--container-xxl);
  margin: 0 auto;
  padding: var(--space-lg);
  
  @media (max-width: 768px) {
    padding: var(--space-md);
  }
`;

// 轮播区域
const HeroBanner = styled.section`
  position: relative;
  height: 400px;
  border-radius: var(--border-radius-xl);
  overflow: hidden;
  margin-bottom: var(--space-xxxl);
  background: var(--background-tertiary);
  
  @media (max-width: 768px) {
    height: 240px;
    margin-bottom: var(--space-xl);
  }
`;

const BannerSlide = styled.div<{ active: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: ${props => props.active ? 1 : 0};
  transition: opacity var(--duration-slow) var(--ease-out);
`;

const BannerImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const BannerOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    45deg,
    rgba(0, 0, 0, 0.6) 0%,
    transparent 50%,
    rgba(0, 0, 0, 0.3) 100%
  );
`;

const BannerContent = styled.div`
  position: absolute;
  bottom: var(--space-xl);
  left: var(--space-xl);
  right: var(--space-xl);
  color: var(--text-inverse);
  
  @media (max-width: 768px) {
    bottom: var(--space-lg);
    left: var(--space-lg);
    right: var(--space-lg);
  }
`;

const BannerTitle = styled.h2`
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--space-sm);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  
  @media (max-width: 768px) {
    font-size: var(--font-size-h2);
  }
`;

const BannerDescription = styled.p`
  font-size: var(--font-size-lg);
  opacity: 0.9;
  margin-bottom: var(--space-lg);
  max-width: 600px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  
  @media (max-width: 768px) {
    font-size: var(--font-size-base);
    margin-bottom: var(--space-md);
  }
`;

const BannerIndicators = styled.div`
  position: absolute;
  bottom: var(--space-lg);
  right: var(--space-xl);
  display: flex;
  gap: var(--space-sm);
`;

const BannerIndicator = styled.button<{ active: boolean }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--text-inverse);
  background: ${props => props.active ? 'var(--text-inverse)' : 'transparent'};
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-out);
  
  &:hover {
    background: var(--text-inverse);
  }
`;

// 内容区域
const ContentSection = styled.section`
  margin-bottom: var(--space-xxxl);
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-lg);
`;

const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
`;

const SectionIcon = styled.span`
  font-size: var(--font-size-h3);
`;

const MoreLink = styled.a`
  color: var(--text-secondary);
  text-decoration: none;
  font-size: var(--font-size-base);
  transition: color var(--duration-base) var(--ease-out);
  
  &:hover {
    color: var(--primary-color);
  }
`;

// 视频网格
const VideoGrid = styled.div`
  display: grid;
  gap: var(--space-lg);
  
  /* 响应式网格 */
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  
  @media (min-width: 1200px) {
    grid-template-columns: repeat(5, 1fr);
  }
  
  @media (max-width: 992px) {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-md);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-sm);
  }
`;

// 直播网格
const LiveGrid = styled.div`
  display: grid;
  gap: var(--space-lg);
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-md);
  }
`;

const LiveCard = styled.div`
  position: relative;
  background: var(--background-primary);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-out);
  box-shadow: var(--shadow-sm);
  
  &:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
  }
`;

const LiveCover = styled.div`
  position: relative;
  aspect-ratio: 16/9;
  overflow: hidden;
`;

const LiveImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const LiveBadge = styled.div`
  position: absolute;
  top: var(--space-sm);
  left: var(--space-sm);
  background: var(--live-gradient);
  color: var(--text-inverse);
  padding: 4px var(--space-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  box-shadow: var(--shadow-base);
`;

const LiveViewers = styled.div`
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
  background: rgba(0, 0, 0, 0.8);
  color: var(--text-inverse);
  padding: 4px var(--space-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  backdrop-filter: blur(4px);
`;

const LiveInfo = styled.div`
  padding: var(--space-md);
`;

const LiveTitle = styled.h4`
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const LiveAuthor = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
`;

// 加载状态
const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--space-xxxl);
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-light);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// ============ Mock 数据 ============

const mockBannerData = [
  {
    id: '1',
    title: '2025年度巨制：《科幻世界》',
    description: '一部颠覆想象的科幻大片，带你走进未来世界',
    image: 'https://picsum.photos/1200/400?random=1',
    video: {} as Video
  },
  {
    id: '2',
    title: '编程教程：从零开始学React',
    description: '最新React 18教程，适合初学者的完整课程',
    image: 'https://picsum.photos/1200/400?random=2',
    video: {} as Video
  },
  {
    id: '3',
    title: '美食探索：世界各地特色小吃',
    description: '跟随镜头品尝全球美食，感受不同文化的味道',
    image: 'https://picsum.photos/1200/400?random=3',
    video: {} as Video
  }
];

const mockVideoData: Video[] = Array.from({ length: 15 }, (_, i) => ({
  id: `video-${i + 1}`,
  title: `精彩视频标题 ${i + 1} - 这是一个很有趣的内容`,
  description: `这是视频${i + 1}的描述信息`,
  cover: `https://picsum.photos/320/180?random=${i + 10}`,
  url: '',
  duration: Math.floor(Math.random() * 3600) + 60,
  viewCount: Math.floor(Math.random() * 1000000) + 1000,
  likeCount: Math.floor(Math.random() * 50000) + 100,
  commentCount: Math.floor(Math.random() * 5000) + 10,
  shareCount: Math.floor(Math.random() * 1000) + 10,
  isLiked: Math.random() > 0.5,
  isCollected: Math.random() > 0.7,
  author: {
    id: `user-${i + 1}`,
    username: `user${i + 1}`,
    nickname: `UP主${i + 1}`,
    avatar: `https://picsum.photos/64/64?random=${i + 100}`,
    isVip: Math.random() > 0.7,
    followers: Math.floor(Math.random() * 100000) + 1000,
    following: Math.floor(Math.random() * 1000) + 10,
    likes: Math.floor(Math.random() * 1000000) + 10000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  category: {
    id: 'tech',
    name: '科技',
    icon: '💻',
    description: '科技相关内容',
    videoCount: 1000
  },
  tags: ['标签1', '标签2'],
  qualities: [],
  createdAt: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
  updatedAt: new Date().toISOString()
}));

const mockLiveData: LiveStream[] = Array.from({ length: 8 }, (_, i) => ({
  id: `live-${i + 1}`,
  title: `直播间标题 ${i + 1} - 正在直播中`,
  cover: `https://picsum.photos/400/225?random=${i + 200}`,
  streamUrl: '',
  author: {
    id: `streamer-${i + 1}`,
    username: `streamer${i + 1}`,
    nickname: `主播${i + 1}`,
    avatar: `https://picsum.photos/32/32?random=${i + 300}`,
    isVip: Math.random() > 0.6,
    followers: Math.floor(Math.random() * 50000) + 1000,
    following: 0,
    likes: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  category: {
    id: 'entertainment',
    name: '娱乐',
    icon: '🎵',
    description: '娱乐内容',
    videoCount: 500
  },
  viewerCount: Math.floor(Math.random() * 50000) + 100,
  isLive: true,
  tags: ['娱乐', '直播'],
  startTime: new Date().toISOString()
}));

// ============ 组件实现 ============

const HomePage: React.FC = () => {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // 轮播图自动切换
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => 
        (prev + 1) % mockBannerData.length
      );
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const handleVideoClick = (video: Video) => {
    console.log('点击视频:', video.title);
    // 跳转到视频播放页
  };

  const handleLiveClick = (live: LiveStream) => {
    console.log('点击直播:', live.title);
    // 跳转到直播页
  };

  const formatViewerCount = (count: number): string => {
    if (count >= 10000) {
      return `${(count / 10000).toFixed(1)}万人观看`;
    }
    return `${count}人观看`;
  };

  if (loading) {
    return (
      <PageContainer>
        <Header />
        <LoadingContainer>
          <LoadingSpinner />
        </LoadingContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header />
      
      <MainContent>
        {/* 轮播推荐区域 */}
        <HeroBanner>
          {mockBannerData.map((banner, index) => (
            <BannerSlide key={banner.id} active={index === currentBannerIndex}>
              <BannerImage src={banner.image} alt={banner.title} />
              <BannerOverlay />
              <BannerContent>
                <BannerTitle>{banner.title}</BannerTitle>
                <BannerDescription>{banner.description}</BannerDescription>
                <Button type="primary" size="large">
                  立即观看
                </Button>
              </BannerContent>
            </BannerSlide>
          ))}
          
          <BannerIndicators>
            {mockBannerData.map((_, index) => (
              <BannerIndicator
                key={index}
                active={index === currentBannerIndex}
                onClick={() => setCurrentBannerIndex(index)}
                aria-label={`切换到第${index + 1}张图片`}
              />
            ))}
          </BannerIndicators>
        </HeroBanner>

        {/* 为你推荐 */}
        <ContentSection>
          <SectionHeader>
            <SectionTitle>
              <SectionIcon>📺</SectionIcon>
              为你推荐
            </SectionTitle>
            <MoreLink href="/recommended">更多 →</MoreLink>
          </SectionHeader>
          
          <VideoGrid>
            {mockVideoData.slice(0, 10).map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onClick={handleVideoClick}
                showAuthor={true}
                showStats={true}
              />
            ))}
          </VideoGrid>
        </ContentSection>

        {/* 热门直播 */}
        <ContentSection>
          <SectionHeader>
            <SectionTitle>
              <SectionIcon>🔥</SectionIcon>
              热门直播
            </SectionTitle>
            <MoreLink href="/live">更多 →</MoreLink>
          </SectionHeader>
          
          <LiveGrid>
            {mockLiveData.map((live) => (
              <LiveCard
                key={live.id}
                onClick={() => handleLiveClick(live)}
              >
                <LiveCover>
                  <LiveImage src={live.cover} alt={live.title} />
                  <LiveBadge>🔴 LIVE</LiveBadge>
                  <LiveViewers>
                    👥 {formatViewerCount(live.viewerCount)}
                  </LiveViewers>
                </LiveCover>
                
                <LiveInfo>
                  <LiveTitle>{live.title}</LiveTitle>
                  <LiveAuthor>
                    <img 
                      src={live.author.avatar} 
                      alt={live.author.nickname}
                      width="20"
                      height="20"
                      style={{ borderRadius: '50%' }}
                    />
                    <span>{live.author.nickname}</span>
                    {live.author.isVip && (
                      <span style={{ 
                        background: 'var(--vip-gradient)', 
                        color: 'var(--text-inverse)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 'bold'
                      }}>
                        VIP
                      </span>
                    )}
                  </LiveAuthor>
                </LiveInfo>
              </LiveCard>
            ))}
          </LiveGrid>
        </ContentSection>

        {/* 最新视频 */}
        <ContentSection>
          <SectionHeader>
            <SectionTitle>
              <SectionIcon>🆕</SectionIcon>
              最新视频
            </SectionTitle>
            <MoreLink href="/latest">更多 →</MoreLink>
          </SectionHeader>
          
          <VideoGrid>
            {mockVideoData.slice(10, 15).map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onClick={handleVideoClick}
                showAuthor={true}
                showStats={true}
              />
            ))}
          </VideoGrid>
        </ContentSection>
      </MainContent>
    </PageContainer>
  );
};

export default HomePage;