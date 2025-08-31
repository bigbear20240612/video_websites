export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  bio?: string
  role: 'user' | 'admin'
  followerCount: number
  followingCount: number
  videoCount: number
  createdAt: string
  updatedAt: string
}

export interface Video {
  id: string
  title: string
  description: string
  url: string
  thumbnailUrl: string
  duration: number
  viewCount: number
  likeCount: number
  commentCount: number
  shareCount: number
  uploaderId: string
  uploaderName: string
  uploaderAvatar?: string
  categoryId: string
  category: Category
  tags: string[]
  qualities: VideoQuality[]
  isLiked?: boolean
  isCollected?: boolean
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  icon: string
  description: string
  videoCount: number
}

export interface VideoQuality {
  quality: string
  url: string
  bitrate: number
  resolution: string
}

export interface Comment {
  id: string
  content: string
  authorId: string
  authorName: string
  authorAvatar?: string
  videoId: string
  parentId?: string
  replies?: Comment[]
  likeCount: number
  isLiked?: boolean
  createdAt: string
  updatedAt: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface VideoListParams extends PaginationParams {
  category?: string
  search?: string
  sortBy?: 'createdAt' | 'viewCount' | 'likeCount'
  sortOrder?: 'asc' | 'desc'
}