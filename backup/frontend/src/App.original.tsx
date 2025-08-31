/*
 * 大雄视频平台 - 应用主组件
 * 根组件，包含路由配置和全局设置
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import styled, { ThemeProvider } from 'styled-components';
import HomePage from './pages/home/HomePage';
import './styles/global.css';

// ============ 主题配置 ============

const theme = {
  // 这里可以添加 JavaScript 中需要的主题配置
  // CSS 变量已在 global.css 中定义
};

// ============ 样式定义 ============

const AppContainer = styled.div`
  min-height: 100vh;
  background: var(--background-primary);
  color: var(--text-primary);
  font-family: var(--font-family);
`;

// ============ 组件实现 ============

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <AppContainer>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            
            {/* 其他路由将在后续添加 */}
            <Route path="/video/:id" element={<div>视频播放页 - 开发中</div>} />
            <Route path="/user/:id" element={<div>用户页面 - 开发中</div>} />
            <Route path="/live" element={<div>直播页面 - 开发中</div>} />
            <Route path="/upload" element={<div>上传页面 - 开发中</div>} />
            <Route path="/login" element={<div>登录页面 - 开发中</div>} />
            <Route path="/register" element={<div>注册页面 - 开发中</div>} />
            
            {/* 404 页面 */}
            <Route path="*" element={<div>404 - 页面未找到</div>} />
          </Routes>
        </Router>
      </AppContainer>
    </ThemeProvider>
  );
};

export default App;
