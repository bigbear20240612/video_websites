'use client'

import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Typography, Button, Carousel, Skeleton, Spin } from 'antd'
import { PlayCircleOutlined, EyeOutlined, LikeOutlined } from '@ant-design/icons'
import styled from 'styled-components'

const { Title, Text, Paragraph } = Typography

const PageContainer = styled.div`
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24px;
`

const HeroCarousel = styled(Carousel)`
  margin-bottom: 48px;
  
  .slick-slide {
    height: 400px;
  }
  
  .slick-slide > div {
    height: 100%;
  }
`

const BannerSlide = styled.div`
  position: relative;
  height: 400px;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex !important;
  align-items: center;
  justify-content: center;
  color: white;
  text-align: center;
`

const VideoCard = styled(Card)`
  .ant-card-cover {
    height: 200px;
    overflow: hidden;
  }
  
  .ant-card-cover img {
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
  }
  
  &:hover .ant-card-cover img {
    transform: scale(1.05);
  }
  
  .ant-card-body {
    padding: 16px;
  }
`

const CategoryTabs = styled.div`
  margin-bottom: 32px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`

const CategoryButton = styled(Button)<{ $active?: boolean }>`
  border-radius: 20px;
  ${props => props.$active && `
    background: #1677ff;
    border-color: #1677ff;
    color: white;
  `}
`

// Mock 数据
const mockBanners = [
  {
    id: 1,
    title: 'DAXIONG 视频平台',
    description: '专业的视频分享与观看平台',
    image: '/api/placeholder/1200/400'
  },
  {
    id: 2,
    title: '发现精彩内容',
    description: '探索无限可能的视频世界',
    image: '/api/placeholder/1200/400'
  },
  {
    id: 3,
    title: '创作与分享',
    description: '展示你的创意与才华',
    image: '/api/placeholder/1200/400'
  }
]

const mockVideos = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  title: `精彩视频 ${i + 1}`,
  description: '这是一个有趣的视频描述...',
  thumbnail: `/api/placeholder/320/200?${i}`,
  duration: '5:30',
  views: Math.floor(Math.random() * 10000) + 1000,
  likes: Math.floor(Math.random() * 1000) + 100,
  author: {
    name: `UP主 ${i + 1}`,
    avatar: `/api/placeholder/40/40?${i + 100}`
  },
  category: ['教育', '科技', '娱乐', '生活'][i % 4],
  createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
}))

const categories = ['全部', '教育', '科技', '娱乐', '生活', '游戏', '音乐', '体育']

export default function HomePage() {
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('全部')
  const [filteredVideos, setFilteredVideos] = useState(mockVideos)

  useEffect(() => {
    // 模拟加载
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1500)
    
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (activeCategory === '全部') {
      setFilteredVideos(mockVideos)
    } else {
      setFilteredVideos(mockVideos.filter(video => video.category === activeCategory))
    }
  }, [activeCategory])

  const handleVideoClick = (video: any) => {
    console.log('点击视频:', video)
    // 在实际应用中这里会导航到视频详情页
  }

  return (
    <PageContainer>
      <Title level={1} style={{ textAlign: 'center', marginBottom: 32 }}>
        DAXIONG 视频平台
      </Title>

      {/* 轮播图 */}
      <HeroCarousel autoplay>
        {mockBanners.map(banner => (
          <BannerSlide key={banner.id}>
            <div>
              <Title level={2} style={{ color: 'white', marginBottom: 16 }}>
                {banner.title}
              </Title>
              <Paragraph style={{ color: 'white', fontSize: 18, marginBottom: 24 }}>
                {banner.description}
              </Paragraph>
              <Button type="primary" size="large" icon={<PlayCircleOutlined />}>
                开始探索
              </Button>
            </div>
          </BannerSlide>
        ))}
      </HeroCarousel>

      {/* 分类筛选 */}
      <CategoryTabs>
        {categories.map(category => (
          <CategoryButton
            key={category}
            $active={activeCategory === category}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </CategoryButton>
        ))}
      </CategoryTabs>

      {/* 推荐视频部分 */}
      <Title level={3} style={{ marginBottom: 24 }}>
        📺 为你推荐
      </Title>

      {loading ? (
        <Row gutter={[16, 16]}>
          {Array.from({ length: 8 }, (_, i) => (
            <Col xs={24} sm={12} md={8} lg={6} key={i}>
              <Card>
                <Skeleton.Image style={{ width: '100%', height: 200 }} />
                <Skeleton active paragraph={{ rows: 2 }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Row gutter={[16, 16]}>
          {filteredVideos.slice(0, 12).map(video => (
            <Col xs={24} sm={12} md={8} lg={6} key={video.id}>
              <VideoCard
                hoverable
                cover={
                  <div style={{ position: 'relative' }}>
                    <img alt={video.title} src={video.thumbnail} />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        background: 'rgba(0,0,0,0.8)',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontSize: '12px'
                      }}
                    >
                      {video.duration}
                    </div>
                  </div>
                }
                actions={[
                  <div key="views" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <EyeOutlined />
                    <span>{video.views.toLocaleString()}</span>
                  </div>,
                  <div key="likes" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <LikeOutlined />
                    <span>{video.likes.toLocaleString()}</span>
                  </div>
                ]}
                onClick={() => handleVideoClick(video)}
              >
                <Card.Meta
                  title={
                    <div style={{ 
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: '1.4',
                      height: '2.8em'
                    }}>
                      {video.title}
                    </div>
                  }
                  description={
                    <div>
                      <div style={{ marginBottom: 8, color: '#666', fontSize: '12px' }}>
                        {video.author.name}
                      </div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {new Date(video.createdAt).toLocaleDateString()}
                      </Text>
                    </div>
                  }
                />
              </VideoCard>
            </Col>
          ))}
        </Row>
      )}

      {/* 最新视频部分 */}
      <Title level={3} style={{ marginTop: 48, marginBottom: 24 }}>
        🆕 最新视频
      </Title>

      <Row gutter={[16, 16]}>
        {mockVideos.slice(12, 16).map(video => (
          <Col xs={24} sm={12} md={8} lg={6} key={video.id}>
            <VideoCard
              hoverable
              cover={
                <div style={{ position: 'relative' }}>
                  <img alt={video.title} src={video.thumbnail} />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      background: 'rgba(0,0,0,0.8)',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: '12px'
                    }}
                  >
                    {video.duration}
                  </div>
                </div>
              }
              actions={[
                <div key="views" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <EyeOutlined />
                  <span>{video.views.toLocaleString()}</span>
                </div>,
                <div key="likes" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <LikeOutlined />
                  <span>{video.likes.toLocaleString()}</span>
                </div>
              ]}
              onClick={() => handleVideoClick(video)}
            >
              <Card.Meta
                title={
                  <div style={{ 
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: '1.4',
                    height: '2.8em'
                  }}>
                    {video.title}
                  </div>
                }
                description={
                  <div>
                    <div style={{ marginBottom: 8, color: '#666', fontSize: '12px' }}>
                      {video.author.name}
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {new Date(video.createdAt).toLocaleDateString()}
                    </Text>
                  </div>
                }
              />
            </VideoCard>
          </Col>
        ))}
      </Row>
    </PageContainer>
  )
}