import { useEffect, useRef, useState } from 'react';

/**
 * Hook for animating number values with easing
 * @param {number} targetValue - The target number to animate to
 * @param {number} duration - Animation duration in milliseconds (default: 1000)
 * @param {string} easing - Easing function: 'linear', 'easeOut', 'easeInOut' (default: 'easeOut')
 * @returns {number} - The current animated value
 */
export function useAnimatedCounter(targetValue, duration = 1000, easing = 'easeOut') {
  const [currentValue, setCurrentValue] = useState(0);
  const startTimeRef = useRef(null);
  const startValueRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    // Reset animation when target changes
    startTimeRef.current = null;
    startValueRef.current = currentValue;

    const easingFunctions = {
      linear: (t) => t,
      easeOut: (t) => 1 - Math.pow(1 - t, 3),
      easeInOut: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    };

    const easeFn = easingFunctions[easing] || easingFunctions.easeOut;

    const animate = (timestamp) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeFn(progress);

      const newValue = startValueRef.current + (targetValue - startValueRef.current) * easedProgress;
      setCurrentValue(newValue);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentValue(targetValue);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [targetValue, duration, easing]);

  return currentValue;
}

/**
 * Format animated value for display
 * @param {number} value - The animated value
 * @param {object} options - Formatting options
 * @returns {string} - Formatted string
 */
export function formatAnimatedValue(value, options = {}) {
  const {
    prefix = '',
    suffix = '',
    decimals = 0,
    separator = ',',
  } = options;

  const rounded = decimals > 0 ? value.toFixed(decimals) : Math.round(value);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);

  return `${prefix}${formatted}${suffix}`;
}
