/*
 * 大雄视频平台 - 直播页面
 * 支持直播观看、弹幕互动、礼物打赏等功能
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Header from '../../components/layout/Header';
import DanmakuSystem from '../../components/video/DanmakuSystem';
import Button from '../../components/common/Button';
import { useTheme } from '../../contexts/ThemeContext';
import { mediaQuery, responsiveStyles } from '../../utils/responsive';

// ============ 类型定义 ============

interface LiveStream {
  id: string;
  title: string;
  streamUrl: string;
  thumbnail: string;
  isLive: boolean;
  viewerCount: number;
  likeCount: number;
  shareCount: number;
  category: {
    id: string;
    name: string;
    icon: string;
  };
  tags: string[];
  description: string;
  startTime: string;
  duration: number;
  streamer: {
    id: string;
    username: string;
    nickname: string;
    avatar: string;
    isVip: boolean;
    verified: boolean;
    followers: number;
    level: number;
  };
}

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  message: string;
  timestamp: number;
  type: 'message' | 'gift' | 'system' | 'follow' | 'like';
  vip?: boolean;
  level?: number;
  giftInfo?: {
    name: string;
    icon: string;
    count: number;
    value: number;
  };
}

interface Gift {
  id: string;
  name: string;
  icon: string;
  price: number;
  effect: string;
}

// ============ 样式定义 ============

const PageContainer = styled.div`
  ${responsiveStyles.fullHeight}
  background: var(--background-primary);
  overflow-x: hidden;
`;

const MainContent = styled.main`
  ${responsiveStyles.trueFullScreenContainer}
  display: grid;
  grid-template-columns: 1fr clamp(320px, 30vw, 360px);
  gap: clamp(var(--space-lg), 3vw, var(--space-xl));
  padding: var(--space-lg);
  
  ${mediaQuery.down('lg')} {
    grid-template-columns: 1fr;
    gap: var(--space-lg);
  }
  
  ${mediaQuery.down('md')} {
    padding: var(--space-md);
  }
  
  ${mediaQuery.down('sm')} {
    gap: var(--space-md);
    padding: var(--space-sm);
  }
`;

const StreamSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
`;

const StreamContainer = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  background: #000;
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
`;

const StreamVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const StreamOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.6) 0%,
    transparent 20%,
    transparent 80%,
    rgba(0, 0, 0, 0.8) 100%
  );
  pointer-events: none;
`;

const LiveIndicator = styled.div<{ $isLive: boolean }>`
  position: absolute;
  top: var(--space-md);
  left: var(--space-md);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  background: ${props => props.$isLive ? 'var(--live-color)' : 'var(--text-tertiary)'};
  color: white;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  border-radius: var(--border-radius-sm);
  backdrop-filter: blur(8px);
  
  &::before {
    content: '●';
    animation: ${props => props.$isLive ? 'pulse 2s infinite' : 'none'};
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const ViewerStats = styled.div`
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border-radius: var(--border-radius-sm);
  backdrop-filter: blur(8px);
`;

const StreamInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
`;

const StreamTitle = styled.h1`
  font-size: clamp(var(--font-size-h3), 4vw, var(--font-size-h2));
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  line-height: var(--line-height-tight);
  margin: 0;
  }
`;

const StreamMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) 0;
  border-bottom: 1px solid var(--border-light);
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-left: auto;
  
  @media (max-width: 768px) {
    margin-left: 0;
    width: 100%;
    justify-content: space-between;
  }
`;

const ActionButton = styled(Button)<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  font-size: var(--font-size-sm);
  background: ${props => props.$active ? 'var(--primary-color)' : 'var(--background-secondary)'};
  color: ${props => props.$active ? 'var(--text-inverse)' : 'var(--text-secondary)'};
  border: 1px solid ${props => props.$active ? 'var(--primary-color)' : 'var(--border-light)'};
  
  &:hover {
    background: ${props => props.$active ? 'var(--primary-hover)' : 'var(--background-tertiary)'};
    color: ${props => props.$active ? 'var(--text-inverse)' : 'var(--text-primary)'};
    border-color: ${props => props.$active ? 'var(--primary-hover)' : 'var(--border-color)'};
  }
`;

const StreamerSection = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg);
  background: var(--background-secondary);
  border-radius: var(--border-radius-lg);
`;

const StreamerAvatar = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--border-light);
`;

const StreamerInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
`;

const StreamerName = styled.h3`
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
`;

const VipBadge = styled.span`
  background: var(--vip-gradient);
  color: var(--text-inverse);
  font-size: var(--font-size-xs);
  padding: 2px var(--space-xs);
  border-radius: var(--border-radius-sm);
  font-weight: var(--font-weight-medium);
`;

const LevelBadge = styled.span<{ $level: number }>`
  background: ${props => {
    if (props.$level >= 50) return 'var(--live-gradient)';
    if (props.$level >= 30) return 'var(--vip-gradient)';
    if (props.$level >= 10) return 'var(--primary-gradient)';
    return 'var(--background-tertiary)';
  }};
  color: var(--text-inverse);
  font-size: var(--font-size-xs);
  padding: 2px var(--space-xs);
  border-radius: var(--border-radius-sm);
  font-weight: var(--font-weight-bold);
`;

const StreamerStats = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-md);
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
`;

const FollowButton = styled(Button)`
  padding: var(--space-sm) var(--space-lg);
  font-weight: var(--font-weight-medium);
  
  @media (max-width: 768px) {
    padding: var(--space-xs) var(--space-md);
    font-size: var(--font-size-sm);
  }
`;

const ChatSidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  
  @media (max-width: 968px) {
    order: -1;
    max-height: 400px;
  }
`;

const ChatSection = styled.section`
  background: var(--background-secondary);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 500px;
  
  @media (max-width: 968px) {
    height: 300px;
  }
`;

const ChatHeader = styled.div`
  padding: var(--space-md);
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ChatTitle = styled.h3`
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
`;

const ChatMessages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: var(--space-sm);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: var(--background-tertiary);
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 2px;
  }
`;

const ChatMessage = styled.div<{ $type: string }>`
  display: flex;
  gap: var(--space-xs);
  padding: var(--space-xs);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-base);
  background: ${props => {
    switch (props.$type) {
      case 'gift': return 'rgba(255, 215, 0, 0.1)';
      case 'follow': return 'rgba(24, 144, 255, 0.1)';
      case 'system': return 'rgba(114, 46, 209, 0.1)';
      default: return 'transparent';
    }
  }};
  
  &:hover {
    background: var(--background-tertiary);
  }
`;

const MessageAvatar = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
`;

const MessageContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const MessageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-xs);
`;

const MessageUsername = styled.span<{ $vip?: boolean }>`
  font-weight: var(--font-weight-medium);
  color: ${props => props.$vip ? 'var(--vip-color)' : 'var(--text-primary)'};
  font-size: var(--font-size-xs);
`;

const MessageText = styled.div`
  color: var(--text-secondary);
  word-break: break-word;
`;

const ChatInput = styled.div`
  padding: var(--space-md);
  border-top: 1px solid var(--border-light);
  display: flex;
  gap: var(--space-sm);
`;

const ChatInputField = styled.input`
  flex: 1;
  padding: var(--space-sm);
  background: var(--background-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-base);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
  }
  
  &::placeholder {
    color: var(--text-tertiary);
  }
`;

const GiftSection = styled.section`
  background: var(--background-secondary);
  border-radius: var(--border-radius-lg);
  padding: var(--space-md);
`;

const GiftTitle = styled.h3`
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-md) 0;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
`;

const GiftGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-sm);
`;

const GiftItem = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm);
  background: var(--background-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-base);
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-out);
  
  &:hover {
    background: var(--background-tertiary);
    border-color: var(--primary-color);
    transform: translateY(-2px);
  }
`;

const GiftIcon = styled.div`
  font-size: 24px;
`;

const GiftName = styled.div`
  font-size: var(--font-size-xs);
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
`;

const GiftPrice = styled.div`
  font-size: var(--font-size-xs);
  color: var(--vip-color);
  font-weight: var(--font-weight-bold);
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-top: var(--space-md);
`;

const Tag = styled.span`
  display: inline-block;
  padding: var(--space-xs) var(--space-sm);
  background: var(--background-tertiary);
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
  border-radius: var(--border-radius-full);
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-out);
  
  &:hover {
    background: var(--primary-color);
    color: var(--text-inverse);
  }
`;

// ============ Mock 数据 ============

const mockLiveStream: LiveStream = {
  id: 'live-1',
  title: '【React实战】手把手教你开发现代化视频直播平台 🚀',
  streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  thumbnail: 'https://picsum.photos/800/450?random=live',
  isLive: true,
  viewerCount: 12543,
  likeCount: 2580,
  shareCount: 156,
  category: {
    id: 'tech',
    name: '科技',
    icon: '💻'
  },
  tags: ['React', 'TypeScript', '直播开发', '前端', '实战'],
  description: '欢迎来到React实战直播课堂！今天我们将从零开始构建一个功能完整的视频直播平台，包括：\n\n🎯 主要内容：\n• 直播推流与拉流技术\n• WebRTC实时通信\n• 弹幕系统实现\n• 聊天室功能开发\n• 礼物打赏系统\n\n💡 适合人群：有React基础的开发者\n🔥 源码会在直播结束后分享给大家！',
  startTime: '2024-12-10T14:30:00Z',
  duration: 7200, // 2小时
  streamer: {
    id: 'streamer-1',
    username: 'daxiong_dev',
    nickname: '大雄开发者',
    avatar: 'https://picsum.photos/120/120?random=streamer',
    isVip: true,
    verified: true,
    followers: 125600,
    level: 45
  }
};

const mockGifts: Gift[] = [
  { id: 'gift-1', name: '点赞', icon: '👍', price: 1, effect: 'like' },
  { id: 'gift-2', name: '玫瑰', icon: '🌹', price: 5, effect: 'rose' },
  { id: 'gift-3', name: '礼物', icon: '🎁', price: 10, effect: 'gift' },
  { id: 'gift-4', name: '火箭', icon: '🚀', price: 50, effect: 'rocket' },
  { id: 'gift-5', name: '跑车', icon: '🏎️', price: 100, effect: 'car' },
  { id: 'gift-6', name: '城堡', icon: '🏰', price: 500, effect: 'castle' }
];

const mockChatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    userId: 'user-1',
    username: '前端小白',
    avatar: 'https://picsum.photos/48/48?random=1',
    message: '大雄老师讲得太好了！',
    timestamp: Date.now() - 300000,
    type: 'message',
    level: 5
  },
  {
    id: 'msg-2',
    userId: 'user-2',
    username: 'React爱好者',
    avatar: 'https://picsum.photos/48/48?random=2',
    message: '终于等到直播课了，准备好了！',
    timestamp: Date.now() - 240000,
    type: 'message',
    vip: true,
    level: 25
  },
  {
    id: 'msg-3',
    userId: 'user-3',
    username: '码农小张',
    avatar: 'https://picsum.photos/48/48?random=3',
    message: '源码什么时候分享？',
    timestamp: Date.now() - 180000,
    type: 'message',
    level: 12
  },
  {
    id: 'msg-4',
    userId: 'user-4',
    username: 'TypeScript高手',
    avatar: 'https://picsum.photos/48/48?random=4',
    message: '',
    timestamp: Date.now() - 120000,
    type: 'gift',
    vip: true,
    level: 35,
    giftInfo: {
      name: '火箭',
      icon: '🚀',
      count: 2,
      value: 100
    }
  },
  {
    id: 'msg-5',
    userId: 'system',
    username: '系统消息',
    avatar: '',
    message: '欢迎 "新用户666" 加入直播间！',
    timestamp: Date.now() - 60000,
    type: 'system'
  }
];

// ============ 工具函数 ============

const formatViewCount = (count: number): string => {
  if (count >= 100000000) return `${(count / 100000000).toFixed(1)}亿`;
  if (count >= 10000) return `${(count / 10000).toFixed(1)}万`;
  return count.toString();
};

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  }
  return `${minutes}分钟`;
};

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}小时前`;
  return date.toLocaleDateString('zh-CN');
};

// ============ 组件实现 ============

const LivePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { actualTheme } = useTheme();
  
  const [stream] = useState(mockLiveStream);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState(mockChatMessages);
  const [showDanmaku, setShowDanmaku] = useState(true);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  
  const handleLike = () => {
    setIsLiked(!isLiked);
  };
  
  const handleFollow = () => {
    setIsFollowing(!isFollowing);
  };
  
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    console.log('直播链接已复制到剪贴板');
  };
  
  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        userId: 'current-user',
        username: '我',
        avatar: 'https://picsum.photos/48/48?random=me',
        message: chatMessage.trim(),
        timestamp: Date.now(),
        type: 'message',
        level: 8
      };
      
      setChatMessages(prev => [...prev, newMessage]);
      setChatMessage('');
    }
  };
  
  const handleSendGift = (gift: Gift) => {
    const giftMessage: ChatMessage = {
      id: `gift-${Date.now()}`,
      userId: 'current-user',
      username: '我',
      avatar: 'https://picsum.photos/48/48?random=me',
      message: '',
      timestamp: Date.now(),
      type: 'gift',
      level: 8,
      giftInfo: {
        name: gift.name,
        icon: gift.icon,
        count: 1,
        value: gift.price
      }
    };
    
    setChatMessages(prev => [...prev, giftMessage]);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };
  
  // 自动滚动到最新消息
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);
  
  // 模拟新消息
  useEffect(() => {
    const interval = setInterval(() => {
      const randomMessages = [
        '666666',
        '讲得太棒了！',
        '学到了很多',
        '什么时候下播？',
        '源码求分享',
        '关注了关注了',
        '前排支持'
      ];
      
      const newMessage: ChatMessage = {
        id: `auto-${Date.now()}`,
        userId: `user-${Math.random()}`,
        username: `观众${Math.floor(Math.random() * 1000)}`,
        avatar: `https://picsum.photos/48/48?random=${Math.floor(Math.random() * 100)}`,
        message: randomMessages[Math.floor(Math.random() * randomMessages.length)],
        timestamp: Date.now(),
        type: 'message',
        level: Math.floor(Math.random() * 50)
      };
      
      setChatMessages(prev => [...prev.slice(-50), newMessage]); // 保持最新50条消息
    }, 5000 + Math.random() * 10000); // 5-15秒随机间隔
    
    return () => clearInterval(interval);
  }, []);
  
  if (!stream) {
    return (
      <PageContainer>
        <Header />
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          直播不存在或已结束
        </div>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer>
      <Header />
      
      <MainContent>
        <StreamSection>
          <StreamContainer>
            <StreamVideo
              src={stream.streamUrl}
              poster={stream.thumbnail}
              controls={false}
              autoPlay
              muted
            />
            
            <StreamOverlay />
            
            <LiveIndicator $isLive={stream.isLive}>
              {stream.isLive ? 'LIVE' : 'REPLAY'}
            </LiveIndicator>
            
            <ViewerStats>
              <StatItem>
                <span>👁</span>
                <span>{formatViewCount(stream.viewerCount)}</span>
              </StatItem>
              <StatItem>
                <span>👍</span>
                <span>{formatViewCount(stream.likeCount)}</span>
              </StatItem>
            </ViewerStats>
            
            {showDanmaku && (
              <DanmakuSystem
                videoCurrentTime={0}
                danmakuList={[]}
                visible={true}
                opacity={0.8}
                fontSize={16}
                speed={8}
                onSendDanmaku={() => {}}
              />
            )}
          </StreamContainer>
          
          <StreamInfo>
            <StreamTitle>{stream.title}</StreamTitle>
            
            <StreamMeta>
              <MetaItem>
                <span>🏷️</span>
                <span>{stream.category.name}</span>
              </MetaItem>
              
              <MetaItem>
                <span>⏱️</span>
                <span>已直播 {formatDuration(stream.duration)}</span>
              </MetaItem>
              
              <ActionButtons>
                <ActionButton $active={isLiked} onClick={handleLike}>
                  <span>{isLiked ? '❤️' : '🤍'}</span>
                  <span>{formatViewCount(stream.likeCount + (isLiked ? 1 : 0))}</span>
                </ActionButton>
                
                <ActionButton onClick={() => setShowDanmaku(!showDanmaku)}>
                  <span>{showDanmaku ? '💬' : '🚫'}</span>
                  <span>弹幕</span>
                </ActionButton>
                
                <ActionButton onClick={handleShare}>
                  <span>🔗</span>
                  <span>分享</span>
                </ActionButton>
              </ActionButtons>
            </StreamMeta>
            
            <StreamerSection>
              <StreamerAvatar src={stream.streamer.avatar} alt={stream.streamer.nickname} />
              <StreamerInfo>
                <StreamerName>
                  {stream.streamer.nickname}
                  {stream.streamer.isVip && <VipBadge>VIP</VipBadge>}
                  <LevelBadge $level={stream.streamer.level}>Lv.{stream.streamer.level}</LevelBadge>
                </StreamerName>
                <StreamerStats>
                  <span>{formatViewCount(stream.streamer.followers)} 粉丝</span>
                </StreamerStats>
              </StreamerInfo>
              <FollowButton
                type={isFollowing ? "secondary" : "primary"}
                onClick={handleFollow}
              >
                {isFollowing ? '已关注' : '关注'}
              </FollowButton>
            </StreamerSection>
            
            <div style={{ 
              padding: 'var(--space-lg)', 
              background: 'var(--background-secondary)', 
              borderRadius: 'var(--border-radius-lg)',
              whiteSpace: 'pre-wrap',
              lineHeight: 'var(--line-height-base)',
              color: 'var(--text-secondary)'
            }}>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>
                📝 直播简介
              </h4>
              {stream.description}
              <TagList>
                {stream.tags.map((tag) => (
                  <Tag key={tag}>#{tag}</Tag>
                ))}
              </TagList>
            </div>
          </StreamInfo>
        </StreamSection>
        
        <ChatSidebar>
          <ChatSection>
            <ChatHeader>
              <ChatTitle>
                <span>💬</span>
                <span>聊天室</span>
              </ChatTitle>
              <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                {formatViewCount(stream.viewerCount)} 在线
              </span>
            </ChatHeader>
            
            <ChatMessages ref={chatMessagesRef}>
              {chatMessages.map((msg) => (
                <ChatMessage key={msg.id} $type={msg.type}>
                  {msg.type !== 'system' && (
                    <MessageAvatar src={msg.avatar} alt={msg.username} />
                  )}
                  <MessageContent>
                    {msg.type !== 'system' && (
                      <MessageHeader>
                        <MessageUsername $vip={msg.vip}>
                          {msg.username}
                        </MessageUsername>
                        {msg.level && (
                          <LevelBadge $level={msg.level}>Lv.{msg.level}</LevelBadge>
                        )}
                        <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-xs)' }}>
                          {formatTime(msg.timestamp)}
                        </span>
                      </MessageHeader>
                    )}
                    <MessageText>
                      {msg.type === 'gift' && msg.giftInfo ? (
                        <span style={{ color: 'var(--vip-color)', fontWeight: 'var(--font-weight-bold)' }}>
                          赠送了 {msg.giftInfo.icon} {msg.giftInfo.name} x{msg.giftInfo.count}
                        </span>
                      ) : (
                        msg.message
                      )}
                    </MessageText>
                  </MessageContent>
                </ChatMessage>
              ))}
            </ChatMessages>
            
            <ChatInput>
              <ChatInputField
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="说点什么..."
                maxLength={200}
              />
              <Button
                type="primary"
                size="small"
                onClick={handleSendMessage}
                disabled={!chatMessage.trim()}
              >
                发送
              </Button>
            </ChatInput>
          </ChatSection>
          
          <GiftSection>
            <GiftTitle>
              <span>🎁</span>
              <span>礼物打赏</span>
            </GiftTitle>
            <GiftGrid>
              {mockGifts.map((gift) => (
                <GiftItem key={gift.id} onClick={() => handleSendGift(gift)}>
                  <GiftIcon>{gift.icon}</GiftIcon>
                  <GiftName>{gift.name}</GiftName>
                  <GiftPrice>{gift.price}币</GiftPrice>
                </GiftItem>
              ))}
            </GiftGrid>
          </GiftSection>
        </ChatSidebar>
      </MainContent>
    </PageContainer>
  );
};

export default LivePage;