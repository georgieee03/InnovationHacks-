import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const MotionDiv = motion.div;

export default function Tooltip({
  children,
  content,
  side = 'right',
  delay = 300,
  disabled = false,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef(null);
  const tooltipId = useId();

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const showTooltip = () => {
    if (disabled || !content) return;

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const hideTooltip = () => {
    clearTimeout(timerRef.current);
    setIsVisible(false);
  };

  const positionClasses = side === 'right'
    ? 'left-full top-1/2 ml-3 -translate-y-1/2'
    : 'bottom-full left-1/2 mb-3 -translate-x-1/2';

  return (
    <div
      className="relative flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocusCapture={showTooltip}
      onBlurCapture={hideTooltip}
    >
      {children}
      <AnimatePresence>
        {isVisible && !disabled && content && (
          <MotionDiv
            id={tooltipId}
            role="tooltip"
            initial={{ opacity: 0, x: side === 'right' ? -8 : 0, y: side === 'right' ? 0 : 8 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: side === 'right' ? -8 : 0, y: side === 'right' ? 0 : 8 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className={`sidebar-tooltip pointer-events-none absolute z-50 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-[0.78rem] font-medium tracking-[0.04em] text-text-primary ${positionClasses}`}
          >
            {content}
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
}
