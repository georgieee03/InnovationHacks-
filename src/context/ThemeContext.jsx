import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'safeguard-theme';

export const ThemeContext = createContext(null);

function getDefaultTheme() {
  return 'dark';
}

function readStoredTheme() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storedTheme = window.localStorage.getItem(STORAGE_KEY);
    return storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : null;
  } catch {
    return null;
  }
}

function getInitialTheme() {
  if (typeof document !== 'undefined') {
    const domTheme = document.documentElement.getAttribute('data-theme');
    if (domTheme === 'light' || domTheme === 'dark') {
      return domTheme;
    }
  }

  return readStoredTheme() ?? getDefaultTheme();
}

export function ThemeProvider({ children }) {
  const transitionTimerRef = useRef(null);
  const [userPreference, setUserPreference] = useState(() => readStoredTheme());
  const [theme, setTheme] = useState(() => getInitialTheme());
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;

    if (isTransitioning) {
      root.setAttribute('data-theme-transitioning', 'true');
    } else {
      root.removeAttribute('data-theme-transitioning');
    }
  }, [isTransitioning]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    try {
      if (userPreference) {
        window.localStorage.setItem(STORAGE_KEY, userPreference);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      return undefined;
    }

    return undefined;
  }, [userPreference]);

  useEffect(() => () => {
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
    }
  }, []);

  const setThemePreference = useCallback((nextTheme) => {
    if (nextTheme !== 'light' && nextTheme !== 'dark') {
      return;
    }

    setIsTransitioning(true);
    setTheme(nextTheme);
    setUserPreference(nextTheme);

    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
    }

    transitionTimerRef.current = window.setTimeout(() => {
      setIsTransitioning(false);
      transitionTimerRef.current = null;
    }, 320);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemePreference(theme === 'dark' ? 'light' : 'dark');
  }, [setThemePreference, theme]);

  const value = useMemo(() => ({
    theme,
    isDark: theme === 'dark',
    isTransitioning,
    toggleTheme,
    setThemePreference,
    userPreference,
  }), [isTransitioning, setThemePreference, theme, toggleTheme, userPreference]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
