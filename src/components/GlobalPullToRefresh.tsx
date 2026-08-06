import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Check, ArrowDown } from 'lucide-react';

interface GlobalPullToRefreshProps {
  children: React.ReactNode;
  onRefresh?: () => Promise<void> | void;
}

export const GlobalPullToRefresh: React.FC<GlobalPullToRefreshProps> = ({
  children,
  onRefresh,
}) => {
  const [pullDistance, setPullDistance] = useState<number>(0);
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [readyToRefresh, setReadyToRefresh] = useState<boolean>(false);

  const startYRef = useRef<number | null>(null);
  const startXRef = useRef<number | null>(null);
  const isPullingRef = useRef<boolean>(false);
  const isRefreshingRef = useRef<boolean>(false);
  const readyToRefreshRef = useRef<boolean>(false);

  const THRESHOLD = 85;

  // Keep refs synced to avoid stale closures in event listeners
  useEffect(() => {
    isPullingRef.current = isPulling;
    isRefreshingRef.current = isRefreshing;
    readyToRefreshRef.current = readyToRefresh;
  }, [isPulling, isRefreshing, readyToRefresh]);

  useEffect(() => {
    // Helper to check if touch target should be excluded from Pull-to-Refresh
    const isExcludedElement = (target: Element | null): boolean => {
      let curr = target;
      while (curr && curr !== document.body && curr !== document.documentElement) {
        if (
          curr.getAttribute('data-no-pull-to-refresh') === 'true' ||
          curr.classList.contains('no-pull-to-refresh') ||
          curr.tagName === 'CANVAS' ||
          curr.tagName === 'SVG' ||
          curr.tagName === 'INPUT' ||
          curr.tagName === 'TEXTAREA' ||
          curr.tagName === 'SELECT'
        ) {
          return true;
        }
        // If an inner container is scrolled down, exclude it
        if (curr.scrollTop > 5) {
          return true;
        }
        curr = curr.parentElement;
      }
      return false;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (isRefreshingRef.current) return;

      // Only activate if page is scrolled at the top
      const pageScrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      if (pageScrollTop > 5) return;

      const target = e.target as Element | null;
      if (isExcludedElement(target)) return;

      if (e.touches && e.touches.length === 1) {
        startYRef.current = e.touches[0].clientY;
        startXRef.current = e.touches[0].clientX;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startYRef.current === null || isRefreshingRef.current) return;

      const pageScrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      if (pageScrollTop > 5) {
        startYRef.current = null;
        setIsPulling(false);
        setPullDistance(0);
        return;
      }

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const deltaY = currentY - startYRef.current;
      const deltaX = currentX - (startXRef.current ?? currentX);

      // Ignore upward scroll or horizontal gestures
      if (deltaY <= 0 || Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
        if (!isPullingRef.current) {
          startYRef.current = null;
        }
        return;
      }

      // Calculate damped pull distance for fluid feel
      const distance = Math.min(125, Math.pow(deltaY, 0.82) * 2.5);

      if (deltaY > 10) {
        // Prevent browser native pull-to-refresh bounce when custom indicator is active
        if (e.cancelable) {
          e.preventDefault();
        }

        setIsPulling(true);
        setPullDistance(distance);

        const isReady = distance >= THRESHOLD;
        setReadyToRefresh(isReady);
      }
    };

    const handleTouchEnd = async () => {
      if (startYRef.current === null) return;

      startYRef.current = null;
      startXRef.current = null;

      if (readyToRefreshRef.current && !isRefreshingRef.current) {
        setIsRefreshing(true);
        setPullDistance(THRESHOLD);

        try {
          // Trigger global refresh events across app components
          window.dispatchEvent(new CustomEvent('app_global_refresh'));
          window.dispatchEvent(new CustomEvent('genealogy_data_updated'));
          window.dispatchEvent(new CustomEvent('admin_notifications_updated'));

          if (onRefresh) {
            await onRefresh();
          }

          // Ensure visual minimum spinner display time of 800ms for clean user experience
          await new Promise((resolve) => setTimeout(resolve, 800));
        } catch (err) {
          console.error('Error during pull-to-refresh:', err);
        } finally {
          setIsRefreshing(false);
          setIsPulling(false);
          setReadyToRefresh(false);
          setPullDistance(0);
        }
      } else {
        // Smoothly snap back if threshold wasn't reached
        setIsPulling(false);
        setReadyToRefresh(false);
        setPullDistance(0);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [onRefresh]);

  const progressRatio = Math.min(1, pullDistance / THRESHOLD);
  const opacity = Math.min(1, pullDistance / 25);
  const translateY = isRefreshing
    ? 20
    : isPulling
    ? Math.min(60, pullDistance * 0.55) - 45
    : -60;

  return (
    <div className="relative w-full min-h-screen">
      {/* Visual Refresh Indicator Pill */}
      {(isPulling || isRefreshing || pullDistance > 0) && (
        <div
          style={{
            transform: `translate(-50%, ${translateY}px) scale(${0.85 + progressRatio * 0.2})`,
            opacity: isRefreshing ? 1 : opacity,
          }}
          className={`fixed top-4 left-1/2 z-[99999] pointer-events-none transition-all duration-200 ease-out flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-2xl border-2 backdrop-blur-md font-['Noto_Kufi_Arabic'] text-xs font-bold ${
            isRefreshing
              ? 'bg-[#1A2A40] text-[#C5A059] border-[#C5A059] ring-4 ring-[#C5A059]/40'
              : readyToRefresh
              ? 'bg-[#243B55] text-amber-300 border-amber-400 ring-4 ring-amber-400/50 scale-105'
              : 'bg-[#1A2A40]/95 text-[#C5A059] border-[#C5A059]/60'
          }`}
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-[#C5A059] stroke-[2.5]" />
              <span>جاري تحديث البيانات...</span>
            </>
          ) : readyToRefresh ? (
            <>
              <Check className="w-4 h-4 text-emerald-400 stroke-[3] animate-bounce" />
              <span>اترك الآن للتحديث</span>
            </>
          ) : (
            <>
              <ArrowDown
                className="w-4 h-4 text-[#C5A059] stroke-[2.5] transition-transform duration-150"
                style={{ transform: `rotate(${progressRatio * 180}deg)` }}
              />
              <span>اسحب لتحديث الموسوعة...</span>
            </>
          )}
        </div>
      )}

      {/* Main App Content */}
      {children}
    </div>
  );
};
