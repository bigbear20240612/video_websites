/*
 * 大雄视频平台 - 应用主组件
 * 根组件，包含路由配置和全局设置
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import styled, { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { ThemeProvider } from './contexts/ThemeContext';
import Transition from './components/common/Transition';
import HomePage from './pages/home/HomePage';
import VideoPage from './pages/video/VideoPage';
import UserPage from './pages/user/UserPage';
import LivePage from './pages/live/LivePage';
import UploadPage from './pages/upload/UploadPage';
import AuthPage from './pages/auth/AuthPage';
import CategoriesPage from './pages/categories/CategoriesPage';
import CategoryPage from './pages/category/CategoryPage';
import FollowingPage from './pages/following/FollowingPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import NotFoundPage from './pages/error/NotFoundPage';
import './styles/global.css';

// ============ 主题配置 ============

const theme = {
  // 这里可以添加 JavaScript 中需要的主题配置
  // CSS 变量已在 global.css 中定义
};

// ============ 样式定义 ============

const AppContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  background: var(--background-primary);
  color: var(--text-primary);
  font-family: var(--font-family);
  margin: 0;
  padding: 0;
  box-sizing: border-box;
`;

// ============ 组件实现 ============

// 路由组件包装器
const RoutesWithTransition: React.FC = () => {
  const location = useLocation();
  
  return (
    <Transition 
      key={location.pathname}
      show={true}
      type="fade"
      duration={200}
    >
      <Routes location={location}>
        <Route path="/" element={<HomePage />} />
        
        {/* 其他路由将在后续添加 */}
        <Route path="/video/:id" element={<VideoPage />} />
        <Route path="/user/:id" element={<UserPage />} />
        <Route path="/live" element={<LivePage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/category/:categoryId" element={<CategoryPage />} />
        <Route path="/following" element={<FollowingPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        
        {/* 404 页面 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Transition>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <StyledThemeProvider theme={theme}>
        <AppContainer>
          <Router>
            <RoutesWithTransition />
          </Router>
        </AppContainer>
      </StyledThemeProvider>
    </ThemeProvider>
  );
};

export default App;
