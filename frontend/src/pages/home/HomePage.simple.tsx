// 简化版本的HomePage，用于测试问题
import React from 'react';

const HomePage: React.FC = () => {
  return (
    <div style={{ padding: '20px', minHeight: '100vh' }}>
      <h1>🎬 大雄视频平台 - 简化首页</h1>
      <p>这是简化版的首页组件</p>
      <div style={{ background: '#f0f0f0', padding: '20px', borderRadius: '8px' }}>
        <h2>测试区域</h2>
        <p>如果你能看到这个内容，说明HomePage组件基础结构是正常的。</p>
      </div>
    </div>
  );
};

export default HomePage;