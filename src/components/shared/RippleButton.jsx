import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RippleButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  className = '',
  disabled = false,
  ...props
}) {
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    if (disabled) return;

    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ripple = {
      x,
      y,
      id: Date.now(),
    };

    setRipples((prev) => [...prev, ripple]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
    }, 600);

    if (onClick) onClick(e);
  };

  const variants = {
    primary: 'bg-primary hover:bg-primary/90 text-white border-primary/50',
    secondary: 'bg-white/5 hover:bg-white/10 text-text-primary border-white/10',
    outline: 'bg-transparent hover:bg-white/5 text-primary border-primary/50',
    ghost: 'bg-transparent hover:bg-white/5 text-text-primary border-transparent',
    danger: 'bg-gap hover:bg-gap/90 text-white border-gap/50',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative overflow-hidden
        inline-flex items-center justify-center gap-2
        font-semibold rounded-lg
        border backdrop-blur-sm
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      whileHover={!disabled ? { scale: 1.02, y: -1 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      transition={{ duration: 0.15 }}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4" />}
      <span className="relative z-10">{children}</span>

      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="absolute rounded-full bg-white/30 pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
            }}
            initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 1 }}
            animate={{
              width: 400,
              height: 400,
              x: -200,
              y: -200,
              opacity: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    </motion.button>
  );
}
