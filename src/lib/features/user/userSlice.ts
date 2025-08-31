import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UserProfile {
  id: string
  username: string
  email: string
  avatar?: string
  bio?: string
  followerCount: number
  followingCount: number
  videoCount: number
  isFollowing?: boolean
}

interface UserState {
  profile: UserProfile | null
  loading: boolean
  error: string | null
  followers: UserProfile[]
  following: UserProfile[]
  userVideos: any[]
}

const initialState: UserState = {
  profile: null,
  loading: false,
  error: null,
  followers: [],
  following: [],
  userVideos: [],
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setFollowers: (state, action: PayloadAction<UserProfile[]>) => {
      state.followers = action.payload
    },
    setFollowing: (state, action: PayloadAction<UserProfile[]>) => {
      state.following = action.payload
    },
    setUserVideos: (state, action: PayloadAction<any[]>) => {
      state.userVideos = action.payload
    },
    toggleFollow: (state) => {
      if (state.profile) {
        state.profile.isFollowing = !state.profile.isFollowing
        state.profile.followerCount += state.profile.isFollowing ? 1 : -1
      }
    },
  },
})

export const {
  setProfile,
  setLoading,
  setError,
  setFollowers,
  setFollowing,
  setUserVideos,
  toggleFollow,
} = userSlice.actions

export default userSlice.reducer