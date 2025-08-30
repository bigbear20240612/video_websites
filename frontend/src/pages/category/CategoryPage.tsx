/*
 * 大雄视频平台 - 分类页面
 * 展示不同分类的视频内容，支持筛选和排序
 */

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Header from '../../components/layout/Header';
import VideoCard from '../../components/video/VideoCard';
import Button from '../../components/common/Button';
import { useTheme } from '../../contexts/ThemeContext';
import { mediaQuery, responsiveStyles } from '../../utils/responsive';

// ============ 类型定义 ============

interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  videoCount: number;
  color: string;
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
  author: {
    id: string;
    username: string;
    nickname: string;
    avatar: string;
    isVip: boolean;
    verified: boolean;
  };
  category: Category;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

type SortType = 'latest' | 'popular' | 'trending' | 'oldest';
type FilterType = 'all' | 'today' | 'week' | 'month' | 'year';

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

const CategoryHeader = styled.div`
  background: var(--background-secondary);
  border-radius: var(--border-radius-xl);
  padding: var(--space-xl);
  margin-bottom: var(--space-xl);
  position: relative;
  overflow: hidden;
`;

const CategoryBanner = styled.div<{ $color: string }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, ${props => props.$color}20 0%, ${props => props.$color}05 100%);
  opacity: 0.8;
`;

const CategoryInfo = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    gap: var(--space-md);
  }
`;

const CategoryIcon = styled.div`
  font-size: 64px;
  width: 120px;
  height: 120px;
  background: var(--background-primary);
  border-radius: var(--border-radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-lg);
  
  @media (max-width: 768px) {
    width: 80px;
    height: 80px;
    font-size: 48px;
  }
`;

const CategoryDetails = styled.div`
  flex: 1;
`;

const CategoryTitle = styled.h1`
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0 0 var(--space-sm) 0;
  
  @media (max-width: 768px) {
    font-size: var(--font-size-h2);
  }
`;

const CategoryDescription = styled.p`
  font-size: var(--font-size-lg);
  color: var(--text-secondary);
  line-height: var(--line-height-base);
  margin: 0 0 var(--space-md) 0;
`;

const CategoryStats = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  font-size: var(--font-size-base);
  color: var(--text-tertiary);
  
  @media (max-width: 768px) {
    justify-content: center;
    gap: var(--space-md);
  }
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-xs);
`;

const FiltersContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
  padding: var(--space-lg);
  background: var(--background-secondary);
  border-radius: var(--border-radius-lg);
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: var(--space-md);
    align-items: stretch;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-md);
  
  @media (max-width: 768px) {
    justify-content: space-between;
  }
`;

const FilterLabel = styled.span`
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  white-space: nowrap;
`;

const FilterSelect = styled.select`
  padding: var(--space-sm) var(--space-md);
  background: var(--background-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-base);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
  }
`;

const TagFilters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
`;

const TagButton = styled.button<{ $active: boolean }>`
  padding: var(--space-xs) var(--space-md);
  background: ${props => props.$active ? 'var(--primary-color)' : 'var(--background-primary)'};
  color: ${props => props.$active ? 'var(--text-inverse)' : 'var(--text-secondary)'};
  border: 1px solid ${props => props.$active ? 'var(--primary-color)' : 'var(--border-light)'};
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-out);
  white-space: nowrap;
  
  &:hover {
    background: ${props => props.$active ? 'var(--primary-hover)' : 'var(--background-tertiary)'};
    border-color: ${props => props.$active ? 'var(--primary-hover)' : 'var(--border-color)'};
  }
`;

const ResultsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-lg);
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: var(--space-md);
    align-items: stretch;
  }
`;

const ResultsCount = styled.div`
  font-size: var(--font-size-base);
  color: var(--text-secondary);
`;

const ViewToggle = styled.div`
  display: flex;
  background: var(--background-secondary);
  border-radius: var(--border-radius-base);
  padding: 4px;
  gap: 4px;
`;

const ViewButton = styled.button<{ $active: boolean }>`
  padding: var(--space-xs) var(--space-sm);
  background: ${props => props.$active ? 'var(--background-primary)' : 'transparent'};
  color: ${props => props.$active ? 'var(--text-primary)' : 'var(--text-secondary)'};
  border: none;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-out);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  
  &:hover {
    color: var(--text-primary);
  }
`;

const VideoGrid = styled.div<{ $view: string }>`
  display: grid;
  gap: var(--space-lg);
  grid-template-columns: ${props => {
    switch (props.$view) {
      case 'list': return '1fr';
      case 'compact': return 'repeat(auto-fill, minmax(200px, 1fr))';
      default: return 'repeat(auto-fill, minmax(280px, 1fr))';
    }
  }};
  
  @media (max-width: 992px) {
    grid-template-columns: ${props => {
      switch (props.$view) {
        case 'list': return '1fr';
        case 'compact': return 'repeat(auto-fill, minmax(160px, 1fr))';
        default: return 'repeat(2, 1fr)';
      }
    }};
    gap: var(--space-md);
  }
  
  @media (max-width: 480px) {
    grid-template-columns: ${props => props.$view === 'list' ? '1fr' : 'repeat(2, 1fr)'};
    gap: var(--space-sm);
  }
`;

