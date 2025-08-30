/*
 * 大雄视频平台 - 分类列表页面
 * 展示所有分类的列表和概览
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Header from '../../components/layout/Header';
import SearchBox from '../../components/common/SearchBox';
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
  trending: boolean;
  tags: string[];
}

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
  text-align: center;
  margin-bottom: var(--space-xl);
  padding: var(--space-xl) 0;
`;

const PageTitle = styled.h1`
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0 0 var(--space-md) 0;
  
  @media (max-width: 768px) {
    font-size: var(--font-size-h2);
  }
`;

const PageSubtitle = styled.p`
  font-size: var(--font-size-lg);
  color: var(--text-secondary);
  line-height: var(--line-height-base);
  margin: 0 0 var(--space-lg) 0;
`;

const SearchSection = styled.div`
  background: var(--background-secondary);
  border-radius: var(--border-radius-xl);
  padding: var(--space-xl);
  margin-bottom: var(--space-xl);
  text-align: center;
`;


const SectionTitle = styled.h2`
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0 0 var(--space-lg) 0;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  
  @media (max-width: 768px) {
    font-size: var(--font-size-h3);
  }
`;

const TrendingSection = styled.section`
  margin-bottom: var(--space-xxxl);
`;

const TrendingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: var(--space-md);
  }
`;

const TrendingCard = styled.div<{ $color: string }>`
  position: relative;
  background: linear-gradient(135deg, ${props => props.$color}15 0%, ${props => props.$color}05 100%);
  border: 2px solid ${props => props.$color}20;
  border-radius: var(--border-radius-xl);
  padding: var(--space-xl);
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-out);
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 100px;
    height: 100px;
    background: linear-gradient(135deg, ${props => props.$color}20 0%, transparent 70%);
    border-radius: 0 var(--border-radius-xl) 0 100%;
  }
  
  &:hover {
    transform: translateY(-4px);
    border-color: ${props => props.$color}40;
    box-shadow: 0 12px 32px ${props => props.$color}20;
  }
`;

const AllCategoriesSection = styled.section``;

const CategoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-lg);
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-md);
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const CategoryCard = styled.div<{ $color: string }>`
  background: var(--background-secondary);
  border-radius: var(--border-radius-lg);
  padding: var(--space-lg);
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-out);
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border-light);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => props.$color};
    transform: scaleX(0);
    transition: transform var(--duration-base) var(--ease-out);
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
    border-color: ${props => props.$color}30;
    
    &::before {
      transform: scaleX(1);
    }
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
`;

const CategoryIcon = styled.div<{ $color: string }>`
  width: 48px;
  height: 48px;
  background: ${props => props.$color}15;
  border-radius: var(--border-radius-base);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
`;

const CardContent = styled.div`
  flex: 1;
`;

const CategoryName = styled.h3`
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-xs) 0;
`;

const CategoryCount = styled.div`
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
`;

const CategoryDescription = styled.p`
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-base);
  margin: var(--space-sm) 0 var(--space-md) 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
`;

const Tag = styled.span<{ $color: string }>`
  display: inline-block;
  padding: 2px var(--space-xs);
  background: ${props => props.$color}10;
  color: ${props => props.$color};
  font-size: var(--font-size-xs);
  border-radius: var(--border-radius-sm);
  white-space: nowrap;
`;

const TrendingBadge = styled.div`
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  background: var(--error-color);
  color: var(--text-inverse);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--border-radius-full);
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 1;
  
  &::before {
    content: '🔥';
  }
`;

const StatsSection = styled.div`
  background: var(--background-secondary);
  border-radius: var(--border-radius-xl);
  padding: var(--space-xl);
  margin-bottom: var(--space-xl);
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-lg);
  text-align: center;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
`;

const StatNumber = styled.div`
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-bold);
  color: var(--primary-color);
`;

const StatLabel = styled.div`
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
`;

// ============ Mock 数据 ============

const mockCategories: Category[] = [
  {
    id: 'tech',
    name: '科技',
    icon: '💻',
    description: '科技数码、编程开发、AI人工智能、新产品评测、技术教程等前沿科技内容',
    videoCount: 12543,
    color: '#1890ff',
    trending: true,
    tags: ['编程', 'AI', '数码', '评测']
  },
  {
    id: 'game',
    name: '游戏',
    icon: '🎮',
    description: '游戏实况、攻略解说、电竞赛事、新游推荐、游戏评测等游戏相关内容',
    videoCount: 18967,
    color: '#722ed1',
    trending: true,
    tags: ['实况', '攻略', '电竞', '手游']
  },
  {
    id: 'music',
    name: '音乐',
    icon: '🎵',
    description: '音乐MV、翻唱作品、乐器演奏、音乐教学、现场演出等音乐相关内容',
    videoCount: 15432,
    color: '#eb2f96',
    trending: false,
    tags: ['翻唱', '原创', '乐器', '现场']
  },
  {
    id: 'life',
    name: '生活',
    icon: '🌟',
    description: '日常生活、旅行分享、美食制作、生活技巧、家居装饰等生活方式内容',
    videoCount: 23156,
    color: '#52c41a',
    trending: true,
    tags: ['vlog', '美食', '旅行', '家居']
  },
  {
    id: 'education',
    name: '教育',
    icon: '📚',
    description: '知识科普、学习方法、技能教学、考试辅导、职业发展等教育学习内容',
    videoCount: 9834,
    color: '#faad14',
    trending: false,
    tags: ['科普', '教学', '学习', '考试']
  },
  {
    id: 'entertainment',
    name: '娱乐',
    icon: '🎭',
    description: '搞笑视频、娱乐八卦、综艺节目、明星动态、影视解说等娱乐内容',
    videoCount: 21765,
    color: '#ff4d4f',
    trending: true,
    tags: ['搞笑', '综艺', '明星', '影视']
  },
  {
    id: 'sport',
    name: '体育',
    icon: '⚽',
    description: '体育赛事、健身教程、运动技巧、体育新闻、运动装备等体育相关内容',
    videoCount: 6543,
    color: '#13c2c2',
    trending: false,
    tags: ['健身', '足球', '篮球', '教程']
  },
  {
    id: 'food',
    name: '美食',
    icon: '🍳',
    description: '美食制作、餐厅探店、料理教程、美食评测、地方特色等美食相关内容',
    videoCount: 11287,
    color: '#fa8c16',
    trending: false,
    tags: ['制作', '探店', '教程', '特色']
  },
  {
    id: 'travel',
    name: '旅行',
    icon: '✈️',
    description: '旅行攻略、景点介绍、文化体验、美景分享、旅行日记等旅行相关内容',
    videoCount: 8765,
    color: '#1677ff',
    trending: false,
    tags: ['攻略', '景点', '文化', '美景']
  },
  {
    id: 'fashion',
    name: '时尚',
    icon: '👗',
    description: '时尚搭配、美妆教程、潮流资讯、购物分享、护肤美容等时尚生活内容',
    videoCount: 14321,
    color: '#f759ab',
    trending: false,
    tags: ['搭配', '美妆', '潮流', '护肤']
  },
  {
    id: 'auto',
    name: '汽车',
    icon: '🚗',
    description: '汽车评测、驾驶技巧、汽车资讯、改装文化、新车发布等汽车相关内容',
    videoCount: 5678,
    color: '#389e0d',
    trending: false,
    tags: ['评测', '驾驶', '改装', '新车']
  },
  {
    id: 'anime',
    name: '动漫',
    icon: '🎨',
    description: '动漫推荐、漫画解说、二次元文化、声优访谈、动漫资讯等ACG相关内容',
    videoCount: 16789,
    color: '#9254de',
    trending: false,
    tags: ['推荐', '解说', '二次元', '声优']
  }
];

// ============ 工具函数 ============

const formatNumber = (num: number): string => {
  if (num >= 100000000) return `${(num / 100000000).toFixed(1)}亿`;
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`;
  return num.toString();
};

// ============ 组件实现 ============

const CategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { actualTheme } = useTheme();
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleCategoryClick = (categoryId: string) => {
    navigate(`/category/${categoryId}`);
  };
  
  const filteredCategories = mockCategories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const trendingCategories = filteredCategories.filter(category => category.trending);
  const totalVideos = mockCategories.reduce((sum, cat) => sum + cat.videoCount, 0);
  const totalCategories = mockCategories.length;
  
  return (
    <PageContainer>
      <Header />
      
      <MainContent>
        <PageHeader>
          <PageTitle>🔥 视频分类</PageTitle>
          <PageSubtitle>
            发现你感兴趣的内容，探索无限可能
          </PageSubtitle>
        </PageHeader>
        
        <SearchSection>
          <SearchBox
            placeholder="搜索分类、标签..."
            value={searchQuery}
            onChange={setSearchQuery}
            size="large"
            variant="outlined"
            showMic={false}
            showFilters={false}
          />
        </SearchSection>
        
        <StatsSection>
          <StatsGrid>
            <StatItem>
              <StatNumber>{totalCategories}</StatNumber>
              <StatLabel>个分类</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>{formatNumber(totalVideos)}</StatNumber>
              <StatLabel>个视频</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>{trendingCategories.length}</StatNumber>
              <StatLabel>热门分类</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>24/7</StatNumber>
              <StatLabel>持续更新</StatLabel>
            </StatItem>
          </StatsGrid>
        </StatsSection>
        
        {trendingCategories.length > 0 && (
          <TrendingSection>
            <SectionTitle>
              🔥 热门分类
            </SectionTitle>
            <TrendingGrid>
              {trendingCategories.map((category) => (
                <TrendingCard
                  key={category.id}
                  $color={category.color}
                  onClick={() => handleCategoryClick(category.id)}
                >
                  <TrendingBadge>HOT</TrendingBadge>
                  <CardHeader>
                    <CategoryIcon $color={category.color}>
                      {category.icon}
                    </CategoryIcon>
                    <CardContent>
                      <CategoryName>{category.name}</CategoryName>
                      <CategoryCount>
                        <span>📺</span>
                        <span>{formatNumber(category.videoCount)} 个视频</span>
                      </CategoryCount>
                    </CardContent>
                  </CardHeader>
                  <CategoryDescription>{category.description}</CategoryDescription>
                  <TagList>
                    {category.tags.map((tag) => (
                      <Tag key={tag} $color={category.color}>
                        {tag}
                      </Tag>
                    ))}
                  </TagList>
                </TrendingCard>
              ))}
            </TrendingGrid>
          </TrendingSection>
        )}
        
        <AllCategoriesSection>
          <SectionTitle>
            📋 全部分类
          </SectionTitle>
          <CategoryGrid>
            {filteredCategories.map((category) => (
              <CategoryCard
                key={category.id}
                $color={category.color}
                onClick={() => handleCategoryClick(category.id)}
              >
                <CardHeader>
                  <CategoryIcon $color={category.color}>
                    {category.icon}
                  </CategoryIcon>
                  <CardContent>
                    <CategoryName>{category.name}</CategoryName>
                    <CategoryCount>
                      <span>📺</span>
                      <span>{formatNumber(category.videoCount)} 个视频</span>
                    </CategoryCount>
                  </CardContent>
                </CardHeader>
                <CategoryDescription>{category.description}</CategoryDescription>
                <TagList>
                  {category.tags.map((tag) => (
                    <Tag key={tag} $color={category.color}>
                      {tag}
                    </Tag>
                  ))}
                </TagList>
              </CategoryCard>
            ))}
          </CategoryGrid>
        </AllCategoriesSection>
        
        {filteredCategories.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: 'var(--space-xxxl)',
            color: 'var(--text-tertiary)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: 'var(--space-lg)' }}>🔍</div>
            <div style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-sm)' }}>
              未找到相关分类
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)' }}>
              试试其他关键词或浏览全部分类
            </div>
          </div>
        )}
      </MainContent>
    </PageContainer>
  );
};

export default CategoriesPage;