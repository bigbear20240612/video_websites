/*
 * 大雄视频平台 - 美观搜索框组件
 * 现代化设计的搜索输入框，支持建议和快捷操作
 */

import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

// ============ 类型定义 ============

interface SearchBoxProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  suggestions?: string[];
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'filled' | 'outlined';
  showMic?: boolean;
  showFilters?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
}

// ============ 样式定义 ============

const SearchContainer = styled.div<{ 
  $size: string; 
  $variant: string; 
  $focused: boolean; 
  $disabled: boolean;
}>`
  position: relative;
  width: 100%;
  max-width: ${props => {
    switch (props.$size) {
      case 'small': return '300px';
      case 'large': return '600px';
      default: return '450px';
    }
  }};
`;

const SearchInputWrapper = styled.div<{ 
  $size: string; 
  $variant: string; 
  $focused: boolean; 
  $disabled: boolean;
}>`
  position: relative;
  display: flex;
  align-items: center;
  background: ${props => {
    switch (props.$variant) {
      case 'filled': return 'var(--background-secondary)';
      case 'outlined': return 'transparent';
      default: return 'var(--background-primary)';
    }
  }};
  border: ${props => {
    if (props.$variant === 'outlined') {
      return props.$focused ? '2px solid var(--primary-color)' : '2px solid var(--border-color)';
    }
    return props.$focused ? '2px solid var(--primary-color)' : '1px solid var(--border-light)';
  }};
  border-radius: ${props => {
    switch (props.$size) {
      case 'small': return '20px';
      case 'large': return '28px';
      default: return '24px';
    }
  }};
  padding: ${props => {
    switch (props.$size) {
      case 'small': return '8px 16px';
      case 'large': return '16px 24px';
      default: return '12px 20px';
    }
  }};
  transition: all 0.2s ease;
  box-shadow: ${props => {
    if (props.$variant === 'outlined') {
      return props.$focused ? '0 4px 20px rgba(24, 144, 255, 0.15)' : '0 2px 8px rgba(0, 0, 0, 0.05)';
    }
    return props.$focused ? '0 4px 20px rgba(24, 144, 255, 0.15)' : '0 2px 8px rgba(0, 0, 0, 0.05)';
  }};
  opacity: ${props => props.$disabled ? 0.6 : 1};
  cursor: ${props => props.$disabled ? 'not-allowed' : 'text'};
  
  &:hover:not(:focus-within) {
    border-color: ${props => props.$disabled ? 'var(--border-light)' : 'var(--border-color)'};
    box-shadow: ${props => props.$disabled ? '0 2px 8px rgba(0, 0, 0, 0.05)' : '0 6px 24px rgba(0, 0, 0, 0.08)'};
  }
`;

