import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import useTheme from '../../hooks/useTheme';

const MotionDiv = motion.div;

export default function ThemeToggle() {
  const { isDark, theme, toggleTheme } = useTheme();
  const nextTheme = isDark ? 'light' : 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="theme-toggle focus-ring-control"
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
      aria-pressed={theme === 'light'}
    >
      <span className="theme-toggle__track">
        <span className="theme-toggle__icons" aria-hidden="true">
          <Sun className={`theme-toggle__icon ${!isDark ? 'is-active' : ''}`} />
          <Moon className={`theme-toggle__icon ${isDark ? 'is-active' : ''}`} />
        </span>
        <MotionDiv
          aria-hidden="true"
          className="theme-toggle__thumb"
          animate={{ x: isDark ? 34 : 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28, mass: 0.28 }}
        />
      </span>
    </button>
  );
}
