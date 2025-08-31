/*
 * 大雄视频平台 - 顶部导航栏组件
 * 包含Logo、搜索框、用户菜单等功能
 */

import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import Button from '../common/Button';

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
  max-width: var(--container-xxl);
  margin: 0 auto;
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
`;

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 500px;
`;

const SearchInput = styled.input`
  width: 100%;
  height: 40px;
  padding: 0 var(--space-md) 0 var(--space-xl);
  font-size: var(--font-size-base);
  background: var(--background-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-full);
  outline: none;
  transition: all var(--duration-base) var(--ease-out);
  
  &::placeholder {
    color: var(--text-tertiary);
  }
  
  &:focus {
    border-color: var(--primary-color);
    background: var(--background-primary);
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: var(--space-md);
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  font-size: 16px;
  pointer-events: none;
`;

const SearchButton = styled(Button)`
  position: absolute;
  right: 4px;
  top: 4px;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 50%;
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

const Header: React.FC<HeaderProps> = ({
  user,
  onSearch,
  onLogoClick,
  onUploadClick,
  onLoginClick,
  onUserMenuClick,
  className
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNavItem, setActiveNavItem] = useState('home');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch?.(searchQuery.trim());
    }
  };

  const handleSearchInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(e as any);
    }
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
              onClick={() => setActiveNavItem('home')}
            >
              🏠 首页
            </NavItem>
            <NavItem 
              href="/categories" 
              active={activeNavItem === 'categories'}
              onClick={() => setActiveNavItem('categories')}
            >
              🔥 分类
            </NavItem>
            <NavItem 
              href="/live" 
              active={activeNavItem === 'live'}
              onClick={() => setActiveNavItem('live')}
            >
              🔴 直播
            </NavItem>
            <NavItem 
              href="/following" 
              active={activeNavItem === 'following'}
              onClick={() => setActiveNavItem('following')}
            >
              👥 关注
            </NavItem>
          </NavMenu>
        </LeftSection>

        {/* 中间搜索框 */}
        <CenterSection>
          <SearchContainer>
            <form onSubmit={handleSearchSubmit}>
              <SearchIcon>🔍</SearchIcon>
              <SearchInput
                type="text"
                placeholder="搜索视频、UP主、直播..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchInputKeyDown}
              />
              <SearchButton 
                type="primary" 
                size="small"
                onClick={handleSearchSubmit}
              >
                🔍
              </SearchButton>
            </form>
          </SearchContainer>
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
          
          <IconButton title="消息" aria-label="消息">
            🔔
          </IconButton>
          
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