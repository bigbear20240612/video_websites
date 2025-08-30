/*
 * 大雄视频平台 - 顶部导航栏组件
 * 包含Logo、搜索框、用户菜单等功能
 */

import React, { useState, useRef, useEffect } from 'react';
import styled, { css } from 'styled-components';
import Button from '../common/Button';
import SearchBox from '../common/SearchBox';
import SearchSuggestions from '../common/SearchSuggestions';
import ThemeToggle from '../common/ThemeToggle';
import NotificationDropdown from '../common/NotificationDropdown';

// ============ 样式定义 ============

const HeaderContainer = styled.header`
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  background: var(--background-primary);
  border-bottom: 1px solid var(--border-light);
  backdrop-filter: blur(8px);
  transition: all var(--duration-base) var(--ease-out);
`;

const HeaderContent = styled.div`
  width: 100%;
  height: var(--header-height);
  padding: 0 var(--space-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-lg);
  
  @media (max-width: 768px) {
    height: var(--header-height-mobile);
    padding: 0 var(--space-md);
    gap: var(--space-md);
  }
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  flex: 0 0 auto;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  cursor: pointer;
  transition: transform var(--duration-base) var(--ease-out);
  
  &:hover {
    transform: scale(1.05);
  }
`;

const LogoIcon = styled.div`
  width: 40px;
  height: 40px;
  background: var(--primary-gradient);
  border-radius: var(--border-radius-base);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-inverse);
  font-size: 20px;
  font-weight: var(--font-weight-bold);
`;

const LogoText = styled.span`
  font-size: var(--font-size-h4);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  
  @media (max-width: 576px) {
    display: none;
  }
`;

const NavMenu = styled.nav`
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const NavItem = styled.a<{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: var(--border-radius-base);
  transition: all var(--duration-base) var(--ease-out);
  position: relative;
  
  &:hover {
    color: var(--primary-color);
    background: rgba(24, 144, 255, 0.08);
  }
  
  ${props => props.active && css`
    color: var(--primary-color);
    
    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 50%;
      transform: translateX(-50%);
      width: 20px;
      height: 3px;
      background: var(--primary-color);
      border-radius: 2px 2px 0 0;
    }
  `}
`;

const CenterSection = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  max-width: 600px;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex: 0 0 auto;
`;

const IconButton = styled.button`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--border-radius-base);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-out);
  
  &:hover {
    background: var(--background-secondary);
    color: var(--text-primary);
  }
  
  @media (max-width: 576px) {
    width: 36px;
    height: 36px;
  }
`;

const UserAvatar = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  border: 2px solid var(--border-light);
  transition: all var(--duration-base) var(--ease-out);
  
  &:hover {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }
`;

const MobileMenuButton = styled(IconButton)`
  display: none;
  
  @media (max-width: 768px) {
    display: flex;
  }
`;

const UploadButton = styled(Button)`
  @media (max-width: 576px) {
    padding: var(--padding-xs);
    
    span {
      display: none;
    }
  }
`;

// ============ 接口定义 ============

interface HeaderProps {
  user?: {
    id: string;
    nickname: string;
    avatar: string;
    isVip: boolean;
  };
  onSearch?: (query: string) => void;
  onLogoClick?: () => void;
  onUploadClick?: () => void;
  onLoginClick?: () => void;
  onUserMenuClick?: () => void;
  className?: string;
}

// ============ 组件实现 ============

// Mock 数据
const mockSuggestions = [
  { id: '1', text: 'React教程', type: 'suggestion' as const, count: 1250 },
  { id: '2', text: 'JavaScript基础', type: 'suggestion' as const, count: 3420 },
  { id: '3', text: '前端开发', type: 'suggestion' as const, count: 8900 },
  { id: '4', text: 'Vue.js入门', type: 'suggestion' as const, count: 670 },
  { id: '5', text: 'TypeScript', type: 'suggestion' as const, count: 890 },
];

const mockHotSearches = [
  '最新科技资讯',
  '美食制作',
  '旅行攻略',
  '编程教程',
  '健身训练',
  '音乐分享'
];

