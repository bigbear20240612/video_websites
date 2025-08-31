/*
 * 大雄视频平台 - 弹幕系统组件
 * 实现弹幕显示、发送、过滤等功能
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';

// ============ 类型定义 ============

interface DanmakuItem {
  id: string;
  text: string;
  time: number;
  color: string;
  position: 'scroll' | 'top' | 'bottom';
  author: string;
  size?: 'small' | 'medium' | 'large';
  speed?: number;
}

interface DanmakuSystemProps {
  videoCurrentTime: number;
  danmakuList: DanmakuItem[];
  visible: boolean;
  opacity: number;
  fontSize: number;
  speed: number;
  onSendDanmaku: (danmaku: Omit<DanmakuItem, 'id'>) => void;
  className?: string;
}

interface DanmakuInputProps {
  onSend: (text: string, color: string, position: 'scroll' | 'top' | 'bottom') => void;
  visible: boolean;
}

// ============ 动画定义 ============

const scrollAnimation = keyframes`
  from {
    transform: translateX(100vw);
  }
  to {
    transform: translateX(-100%);
  }
`;

const fadeInOut = keyframes`
  0% { opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { opacity: 0; }
`;

// ============ 样式定义 ============

const DanmakuContainer = styled.div<{ $visible: boolean; $opacity: number }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
  opacity: ${props => props.$visible ? props.$opacity : 0};
  transition: opacity var(--duration-base) var(--ease-out);
  z-index: 10;
`;

const DanmakuText = styled.div<{
  $color: string;
  $fontSize: number;
  $position: 'scroll' | 'top' | 'bottom';
  $speed: number;
  $lane?: number;
}>`
  position: absolute;
  color: ${props => props.$color};
  font-size: ${props => props.$fontSize}px;
  font-weight: var(--font-weight-bold);
  text-shadow: 
    -1px -1px 1px rgba(0, 0, 0, 0.8),
    1px -1px 1px rgba(0, 0, 0, 0.8),
    -1px 1px 1px rgba(0, 0, 0, 0.8),
    1px 1px 1px rgba(0, 0, 0, 0.8),
    0 0 3px rgba(0, 0, 0, 0.9);
  white-space: nowrap;
  user-select: none;
  z-index: 1;
  line-height: 1.2;
  font-family: var(--font-family);

  ${props => {
    switch (props.$position) {
      case 'scroll':
        return css`
          top: ${(props.$lane || 0) * (props.$fontSize + 6)}px;
          animation: ${scrollAnimation} ${props.$speed}s linear;
        `;
      case 'top':
        return css`
          top: ${(props.$lane || 0) * (props.$fontSize + 4)}px;
          left: 50%;
          transform: translateX(-50%);
          animation: ${fadeInOut} 4s ease-in-out;
        `;
      case 'bottom':
        return css`
          bottom: ${(props.$lane || 0) * (props.$fontSize + 4)}px;
          left: 50%;
          transform: translateX(-50%);
          animation: ${fadeInOut} 4s ease-in-out;
        `;
      default:
        return '';
    }
  }}

  &:hover {
    text-shadow: 
      -1px -1px 2px rgba(0, 0, 0, 1),
      1px -1px 2px rgba(0, 0, 0, 1),
      -1px 1px 2px rgba(0, 0, 0, 1),
      1px 1px 2px rgba(0, 0, 0, 1),
      0 0 6px rgba(0, 0, 0, 1);
    transform: scale(1.05);
    z-index: 10;
  }
`;

const DanmakuInputContainer = styled.div<{ $visible: boolean }>`
  position: absolute;
  bottom: 80px;
  left: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  border-radius: var(--border-radius-lg);
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  opacity: ${props => props.$visible ? 1 : 0};
  transform: translateY(${props => props.$visible ? 0 : 20}px);
  transition: all var(--duration-base) var(--ease-out);
  pointer-events: ${props => props.$visible ? 'auto' : 'none'};
  z-index: 100;
`;

const InputRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-sm);
`;

const DanmakuInput = styled.input`
  flex: 1;
  padding: var(--space-sm) var(--space-md);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--border-radius-base);
  color: white;
  font-size: var(--font-size-base);
  outline: none;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
  
  &:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }
`;

const ColorPicker = styled.div`
  display: flex;
  gap: var(--space-xs);
`;

const ColorButton = styled.button<{ $color: string; $active: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid ${props => props.$active ? 'white' : 'transparent'};
  background: ${props => props.$color};
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-out);
  
  &:hover {
    transform: scale(1.2);
    border-color: white;
  }
`;

const PositionSelector = styled.select`
  padding: var(--space-xs) var(--space-sm);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--border-radius-sm);
  color: white;
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

const SendButton = styled.button`
  padding: var(--space-sm) var(--space-md);
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--border-radius-base);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-out);
  
  &:hover {
    background: var(--primary-hover);
    transform: translateY(-1px);
  }
  
  &:disabled {
    background: rgba(255, 255, 255, 0.2);
    cursor: not-allowed;
    transform: none;
  }
`;

const OptionsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
`;

const InputLabel = styled.label`
  color: rgba(255, 255, 255, 0.8);
  font-size: var(--font-size-xs);
  white-space: nowrap;
`;

// ============ 弹幕输入组件 ============

const DanmakuInputComponent: React.FC<DanmakuInputProps> = ({ onSend, visible }) => {
  const [text, setText] = useState('');
  const [color, setColor] = useState('#ffffff');
  const [position, setPosition] = useState<'scroll' | 'top' | 'bottom'>('scroll');

  const colors = [
    '#ffffff', '#ff0000', '#00ff00', '#0000ff', 
    '#ffff00', '#ff00ff', '#00ffff', '#ffa500',
    '#ff69b4', '#9370db', '#32cd32', '#ffd700'
  ];

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim(), color, position);
      setText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <DanmakuInputContainer $visible={visible}>
      <InputRow>
        <DanmakuInput
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="发个弹幕见证当下"
          maxLength={100}
        />
        <SendButton onClick={handleSend} disabled={!text.trim()}>
          发送
        </SendButton>
      </InputRow>
      
      <OptionsRow>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <InputLabel>颜色:</InputLabel>
          <ColorPicker>
            {colors.map((colorOption) => (
              <ColorButton
                key={colorOption}
                $color={colorOption}
                $active={color === colorOption}
                onClick={() => setColor(colorOption)}
                title={colorOption === '#ffffff' ? '白色' : colorOption}
              />
            ))}
          </ColorPicker>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <InputLabel>位置:</InputLabel>
          <PositionSelector
            value={position}
            onChange={(e) => setPosition(e.target.value as 'scroll' | 'top' | 'bottom')}
          >
            <option value="scroll">滚动</option>
            <option value="top">顶部</option>
            <option value="bottom">底部</option>
          </PositionSelector>
        </div>
      </OptionsRow>
    </DanmakuInputContainer>
  );
};

// ============ 弹幕系统主组件 ============

const DanmakuSystem: React.FC<DanmakuSystemProps> = ({
  videoCurrentTime,
  danmakuList,
  visible,
  opacity,
  fontSize,
  speed,
  onSendDanmaku,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayedDanmakus, setDisplayedDanmakus] = useState<(DanmakuItem & { lane: number; key: string })[]>([]);
  const [showInput, setShowInput] = useState(false);
  const laneManagerRef = useRef({
    scroll: [] as boolean[],
    top: [] as boolean[],
    bottom: [] as boolean[]
  });

  // 分配弹幕轨道
  const allocateLane = useCallback((position: 'scroll' | 'top' | 'bottom', duration: number = 8) => {
    const lanes = laneManagerRef.current[position];
    const maxLanes = position === 'scroll' ? 15 : 5;
    
    // 找到空闲轨道
    for (let i = 0; i < maxLanes; i++) {
      if (!lanes[i]) {
        lanes[i] = true;
        
        // 设置定时器释放轨道
        setTimeout(() => {
          lanes[i] = false;
        }, duration * 1000);
        
        return i;
      }
    }
    
    // 如果没有空闲轨道，使用随机轨道
    const randomLane = Math.floor(Math.random() * maxLanes);
    return randomLane;
  }, []);

  // 显示弹幕
  useEffect(() => {
    const currentDanmakus = danmakuList.filter(
      danmaku => Math.abs(danmaku.time - videoCurrentTime) < 0.5
    );

    currentDanmakus.forEach(danmaku => {
      const lane = allocateLane(danmaku.position, danmaku.speed || speed);
      const key = `${danmaku.id}-${Date.now()}-${Math.random()}`;
      
      setDisplayedDanmakus(prev => [
        ...prev,
        {
          ...danmaku,
          lane,
          key
        }
      ]);

      // 设置移除定时器
      const removeTimeout = danmaku.position === 'scroll' 
        ? (danmaku.speed || speed) * 1000 
        : 4000;

      setTimeout(() => {
        setDisplayedDanmakus(prev => prev.filter(item => item.key !== key));
      }, removeTimeout);
    });
  }, [videoCurrentTime, danmakuList, allocateLane, speed]);

  // 处理发送弹幕
  const handleSendDanmaku = (text: string, color: string, position: 'scroll' | 'top' | 'bottom') => {
    const newDanmaku: Omit<DanmakuItem, 'id'> = {
      text,
      color,
      position,
      time: videoCurrentTime,
      author: 'current_user',
      speed: speed
    };
    
    onSendDanmaku(newDanmaku);
    setShowInput(false);
  };

  // 键盘快捷键
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'd' && e.ctrlKey) {
        e.preventDefault();
        setShowInput(!showInput);
      }
      if (e.key === 'Escape') {
        setShowInput(false);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [showInput]);

  return (
    <>
      <DanmakuContainer 
        ref={containerRef}
        $visible={visible}
        $opacity={opacity}
        className={className}
        onDoubleClick={() => setShowInput(!showInput)}
      >
        {displayedDanmakus.map(danmaku => (
          <DanmakuText
            key={danmaku.key}
            $color={danmaku.color}
            $fontSize={fontSize}
            $position={danmaku.position}
            $speed={danmaku.speed || speed}
            $lane={danmaku.lane}
            title={`${danmaku.author}: ${danmaku.text}`}
          >
            {danmaku.text}
          </DanmakuText>
        ))}
      </DanmakuContainer>

      <DanmakuInputComponent
        visible={showInput}
        onSend={handleSendDanmaku}
      />
    </>
  );
};

export default DanmakuSystem;