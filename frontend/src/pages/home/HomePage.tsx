/*
 * 大雄视频平台 - 首页组件
 * 包含轮播图、推荐视频、热门直播等功能模块
 */

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Header from '../../components/layout/Header';
import VideoCard from '../../components/video/VideoCard';
import Button from '../../components/common/Button';
import SkeletonCard from '../../components/common/SkeletonCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Transition from '../../components/common/Transition';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';
import { mediaQuery, responsiveStyles } from '../../utils/responsive';

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

const HeroBanner = styled.section`
  position: relative;
  height: clamp(240px, 40vw, 400px);
  border-radius: var(--border-radius-xl);
  overflow: hidden;
  margin-bottom: var(--space-xxxl);
  background: var(--background-tertiary);
  
  ${mediaQuery.down('md')} {
    height: clamp(200px, 35vw, 280px);
    margin-bottom: var(--space-xl);
    border-radius: var(--border-radius-lg);
  }
  
  ${mediaQuery.down('sm')} {
    height: clamp(160px, 30vw, 240px);
    margin-bottom: var(--space-lg);
    border-radius: var(--border-radius-base);
    margin: 0 -var(--space-sm) var(--space-lg) -var(--space-sm);
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
  background: linear-gradient(45deg, rgba(0, 0, 0, 0.6) 0%, transparent 50%, rgba(0, 0, 0, 0.3) 100%);
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
  
  @media (max-width: 576px) {
    bottom: var(--space-md);
    left: var(--space-md);
    right: var(--space-md);
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
  
  @media (max-width: 576px) {
    font-size: var(--font-size-h3);
    margin-bottom: var(--space-xs);
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
    max-width: 100%;
  }
  
  @media (max-width: 576px) {
    font-size: var(--font-size-sm);
    margin-bottom: var(--space-sm);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-lg);
`;

const CategoryFilter = styled.div`
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
  padding: var(--space-sm) 0;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
  
  @media (max-width: 768px) {
    margin-bottom: var(--space-md);
  }
`;

const CategoryTab = styled.button<{ $active?: boolean }>`
  padding: var(--space-sm) var(--space-md);
  border: 2px solid ${props => props.$active ? 'var(--primary-color)' : 'var(--border-light)'};
  background: ${props => props.$active ? 'var(--primary-color)' : 'transparent'};
  color: ${props => props.$active ? 'var(--text-inverse)' : 'var(--text-secondary)'};
  border-radius: var(--border-radius-lg);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--duration-base) var(--ease-out);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  min-width: fit-content;
  
  &:hover {
    border-color: var(--primary-color);
    color: ${props => props.$active ? 'var(--text-inverse)' : 'var(--primary-color)'};
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const VideoGrid = styled.div`
  ${responsiveStyles.gridResponsive({
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5,
  })}
  gap: clamp(var(--space-sm), 2vw, var(--space-lg));
  margin-bottom: clamp(var(--space-xl), 4vw, var(--space-xxxl));
  
  ${mediaQuery.up('xxl')} {
    grid-template-columns: repeat(6, 1fr);
  }
  
  ${mediaQuery.down('sm')} {
    margin-bottom: var(--space-xl);
  }
