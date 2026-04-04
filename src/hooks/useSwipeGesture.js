import { useEffect, useRef } from 'react';

export default function useSwipeGesture({
  enabled = true,
  isDrawerOpen = false,
  edgeThreshold = 28,
  minDistance = 72,
  drawerWidth = 280,
  onSwipeOpen,
  onSwipeClose,
}) {
  const gestureRef = useRef(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined;

    const resetGesture = () => {
      gestureRef.current = null;
    };

    const handleTouchStart = (event) => {
      const touch = event.touches[0];
      if (!touch) return;

      const canStartGesture = isDrawerOpen
        ? touch.clientX <= drawerWidth + 24
        : touch.clientX <= edgeThreshold;

      if (!canStartGesture) {
        gestureRef.current = null;
        return;
      }

      gestureRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = (event) => {
      const startPoint = gestureRef.current;
      gestureRef.current = null;

      if (!startPoint) return;

      const touch = event.changedTouches[0];
      if (!touch) return;

      const deltaX = touch.clientX - startPoint.x;
      const deltaY = touch.clientY - startPoint.y;

      if (Math.abs(deltaX) < minDistance || Math.abs(deltaX) < Math.abs(deltaY)) return;

      if (!isDrawerOpen && deltaX > 0) {
        onSwipeOpen?.();
      }

      if (isDrawerOpen && deltaX < 0) {
        onSwipeClose?.();
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', resetGesture, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', resetGesture);
    };
  }, [drawerWidth, edgeThreshold, enabled, isDrawerOpen, minDistance, onSwipeClose, onSwipeOpen]);
}
