import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRef, useMemo } from 'react';
import { useCardTilt } from '../../hooks/useCursorPosition';
import { useAnimatedCounter, formatAnimatedValue } from '../../hooks/useAnimatedCounter';
import StatValue from './StatValue';

const TREND_ICONS = {
  up: <TrendingUp className="w-4 h-4 text-covered" />,
  down: <TrendingDown className="w-4 h-4 text-gap" />,
  neutral: <Minus className="w-4 h-4 text-text-secondary" />,
};

const COLOR_TO_VARIANT = {
  'text-primary': 'primary',
  'text-covered': 'success',
  'text-underinsured': 'warning',
  'text-gap': 'danger',
  'text-text-primary': 'neutral',
};

export default function MetricCard({ title, value, subtitle, trend, color, delay = 0, animate = true }) {
  const cardRef = useRef(null);
  const tilt = useCardTilt(cardRef, 6);

  // Extract numeric value if it's a string with currency/percentage
  const numericValue = useMemo(() => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const match = value.match(/[\d,]+\.?\d*/);
      return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
    }
    return 0;
  }, [value]);

  // Detect formatting from original value
  const formatting = useMemo(() => {
    if (typeof value === 'string') {
      return {
        prefix: value.match(/^[^\d]+/)?.[0] || '',
        suffix: value.match(/[^\d]+$/)?.[0] || '',
        decimals: value.includes('.') ? value.split('.')[1]?.length || 0 : 0,
      };
    }
    return { prefix: '', suffix: '', decimals: 0 };
  }, [value]);

  const animatedValue = useAnimatedCounter(numericValue, 1200, 'easeOut');
  const displayValue = animate && numericValue > 0
    ? formatAnimatedValue(animatedValue, formatting)
    : value;

  return (
    <motion.div
      ref={cardRef}
      className="glass-card group p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ 
        y: -6, 
        scale: 1.02,
        transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
      }}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
    >
      <p className="text-xs font-normal text-text-secondary uppercase tracking-[0.05em]">{title}</p>
      <div className="mt-3">
        <StatValue
          value={displayValue}
          color={COLOR_TO_VARIANT[color] || 'neutral'}
          size="lg"
          reflective
        />
      </div>
      {(subtitle || trend) && (
        <div className="flex items-center gap-1.5 mt-2">
          {trend && TREND_ICONS[trend]}
          {subtitle && <span className="text-xs font-light text-text-secondary">{subtitle}</span>}
        </div>
      )}
    </motion.div>
  );
}
