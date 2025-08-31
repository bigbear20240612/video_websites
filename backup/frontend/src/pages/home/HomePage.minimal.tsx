// 最简单的HomePage，完全不依赖其他自定义组件
import React from 'react';

const HomePage: React.FC = () => {
  return (
    <div style={{ 
      padding: '20px',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <header style={{
        background: '#1890ff',
        color: 'white',
        padding: '15px 20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h1>🎬 大雄视频平台 - 最简版本</h1>
      </header>

      <main>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h2>✅ 完全隔离测试</h2>
          <p>这个版本不依赖任何自定义组件，只使用原生HTML和内联样式。</p>
          <p>如果这个能正常显示，说明问题在自定义组件上。</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px'
        }}>
          {/* 模拟视频卡片 */}
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              background: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}>
              <div style={{
                width: '100%',
                height: '150px',
                background: `linear-gradient(45deg, #1890ff, #722ed1)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '18px'
              }}>
                📹 视频 {i}
              </div>
              <div style={{ padding: '15px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
                  测试视频标题 {i}
                </h3>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: '8px',
                  color: '#666',
                  fontSize: '14px'
                }}>
                  <span>👤 UP主{i}</span>
                  <span>👁 1.2万</span>
                  <span>👍 520</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default HomePage;