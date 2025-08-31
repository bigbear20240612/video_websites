/*
 * 大雄视频平台 - 搜索建议组件
 * 提供搜索自动补全和历史记录功能
 */

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

// ============ 样式定义 ============

const SuggestionsContainer = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--background-primary);
  border: 1px solid var(--border-light);
  border-top: none;
  border-radius: 0 0 var(--border-radius-lg) var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
  backdrop-filter: blur(8px);
`;

const SuggestionSection = styled.div`
  padding: var(--space-sm) 0;
  
  &:not(:last-child) {
    border-bottom: 1px solid var(--border-light);
  }
`;

const SectionTitle = styled.div`
  padding: var(--space-xs) var(--space-md);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SuggestionItem = styled.div<{ $active?: boolean }>`
  padding: var(--space-sm) var(--space-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  transition: all var(--duration-base) var(--ease-out);
  background: ${props => props.$active ? 'var(--background-secondary)' : 'transparent'};
  
  &:hover {
    background: var(--background-secondary);
    color: var(--primary-color);
  }
`;

const SuggestionIcon = styled.span`
  font-size: 14px;
  color: var(--text-tertiary);
  width: 16px;
  text-align: center;
`;

const SuggestionText = styled.span`
  flex: 1;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
`;

const SuggestionCount = styled.span`
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
`;

const HighlightText = styled.span`
  color: var(--primary-color);
  font-weight: var(--font-weight-medium);
`;

const ClearHistoryButton = styled.button`
  padding: var(--space-xs) var(--space-md);
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  font-size: var(--font-size-xs);
  cursor: pointer;
  transition: color var(--duration-base) var(--ease-out);
  
  &:hover {
    color: var(--text-secondary);
  }
`;

// ============ 接口定义 ============

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'history' | 'suggestion' | 'hot';
  count?: number;
}

interface SearchSuggestionsProps {
  query: string;
  suggestions: SearchSuggestion[];
  searchHistory: string[];
  hotSearches: string[];
  visible: boolean;
  onSelect: (suggestion: string) => void;
  onClearHistory: () => void;
  activeIndex?: number;
  className?: string;
}

// ============ 工具函数 ============

const highlightMatch = (text: string, query: string) => {
  if (!query) return text;
  
  const regex = new RegExp(`(${query})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) =>
    regex.test(part) ? (
      <HighlightText key={index}>{part}</HighlightText>
    ) : (
      part
    )
  );
};

// ============ 组件实现 ============

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  query,
  suggestions,
  searchHistory,
  hotSearches,
  visible,
  onSelect,
  onClearHistory,
  activeIndex = -1,
  className
}) => {
  if (!visible) return null;

  const filteredHistory = query 
    ? searchHistory.filter(item => 
        item.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : searchHistory.slice(0, 5);

  const filteredSuggestions = suggestions.filter(item =>
    item.text.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8);

  const showHot = !query && hotSearches.length > 0;

  let currentIndex = 0;

  return (
    <SuggestionsContainer className={className}>
      {/* 搜索历史 */}
      {filteredHistory.length > 0 && (
        <SuggestionSection>
          <SectionTitle>
            搜索历史
            <ClearHistoryButton onClick={onClearHistory}>
              清空
            </ClearHistoryButton>
          </SectionTitle>
          {filteredHistory.map((item, index) => {
            const itemIndex = currentIndex++;
            return (
              <SuggestionItem
                key={`history-${index}`}
                $active={activeIndex === itemIndex}
                onClick={() => onSelect(item)}
              >
                <SuggestionIcon>🕐</SuggestionIcon>
                <SuggestionText>
                  {highlightMatch(item, query)}
                </SuggestionText>
              </SuggestionItem>
            );
          })}
        </SuggestionSection>
      )}

      {/* 搜索建议 */}
      {filteredSuggestions.length > 0 && (
        <SuggestionSection>
          <SectionTitle>搜索建议</SectionTitle>
          {filteredSuggestions.map((item, index) => {
            const itemIndex = currentIndex++;
            return (
              <SuggestionItem
                key={item.id}
                $active={activeIndex === itemIndex}
                onClick={() => onSelect(item.text)}
              >
                <SuggestionIcon>🔍</SuggestionIcon>
                <SuggestionText>
                  {highlightMatch(item.text, query)}
                </SuggestionText>
                {item.count && (
                  <SuggestionCount>{item.count}个视频</SuggestionCount>
                )}
              </SuggestionItem>
            );
          })}
        </SuggestionSection>
      )}

      {/* 热门搜索 */}
      {showHot && (
        <SuggestionSection>
          <SectionTitle>热门搜索</SectionTitle>
          {hotSearches.slice(0, 6).map((item, index) => {
            const itemIndex = currentIndex++;
            return (
              <SuggestionItem
                key={`hot-${index}`}
                $active={activeIndex === itemIndex}
                onClick={() => onSelect(item)}
              >
                <SuggestionIcon>🔥</SuggestionIcon>
                <SuggestionText>{item}</SuggestionText>
              </SuggestionItem>
            );
          })}
        </SuggestionSection>
      )}
    </SuggestionsContainer>
  );
};

export default SearchSuggestions;