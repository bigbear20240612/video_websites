/*
 * 大雄视频平台 - TypeScript 类型定义
 * 全局类型和接口定义
 */

// ============ 基础数据类型 ============

export interface User {
  id: string;
  username: string;
  nickname: string;
  avatar: string;
  email?: string;
  phone?: string;
  isVip: boolean;
  vipExpireTime?: string;
  followers: number;
  following: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  cover: string;
  url: string;
  duration: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isLiked: boolean;
  isCollected: boolean;
  author: User;
  category: Category;
  tags: string[];
  qualities: VideoQuality[];
  createdAt: string;
  updatedAt: string;
}

export interface VideoQuality {
  quality: '480p' | '720p' | '1080p' | '4K';
  url: string;
  size: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  videoCount: number;
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  videoId: string;
  parentId?: string;
  replies?: Comment[];
  likeCount: number;
  isLiked: boolean;
  createdAt: string;
}

export interface Danmaku {
  id: string;
  text: string;
  time: number;
  color: string;
  position: 'scroll' | 'top' | 'bottom';
  author: User;
  videoId: string;
  createdAt: string;
}

export interface LiveStream {
  id: string;
  title: string;
  cover: string;
  streamUrl: string;
  author: User;
  category: Category;
  viewerCount: number;
  isLive: boolean;
  tags: string[];
  startTime: string;
}

// ============ API 响应类型 ============

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============ 组件 Props 类型 ============

export interface VideoCardProps {
  video: Video;
  size?: 'small' | 'medium' | 'large';
  showAuthor?: boolean;
  showStats?: boolean;
  className?: string;
  onClick?: (video: Video) => void;
}

export interface ButtonProps {
  type?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  block?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export interface VideoPlayerProps {
  video: Video;
  autoplay?: boolean;
  controls?: boolean;
  danmaku?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
}

export interface DanmakuInputProps {
  videoId: string;
  currentTime: number;
  onSend: (danmaku: Omit<Danmaku, 'id' | 'author' | 'createdAt'>) => void;
}

export interface CommentListProps {
  videoId: string;
  comments: Comment[];
  loading?: boolean;
  onLoadMore?: () => void;
  onReply?: (comment: Comment, content: string) => void;
  onLike?: (commentId: string) => void;
}

// ============ 表单类型 ============

export interface LoginForm {
  username: string;
  password: string;
  remember?: boolean;
}

export interface RegisterForm {
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  phone?: string;
}

export interface VideoUploadForm {
  title: string;
  description: string;
  categoryId: string;
  tags: string[];
  file: File;
  cover?: File;
}

export interface UserProfileForm {
  nickname: string;
  avatar?: File;
  email?: string;
  phone?: string;
  description?: string;
}

// ============ 状态管理类型 ============

export interface RootState {
  auth: AuthState;
  video: VideoState;
  user: UserState;
  ui: UIState;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;
}

export interface VideoState {
  currentVideo: Video | null;
  videoList: Video[];
  recommendedVideos: Video[];
  hotVideos: Video[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
}

export interface UserState {
  profile: User | null;
  watchHistory: Video[];
  favorites: Video[];
  uploads: Video[];
  following: User[];
  followers: User[];
  loading: boolean;
  error: string | null;
}

export interface UIState {
  theme: 'light' | 'dark' | 'auto';
  sidebar: {
    collapsed: boolean;
  };
  player: {
    volume: number;
    playbackRate: number;
    quality: string;
    danmakuVisible: boolean;
    fullscreen: boolean;
  };
  modal: {
    visible: boolean;
    type: 'login' | 'register' | 'upload' | 'profile' | null;
  };
  loading: {
    global: boolean;
  };
  toast: {
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  };
}

// ============ 路由类型 ============

export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  exact?: boolean;
  private?: boolean;
  meta?: {
    title: string;
    description?: string;
    keywords?: string[];
  };
}

// ============ 工具类型 ============

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type WithId<T> = T & { id: string };

export type WithTimestamp<T> = T & {
  createdAt: string;
  updatedAt: string;
};

// ============ 事件类型 ============

export interface VideoPlayerEvent {
  type: 'play' | 'pause' | 'ended' | 'timeupdate' | 'volumechange';
  currentTime?: number;
  duration?: number;
  volume?: number;
}

export interface DanmakuEvent {
  type: 'send' | 'receive';
  danmaku: Danmaku;
}

// ============ 配置类型 ============

export interface AppConfig {
  apiBaseUrl: string;
  cdnUrl: string;
  uploadUrl: string;
  maxFileSize: number;
  supportedVideoFormats: string[];
  defaultPageSize: number;
  danmakuConfig: {
    maxLength: number;
    speed: number;
    opacity: number;
    fontSize: number;
  };
}

// ============ 主题类型 ============

export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    text: {
      primary: string;
      secondary: string;
      disabled: string;
    };
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
  };
  breakpoints: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

// ============ 导出所有类型 ============

// 所有类型都在这个文件中统一定义和导出
// 其他分类文件（api.ts, components.ts, store.ts）主要用于组织代码结构