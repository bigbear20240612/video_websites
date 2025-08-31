import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Video {
  id: string
  title: string
  description: string
  url: string
  thumbnailUrl: string
  duration: number
  viewCount: number
  likeCount: number
  uploaderId: string
  uploaderName: string
  uploaderAvatar?: string
  categoryId: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface VideoState {
  currentVideo: Video | null
  videos: Video[]
  loading: boolean
  error: string | null
  searchResults: Video[]
  searchLoading: boolean
  recommendations: Video[]
  categories: any[]
}

const initialState: VideoState = {
  currentVideo: null,
  videos: [],
  loading: false,
  error: null,
  searchResults: [],
  searchLoading: false,
  recommendations: [],
  categories: [],
}

const videoSlice = createSlice({
  name: 'video',
  initialState,
  reducers: {
    setCurrentVideo: (state, action: PayloadAction<Video>) => {
      state.currentVideo = action.payload
    },
    setVideos: (state, action: PayloadAction<Video[]>) => {
      state.videos = action.payload
    },
    addVideo: (state, action: PayloadAction<Video>) => {
      state.videos.unshift(action.payload)
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setSearchResults: (state, action: PayloadAction<Video[]>) => {
      state.searchResults = action.payload
    },
    setSearchLoading: (state, action: PayloadAction<boolean>) => {
      state.searchLoading = action.payload
    },
    setRecommendations: (state, action: PayloadAction<Video[]>) => {
      state.recommendations = action.payload
    },
    setCategories: (state, action: PayloadAction<any[]>) => {
      state.categories = action.payload
    },
    clearCurrentVideo: (state) => {
      state.currentVideo = null
    },
  },
})

export const {
  setCurrentVideo,
  setVideos,
  addVideo,
  setLoading,
  setError,
  setSearchResults,
  setSearchLoading,
  setRecommendations,
  setCategories,
  clearCurrentVideo,
} = videoSlice.actions

export default videoSlice.reducer