const LoadMoreContainer = styled.div`
  text-align: center;
  margin-top: var(--space-xl);
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

// ============ Mock 数据 ============

const mockCategories: Category[] = [
  { id: 'tech', name: '科技', icon: '💻', description: '科技数码、编程开发、AI人工智能等前沿科技内容', videoCount: 12543, color: '#1890ff' },
  { id: 'game', name: '游戏', icon: '🎮', description: '游戏实况、攻略解说、电竞赛事等游戏相关内容', videoCount: 8967, color: '#722ed1' },
  { id: 'music', name: '音乐', icon: '🎵', description: '音乐MV、翻唱作品、乐器演奏、音乐教学等', videoCount: 15432, color: '#eb2f96' },
  { id: 'life', name: '生活', icon: '🌟', description: '日常生活、旅行分享、美食制作、生活技巧等', videoCount: 23156, color: '#52c41a' },
  { id: 'education', name: '教育', icon: '📚', description: '知识科普、学习方法、技能教学、考试辅导等', videoCount: 9834, color: '#faad14' },
  { id: 'entertainment', name: '娱乐', icon: '🎭', description: '搞笑视频、娱乐八卦、综艺节目、明星动态等', videoCount: 18765, color: '#ff4d4f' },
  { id: 'sport', name: '体育', icon: '⚽', description: '体育赛事、健身教程、运动技巧、体育新闻等', videoCount: 6543, color: '#13c2c2' },
  { id: 'food', name: '美食', icon: '🍳', description: '美食制作、餐厅探店、料理教程、美食评测等', videoCount: 11287, color: '#fa8c16' }
];

const mockTags = ['热门', '最新', '教程', '实战', '入门', '进阶', '评测', '开箱', '解说', '攻略'];

// ============ 工具函数 ============

const formatNumber = (num: number): string => {
  if (num >= 100000000) return `${(num / 100000000).toFixed(1)}亿`;
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`;
  return num.toString();
};

const generateMockVideos = (categoryId: string, count: number = 20): Video[] => {
  const category = mockCategories.find(c => c.id === categoryId) || mockCategories[0];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `${categoryId}-video-${i + 1}`,
    title: `${category.name}精彩视频 ${i + 1} - 专业解说与深度分析`,
    description: `这是一个关于${category.name}的精彩视频内容`,
    cover: `https://picsum.photos/320/180?random=${categoryId}-${i}`,
    url: '',
    duration: Math.floor(Math.random() * 1800) + 300,
    viewCount: Math.floor(Math.random() * 100000) + 1000,
    likeCount: Math.floor(Math.random() * 10000) + 100,
    commentCount: Math.floor(Math.random() * 1000) + 10,
    shareCount: Math.floor(Math.random() * 500) + 5,
    isLiked: Math.random() > 0.8,
    isCollected: Math.random() > 0.9,
    author: {
      id: `author-${i}`,
      username: `creator${i + 1}`,
      nickname: `${category.name}创作者${i + 1}`,
      avatar: `https://picsum.photos/120/120?random=author-${i}`,
      isVip: Math.random() > 0.7,
      verified: Math.random() > 0.8
    },
    category,
    tags: mockTags.slice(0, Math.floor(Math.random() * 4) + 1),
    createdAt: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
    updatedAt: new Date().toISOString()
  }));
};

// ============ 组件实现 ============

const CategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { actualTheme } = useTheme();
  
  const [category, setCategory] = useState<Category | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const [sortType, setSortType] = useState<SortType>('latest');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  
  // 初始化分类和视频数据
  useEffect(() => {
    if (categoryId) {
      const foundCategory = mockCategories.find(c => c.id === categoryId);
      if (foundCategory) {
        setCategory(foundCategory);
        loadVideos(foundCategory.id);
      } else {
        navigate('/404');
      }
    }
  }, [categoryId, navigate]);
  
  // 加载视频数据
  const loadVideos = async (catId: string, append: boolean = false) => {
    setLoading(true);
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const newVideos = generateMockVideos(catId, 12);
      
      if (append) {
        setVideos(prev => [...prev, ...newVideos]);
      } else {
        setVideos(newVideos);
      }
      
      // 模拟分页结束
      setHasMore(videos.length < 100);
    } catch (error) {
      console.error('加载视频失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 处理视频点击
  const handleVideoClick = (video: Video) => {
    navigate(`/video/${video.id}`);
  };
  
  // 处理筛选变化
  const handleSortChange = (newSort: SortType) => {
    setSortType(newSort);
    if (category) {
      loadVideos(category.id);
    }
  };
  
  const handleFilterChange = (newFilter: FilterType) => {
    setFilterType(newFilter);
    if (category) {
      loadVideos(category.id);
    }
  };
  
  const handleTagClick = (tag: string) => {
    setSelectedTag(selectedTag === tag ? '' : tag);
    if (category) {
      loadVideos(category.id);
    }
  };
  
  // 加载更多
  const handleLoadMore = () => {
    if (category && !loading) {
      loadVideos(category.id, true);
    }
  };
  
  if (!category) {
    return (
      <PageContainer>
        <Header />
        <MainContent>
          <EmptyState>
            <EmptyIcon>🔍</EmptyIcon>
            <EmptyText>分类不存在</EmptyText>
            <EmptySubtext>请检查分类ID是否正确</EmptySubtext>
          </EmptyState>
        </MainContent>
      </PageContainer>
    );
  }
  
  const filteredVideos = videos.filter(video => {
    if (selectedTag && !video.tags.includes(selectedTag)) return false;
    return true;
  });
  
  return (
    <PageContainer>
      <Header />
      
      <MainContent>
        <CategoryHeader>
          <CategoryBanner $color={category.color} />
          <CategoryInfo>
            <CategoryIcon>{category.icon}</CategoryIcon>
            <CategoryDetails>
              <CategoryTitle>{category.name}</CategoryTitle>
              <CategoryDescription>{category.description}</CategoryDescription>
              <CategoryStats>
                <StatItem>
                  <span>📺</span>
                  <span>{formatNumber(category.videoCount)} 个视频</span>
                </StatItem>
                <StatItem>
                  <span>👁</span>
                  <span>总播放量 {formatNumber(category.videoCount * 1234)}</span>
                </StatItem>
              </CategoryStats>
            </CategoryDetails>
          </CategoryInfo>
        </CategoryHeader>
        
        <FiltersContainer>
          <FilterGroup>
            <FilterLabel>排序:</FilterLabel>
            <FilterSelect
              value={sortType}
              onChange={(e) => handleSortChange(e.target.value as SortType)}
            >
              <option value="latest">最新发布</option>
              <option value="popular">最多播放</option>
              <option value="trending">正在热播</option>
              <option value="oldest">最早发布</option>
            </FilterSelect>
          </FilterGroup>
          
          <FilterGroup>
            <FilterLabel>时间:</FilterLabel>
            <FilterSelect
              value={filterType}
              onChange={(e) => handleFilterChange(e.target.value as FilterType)}
            >
              <option value="all">全部时间</option>
              <option value="today">今天</option>
              <option value="week">本周</option>
              <option value="month">本月</option>
              <option value="year">今年</option>
            </FilterSelect>
          </FilterGroup>
          
          <TagFilters>
            {mockTags.slice(0, 6).map((tag) => (
              <TagButton
                key={tag}
                $active={selectedTag === tag}
                onClick={() => handleTagClick(tag)}
              >
                {tag}
              </TagButton>
            ))}
          </TagFilters>
        </FiltersContainer>
        
        <ResultsHeader>
          <ResultsCount>
            找到 {formatNumber(filteredVideos.length)} 个相关视频
          </ResultsCount>
          
          <ViewToggle>
            <ViewButton $active={viewMode === 'grid'} onClick={() => setViewMode('grid')}>
              <span>⊞</span>
              <span>网格</span>
            </ViewButton>
            <ViewButton $active={viewMode === 'list'} onClick={() => setViewMode('list')}>
              <span>☰</span>
              <span>列表</span>
            </ViewButton>
            <ViewButton $active={viewMode === 'compact'} onClick={() => setViewMode('compact')}>
              <span>⊡</span>
              <span>紧凑</span>
            </ViewButton>
          </ViewToggle>
        </ResultsHeader>
        
        {filteredVideos.length > 0 ? (
          <>
            <VideoGrid $view={viewMode}>
              {filteredVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onClick={handleVideoClick}
                  showAuthor={true}
                  showStats={true}
                  layout={viewMode === 'list' ? 'horizontal' : 'vertical'}
                  size={viewMode === 'compact' ? 'small' : 'medium'}
                />
              ))}
            </VideoGrid>
            
            {hasMore && (
              <LoadMoreContainer>
                <Button
                  type="secondary"
                  size="large"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? '加载中...' : '加载更多'}
                </Button>
              </LoadMoreContainer>
            )}
          </>
        ) : (
          <EmptyState>
            <EmptyIcon>📽️</EmptyIcon>
            <EmptyText>暂无相关视频</EmptyText>
            <EmptySubtext>试试调整筛选条件或换个标签</EmptySubtext>
          </EmptyState>
        )}
      </MainContent>
    </PageContainer>
  );
};

export default CategoryPage;