const SearchIcon = styled.div<{ $size: string; $clickable?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${props => {
    switch (props.$size) {
      case 'small': return '20px';
      case 'large': return '24px';
      default: return '22px';
    }
  }};
  height: ${props => {
    switch (props.$size) {
      case 'small': return '20px';
      case 'large': return '24px';
      default: return '22px';
    }
  }};
  color: var(--text-tertiary);
  flex-shrink: 0;
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  transition: all 0.2s ease;
  border-radius: 50%;
  font-size: ${props => {
    switch (props.$size) {
      case 'small': return '16px';
      case 'large': return '20px';
      default: return '18px';
    }
  }};
  
  &:hover {
    color: ${props => props.$clickable ? 'var(--primary-color)' : 'var(--text-tertiary)'};
    background: ${props => props.$clickable ? 'rgba(24, 144, 255, 0.1)' : 'transparent'};
  }

  &::before {
    content: '🔍';
  }
`;

const SearchInput = styled.input<{ $size: string }>`
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text-primary);
  font-size: ${props => {
    switch (props.$size) {
      case 'small': return 'var(--font-size-sm)';
      case 'large': return 'var(--font-size-lg)';
      default: return 'var(--font-size-base)';
    }
  }};
  font-family: inherit;
  font-weight: var(--font-weight-normal);
  margin: 0 var(--space-sm);
  
  &::placeholder {
    color: var(--text-tertiary);
    font-weight: var(--font-weight-normal);
  }
  
  &:disabled {
    cursor: not-allowed;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-left: var(--space-xs);
`;

const ActionButton = styled.button<{ $size: string; $variant?: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${props => {
    switch (props.$size) {
      case 'small': return '28px';
      case 'large': return '36px';
      default: return '32px';
    }
  }};
  height: ${props => {
    switch (props.$size) {
      case 'small': return '28px';
      case 'large': return '36px';
      default: return '32px';
    }
  }};
  border: none;
  border-radius: 50%;
  background: ${props => {
    switch (props.$variant) {
      case 'primary': return 'var(--primary-color)';
      case 'danger': return 'var(--error-color)';
      default: return 'transparent';
    }
  }};
  color: ${props => {
    switch (props.$variant) {
      case 'primary': case 'danger': return 'var(--text-inverse)';
      default: return 'var(--text-tertiary)';
    }
  }};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: ${props => {
    switch (props.$size) {
      case 'small': return '14px';
      case 'large': return '18px';
      default: return '16px';
    }
  }};
  
  &:hover {
    background: ${props => {
      switch (props.$variant) {
        case 'primary': return 'var(--primary-hover)';
        case 'danger': return 'var(--error-hover)';
        default: return 'rgba(24, 144, 255, 0.1)';
      }
    }};
    color: ${props => {
      switch (props.$variant) {
        case 'primary': case 'danger': return 'var(--text-inverse)';
        default: return 'var(--primary-color)';
      }
    }};
    transform: scale(1.05);
  }
  
  &:active {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ClearButton = styled(ActionButton)`
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  
  ${SearchInputWrapper}:hover &,
  ${SearchInputWrapper}:focus-within & {
    opacity: 1;
    visibility: visible;
  }
`;

const SubmitButton = styled(ActionButton)<{ $visible: boolean }>`
  transform: ${props => props.$visible ? 'scale(1)' : 'scale(0)'};
  opacity: ${props => props.$visible ? 1 : 0};
  visibility: ${props => props.$visible ? 'visible' : 'hidden'};
  transition: all 0.2s ease;
`;

const SuggestionsDropdown = styled.div<{ $visible: boolean; $size: string }>`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: var(--background-primary);
  border: 1px solid var(--border-light);
  border-radius: ${props => {
    switch (props.$size) {
      case 'small': return 'var(--border-radius-base)';
      case 'large': return 'var(--border-radius-lg)';
      default: return 'var(--border-radius-lg)';
    }
  }};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
  opacity: ${props => props.$visible ? 1 : 0};
  visibility: ${props => props.$visible ? 'visible' : 'hidden'};
  transform: ${props => props.$visible ? 'translateY(0)' : 'translateY(-10px)'};
  transition: all 0.2s ease;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: var(--background-secondary);
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 3px;
  }
`;

const SuggestionItem = styled.div<{ $highlighted: boolean }>`
  padding: var(--space-md) var(--space-lg);
  cursor: pointer;
  background: ${props => props.$highlighted ? 'var(--background-secondary)' : 'transparent'};
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  transition: all 0.1s ease;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: var(--primary-color);
    color: var(--text-inverse);
  }

  &::before {
    content: '🔍';
    opacity: 0.6;
    font-size: 14px;
  }
