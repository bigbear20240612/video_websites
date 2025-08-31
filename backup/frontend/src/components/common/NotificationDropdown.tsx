/*
 * 大雄视频平台 - 消息通知下拉菜单组件
 * 显示用户的各种通知消息
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Button from './Button';

// ============ 类型定义 ============

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'system' | 'video' | 'reply';
  title: string;
  content: string;
  avatar?: string;
  thumbnail?: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  actionData?: any;
}

interface NotificationDropdownProps {
  trigger: React.ReactNode;
  className?: string;
}

// ============ 样式定义 ============

const DropdownContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const TriggerButton = styled.button`
  position: relative;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;
`;

const Badge = styled.div<{ $count: number }>`
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  background: var(--error-color);
  color: var(--text-inverse);
  border-radius: 50%;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  display: ${props => props.$count > 0 ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  animation: ${props => props.$count > 0 ? 'pulse 2s infinite' : 'none'};
  
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
`;

const DropdownContent = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 380px;
  max-height: 500px;
  background: var(--background-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-xl);
  z-index: 1000;
  opacity: ${props => props.$visible ? 1 : 0};
  visibility: ${props => props.$visible ? 'visible' : 'hidden'};
  transform: ${props => props.$visible ? 'translateY(0)' : 'translateY(-10px)'};
  transition: all var(--duration-base) var(--ease-out);
  
  @media (max-width: 480px) {
    width: 90vw;
    right: -50px;
  }
`;

const DropdownHeader = styled.div`
  padding: var(--space-lg);
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const DropdownTitle = styled.h3`
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-sm);
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: var(--primary-color);
  font-size: var(--font-size-sm);
  cursor: pointer;
  padding: var(--space-xs);
  
  &:hover {
    text-decoration: underline;
  }
`;

const NotificationList = styled.div`
  max-height: 400px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: var(--background-secondary);
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 2px;
  }
`;

const NotificationItem = styled.div<{ $isRead: boolean }>`
  display: flex;
  gap: var(--space-md);
  padding: var(--space-md);
  cursor: pointer;
  transition: background var(--duration-base) var(--ease-out);
  border-bottom: 1px solid var(--border-light);
  background: ${props => props.$isRead ? 'transparent' : 'rgba(24, 144, 255, 0.05)'};
  position: relative;
  
  &:hover {
    background: var(--background-secondary);
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const NotificationIcon = styled.div<{ $type: string }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  background: ${props => {
    switch (props.$type) {
      case 'like': return 'rgba(255, 77, 79, 0.1)';
      case 'comment': return 'rgba(24, 144, 255, 0.1)';
      case 'follow': return 'rgba(82, 196, 26, 0.1)';
      case 'system': return 'rgba(250, 173, 20, 0.1)';
      case 'video': return 'rgba(114, 46, 209, 0.1)';
      case 'reply': return 'rgba(24, 144, 255, 0.1)';
      default: return 'var(--background-secondary)';
    }
  }};
  color: ${props => {
    switch (props.$type) {
      case 'like': return 'var(--error-color)';
      case 'comment': return 'var(--primary-color)';
      case 'follow': return 'var(--success-color)';
      case 'system': return 'var(--warning-color)';
      case 'video': return '#722ed1';
      case 'reply': return 'var(--primary-color)';
      default: return 'var(--text-secondary)';
    }
  }};
`;

const NotificationAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
`;

const NotificationContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  min-width: 0;
`;

const NotificationTitle = styled.div`
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  line-height: var(--line-height-tight);
`;

const NotificationText = styled.div`
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-base);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const NotificationTime = styled.div`
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
`;

const NotificationThumbnail = styled.img`
  width: 32px;
  height: 18px;
  border-radius: var(--border-radius-sm);
  object-fit: cover;
  flex-shrink: 0;
`;

const UnreadDot = styled.div<{ $isRead: boolean }>`
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary-color);
  display: ${props => props.$isRead ? 'none' : 'block'};
`;

const EmptyState = styled.div`
  padding: var(--space-xl);
  text-align: center;
  color: var(--text-tertiary);
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: var(--space-md);
  opacity: 0.5;
`;

const EmptyText = styled.div`
  font-size: var(--font-size-base);
  margin-bottom: var(--space-sm);
`;

const EmptySubtext = styled.div`
  font-size: var(--font-size-sm);
`;

const DropdownFooter = styled.div`
  padding: var(--space-md);
  border-top: 1px solid var(--border-light);
  text-align: center;
`;

// ============ Mock 数据 ============

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'like',
    title: '小明 点赞了你的视频',
    content: '《React Hooks 完全指南》',
    avatar: 'https://picsum.photos/80/80?random=1',
    thumbnail: 'https://picsum.photos/120/68?random=video1',
    isRead: false,
    createdAt: '5分钟前',
    actionUrl: '/video/1'
  },
  {
    id: '2',
    type: 'comment',
    title: '小红 评论了你的视频',
    content: '讲得很清楚，学到了很多！感谢分享',
    avatar: 'https://picsum.photos/80/80?random=2',
    thumbnail: 'https://picsum.photos/120/68?random=video2',
    isRead: false,
    createdAt: '15分钟前',
    actionUrl: '/video/2'
  },
  {
    id: '3',
    type: 'follow',
    title: '小李 关注了你',
    content: '查看他的主页',
    avatar: 'https://picsum.photos/80/80?random=3',
    isRead: false,
    createdAt: '1小时前',
    actionUrl: '/user/3'
  },
  {
    id: '4',
    type: 'reply',
    title: '小王 回复了你的评论',
    content: '是的，我也觉得这个方法很实用！',
    avatar: 'https://picsum.photos/80/80?random=4',
    thumbnail: 'https://picsum.photos/120/68?random=video3',
    isRead: true,
    createdAt: '2小时前',
    actionUrl: '/video/3'
  },
  {
    id: '5',
    type: 'system',
    title: '系统消息',
    content: '你的视频《Vue3 新特性详解》审核通过，已发布成功！',
    isRead: true,
    createdAt: '3小时前'
  },
  {
    id: '6',
    type: 'video',
    title: '你关注的用户发布了新视频',
    content: '科技UP主发布了《2024最值得学习的编程语言》',
    avatar: 'https://picsum.photos/80/80?random=6',
    thumbnail: 'https://picsum.photos/120/68?random=video6',
    isRead: true,
    createdAt: '1天前',
    actionUrl: '/video/6'
  }
];

// ============ 工具函数 ============

const getNotificationIcon = (type: string): string => {
  switch (type) {
    case 'like': return '❤️';
    case 'comment': return '💬';
    case 'follow': return '👤';
    case 'reply': return '↩️';
    case 'system': return '🔔';
    case 'video': return '🎬';
    default: return '📢';
  }
};

// ============ 组件实现 ============

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  trigger,
  className
}) => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setVisible(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleToggle = () => {
    setVisible(!visible);
  };
  
  const handleNotificationClick = (notification: Notification) => {
    // 标记为已读
    if (!notification.isRead) {
      setNotifications(prev =>
        prev.map(n =>
          n.id === notification.id ? { ...n, isRead: true } : n
        )
      );
    }
    
    // 跳转到相应页面
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
    
    setVisible(false);
  };
  
  const handleMarkAllRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );
  };
  
  const handleClearAll = () => {
    setNotifications([]);
  };
  
  const handleViewAll = () => {
    navigate('/notifications');
    setVisible(false);
  };
  
  return (
    <DropdownContainer ref={containerRef} className={className}>
      <TriggerButton onClick={handleToggle}>
        {trigger}
        <Badge $count={unreadCount}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      </TriggerButton>
      
      <DropdownContent $visible={visible}>
        <DropdownHeader>
          <DropdownTitle>
            <span>🔔</span>
            <span>消息通知</span>
          </DropdownTitle>
          <HeaderActions>
            {unreadCount > 0 && (
              <ActionButton onClick={handleMarkAllRead}>
                全部已读
              </ActionButton>
            )}
            <ActionButton onClick={handleClearAll}>
              清空
            </ActionButton>
          </HeaderActions>
        </DropdownHeader>
        
        {notifications.length > 0 ? (
          <>
            <NotificationList>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  $isRead={notification.isRead}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {notification.avatar ? (
                    <NotificationAvatar src={notification.avatar} alt="" />
                  ) : (
                    <NotificationIcon $type={notification.type}>
                      {getNotificationIcon(notification.type)}
                    </NotificationIcon>
                  )}
                  
                  <NotificationContent>
                    <NotificationTitle>{notification.title}</NotificationTitle>
                    <NotificationText>{notification.content}</NotificationText>
                    <NotificationTime>{notification.createdAt}</NotificationTime>
                  </NotificationContent>
                  
                  {notification.thumbnail && (
                    <NotificationThumbnail src={notification.thumbnail} alt="" />
                  )}
                  
                  <UnreadDot $isRead={notification.isRead} />
                </NotificationItem>
              ))}
            </NotificationList>
            
            <DropdownFooter>
              <Button type="ghost" size="small" onClick={handleViewAll}>
                查看全部消息
              </Button>
            </DropdownFooter>
          </>
        ) : (
          <EmptyState>
            <EmptyIcon>📭</EmptyIcon>
            <EmptyText>暂无新消息</EmptyText>
            <EmptySubtext>有新消息时会在这里显示</EmptySubtext>
          </EmptyState>
        )}
      </DropdownContent>
    </DropdownContainer>
  );
};

export default NotificationDropdown;