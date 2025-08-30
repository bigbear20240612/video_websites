// 简单的测试页面，用于诊断问题
import React from 'react';

const TestPage: React.FC = () => {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>🎬 大雄视频平台 - 测试页面</h1>
      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2>✅ React 正常工作</h2>
        <p>如果你能看到这个页面，说明基本的React渲染是正常的。</p>
        <p>当前时间：{new Date().toLocaleString()}</p>
        <button 
          onClick={() => alert('按钮点击正常！')}
          style={{
            background: '#1890ff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          测试按钮交互
        </button>
      </div>
    </div>
  );
};

export default TestPage;