`;

// ============ 组件实现 ============

const SearchBox: React.FC<SearchBoxProps> = ({
  placeholder = "搜索...",
  value: controlledValue,
  onChange,
  onSubmit,
  onFocus,
  onBlur,
  suggestions = [],
  size = 'medium',
  variant = 'default',
  showMic = false,
  showFilters = false,
  autoFocus = false,
  disabled = false,
  className
}) => {
  const [internalValue, setInternalValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const hasValue = value && value.length > 0;
  
  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    if (onChange) {
      onChange(newValue);
    }
    
    // 实时显示建议：当输入内容时显示匹配的建议
    const filteredSuggestions = suggestions.filter(suggestion => 
      suggestion.toLowerCase().includes(newValue.toLowerCase())
    );
    setShowSuggestions(newValue.length > 0 && filteredSuggestions.length > 0);
    setHighlightedIndex(-1);
  };
  
  // 处理提交
  const handleSubmit = () => {
    if (value && value.trim()) {
      if (onSubmit) {
        onSubmit(value.trim());
      }
      setShowSuggestions(false);
    }
  };
  
  // 处理清空
  const handleClear = () => {
    if (controlledValue === undefined) {
      setInternalValue('');
    }
    if (onChange) {
      onChange('');
    }
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // 处理焦点
  const handleFocus = () => {
    setFocused(true);
    if (onFocus) {
      onFocus();
    }
    if (suggestions.length > 0 && value && value.length > 0) {
      setShowSuggestions(true);
    }
  };
  
  const handleBlur = () => {
    setFocused(false);
    if (onBlur) {
      onBlur();
    }
    // 延迟隐藏建议，让点击建议有时间执行
    setTimeout(() => setShowSuggestions(false), 150);
  };
  
  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && suggestions.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0) {
            const selectedSuggestion = suggestions[highlightedIndex];
            if (controlledValue === undefined) {
              setInternalValue(selectedSuggestion);
            }
            if (onChange) {
              onChange(selectedSuggestion);
            }
            if (onSubmit) {
              onSubmit(selectedSuggestion);
            }
          } else {
            handleSubmit();
          }
          setShowSuggestions(false);
          break;
        case 'Escape':
          setShowSuggestions(false);
          if (inputRef.current) {
            inputRef.current.blur();
          }
          break;
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  // 处理建议点击
  const handleSuggestionClick = (suggestion: string) => {
    if (controlledValue === undefined) {
      setInternalValue(suggestion);
    }
    if (onChange) {
      onChange(suggestion);
    }
    if (onSubmit) {
      onSubmit(suggestion);
    }
    setShowSuggestions(false);
  };
  
  // 点击外部关闭建议
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // 自动聚焦
  useEffect(() => {
    if (autoFocus && inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [autoFocus, disabled]);
  
  return (
    <SearchContainer
      ref={containerRef}
      $size={size}
      $variant={variant}
      $focused={focused}
      $disabled={disabled}
      className={className}
    >
      <SearchInputWrapper
        $size={size}
        $variant={variant}
        $focused={focused}
        $disabled={disabled}
      >
        <SearchIcon $size={size} />
        
        <SearchInput
          ref={inputRef}
          $size={size}
          type="text"
          value={value || ''}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
        />
        
        <ActionButtons>
          {hasValue && (
            <ClearButton
              $size={size}
              onClick={handleClear}
              title="清空"
              disabled={disabled}
            >
              ×
            </ClearButton>
          )}
          
          {showMic && (
            <ActionButton
              $size={size}
              title="语音搜索"
              disabled={disabled}
            >
              🎤
            </ActionButton>
          )}
          
          {showFilters && (
            <ActionButton
              $size={size}
              title="筛选"
              disabled={disabled}
            >
              ⚙️
            </ActionButton>
          )}
          
          <SubmitButton
            $size={size}
            $variant="primary"
            $visible={hasValue || false}
            onClick={handleSubmit}
            title="搜索"
            disabled={disabled}
          >
            →
          </SubmitButton>
        </ActionButtons>
      </SearchInputWrapper>
      
      <SuggestionsDropdown
        $visible={showSuggestions}
        $size={size}
      >
        {suggestions
          .filter(suggestion => 
            suggestion.toLowerCase().includes((value || '').toLowerCase())
          )
          .map((suggestion, index) => (
            <SuggestionItem
              key={index}
              $highlighted={index === highlightedIndex}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </SuggestionItem>
          ))}
      </SuggestionsDropdown>
    </SearchContainer>
  );
};

export default SearchBox;