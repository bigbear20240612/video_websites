import { User, Video, Category, Comment } from '@/types'
import { generateId } from '@/utils/api'

// Mock 用户数据
export const mockUsers: User[] = [
  {
    id: 'user1',
    username: 'admin',
    email: 'admin@daxiong.com',
    avatar: '/api/placeholder/64/64?1',
    bio: '视频平台管理员',
    role: 'admin',
    followerCount: 10000,
    followingCount: 100,
    videoCount: 50,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-12-31T00:00:00Z'
  },
  {
    id: 'user2',
    username: 'creator1',
    email: 'creator1@example.com',
    avatar: '/api/placeholder/64/64?2',
    bio: '科技内容创作者',
    role: 'user',
    followerCount: 5000,
    followingCount: 50,
    videoCount: 30,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-12-31T00:00:00Z'
  }
]

// Mock 分类数据
export const mockCategories: Category[] = [
  { id: 'tech', name: '科技', icon: '💻', description: '科技相关内容', videoCount: 100 },
  { id: 'entertainment', name: '娱乐', icon: '🎵', description: '娱乐相关内容', videoCount: 200 },
  { id: 'education', name: '教育', icon: '📚', description: '教育相关内容', videoCount: 150 },
  { id: 'gaming', name: '游戏', icon: '🎮', description: '游戏相关内容', videoCount: 180 },
  { id: 'lifestyle', name: '生活', icon: '🏠', description: '生活相关内容', videoCount: 120 },
  { id: 'sports', name: '体育', icon: '⚽', description: '体育相关内容', videoCount: 90 },
  { id: 'food', name: '美食', icon: '🍽️', description: '美食相关内容', videoCount: 110 },
  { id: 'travel', name: '旅行', icon: '✈️', description: '旅行相关内容', videoCount: 80 }
]

// Mock 视频数据
export const mockVideos: Video[] = Array.from({ length: 50 }, (_, i) => {
  const categories = mockCategories
  const users = mockUsers
  const category = categories[i % categories.length]
  const user = users[i % users.length]
  
  return {
    id: `video${i + 1}`,
    title: `精彩视频 ${i + 1} - ${category.name}主题内容`,
    description: `这是第${i + 1}个视频的详细描述，包含了${category.name}相关的精彩内容。视频质量很高，内容丰富有趣，值得观看和分享。`,
    url: `/api/placeholder/video/${i + 1}`,
    thumbnailUrl: `/api/placeholder/640/360?${i + 10}`,
    duration: Math.floor(Math.random() * 3600) + 60,
    viewCount: Math.floor(Math.random() * 100000) + 1000,
    likeCount: Math.floor(Math.random() * 10000) + 100,
    commentCount: Math.floor(Math.random() * 1000) + 10,
    shareCount: Math.floor(Math.random() * 500) + 5,
    uploaderId: user.id,
    uploaderName: user.username,
    uploaderAvatar: user.avatar,
    categoryId: category.id,
    category,
    tags: [`标签${i + 1}`, `${category.name}`, '热门'],
    qualities: [
      { quality: '480p', url: `/api/placeholder/video/${i + 1}/480p`, bitrate: 800, resolution: '854x480' },
      { quality: '720p', url: `/api/placeholder/video/${i + 1}/720p`, bitrate: 1500, resolution: '1280x720' },
      { quality: '1080p', url: `/api/placeholder/video/${i + 1}/1080p`, bitrate: 3000, resolution: '1920x1080' }
    ],
    isLiked: Math.random() > 0.7,
    isCollected: Math.random() > 0.8,
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  }
})

// Mock 评论数据
export const mockComments: Comment[] = Array.from({ length: 200 }, (_, i) => {
  const users = mockUsers
  const videos = mockVideos
  const user = users[i % users.length]
  const video = videos[i % videos.length]
  
  return {
    id: `comment${i + 1}`,
    content: `这是第${i + 1}条评论，内容很有意思！${['👍', '😄', '💯', '🔥', '❤️'][i % 5]}`,
    authorId: user.id,
    authorName: user.username,
    authorAvatar: user.avatar,
    videoId: video.id,
    likeCount: Math.floor(Math.random() * 100) + 1,
    isLiked: Math.random() > 0.6,
    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  }
})

// 简单的内存存储（在真实应用中应该使用数据库）
class MockDatabase {
  private users = [...mockUsers]
  private videos = [...mockVideos]
  private comments = [...mockComments]
  private categories = [...mockCategories]

  // 用户相关方法
  getUsers() {
    return this.users
  }

  getUserById(id: string) {
    return this.users.find(user => user.id === id)
  }

  getUserByUsername(username: string) {
    return this.users.find(user => user.username === username)
  }

  getUserByEmail(email: string) {
    return this.users.find(user => user.email === email)
  }

  createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    const user: User = {
      ...userData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    this.users.push(user)
    return user
  }

  // 视频相关方法
  getVideos(params: {
    page?: number
    limit?: number
    category?: string
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  } = {}) {
    let filteredVideos = [...this.videos]

    // 分类筛选
    if (params.category && params.category !== 'all') {
      filteredVideos = filteredVideos.filter(video => video.categoryId === params.category)
    }

    // 搜索筛选
    if (params.search) {
      const searchLower = params.search.toLowerCase()
      filteredVideos = filteredVideos.filter(video =>
        video.title.toLowerCase().includes(searchLower) ||
        video.description.toLowerCase().includes(searchLower) ||
        video.uploaderName.toLowerCase().includes(searchLower)
      )
    }

    // 排序
    if (params.sortBy) {
      filteredVideos.sort((a, b) => {
        const aValue = a[params.sortBy as keyof Video] as number
        const bValue = b[params.sortBy as keyof Video] as number
        return params.sortOrder === 'desc' ? bValue - aValue : aValue - bValue
      })
    }

    // 分页
    const page = params.page || 1
    const limit = params.limit || 20
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit

    return {
      videos: filteredVideos.slice(startIndex, endIndex),
      total: filteredVideos.length,
      page,
      limit,
      totalPages: Math.ceil(filteredVideos.length / limit)
    }
  }

  getVideoById(id: string) {
    return this.videos.find(video => video.id === id)
  }

  // 分类相关方法
  getCategories() {
    return this.categories
  }

  getCategoryById(id: string) {
    return this.categories.find(category => category.id === id)
  }

  // 评论相关方法
  getCommentsByVideoId(videoId: string) {
    return this.comments.filter(comment => comment.videoId === videoId)
  }

  createComment(commentData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>) {
    const comment: Comment = {
      ...commentData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    this.comments.push(comment)
    return comment
  }
}

export const db = new MockDatabase()