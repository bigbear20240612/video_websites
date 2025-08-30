/*
 * 大雄视频平台 - 消息通知页面
 * 显示所有消息通知的完整列表
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Header from '../../components/layout/Header';
import Button from '../../components/common/Button';
import { useTheme } from '../../contexts/ThemeContext';
import { mediaQuery, responsiveStyles } from '../../utils/responsive';

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

type FilterType = 'all' | 'like' | 'comment' | 'follow' | 'system' | 'video' | 'reply' | 'unread';

// ============ 样式定义 ============

const PageContainer = styled.div`
  ${responsiveStyles.fullHeight}
  background: var(--background-primary);
  overflow-x: hidden;
`;

const MainContent = styled.main`
  ${responsiveStyles.trueFullScreenContainer}
  padding: var(--space-lg);
  
  ${mediaQuery.down('md')} {
    padding: var(--space-md);
  }
  
  ${mediaQuery.down('sm')} {
    padding: var(--space-sm);
  }
`;

const PageHeader = styled.div`
  margin-bottom: var(--space-xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-md);
  }
`;

const PageTitle = styled.h1`
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  
  @media (max-width: 768px) {
    font-size: var(--font-size-h2);
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const ContentContainer = styled.div`
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: var(--space-xl);
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: var(--space-lg);
  }
`;

const Sidebar = styled.aside`
  background: var(--background-secondary);
  border-radius: var(--border-radius-lg);
  padding: var(--space-lg);
  height: fit-content;
  position: sticky;
  top: calc(var(--header-height) + var(--space-lg));
  
  @media (max-width: 768px) {
    position: static;
    order: -1;
  }
`;

const FilterTitle = styled.h3`
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-md) 0;
`;

const FilterList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  
  @media (max-width: 768px) {
    flex-direction: row;
    overflow-x: auto;
    gap: var(--space-sm);
    padding-bottom: var(--space-xs);
    
    &::-webkit-scrollbar {
      height: 4px;
    }
    
    &::-webkit-scrollbar-track {
      background: var(--background-tertiary);
    }
    
    &::-webkit-scrollbar-thumb {
      background: var(--border-color);
      border-radius: 2px;
    }
  }
`;

const FilterItem = styled.button<{ $active: boolean; $count?: number }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md);
  background: ${props => props.$active ? 'var(--primary-color)' : 'transparent'};
  color: ${props => props.$active ? 'var(--text-inverse)' : 'var(--text-secondary)'};
  border: none;
  border-radius: var(--border-radius-base);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-out);
  white-space: nowrap;
  
  &:hover {
    background: ${props => props.$active ? 'var(--primary-hover)' : 'var(--background-tertiary)'};
    color: ${props => props.$active ? 'var(--text-inverse)' : 'var(--text-primary)'};
  }
`;

const FilterIcon = styled.span`
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: 16px;
`;

const FilterCount = styled.span<{ $active: boolean }>`
  background: ${props => props.$active ? 'rgba(255, 255, 255, 0.2)' : 'var(--background-primary)'};
  color: ${props => props.$active ? 'var(--text-inverse)' : 'var(--text-tertiary)'};
  padding: 2px var(--space-xs);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  min-width: 20px;
  text-align: center;
`;

const NotificationContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
`;

const NotificationStats = styled.div`
  background: var(--background-secondary);
  border-radius: var(--border-radius-lg);
  padding: var(--space-lg);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--space-lg);
  margin-bottom: var(--space-lg);
`;

const StatItem = styled.div`
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
`;

const StatNumber = styled.div`
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-bold);
  color: var(--primary-color);
`;

const StatLabel = styled.div`
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
`;

const NotificationList = styled.div`
  background: var(--background-secondary);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
`;

const NotificationItem = styled.div<{ $isRead: boolean; $selected: boolean }>`
  display: flex;
  gap: var(--space-md);
  padding: var(--space-lg);
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-out);
  border-bottom: 1px solid var(--border-light);
  background: ${props => {
    if (props.$selected) return 'rgba(24, 144, 255, 0.1)';
    if (!props.$isRead) return 'rgba(24, 144, 255, 0.05)';
    return 'transparent';
  }};
  position: relative;
  
  &:hover {
    background: var(--background-tertiary);
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const SelectCheckbox = styled.input`
  width: 18px;
  height: 18px;
  margin: 0;
  margin-top: 2px;
  cursor: pointer;
`;

const NotificationIcon = styled.div<{ $type: string }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  background: ${props => {
    switch (props.$type) {
      case 'like': return 'rgba(255, 77, 79, 0.1)';
      case 'comment': return 'rgba(24, 144, 255, 0.1)';
      case 'follow': return 'rgba(82, 196, 26, 0.1)';
      case 'system': return 'rgba(250, 173, 20, 0.1)';
      case 'video': return 'rgba(114, 46, 209, 0.1)';
      case 'reply': return 'rgba(24, 144, 255, 0.1)';
      default: return 'var(--background-tertiary)';
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
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
`;

const NotificationContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  min-width: 0;
`;

const NotificationHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-md);
`;

const NotificationTitle = styled.div<{ $isRead: boolean }>`
  font-size: var(--font-size-base);
  font-weight: ${props => props.$isRead ? 'var(--font-weight-medium)' : 'var(--font-weight-semibold)'};
  color: var(--text-primary);
  line-height: var(--line-height-tight);
`;

const NotificationTime = styled.div`
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
  white-space: nowrap;
`;

const NotificationText = styled.div<{ $isRead: boolean }>`
  font-size: var(--font-size-base);
  color: ${props => props.$isRead ? 'var(--text-secondary)' : 'var(--text-primary)'};
  line-height: var(--line-height-base);
`;

const NotificationMedia = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-top: var(--space-xs);
`;

const NotificationThumbnail = styled.img`
  width: 60px;
  height: 34px;
  border-radius: var(--border-radius-sm);
  object-fit: cover;
`;

const UnreadDot = styled.div<{ $isRead: boolean }>`
  position: absolute;
  top: var(--space-lg);
  right: var(--space-lg);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary-color);
  display: ${props => props.$isRead ? 'none' : 'block'};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: var(--space-xxxl);
  color: var(--text-tertiary);
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: var(--space-lg);
  opacity: 0.5;
`;

const EmptyText = styled.div`
  font-size: var(--font-size-lg);
  margin-bottom: var(--space-sm);
`;

const EmptySubtext = styled.div`
  font-size: var(--font-size-base);
`;

const BulkActions = styled.div<{ $visible: boolean }>`
  display: ${props => props.$visible ? 'flex' : 'none'};
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--background-tertiary);
  border-radius: var(--border-radius-lg);
  margin-bottom: var(--space-md);
`;

const LoadMoreButton = styled(Button)`
  margin: var(--space-lg) auto 0;
  display: block;
`;

// ============ Mock 数据 ============

const generateMockNotifications = (count: number = 50): Notification[] => {
  const types: Notification['type'][] = ['like', 'comment', 'follow', 'system', 'video', 'reply'];
  const titles = {
    like: ['点赞了你的视频', '喜欢了你的评论'],
    comment: ['评论了你的视频', '在你的视频下留言'],
    follow: ['关注了你', '开始关注你'],
    system: ['系统通知', '平台消息', '审核结果'],
    video: ['发布了新视频', '上传了新作品'],
    reply: ['回复了你的评论', '回复了你']
  };
  
  return Array.from({ length: count }, (_, i) => {
    const type = types[Math.floor(Math.random() * types.length)];
    const isSystem = type === 'system';
    
    return {
      id: `notification-${i + 1}`,
      type,
      title: `${isSystem ? '' : `用户${i + 1} `}${titles[type][Math.floor(Math.random() * titles[type].length)]}`,
      content: isSystem 
        ? '你的视频已通过审核，发布成功！' 
        : `这是第${i + 1}条通知内容，用于展示通知的详细信息。`,
      avatar: isSystem ? undefined : `https://picsum.photos/96/96?random=user-${i}`,
      thumbnail: ['like', 'comment', 'reply', 'video'].includes(type) 
        ? `https://picsum.photos/120/68?random=video-${i}` 
        : undefined,
      isRead: Math.random() > 0.3,
      createdAt: `${Math.floor(Math.random() * 24)}小时前`,
      actionUrl: type === 'follow' ? `/user/${i}` : `/video/${i}`
    };
  });
};

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

const getFilterIcon = (filter: FilterType): string => {
  switch (filter) {
    case 'all': return '📋';
    case 'like': return '❤️';
    case 'comment': return '💬';
    case 'follow': return '👤';
    case 'reply': return '↩️';
    case 'system': return '🔔';
    case 'video': return '🎬';
    case 'unread': return '🔴';
    default: return '📢';
  }
};

const getFilterLabel = (filter: FilterType): string => {
  switch (filter) {
    case 'all': return '全部消息';
    case 'like': return '点赞';
    case 'comment': return '评论';
    case 'follow': return '关注';
    case 'reply': return '回复';
    case 'system': return '系统';
    case 'video': return '视频';
    case 'unread': return '未读';
    default: return '其他';
  }
};

// ============ 组件实现 ============

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { actualTheme } = useTheme();
  
  const [notifications, setNotifications] = useState<Notification[]>(generateMockNotifications());
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  
  // 过滤通知
  const filteredNotifications = notifications.filter(notification => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !notification.isRead;
    return notification.type === activeFilter;
  });
  
  // 统计数据
  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.isRead).length,
    today: notifications.filter(n => n.createdAt.includes('小时前') || n.createdAt.includes('分钟前')).length
  };
  
  // 各类型通知数量
  const getFilterCount = (filter: FilterType): number => {
    if (filter === 'all') return notifications.length;
    if (filter === 'unread') return notifications.filter(n => !n.isRead).length;
    return notifications.filter(n => n.type === filter).length;
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
  };
  
  const handleSelectNotification = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };
  
  const handleSelectAll = () => {
    const allIds = filteredNotifications.map(n => n.id);
    setSelectedIds(new Set(allIds));
  };
  
  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };
  
  const handleMarkSelectedRead = () => {
    setNotifications(prev =>
      prev.map(n =>
        selectedIds.has(n.id) ? { ...n, isRead: true } : n
      )
    );
    setSelectedIds(new Set());
  };
  
  const handleDeleteSelected = () => {
    setNotifications(prev =>
      prev.filter(n => !selectedIds.has(n.id))
    );
    setSelectedIds(new Set());
  };
  
  const handleMarkAllRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );
  };
  
  const handleClearAll = () => {
    if (confirm('确定要清空所有消息吗？此操作不可恢复。')) {
      setNotifications([]);
      setSelectedIds(new Set());
    }
  };
  
  return (
    <PageContainer>
      <Header />
      
      <MainContent>
        <PageHeader>
          <PageTitle>
            <span>🔔</span>
            <span>消息通知</span>
          </PageTitle>
          <HeaderActions>
            <Button type="ghost" size="small" onClick={handleMarkAllRead}>
              全部已读
            </Button>
            <Button type="ghost" size="small" onClick={handleClearAll}>
              清空消息
            </Button>
          </HeaderActions>
        </PageHeader>
        
        <NotificationStats>
          <StatItem>
            <StatNumber>{stats.total}</StatNumber>
            <StatLabel>总消息</StatLabel>
          </StatItem>
          <StatItem>
            <StatNumber>{stats.unread}</StatNumber>
            <StatLabel>未读消息</StatLabel>
          </StatItem>
          <StatItem>
            <StatNumber>{stats.today}</StatNumber>
            <StatLabel>今日消息</StatLabel>
          </StatItem>
        </NotificationStats>
        
        <ContentContainer>
          <Sidebar>
            <FilterTitle>消息分类</FilterTitle>
            <FilterList>
              {(['all', 'unread', 'like', 'comment', 'follow', 'reply', 'video', 'system'] as FilterType[]).map((filter) => (
                <FilterItem
                  key={filter}
                  $active={activeFilter === filter}
                  onClick={() => setActiveFilter(filter)}
                >
                  <FilterIcon>
                    {getFilterIcon(filter)}
                    {getFilterLabel(filter)}
                  </FilterIcon>
                  <FilterCount $active={activeFilter === filter}>
                    {getFilterCount(filter)}
                  </FilterCount>
                </FilterItem>
              ))}
            </FilterList>
          </Sidebar>
          
          <NotificationContainer>
            <BulkActions $visible={selectedIds.size > 0}>
              <span>已选择 {selectedIds.size} 项</span>
              <Button type="ghost" size="small" onClick={handleMarkSelectedRead}>
                标记已读
              </Button>
              <Button type="ghost" size="small" onClick={handleDeleteSelected}>
                删除选中
              </Button>
              <Button type="ghost" size="small" onClick={handleDeselectAll}>
                取消选择
              </Button>
            </BulkActions>
            
            {filteredNotifications.length > 0 ? (
              <NotificationList>
                {filteredNotifications.slice(0, 20).map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    $isRead={notification.isRead}
                    $selected={selectedIds.has(notification.id)}
                  >
                    <SelectCheckbox
                      type="checkbox"
                      checked={selectedIds.has(notification.id)}
                      onChange={(e) => handleSelectNotification(notification.id, e.target.checked)}
                    />
                    
                    {notification.avatar ? (
                      <NotificationAvatar 
                        src={notification.avatar} 
                        alt=""
                        onClick={() => handleNotificationClick(notification)}
                      />
                    ) : (
                      <NotificationIcon 
                        $type={notification.type}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        {getNotificationIcon(notification.type)}
                      </NotificationIcon>
                    )}
                    
                    <NotificationContent onClick={() => handleNotificationClick(notification)}>
                      <NotificationHeader>
                        <NotificationTitle $isRead={notification.isRead}>
                          {notification.title}
                        </NotificationTitle>
                        <NotificationTime>{notification.createdAt}</NotificationTime>
                      </NotificationHeader>
                      
                      <NotificationText $isRead={notification.isRead}>
                        {notification.content}
                      </NotificationText>
                      
                      {notification.thumbnail && (
                        <NotificationMedia>
                          <NotificationThumbnail src={notification.thumbnail} alt="" />
                        </NotificationMedia>
                      )}
                    </NotificationContent>
                    
                    <UnreadDot $isRead={notification.isRead} />
                  </NotificationItem>
                ))}
              </NotificationList>
            ) : (
              <EmptyState>
                <EmptyIcon>📭</EmptyIcon>
                <EmptyText>暂无消息</EmptyText>
                <EmptySubtext>当前分类下没有消息</EmptySubtext>
              </EmptyState>
            )}
            
            {filteredNotifications.length > 20 && (
              <LoadMoreButton type="secondary" onClick={() => {}}>
                加载更多
              </LoadMoreButton>
            )}
          </NotificationContainer>
        </ContentContainer>
      </MainContent>
    </PageContainer>
  );
};

export default NotificationsPage;