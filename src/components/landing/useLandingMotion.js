import { useEffect, useRef } from 'react';
import { useAnimationControls, useReducedMotion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export const landingEase = [0.22, 1, 0.36, 1];

export function createRevealVariants(prefersReducedMotion, distance = 28) {
  return {
    hidden: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : distance,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.01 : 0.78,
        ease: landingEase,
      },
    },
  };
}

export function createStaggerVariants(prefersReducedMotion, staggerChildren = 0.12) {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : staggerChildren,
        delayChildren: prefersReducedMotion ? 0 : 0.04,
      },
    },
  };
}

export function getFloatingAnimation(index, prefersReducedMotion) {
  if (prefersReducedMotion) {
    return {};
  }

  return {
    y: [0, -10 - index * 2, 0],
    transition: {
      duration: 6 + index * 0.8,
      ease: 'easeInOut',
      repeat: Number.POSITIVE_INFINITY,
      repeatType: 'mirror',
      delay: index * 0.28,
    },
  };
}

export function useLandingSection(options = {}) {
  const prefersReducedMotion = useReducedMotion();
  const controls = useAnimationControls();
  const [ref, inView] = useInView({
    threshold: 0.18,
    triggerOnce: true,
    ...options,
  });

  useEffect(() => {
    if (prefersReducedMotion) {
      controls.set('visible');
      return;
    }

    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView, prefersReducedMotion]);

  return { ref, controls, prefersReducedMotion };
}

export function useTiltMotion() {
  const prefersReducedMotion = useReducedMotion();
  const elementRef = useRef(null);
  const frameRef = useRef(null);
  const pointerRef = useRef({ rotateX: 0, rotateY: 0, x: 50, y: 50, glow: 0.16 });

  useEffect(() => () => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
  }, []);

  const applyStyles = () => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    const { rotateX, rotateY, x, y, glow } = pointerRef.current;
    element.style.setProperty('--landing-tilt-x', `${rotateX}deg`);
    element.style.setProperty('--landing-tilt-y', `${rotateY}deg`);
    element.style.setProperty('--landing-pointer-x', `${x}%`);
    element.style.setProperty('--landing-pointer-y', `${y}%`);
    element.style.setProperty('--landing-glow-strength', `${glow}`);
  };

  const scheduleApply = () => {
    if (frameRef.current) {
      return;
    }

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      applyStyles();
    });
  };

  const reset = () => {
    pointerRef.current = { rotateX: 0, rotateY: 0, x: 50, y: 50, glow: 0.16 };
    scheduleApply();
  };

  const handlePointerMove = (event) => {
    if (prefersReducedMotion || window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const element = elementRef.current;
    if (!element) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const relativeX = (event.clientX - rect.left) / rect.width;
    const relativeY = (event.clientY - rect.top) / rect.height;

    pointerRef.current = {
      rotateX: (relativeY - 0.5) * -8,
      rotateY: (relativeX - 0.5) * 10,
      x: relativeX * 100,
      y: relativeY * 100,
      glow: 0.3,
    };
    scheduleApply();
  };

  const interactive = !prefersReducedMotion;

  return {
    ref: elementRef,
    interactive,
    handlers: {
      onPointerMove: handlePointerMove,
      onPointerLeave: reset,
      onPointerCancel: reset,
      onBlur: reset,
      onFocus: scheduleApply,
    },
  };
}
