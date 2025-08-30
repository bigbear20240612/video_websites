// 简化版Header组件，用于修复崩溃问题
import React, { useState } from 'react';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  position: sticky;
  top: 0;
  z-index: 1020;
  background: var(--background-primary);
  border-bottom: 1px solid var(--border-light);
  height: 60px;
`;

const HeaderContent = styled.div`
  max-width: var(--container-xxl);
  margin: 0 auto;
  height: 100%;
  padding: 0 var(--space-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-lg);
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  cursor: pointer;
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
`;

const SearchContainer = styled.div`
  flex: 1;
  max-width: 500px;
  margin: 0 var(--space-lg);
`;

const SearchInput = styled.input`
  width: 100%;
  height: 40px;
  padding: 0 var(--space-md) 0 var(--space-xl);
  font-size: var(--font-size-base);
  background: var(--background-secondary);
  border: 1px solid var(--border-light);
  border-radius: 20px;
  outline: none;
  
  &::placeholder {
    color: var(--text-tertiary);
  }
  
  &:focus {
    border-color: var(--primary-color);
    background: var(--background-primary);
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-md);
`;

const SimpleButton = styled.button`
  height: 32px;
  padding: 0 var(--space-md);
  background: var(--primary-color);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: background var(--duration-base);
  
  &:hover {
    background: var(--primary-hover);
  }
`;

interface HeaderProps {
  onSearch?: (query: string) => void;
  onLogoClick?: () => void;
  onUploadClick?: () => void;
  onLoginClick?: () => void;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({
  onSearch,
  onLogoClick,
  onUploadClick,
  onLoginClick,
  className
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch?.(searchQuery.trim());
    }
  };

  return (
    <HeaderContainer className={className}>
      <HeaderContent>
        <Logo onClick={onLogoClick}>
          <LogoIcon>🎬</LogoIcon>
          <LogoText>大雄视频</LogoText>
        </Logo>
        
        <SearchContainer>
          <form onSubmit={handleSearchSubmit}>
            <SearchInput
              type="text"
              placeholder="搜索视频、UP主、直播..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </SearchContainer>

        <RightSection>
          <SimpleButton onClick={onUploadClick}>
            📤 投稿
          </SimpleButton>
          
          <SimpleButton onClick={onLoginClick}>
            登录
          </SimpleButton>
        </RightSection>
      </HeaderContent>
    </HeaderContainer>
  );
};

export default Header;