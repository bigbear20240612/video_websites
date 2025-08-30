// 测试VideoCard组件版本的HomePage
import React from 'react';
import styled from 'styled-components';
import Header from '../../components/layout/Header';
import VideoCard from '../../components/video/VideoCard';
import { Video } from '../../types';

const PageContainer = styled.div`
  min-height: 100vh;
  background: var(--background-primary);
`;

const MainContent = styled.main`
  max-width: var(--container-xxl);
  margin: 0 auto;
  padding: var(--space-lg);
`;

const TestCard = styled.div`
  background: var(--background-primary);
  border-radius: var(--border-radius-lg);
  padding: var(--space-lg);
  box-shadow: var(--shadow-base);
  margin-bottom: var(--space-lg);
`;

const VideoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-lg);
  margin-top: var(--space-lg);
`;

// 简单的模拟数据
const mockVideo: Video = {
  id: 'test-video-1',
  title: '测试视频标题 - 这是一个很有趣的内容',
  description: '这是测试视频的描述信息',
  cover: 'https://picsum.photos/320/180?random=1',
  url: '',
  duration: 300,
  viewCount: 10000,
  likeCount: 500,
  commentCount: 50,
  shareCount: 10,
  isLiked: false,
  isCollected: false,
  author: {
    id: 'test-user-1',
    username: 'testuser',
    nickname: '测试UP主',
    avatar: 'https://picsum.photos/64/64?random=1',
    isVip: false,
    followers: 1000,
    following: 100,
    likes: 10000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  category: {
    id: 'tech',
    name: '科技',
    icon: '💻',
    description: '科技相关内容',
    videoCount: 1000
  },
  tags: ['测试', '演示'],
  qualities: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const HomePage: React.FC = () => {
  const handleVideoClick = (video: Video) => {
    console.log('点击视频:', video.title);
  };

  return (
    <PageContainer>
      <Header />
      
      <MainContent>
        <TestCard>
          <h1 style={{ color: 'var(--primary-color)' }}>🎬 VideoCard组件测试</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            如果下方能正常显示视频卡片，说明VideoCard组件工作正常。
          </p>
        </TestCard>

        <VideoGrid>
          <VideoCard
            video={mockVideo}
            onClick={handleVideoClick}
            showAuthor={true}
            showStats={true}
          />
          <VideoCard
            video={{...mockVideo, id: 'test-video-2', title: '第二个测试视频'}}
            onClick={handleVideoClick}
            showAuthor={true}
            showStats={true}
          />
          <VideoCard
            video={{...mockVideo, id: 'test-video-3', title: '第三个测试视频'}}
            onClick={handleVideoClick}
            showAuthor={true}
            showStats={true}
          />
        </VideoGrid>
      </MainContent>
    </PageContainer>
  );
};

export default HomePage;