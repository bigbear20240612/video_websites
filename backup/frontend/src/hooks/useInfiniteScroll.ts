/*
 * 大雄视频平台 - 无限滚动Hook
 * 用于实现视频列表的无限加载功能
 */

import { useEffect, useCallback, useState } from 'react';

interface UseInfiniteScrollOptions {
  hasMore: boolean;
  loading: boolean;
  threshold?: number;
}

interface UseInfiniteScrollReturn {
  isFetching: boolean;
  setIsFetching: (isFetching: boolean) => void;
}

const useInfiniteScroll = (
  callback: () => void,
  options: UseInfiniteScrollOptions
): UseInfiniteScrollReturn => {
  const [isFetching, setIsFetching] = useState(false);
  
  const { hasMore, loading, threshold = 300 } = options;

  useEffect(() => {
    if (!isFetching || !hasMore || loading) return;
    
    const fetchData = async () => {
      await callback();
      setIsFetching(false);
    };
    
    fetchData();
  }, [isFetching, callback, hasMore, loading]);

  const handleScroll = useCallback(() => {
    if (loading || !hasMore) return;
    
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
    const clientHeight = document.documentElement.clientHeight || window.innerHeight;
    
    // 当距离底部小于阈值时触发加载
    if (scrollHeight - scrollTop <= clientHeight + threshold) {
      setIsFetching(true);
    }
  }, [loading, hasMore, threshold]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return { isFetching, setIsFetching };
};

export default useInfiniteScroll;