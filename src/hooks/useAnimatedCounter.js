import { useEffect, useRef, useState } from 'react';

export function useAnimatedCounter(targetValue, duration = 1000, easing = 'easeOut') {
  const [currentValue, setCurrentValue] = useState(0);
  const startTimeRef = useRef(null);
  const startValueRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    startTimeRef.current = null;
    startValueRef.current = currentValue;

    const easingFunctions = {
      linear: (t) => t,
      easeOut: (t) => 1 - Math.pow(1 - t, 3),
      easeInOut: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    };

    const easeFn = easingFunctions[easing] || easingFunctions.easeOut;

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
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
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [targetValue, duration, easing]);

  return currentValue;
}

export function formatAnimatedValue(value, options = {}) {
  const { prefix = '', suffix = '', decimals = 0, separator = ',' } = options;
  const rounded = decimals > 0 ? value.toFixed(decimals) : Math.round(value);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  return `${prefix}${formatted}${suffix}`;
}