`;

// Mock 数据
const mockBannerData = [
  {
    id: '1',
    title: '2025年度巨制：《科幻世界》',
    description: '一部颠覆想象的科幻大片，带你走进未来世界',
    image: 'https://picsum.photos/1200/400?random=1'
  },
  {
    id: '2', 
    title: '编程教程：从零开始学React',
    description: '最新React 18教程，适合初学者的完整课程',
    image: 'https://picsum.photos/1200/400?random=2'
  },
  {
    id: '3',
    title: '美食探索：世界各地特色小吃',
    description: '跟随镜头品尝全球美食，感受不同文化的味道',
    image: 'https://picsum.photos/1200/400?random=3'
  }
];

// 扩展 mock 数据以支持无限滚动
const mockVideoData = Array.from({ length: 50 }, (_, i) => {
  const categoryTypes = ['tech', 'entertainment', 'education', 'gaming', 'lifestyle', 'sports', 'food', 'travel'];
  const categoryNames = ['科技', '娱乐', '教育', '游戏', '生活', '体育', '美食', '旅行'];
  const categoryIcons = ['💻', '🎵', '📚', '🎮', '🏠', '⚽', '🍽️', '✈️'];
  
  const categoryIndex = i % categoryTypes.length;
  
  return {
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
      id: categoryTypes[categoryIndex],
      name: categoryNames[categoryIndex],
      icon: categoryIcons[categoryIndex],
      description: `${categoryNames[categoryIndex]}相关内容`,
      videoCount: 1000
    },
    tags: ['标签1', '标签2'],
    qualities: [],
    createdAt: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
    updatedAt: new Date().toISOString()
  };
});

const categories = [
  { id: 'all', name: '全部', icon: '📺' },
  { id: 'tech', name: '科技', icon: '💻' },
  { id: 'entertainment', name: '娱乐', icon: '🎵' },
  { id: 'education', name: '教育', icon: '📚' },
  { id: 'gaming', name: '游戏', icon: '🎮' },
  { id: 'lifestyle', name: '生活', icon: '🏠' },
  { id: 'sports', name: '体育', icon: '⚽' },
  { id: 'food', name: '美食', icon: '🍽️' },
  { id: 'travel', name: '旅行', icon: '✈️' }
];

const HomePage: React.FC = () => {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState('all');
  const [filteredVideos, setFilteredVideos] = useState(mockVideoData);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [displayCount, setDisplayCount] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % mockBannerData.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // 模拟初始加载
  useEffect(() => {
    const loadTimer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(loadTimer);
  }, []);

  useEffect(() => {
    if (activeCategory === 'all') {
      setFilteredVideos(mockVideoData);
    } else {
      setFilteredVideos(mockVideoData.filter(video => video.category.id === activeCategory));
    }
    setDisplayCount(10); // 重置显示数量
    setHasMore(true);
  }, [activeCategory]);

  const handleVideoClick = (video: any) => {
    console.log('点击视频:', video.title);
  };

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
  };

  const handleSearch = async (query: string) => {
    console.log('搜索查询:', query);
    setSearchLoading(true);
    
    // 添加搜索过渡动画
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // 模拟搜索延时
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const searchResults = mockVideoData.filter(video => 
      video.title.toLowerCase().includes(query.toLowerCase()) ||
      video.description.toLowerCase().includes(query.toLowerCase()) ||
      video.author.nickname.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredVideos(searchResults);
    setActiveCategory('all'); // 重置分类筛选
    setDisplayCount(10); // 重置显示数量
    setHasMore(true);
    setSearchLoading(false);
  };

  // 无限滚动加载更多
  const loadMoreVideos = async () => {
    setLoadingMore(true);
    
    // 模拟加载延时
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const nextCount = displayCount + 5;
    setDisplayCount(nextCount);
    
    // 检查是否还有更多数据
    if (nextCount >= filteredVideos.length) {
      setHasMore(false);
    }
    
    setLoadingMore(false);
  };

  const { isFetching } = useInfiniteScroll(loadMoreVideos, {
    hasMore,
    loading: loading || searchLoading || loadingMore,
  });

  return (
    <PageContainer>
      <Header onSearch={handleSearch} />
      
      <MainContent>
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
        </HeroBanner>

        <SectionTitle>
          📺 为你推荐
        </SectionTitle>
        
        <CategoryFilter>
          {categories.map((category) => (
            <CategoryTab
              key={category.id}
              $active={activeCategory === category.id}
              onClick={() => handleCategoryClick(category.id)}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </CategoryTab>
          ))}
        </CategoryFilter>
        
        <VideoGrid>
          {loading || searchLoading ? (
            Array.from({ length: 10 }, (_, i) => (
              <Transition
                key={`skeleton-${i}`}
                show={true}
                type="fade"
                delay={i * 50}
              >
                <SkeletonCard />
              </Transition>
            ))
          ) : (
            filteredVideos.slice(0, displayCount).map((video, index) => (
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
                  showAuthor={true}
                  showStats={true}
                />
              </Transition>
            ))
          )}
          
          {/* 加载更多骨架屏 */}
          {loadingMore && !loading && !searchLoading && (
            Array.from({ length: 5 }, (_, i) => (
              <Transition
                key={`skeleton-more-${i}`}
                show={true}
                type="fade"
                delay={i * 50}
              >
                <SkeletonCard />
              </Transition>
            ))
          )}
        </VideoGrid>
        
        <SectionTitle>
          🆕 最新视频
        </SectionTitle>
        
        <VideoGrid>
          {loading ? (
            Array.from({ length: 5 }, (_, i) => (
              <Transition
                key={`skeleton-latest-${i}`}
                show={true}
                type="fade"
                delay={i * 50}
              >
                <SkeletonCard />
              </Transition>
            ))
          ) : (
            mockVideoData.slice(10, 15).map((video, index) => (
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
                  showAuthor={true}
                  showStats={true}
                />
              </Transition>
            ))
          )}
        </VideoGrid>
      </MainContent>
    </PageContainer>
  );
};

export default HomePage;