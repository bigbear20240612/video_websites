// 测试CSS样式版本的HomePage
import React from 'react';
import styled from 'styled-components';

const PageContainer = styled.div`
  min-height: 100vh;
  background: var(--background-primary);
  padding: var(--space-lg);
`;

const Title = styled.h1`
  font-size: var(--font-size-h1);
  color: var(--primary-color);
  margin-bottom: var(--space-lg);
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
      <Title>🎬 大雄视频平台 - CSS变量测试</Title>
      
      <TestCard>
        <h2 style={{ color: 'var(--text-primary)' }}>CSS变量测试</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          如果这个卡片有圆角、阴影，并且文字颜色正确，说明CSS变量加载正常。
        </p>
        <div style={{ 
          background: 'var(--primary-color)', 
          color: 'var(--text-inverse)', 
          padding: 'var(--space-sm)',
          borderRadius: 'var(--border-radius-sm)',
          marginTop: 'var(--space-md)'
        }}>
          主要颜色测试块
        </div>
      </TestCard>

      <TestCard>
        <h2>间距和字体测试</h2>
        <p style={{ fontSize: 'var(--font-size-lg)' }}>大字体文本</p>
        <p style={{ fontSize: 'var(--font-size-base)' }}>基础字体文本</p>
        <p style={{ fontSize: 'var(--font-size-sm)' }}>小字体文本</p>
      </TestCard>
    </PageContainer>
  );
};

export default HomePage;