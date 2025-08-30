// 测试Header组件版本的HomePage
import React from 'react';
import styled from 'styled-components';
import Header from '../../components/layout/Header';

const PageContainer = styled.div`
  min-height: 100vh;
  background: var(--background-primary);
`;

const MainContent = styled.main`
  max-width: var(--container-xxl);
  margin: 0 auto;
  padding: var(--space-lg);
`;

const TestCard = styled.div`
  background: var(--background-primary);
  border-radius: var(--border-radius-lg);
  padding: var(--space-lg);
  box-shadow: var(--shadow-base);
  margin-bottom: var(--space-lg);
`;

const HomePage: React.FC = () => {
  const handleSearch = (query: string) => {
    console.log('搜索:', query);
  };

  const handleLogoClick = () => {
    console.log('Logo 被点击');
  };

  const handleUploadClick = () => {
    console.log('上传按钮被点击');
  };

  const handleLoginClick = () => {
    console.log('登录按钮被点击');
  };

  return (
    <PageContainer>
      <Header 
        onSearch={handleSearch}
        onLogoClick={handleLogoClick}
        onUploadClick={handleUploadClick}
        onLoginClick={handleLoginClick}
      />
      
      <MainContent>
        <TestCard>
          <h1 style={{ color: 'var(--primary-color)' }}>🎬 Header组件测试</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            如果你能看到上方的导航栏（Logo、搜索框、按钮等），说明Header组件正常工作。
          </p>
          <p>请检查导航栏是否包含：</p>
          <ul>
            <li>🎬 大雄视频 Logo</li>
            <li>导航菜单（首页、分类、直播、关注）</li>
            <li>搜索框</li>
            <li>投稿按钮</li>
            <li>消息通知图标</li>
            <li>登录按钮</li>
          </ul>
        </TestCard>
      </MainContent>
    </PageContainer>
  );
};

export default HomePage;