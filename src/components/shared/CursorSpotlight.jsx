import { useEffect, useRef } from 'react';
import useTheme from '../../hooks/useTheme';

const SPOTLIGHT_SIZE = 150;
const HALF_SPOTLIGHT = SPOTLIGHT_SIZE / 1.25;

export default function CursorSpotlight() {
  const { theme } = useTheme();
  const spotlightRef = useRef(null);
  const frameRef = useRef(null);
  const currentRef = useRef({ x: 0, y: 0, opacity: 0, scale: 0.94 });
  const targetRef = useRef({ x: 0, y: 0, opacity: 0, scale: 0.94 });
  const spotlightGradient = theme === 'light'
    ? 'radial-gradient(circle, rgba(255, 255, 255, 0.38) 0%, rgba(255, 255, 255, 0.24) 14%, rgba(0, 207, 49, 0.16) 32%, rgba(0, 207, 49, 0.07) 48%, rgba(15, 23, 42, 0.03) 62%, transparent 80%)'
    : 'radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.12) 16%, rgba(255, 255, 255, 0.055) 34%, rgba(0, 207, 49, 0.12) 50%, rgba(0, 207, 49, 0.05) 62%, transparent 80%)';

  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia('(pointer: coarse)').matches) {
      return undefined;
    }

    const spotlight = spotlightRef.current;
    if (!spotlight) {
      return undefined;
    }

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    currentRef.current = { x: centerX, y: centerY, opacity: 0, scale: 0.94 };
    targetRef.current = { x: centerX, y: centerY, opacity: 0, scale: 0.94 };

    const applyStyles = () => {
      const current = currentRef.current;
      spotlight.style.transform = `translate3d(${current.x - HALF_SPOTLIGHT}px, ${current.y - HALF_SPOTLIGHT}px, 0) scale(${current.scale})`;
      spotlight.style.opacity = `${current.opacity}`;
    };

    const animate = () => {
      const current = currentRef.current;
      const target = targetRef.current;
      const easing = reducedMotionQuery.matches ? 0.35 : 0.17;

      current.x += (target.x - current.x) * easing;
      current.y += (target.y - current.y) * easing;
      current.opacity += (target.opacity - current.opacity) * (reducedMotionQuery.matches ? 0.3 : 0.12);
      current.scale += (target.scale - current.scale) * 0.18;

      applyStyles();

      const isSettled = Math.abs(target.x - current.x) < 0.2
        && Math.abs(target.y - current.y) < 0.2
        && Math.abs(target.opacity - current.opacity) < 0.02
        && Math.abs(target.scale - current.scale) < 0.01;

      if (isSettled) {
        frameRef.current = null;
        return;
      }

      frameRef.current = window.requestAnimationFrame(animate);
    };

    const scheduleFrame = () => {
      if (!frameRef.current) {
        frameRef.current = window.requestAnimationFrame(animate);
      }
    };

    const handlePointerMove = (event) => {
      targetRef.current.x = event.clientX;
      targetRef.current.y = event.clientY;
      targetRef.current.opacity = 1;
      targetRef.current.scale = 1;
      scheduleFrame();
    };

    const handlePointerLeave = () => {
      targetRef.current.opacity = 0;
      targetRef.current.scale = 0.95;
      scheduleFrame();
    };

    const handlePointerDown = () => {
      targetRef.current.scale = reducedMotionQuery.matches ? 1 : 1.05;
      scheduleFrame();
    };

    const handlePointerUp = () => {
      targetRef.current.scale = 1;
      scheduleFrame();
    };

    applyStyles();
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    window.addEventListener('blur', handlePointerLeave);
    document.documentElement.addEventListener('mouseleave', handlePointerLeave);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('blur', handlePointerLeave);
      document.documentElement.removeEventListener('mouseleave', handlePointerLeave);
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
    return null;
  }

  return (
    <div
      ref={spotlightRef}
      aria-hidden="true"
      className="cursor-spotlight"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: `${SPOTLIGHT_SIZE}px`,
        height: `${SPOTLIGHT_SIZE}px`,
        borderRadius: '50%',
        background: spotlightGradient,
        pointerEvents: 'none',
        zIndex: 5,
        opacity: 0,
        willChange: 'transform, opacity',
      }}
    />
  );
}
