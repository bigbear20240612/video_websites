// 测试修复后的Button和Header组件
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
  return (
    <PageContainer>
      <Header 
        onSearch={(query) => console.log('搜索:', query)}
        onLogoClick={() => console.log('Logo点击')}
        onUploadClick={() => console.log('上传点击')}
        onLoginClick={() => console.log('登录点击')}
      />
      
      <MainContent>
        <TestCard>
          <h1 style={{ color: 'var(--primary-color)' }}>🎉 Button组件修复测试</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            如果你能看到完整的导航栏（包括按钮），说明Button组件修复成功！
          </p>
          <p>修复的关键问题：</p>
          <ul>
            <li>✅ 使用 $buttonType 替代 type 避免HTML属性冲突</li>
            <li>✅ 使用 $size、$loading、$block 前缀</li>
            <li>✅ 添加了默认的CSS fallback值</li>
            <li>✅ 修复了styled-components属性传递问题</li>
          </ul>
        </TestCard>
      </MainContent>
    </PageContainer>
  );
};

export default HomePage;