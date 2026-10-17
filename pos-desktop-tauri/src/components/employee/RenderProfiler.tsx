import React, { Profiler, useEffect, useRef } from 'react';

interface RenderProfilerProps {
  id: string;
  children: React.ReactNode;
  monitorScroll?: boolean;
}

/**
 * RenderProfiler - A lightweight performance tracker component that measures 
 * render durations and detects scroll-induced layout thrashing or lag.
 */
export const RenderProfiler: React.FC<RenderProfilerProps> = ({ id, children, monitorScroll = false }) => {
  const renderCountRef = useRef(0);
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  const onRenderCallback = (
    profilerId: string,
    phase: 'mount' | 'update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ) => {
    renderCountRef.current += 1;
    
    // Distinct styling for mount vs update phases to keep logs extremely readable
    const phaseColor = phase === 'mount' ? '#10b981' : '#f59e0b';
    const durationColor = actualDuration > 3 ? '#ef4444' : '#10b981'; // Mark renders taking >3ms as warning (red)

    console.log(
      `%c⏱️ [Profiler: ${profilerId}] %c${phase.toUpperCase()}%c | Render #${renderCountRef.current} | Actual: %c${actualDuration.toFixed(2)}ms%c | Base: ${baseDuration.toFixed(2)}ms`,
      'color: #818cf8; font-weight: bold; font-size: 11px;',
      `color: ${phaseColor}; font-weight: bold; font-size: 11px; background: ${phaseColor}15; padding: 1px 4px; border-radius: 4px;`,
      'color: inherit; font-size: 11px;',
      `color: ${durationColor}; font-weight: bold; font-size: 11px;`,
      'color: #94a3b8; font-size: 11px;'
    );
  };

  // Optional: Monitor if modal scrolling triggers layout thrashing by checking layout invalidation frequency
  useEffect(() => {
    if (!monitorScroll) return;

    // Find first scrollable parent or children wrapper
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Track layout property access times to detect forced synchronous layout (thrashing)
      const startMeasure = performance.now();
      
      // We read offsetHeight and scrollHeight just to monitor layout computation delay
      const _ = target.offsetHeight;
      const __ = target.scrollHeight;
      
      const endMeasure = performance.now();
      const layoutDuration = endMeasure - startMeasure;

      // Layout recalculation during scroll should ideally be 0ms or sub-millisecond.
      // If it takes longer, layout thrashing is highly likely.
      if (layoutDuration > 0.5) {
        console.warn(
          `%c⚠️ [Layout Thrashing Alert] %cScroll event on %c<${target.tagName.toLowerCase()}>%c took %c${layoutDuration.toFixed(2)}ms%c to resolve layout styles. This suggests style recalculation overhead or forced synchronous layouts.`,
          'color: #ef4444; font-weight: bold;',
          'color: inherit;',
          'color: #ec4899; font-weight: bold;',
          'color: inherit;',
          'color: #f59e0b; font-weight: bold;',
          'color: #94a3b8;'
        );
      }
    };

    // Capture scrolls within the subtree
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [monitorScroll]);

  return (
    <Profiler id={id} onRender={onRenderCallback}>
      {children}
    </Profiler>
  );
};
