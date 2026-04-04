import { useEffect } from 'react';
import { useAnimationControls, useReducedMotion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export const scrollFadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

export default function useScrollAnimation(options = {}) {
  const prefersReducedMotion = useReducedMotion();
  const controls = useAnimationControls();
  const [ref, inView] = useInView({
    threshold: 0.2,
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

  return {
    ref,
    controls,
    inView,
    prefersReducedMotion,
  };
}
