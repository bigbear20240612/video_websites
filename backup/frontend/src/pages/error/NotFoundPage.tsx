/*
 * 大雄视频平台 - 404错误页面
 * 用户访问不存在页面时的友好错误提示
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import Button from '../../components/common/Button';
import { useTheme } from '../../contexts/ThemeContext';

// ============ 动画定义 ============

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
  100% { transform: translateY(0px); }
`;

const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
`;

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// ============ 样式定义 ============

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(
    135deg, 
    var(--background-primary) 0%,
    var(--background-secondary) 50%,
    var(--background-tertiary) 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
  position: relative;
  overflow: hidden;
`;

const BackgroundPattern = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.05;
  background: 
    radial-gradient(circle at 25% 25%, var(--primary-color) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, var(--secondary-color) 0%, transparent 50%);
  pointer-events: none;
`;

const FloatingElements = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
`;

const FloatingElement = styled.div<{ $delay: number; $size: number; $x: number; $y: number }>`
  position: absolute;
  left: ${props => props.$x}%;
  top: ${props => props.$y}%;
  width: ${props => props.$size}px;
  height: ${props => props.$size}px;
  background: var(--primary-color);
  opacity: 0.1;
  border-radius: 50%;
  animation: ${float} ${props => 3 + props.$delay}s ease-in-out infinite;
  animation-delay: ${props => props.$delay}s;
`;

const ErrorContainer = styled.div`
  text-align: center;
  max-width: 600px;
  width: 100%;
  z-index: 1;
  position: relative;
`;

const ErrorCode = styled.div`
  font-size: 8rem;
  font-weight: var(--font-weight-bold);
  color: var(--primary-color);
  line-height: 1;
  margin-bottom: var(--space-lg);
  text-shadow: 0 4px 8px rgba(24, 144, 255, 0.2);
  animation: ${bounce} 2s ease-in-out infinite;
  
  @media (max-width: 768px) {
    font-size: 6rem;
  }
  
  @media (max-width: 480px) {
    font-size: 4rem;
  }
`;

const ErrorTitle = styled.h1`
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0 0 var(--space-md) 0;
  animation: ${fadeInUp} 0.6s ease-out 0.2s both;
  
  @media (max-width: 768px) {
    font-size: var(--font-size-h2);
  }
`;

const ErrorMessage = styled.p`
  font-size: var(--font-size-lg);
  color: var(--text-secondary);
  line-height: var(--line-height-base);
  margin: 0 0 var(--space-xl) 0;
  animation: ${fadeInUp} 0.6s ease-out 0.4s both;
  
  @media (max-width: 768px) {
    font-size: var(--font-size-base);
  }
`;

const ErrorIcon = styled.div`
  font-size: 4rem;
  margin-bottom: var(--space-lg);
  animation: ${rotate} 10s linear infinite;
  
  @media (max-width: 768px) {
    font-size: 3rem;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: var(--space-md);
  justify-content: center;
  margin-bottom: var(--space-xl);
  animation: ${fadeInUp} 0.6s ease-out 0.6s both;
  
  @media (max-width: 480px) {
    flex-direction: column;
    align-items: center;
  }
`;

const ActionButton = styled(Button)`
  padding: var(--space-md) var(--space-xl);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  min-width: 140px;
  
  &:hover {
    animation: ${pulse} 0.3s ease-in-out;
  }
  
  @media (max-width: 480px) {
    width: 200px;
  }
`;

const SuggestionSection = styled.div`
  background: var(--background-secondary);
  border-radius: var(--border-radius-xl);
  padding: var(--space-xl);
  box-shadow: var(--shadow-lg);
  animation: ${fadeInUp} 0.6s ease-out 0.8s both;
`;

const SuggestionTitle = styled.h2`
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-lg) 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
`;

const SuggestionList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
`;

const SuggestionItem = styled.li`
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--background-primary);
  border-radius: var(--border-radius-lg);
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-out);
  
  &:hover {
    background: var(--background-tertiary);
    transform: translateX(8px);
  }
`;

const SuggestionIcon = styled.span`
  font-size: 1.5rem;
  width: 40px;
  text-align: center;
`;

const SuggestionContent = styled.div`
  flex: 1;
`;

const SuggestionText = styled.div`
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
  margin-bottom: 4px;
`;

const SuggestionSubtext = styled.div`
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
`;

const ContactInfo = styled.div`
  margin-top: var(--space-xl);
  padding: var(--space-lg);
  background: var(--background-tertiary);
  border-radius: var(--border-radius-lg);
  text-align: center;
  animation: ${fadeInUp} 0.6s ease-out 1s both;
`;

const ContactTitle = styled.h3`
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-sm) 0;
`;

const ContactText = styled.p`
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
  line-height: var(--line-height-base);
`;

const ContactEmail = styled.a`
  color: var(--primary-color);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
  
  &:hover {
    text-decoration: underline;
  }
`;

// ============ 组件实现 ============

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { actualTheme } = useTheme();
  const [countdown, setCountdown] = useState(10);
  
  // 自动倒计时跳转
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [navigate]);
  
  const handleGoHome = () => {
    navigate('/');
  };
  
  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };
  
  const suggestions = [
    {
      icon: '🏠',
      text: '返回首页',
      subtext: '浏览最新的精彩视频内容',
      action: () => navigate('/')
    },
    {
      icon: '🔍',
      text: '搜索内容',
      subtext: '查找你感兴趣的视频和用户',
      action: () => navigate('/?tab=search')
    },
    {
      icon: '🔥',
      text: '热门推荐',
      subtext: '发现正在热播的精彩视频',
      action: () => navigate('/?category=trending')
    },
    {
      icon: '📺',
      text: '直播中心',
      subtext: '观看正在直播的精彩内容',
      action: () => navigate('/live')
    },
    {
      icon: '👤',
      text: '个人中心',
      subtext: '管理你的账号和设置',
      action: () => navigate('/profile')
    }
  ];
  
  // 生成随机浮动元素
  const floatingElements = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    delay: Math.random() * 2,
    size: 20 + Math.random() * 40,
    x: Math.random() * 100,
    y: Math.random() * 100
  }));
  
  return (
    <PageContainer>
      <BackgroundPattern />
      
      <FloatingElements>
        {floatingElements.map((element) => (
          <FloatingElement
            key={element.id}
            $delay={element.delay}
            $size={element.size}
            $x={element.x}
            $y={element.y}
          />
        ))}
      </FloatingElements>
      
      <ErrorContainer>
        <ErrorIcon>🎬</ErrorIcon>
        <ErrorCode>404</ErrorCode>
        <ErrorTitle>页面不存在</ErrorTitle>
        <ErrorMessage>
          抱歉，你访问的页面可能已被删除、重命名或暂时不可用。<br />
          {countdown > 0 && `${countdown}秒后将自动跳转到首页`}
        </ErrorMessage>
        
        <ActionButtons>
          <ActionButton type="primary" onClick={handleGoHome}>
            返回首页
          </ActionButton>
          <ActionButton type="secondary" onClick={handleGoBack}>
            返回上页
          </ActionButton>
        </ActionButtons>
        
        <SuggestionSection>
          <SuggestionTitle>
            <span>💡</span>
            你可能想要
          </SuggestionTitle>
          
          <SuggestionList>
            {suggestions.map((suggestion, index) => (
              <SuggestionItem key={index} onClick={suggestion.action}>
                <SuggestionIcon>{suggestion.icon}</SuggestionIcon>
                <SuggestionContent>
                  <SuggestionText>{suggestion.text}</SuggestionText>
                  <SuggestionSubtext>{suggestion.subtext}</SuggestionSubtext>
                </SuggestionContent>
              </SuggestionItem>
            ))}
          </SuggestionList>
          
          <ContactInfo>
            <ContactTitle>需要帮助？</ContactTitle>
            <ContactText>
              如果你认为这是一个错误，请联系我们的技术支持团队：<br />
              <ContactEmail href="mailto:support@daxiong.video">
                support@daxiong.video
              </ContactEmail>
            </ContactText>
          </ContactInfo>
        </SuggestionSection>
      </ErrorContainer>
    </PageContainer>
  );
};

export default NotFoundPage;