const Header: React.FC<HeaderProps> = ({
  user,
  onSearch,
  onLogoClick = () => window.location.href = '/',
  onUploadClick = () => window.location.href = '/upload',
  onLoginClick = () => window.location.href = '/login',
  onUserMenuClick,
  className
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNavItem, setActiveNavItem] = useState('home');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(['React hooks', 'Vue3教程', '前端面试']);
  const [suggestionActiveIndex, setSuggestionActiveIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭建议
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSuggestionActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (query?: string) => {
    const searchText = query || searchQuery.trim();
    if (searchText) {
      // 添加到搜索历史
      if (!searchHistory.includes(searchText)) {
        setSearchHistory(prev => [searchText, ...prev.slice(0, 4)]);
      }
      
      onSearch?.(searchText);
      setSearchQuery(searchText);
      setShowSuggestions(false);
      setSuggestionActiveIndex(-1);
      console.log('搜索:', searchText);
    }
  };

  const handleSearchInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSuggestionActiveIndex(prev => prev + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSuggestionActiveIndex(prev => Math.max(-1, prev - 1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSuggestionActiveIndex(-1);
    }
  };

  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);
    // 显示建议当有输入内容时，或者当输入为空但焦点仍在输入框时
    setShowSuggestions(value.length > 0);
    setSuggestionActiveIndex(-1);
  };

  const handleSearchInputFocus = () => {
    // 焦点时显示所有建议（历史记录 + 热门搜索）
    setShowSuggestions(true);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    handleSearchSubmit(suggestion);
  };

  const handleClearHistory = () => {
    setSearchHistory([]);
  };

  const handleSearchButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    handleSearchSubmit();
  };

  return (
    <HeaderContainer className={className}>
      <HeaderContent>
        {/* 左侧 Logo 和导航 */}
        <LeftSection>
          <Logo onClick={onLogoClick}>
            <LogoIcon>🎬</LogoIcon>
            <LogoText>大雄视频</LogoText>
          </Logo>
          
          <NavMenu>
            <NavItem 
              href="/" 
              active={activeNavItem === 'home'}
              onClick={(e) => {
                e.preventDefault();
                setActiveNavItem('home');
                window.location.href = '/';
              }}
            >
              🏠 首页
            </NavItem>
            <NavItem 
              href="/categories" 
              active={activeNavItem === 'categories'}
              onClick={(e) => {
                e.preventDefault();
                setActiveNavItem('categories');
                window.location.href = '/categories';
              }}
            >
              🔥 分类
            </NavItem>
            <NavItem 
              href="/live" 
              active={activeNavItem === 'live'}
              onClick={(e) => {
                e.preventDefault();
                setActiveNavItem('live');
                window.location.href = '/live';
              }}
            >
              🔴 直播
            </NavItem>
            <NavItem 
              href="/following" 
              active={activeNavItem === 'following'}
              onClick={(e) => {
                e.preventDefault();
                setActiveNavItem('following');
                window.location.href = '/following';
              }}
            >
              👥 关注
            </NavItem>
          </NavMenu>
        </LeftSection>

        {/* 中间搜索框 */}
        <CenterSection>
          <SearchBox
            placeholder="搜索视频、UP主、直播..."
            value={searchQuery}
            onChange={handleSearchInputChange}
            onSubmit={handleSearchSubmit}
            onFocus={handleSearchInputFocus}
            suggestions={[
              ...searchHistory,
              ...mockSuggestions.map(item => item.text),
              ...mockHotSearches
            ]}
            size="medium"
            variant="default"
            showMic={true}
            showFilters={false}
          />
        </CenterSection>

        {/* 右侧用户操作 */}
        <RightSection>
          <UploadButton
            type="primary"
            icon="📤"
            onClick={onUploadClick}
          >
            <span>投稿</span>
          </UploadButton>
          
          <NotificationDropdown
            trigger={
              <IconButton title="消息" aria-label="消息">
                🔔
              </IconButton>
            }
          />
          
          <ThemeToggle showDropdown={true} />
          
          {user ? (
            <UserAvatar
              src={user.avatar}
              alt={user.nickname}
              onClick={onUserMenuClick}
              title={user.nickname}
            />
          ) : (
            <Button
              type="ghost"
              size="small"
              onClick={onLoginClick}
            >
              登录
            </Button>
          )}
          
          <MobileMenuButton aria-label="菜单">
            ☰
          </MobileMenuButton>
        </RightSection>
      </HeaderContent>
    </HeaderContainer>
  );
};

export default Header;