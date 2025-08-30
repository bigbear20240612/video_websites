/*
 * 大雄视频平台 - 视频播放器组件
 * 自定义视频播放器，支持弹幕、多清晰度、倍速播放等功能
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useTheme } from '../../contexts/ThemeContext';
import { mediaQuery } from '../../utils/responsive';
import DanmakuSystem from './DanmakuSystem';

// ============ 类型定义 ============

interface VideoPlayerProps {
  video: {
    id: string;
    title: string;
    url: string;
    duration: number;
    qualities: VideoQuality[];
  };
  danmakuEnabled?: boolean;
  onTimeUpdate?: (currentTime: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  className?: string;
}

interface VideoQuality {
  quality: string;
  url: string;
  size: number;
}

// ============ 样式定义 ============

const PlayerContainer = styled.div`
  position: relative;
  width: 100%;
  background: #000;
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  aspect-ratio: 16/9;
`;

const VideoElement = styled.video`
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
`;

const PlayerOverlay = styled.div<{ $visible?: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    transparent 60%,
    rgba(0, 0, 0, 0.8) 100%
  );
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity var(--duration-base) var(--ease-out);
  pointer-events: ${props => props.$visible ? 'auto' : 'none'};
`;

const ControlsContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
`;

const ProgressContainer = styled.div`
  position: relative;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  cursor: pointer;
  
  &:hover {
    height: 6px;
    transform: translateY(-1px);
  }
  
  &:hover .progress-preview {
    opacity: 1;
    visibility: visible;
  }
  
  transition: all var(--duration-base) var(--ease-out);
`;

const ProgressBar = styled.div<{ $progress: number }>`
  height: 100%;
  background: var(--primary-color);
  border-radius: 2px;
  width: ${props => props.$progress}%;
  transition: width 0.1s linear;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    right: -6px;
    top: 50%;
    transform: translateY(-50%);
    width: 12px;
    height: 12px;
    background: var(--primary-color);
    border-radius: 50%;
    opacity: 0;
    transition: opacity var(--duration-base) var(--ease-out);
  }
  
  ${ProgressContainer}:hover &::after {
    opacity: 1;
  }
`;

const BufferedBar = styled.div<{ $buffered: number }>`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 2px;
  width: ${props => props.$buffered}%;
  transition: width 0.3s ease;
`;

const ControlsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
`;

const ControlsLeft = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-sm);
`;

const ControlsRight = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-sm);
`;

const ControlButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  color: white;
  font-size: 18px;
  border-radius: var(--border-radius-base);
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-out);
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const PlayButton = styled(ControlButton)`
  width: 48px;
  height: 48px;
  font-size: 24px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.5);
  }
`;

const TimeDisplay = styled.div`
  color: white;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  user-select: none;
`;

const VolumeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-xs);
`;

const VolumeSlider = styled.input`
  width: 80px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
  
  &::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    background: var(--primary-color);
    border-radius: 50%;
    cursor: pointer;
  }
  
  &::-moz-range-thumb {
    width: 12px;
    height: 12px;
    background: var(--primary-color);
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }
`;

const QualitySelector = styled.select`
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--border-radius-sm);
  padding: var(--space-xs);
  font-size: var(--font-size-sm);
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
  
  option {
    background: #000;
    color: white;
  }
`;

const SpeedSelector = styled(QualitySelector)``;

const CenterPlayButton = styled.button`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  background: rgba(0, 0, 0, 0.8);
  border: 3px solid rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  color: white;
  font-size: 32px;
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-out);
  backdrop-filter: blur(8px);
  
  &:hover {
    transform: translate(-50%, -50%) scale(1.1);
    background: rgba(0, 0, 0, 0.9);
    border-color: var(--primary-color);
    box-shadow: 0 0 20px rgba(24, 144, 255, 0.3);
  }
  
  &:active {
    transform: translate(-50%, -50%) scale(0.95);
  }
  
  &::before {
    content: '▶';
    margin-left: 4px;
  }
`;

const LoadingSpinner = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    from { transform: translate(-50%, -50%) rotate(0deg); }
    to { transform: translate(-50%, -50%) rotate(360deg); }
  }
`;

const ProgressPreview = styled.div<{ $position: number }>`
  position: absolute;
  bottom: 10px;
  left: ${props => props.$position}%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  pointer-events: none;
  z-index: 10;
`;

const QualityBadge = styled.div<{ $active?: boolean }>`
  position: absolute;
  top: 12px;
  right: 12px;
  background: ${props => props.$active ? 'var(--primary-color)' : 'rgba(0, 0, 0, 0.7)'};
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
`;

// ============ 工具函数 ============

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

// ============ 组件实现 ============

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  danmakuEnabled = false,
  onTimeUpdate,
  onPlay,
  onPause,
  onEnded,
  className
}) => {
  const { actualTheme } = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [quality, setQuality] = useState('720p');
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPosition, setPreviewPosition] = useState(0);
  const [danmakuList, setDanmakuList] = useState<any[]>([]);
  const [showDanmakuInput, setShowDanmakuInput] = useState(false);

  let hideControlsTimer = useRef<NodeJS.Timeout>();

  // 处理播放/暂停
  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  // 处理进度条点击
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    videoRef.current.currentTime = newTime;
  };

  // 处理进度条悬停预览
  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const hoverTime = (hoverX / rect.width) * duration;
    const position = (hoverX / rect.width) * 100;
    
    setPreviewTime(hoverTime);
    setPreviewPosition(Math.min(95, Math.max(5, position)));
    setShowPreview(true);
  };

  const handleProgressLeave = () => {
    setShowPreview(false);
  };

  // 处理弹幕发送
  const handleSendDanmaku = (danmaku: any) => {
    const newDanmaku = {
      ...danmaku,
      id: `danmaku-${Date.now()}-${Math.random()}`,
      time: currentTime
    };
    
    setDanmakuList(prev => [...prev, newDanmaku]);
    console.log('发送弹幕:', newDanmaku);
  };

  // 处理音量变化
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  // 切换静音
  const toggleMute = () => {
    if (!videoRef.current) return;
    
    setIsMuted(!isMuted);
    videoRef.current.muted = !isMuted;
  };

  // 切换全屏
  const toggleFullscreen = () => {
    const videoContainer = videoRef.current?.parentElement;
    if (!document.fullscreenElement) {
      if (videoContainer?.requestFullscreen) {
        videoContainer.requestFullscreen();
      } else if (videoRef.current?.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // 显示/隐藏控制栏
  const showControlsTemporary = () => {
    setShowControls(true);
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
    
    if (isPlaying) {
      hideControlsTimer.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  // 视频事件处理
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onTimeUpdate?.(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const bufferedPercent = (bufferedEnd / video.duration) * 100;
        setBuffered(bufferedPercent);
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('progress', handleProgress);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('progress', handleProgress);
    };
  }, [onPlay, onPause, onTimeUpdate, onEnded]);

  // 键盘控制
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target !== document.body) return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime -= 10;
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime += 10;
          }
          break;
        case 'KeyM':
          toggleMute();
          break;
        case 'KeyF':
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <PlayerContainer 
      className={className}
      onMouseMove={showControlsTemporary}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <VideoElement
        ref={videoRef}
        src={video.url}
        poster={`https://picsum.photos/800/450?random=${video.id}`}
        preload="metadata"
      />

      <QualityBadge $active={true}>
        {quality}
      </QualityBadge>
      
      {danmakuEnabled && (
        <DanmakuSystem
          videoCurrentTime={currentTime}
          danmakuList={danmakuList}
          visible={danmakuEnabled}
          opacity={0.8}
          fontSize={16}
          speed={8}
          onSendDanmaku={handleSendDanmaku}
        />
      )}

      {!isPlaying && !isLoading && (
        <CenterPlayButton onClick={togglePlayPause} />
      )}

      {isLoading && <LoadingSpinner />}

      <PlayerOverlay $visible={showControls}>
        <ControlsContainer>
          <ProgressContainer 
            onClick={handleProgressClick}
            onMouseMove={handleProgressHover}
            onMouseLeave={handleProgressLeave}
          >
            <BufferedBar $buffered={buffered} />
            <ProgressBar $progress={progress} />
            {showPreview && (
              <ProgressPreview 
                className="progress-preview"
                $position={previewPosition}
              >
                {formatTime(previewTime)}
              </ProgressPreview>
            )}
          </ProgressContainer>

          <ControlsRow>
            <ControlsLeft>
              <PlayButton onClick={togglePlayPause}>
                {isPlaying ? '⏸' : '▶'}
              </PlayButton>
              
              <TimeDisplay>
                {formatTime(currentTime)} / {formatTime(duration)}
              </TimeDisplay>
            </ControlsLeft>

            <ControlsRight>
              <VolumeContainer>
                <ControlButton onClick={toggleMute}>
                  {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
                </ControlButton>
                <VolumeSlider
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                />
              </VolumeContainer>

              <SpeedSelector
                value={playbackRate}
                onChange={(e) => {
                  const rate = parseFloat(e.target.value);
                  setPlaybackRate(rate);
                  if (videoRef.current) {
                    videoRef.current.playbackRate = rate;
                  }
                }}
              >
                <option value="0.5">0.5x</option>
                <option value="0.75">0.75x</option>
                <option value="1">1x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </SpeedSelector>

              {video.qualities.length > 0 && (
                <QualitySelector
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                >
                  {video.qualities.map((q) => (
                    <option key={q.quality} value={q.quality}>
                      {q.quality}
                    </option>
                  ))}
                </QualitySelector>
              )}

              <ControlButton onClick={toggleFullscreen}>
                {isFullscreen ? '⛶' : '⛶'}
              </ControlButton>
            </ControlsRight>
          </ControlsRow>
        </ControlsContainer>
      </PlayerOverlay>
    </PlayerContainer>
  );
};

export default VideoPlayer;