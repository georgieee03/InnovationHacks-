import { AnimatePresence, motion } from 'framer-motion';
import Tooltip from '../shared/Tooltip';

const MotionButton = motion.button;
const MotionDiv = motion.div;

const badgeStyles = {
  danger: 'border-gap/20 bg-gap/[0.12] text-gap',
  warning: 'border-underinsured/20 bg-underinsured/[0.12] text-underinsured',
  success: 'border-covered/20 bg-covered/[0.12] text-covered',
  primary: 'border-primary/20 bg-primary/[0.12] text-primary',
  neutral: 'border-white/10 bg-white/5 text-text-secondary',
};

export default function NavigationItem({ item, isActive, isExpanded, onClick, buttonRef }) {
  const Icon = item.icon;
  const badgeClass = badgeStyles[item.badge?.color || 'neutral'];

  const button = (
    <MotionButton
      ref={buttonRef}
      type="button"
      onClick={() => !item.disabled && onClick?.(item)}
      disabled={item.disabled}
      aria-label={item.label}
      aria-disabled={item.disabled || undefined}
      aria-current={isActive ? 'page' : undefined}
      className={`btn-ripple focus-ring-control group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border-l-[3px] px-3 py-3 text-left transition-all duration-200 ${
        isExpanded ? 'justify-start' : 'justify-center'
      } ${
        isActive
          ? 'border-primary bg-primary/10 text-text-primary'
          : 'border-transparent bg-transparent text-text-secondary hover:border-primary/70 hover:bg-white/5 hover:text-text-primary'
      } ${
        item.disabled ? 'cursor-not-allowed opacity-50' : ''
      }`}
      whileHover={item.disabled ? undefined : { x: 4 }}
      whileTap={item.disabled ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
    >
      <MotionDiv
        animate={{ scale: isActive ? 1.1 : 1 }}
        transition={{ duration: 0.2 }}
        className="relative shrink-0"
      >
        <Icon className="h-5 w-5" />
        {!isExpanded && item.badge && (
          <>
            <span className="animate-ping-slow absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-primary/45" />
            <span className={`absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border ${badgeClass}`} />
          </>
        )}
      </MotionDiv>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <MotionDiv
            key="label"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="flex min-w-0 flex-1 items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className={`truncate text-sm tracking-[-0.01em] ${isActive ? 'font-medium' : 'font-normal'}`}>
                {item.shortLabel || item.label}
              </p>
            </div>
            {item.badge && (
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-normal uppercase tracking-[0.04em] ${badgeClass}`}>
                {item.badge.text}
              </span>
            )}
          </MotionDiv>
        )}
      </AnimatePresence>
    </MotionButton>
  );

  return (
    <Tooltip
      content={item.label}
      side="right"
      delay={300}
      disabled={isExpanded}
    >
      {button}
    </Tooltip>
  );
}
