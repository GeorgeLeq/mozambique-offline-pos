/**
 * @file useVirtualList.ts
 * @description Highly optimized custom React hook for windowing / virtualization.
 * Eliminates DOM bloat on massive inventory tables, sales histories, and audit logs.
 */

import { useState, useEffect, useMemo, RefObject, useRef } from 'react';

interface UseVirtualListOptions {
  itemHeight: number; // Fixed height of each row in pixels
  overscan?: number;  // Extra items to render above & below viewport to avoid white flashing
}

interface VirtualItem<T> {
  data: T;
  index: number;
  style: {
    position: 'absolute';
    transform: string;
    left: 0;
    right: 0;
    height: number;
    willChange: 'transform';
  };
}

export function useVirtualList<T>(
  items: T[],
  containerRef: RefObject<HTMLElement | null>,
  options: UseVirtualListOptions
) {
  const { itemHeight, overscan = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const scrollRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Track initial and subsequent scroll container heights
    setContainerHeight(container.clientHeight);
    setScrollTop(container.scrollTop);
    scrollRef.current = container.scrollTop;

    let animationFrameId: number;

    const handleScroll = () => {
      // Use requestAnimationFrame to throttle state updates to match screen refreshes
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        if (container) {
          const currentScrollTop = container.scrollTop;
          // Only update state if it actually changed
          if (scrollRef.current !== currentScrollTop) {
            scrollRef.current = currentScrollTop;
            setScrollTop(currentScrollTop);
          }
        }
      });
    };

    const handleResize = () => {
      if (container) {
        setContainerHeight(container.clientHeight);
      }
    };

    // Passive listener allows the browser to perform touch/scroll gestures instantly
    // without waiting for the JS event thread, critical for buttery smoothness
    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    // ResizeObserver for dynamic container height changes (e.g. screen collapse)
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height || container.clientHeight);
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [containerRef]);

  // Calculate virtualized layout range
  const { virtualItems, totalHeight } = useMemo(() => {
    const totalCount = items.length;
    const totalHeight = totalCount * itemHeight;

    if (containerHeight === 0) {
      // Return initial subset if container is not measured yet
      const initialItems: VirtualItem<T>[] = items.slice(0, 15).map((data, index) => ({
        data,
        index,
        style: {
          position: 'absolute',
          transform: `translate3d(0, ${index * itemHeight}px, 0)`, // GPU acceleration
          left: 0,
          right: 0,
          height: itemHeight,
          willChange: 'transform',
        },
      }));
      return { virtualItems: initialItems, totalHeight };
    }

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(totalCount, Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan);

    const virtualItems: VirtualItem<T>[] = [];
    for (let i = startIndex; i < endIndex; i++) {
      virtualItems.push({
        data: items[i],
        index: i,
        style: {
          position: 'absolute',
          transform: `translate3d(0, ${i * itemHeight}px, 0)`, // GPU hardware acceleration (composite layers)
          left: 0,
          right: 0,
          height: itemHeight,
          willChange: 'transform',
        },
      });
    }

    return { virtualItems, totalHeight };
  }, [items, scrollTop, containerHeight, itemHeight, overscan]);

  return {
    virtualItems,
    totalHeight,
  };
}
