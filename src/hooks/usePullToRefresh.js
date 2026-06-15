import { useEffect, useRef, useState } from 'react';

export const usePullToRefresh = (onRefresh, threshold = 100) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let touchStartY = 0;

    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
      startYRef.current = 0;
    };

    const handleTouchMove = (e) => {
      if (container.scrollTop > 0) return;

      const touchCurrentY = e.touches[0].clientY;
      const diff = touchCurrentY - touchStartY;

      if (diff > 0) {
        startYRef.current = diff;
        if (diff > threshold && !isRefreshing) {
          setIsRefreshing(true);
        }
      }
    };

    const handleTouchEnd = async () => {
      if (isRefreshing) {
        await onRefresh();
        setIsRefreshing(false);
      }
      startYRef.current = 0;
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isRefreshing, onRefresh, threshold]);

  return { containerRef, isRefreshing, pullDistance: startYRef.current };
};