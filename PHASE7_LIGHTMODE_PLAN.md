# Phase 7: Light Mode & Theme System

## 🎯 Objective
Implement a comprehensive light/dark mode system with smooth transitions, maintaining accessibility and readability in both themes.

## 📅 Timeline: 2 Sprints (~8-10 hours)

---

## Sprint 7.1: Light Mode Palette & Theme Infrastructure (4-5 hours)

### Goals
- Define light mode color palette
- Create theme system architecture
- Implement theme context
- Build theme toggle component

### Light Mode Color Palette

#### Base Colors - Light Mode
```css
/* Backgrounds */
--color-bg-primary-light: #ffffff;
--color-bg-secondary-light: #fafafa;
--color-bg-tertiary-light: #f5f5f5;
--color-bg-elevated-light: #f0f0f0;

/* Borders */
--color-border-subtle-light: rgba(0, 0, 0, 0.06);
--color-border-default-light: rgba(0, 0, 0, 0.1);
--color-border-strong-light: rgba(0, 0, 0, 0.15);

/* Text */
--color-text-primary-light: #0a0a0b;
--color-text-secondary-light: #52525b;
--color-text-tertiary-light: #71717a;
--color-text-disabled-light: #a1a1aa;

/* Shadows */
--shadow-sm-light: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md-light: 0 4px 6px rgba(0, 0, 0, 0.07);
--shadow-lg-light: 0 10px 15px rgba(0, 0, 0, 0.1);

/* Subtle Gradients */
--gradient-subtle-light: linear-gradient(180deg,
  rgba(0, 0, 0, 0.02) 0%,
  rgba(0, 0, 0, 0) 100%);
```

#### Accent Colors (Same for Both Modes)
```css
/* Interactive - Adjusted for light mode */
--color-primary-light: #0891b2;      /* Darker cyan */
--color-success-light: #059669;      /* Darker green */
--color-warning-light: #d97706;      /* Darker amber */
--color-danger-light: #dc2626;       /* Darker red */

/* Muted variants */
--color-primary-muted-light: rgba(8, 145, 178, 0.1);
--color-success-muted-light: rgba(5, 150, 105, 0.1);
--color-warning-muted-light: rgba(217, 119, 6, 0.1);
--color-danger-muted-light: rgba(220, 38, 38, 0.1);
```

### Theme System Architecture

#### Theme Context
```javascript
// src/context/ThemeContext.jsx
import { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Load theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved) setTheme(saved);
  }, []);

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setIsTransitioning(true);
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    setTimeout(() => setIsTransitioning(false), 300);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isTransitioning }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

#### CSS Variables System
```css
/* src/index.css */

/* Default (Dark Mode) */
:root {
  --color-bg-primary: #0a0a0b;
  --color-text-primary: #fafafa;
  /* ... all dark mode variables */
}

/* Light Mode */
[data-theme="light"] {
  --color-bg-primary: #ffffff;
  --color-text-primary: #0a0a0b;
  /* ... all light mode variables */
}

/* Smooth transitions */
* {
  transition: 
    background-color 300ms ease,
    border-color 300ms ease,
    color 300ms ease,
    box-shadow 300ms ease;
}

/* Disable transitions during theme change */
[data-theme-transitioning] * {
  transition: none !important;
}
```

### Theme Toggle Component

#### Design Specifications
```
┌─────────────────┐
│  ☀️  ●────○  🌙 │  ← Toggle switch
└─────────────────┘

States:
- Dark mode: Moon icon highlighted, toggle right
- Light mode: Sun icon highlighted, toggle left
- Transition: Smooth slide with icon fade
```

#### Implementation
```jsx
// src/components/shared/ThemeToggle.jsx
import { useContext } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="toggle-track">
        <motion.div
          className="toggle-thumb"
          animate={{ x: isDark ? 28 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
        <div className="toggle-icons">
          <Sun className={`icon ${!isDark ? 'active' : ''}`} />
          <Moon className={`icon ${isDark ? 'active' : ''}`} />
        </div>
      </div>
    </button>
  );
}
```

### Accessibility Considerations

#### Contrast Ratios (WCAG AA)
**Dark Mode**
- Body text (15px): 4.5:1 minimum
- Large text (24px): 3:1 minimum
- UI components: 3:1 minimum

**Light Mode**
- Body text (15px): 4.5:1 minimum
- Large text (24px): 3:1 minimum
- UI components: 3:1 minimum

#### Testing Matrix
```
Component         | Dark BG  | Light BG | Contrast
------------------|----------|----------|----------
Body text         | #fafafa  | #0a0a0b  | 18.5:1 ✅
Secondary text    | #a1a1aa  | #52525b  | 7.2:1 ✅
Primary button    | #06b6d4  | #0891b2  | 4.8:1 ✅
Success indicator | #10b981  | #059669  | 4.5:1 ✅
Warning indicator | #f59e0b  | #d97706  | 4.5:1 ✅
Danger indicator  | #ef4444  | #dc2626  | 4.5:1 ✅
```

### Implementation Tasks

#### 1. Create Theme Context
- Build ThemeProvider
- Implement theme state
- Add localStorage persistence
- Handle system preference

#### 2. Update CSS Variables
- Define light mode palette
- Create data-theme selector
- Add transition properties
- Test all combinations

#### 3. Build ThemeToggle Component
- Design toggle UI
- Implement animations
- Add to TopBar/Sidebar
- Test accessibility

#### 4. Update All Components
- Use CSS variables everywhere
- Remove hardcoded colors
- Test in both themes
- Fix contrast issues

### Files to Create
- `src/context/ThemeContext.jsx` - NEW
- `src/components/shared/ThemeToggle.jsx` - NEW
- `src/hooks/useTheme.js` - NEW

### Files to Modify
- `src/index.css` - Theme variables
- `src/main.jsx` - Add ThemeProvider
- `src/App.jsx` - Add theme attribute
- `src/components/layout/TopBar.jsx` - Add toggle
- All components - Use CSS variables

---

## Sprint 7.2: Theme Refinement & Special Cases (4-5 hours)

### Goals
- Handle special cases (charts, images, shadows)
- Implement smooth transitions
- Add theme-aware components
- Optimize performance

### Chart Theming

#### Chart Color Schemes

**Dark Mode Charts**
```javascript
const darkChartColors = {
  grid: 'rgba(255, 255, 255, 0.05)',
  axis: 'rgba(255, 255, 255, 0.2)',
  text: '#a1a1aa',
  tooltip: {
    bg: '#18181b',
    border: 'rgba(255, 255, 255, 0.1)',
    text: '#fafafa'
  },
  series: [
    '#06b6d4', // Cyan
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#a855f7', // Purple
  ]
};
```

**Light Mode Charts**
```javascript
const lightChartColors = {
  grid: 'rgba(0, 0, 0, 0.05)',
  axis: 'rgba(0, 0, 0, 0.2)',
  text: '#52525b',
  tooltip: {
    bg: '#ffffff',
    border: 'rgba(0, 0, 0, 0.1)',
    text: '#0a0a0b'
  },
  series: [
    '#0891b2', // Darker cyan
    '#059669', // Darker green
    '#d97706', // Darker amber
    '#dc2626', // Darker red
    '#9333ea', // Darker purple
  ]
};
```

#### Chart Component Updates
```jsx
// src/components/financial/CashFlowChart.jsx
import { useTheme } from '../../hooks/useTheme';

export default function CashFlowChart({ data }) {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? darkChartColors : lightChartColors;

  return (
    <ResponsiveContainer>
      <BarChart data={data}>
        <CartesianGrid stroke={colors.grid} />
        <XAxis stroke={colors.axis} tick={{ fill: colors.text }} />
        <YAxis stroke={colors.axis} tick={{ fill: colors.text }} />
        <Tooltip
          contentStyle={{
            backgroundColor: colors.tooltip.bg,
            border: `1px solid ${colors.tooltip.border}`,
            color: colors.tooltip.text
          }}
        />
        <Bar dataKey="income" fill={colors.series[1]} />
        <Bar dataKey="expenses" fill={colors.series[3]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

### Shadow System

#### Dark Mode Shadows
```css
/* Subtle, dark shadows */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.5);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.7);
```

#### Light Mode Shadows
```css
/* Softer, lighter shadows */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
```

### Image Handling

#### Logo/Icons
```jsx
// Theme-aware logo
<img
  src={theme === 'dark' ? '/logo-dark.svg' : '/logo-light.svg'}
  alt="SafeGuard"
/>

// Or use CSS filter
<img
  src="/logo.svg"
  className={theme === 'dark' ? 'invert-0' : 'invert'}
/>
```

#### Illustrations
- Use SVG with CSS variables
- Or provide theme-specific versions
- Apply filters for monochrome images

### Smooth Theme Transitions

#### Transition Strategy
```css
/* Transition specific properties */
.theme-transition {
  transition:
    background-color 300ms cubic-bezier(0.4, 0, 0.2, 1),
    border-color 300ms cubic-bezier(0.4, 0, 0.2, 1),
    color 300ms cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Exclude animations during transition */
[data-theme-transitioning] * {
  animation-play-state: paused !important;
}
```

#### Fade Overlay (Optional)
```jsx
// Brief overlay during theme switch
{isTransitioning && (
  <motion.div
    className="theme-transition-overlay"
    initial={{ opacity: 0 }}
    animate={{ opacity: 0.5 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.15 }}
  />
)}
```

### Theme-Aware Components

#### StatusBadge
```jsx
// Adjust opacity based on theme
<span className={`
  status-badge
  ${theme === 'light' ? 'opacity-90' : 'opacity-100'}
`}>
```

#### CursorSpotlight
```jsx
// Lighter in light mode
const spotlightOpacity = theme === 'dark' ? 0.03 : 0.015;
```

#### ParticleGrid
```jsx
// Darker particles in light mode
const particleColor = theme === 'dark' 
  ? 'rgba(255, 255, 255, 0.25)'
  : 'rgba(0, 0, 0, 0.15)';
```

### System Preference Detection

```javascript
// Detect system theme preference
useEffect(() => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleChange = (e) => {
    if (!localStorage.getItem('theme')) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  };

  mediaQuery.addEventListener('change', handleChange);
  return () => mediaQuery.removeEventListener('change', handleChange);
}, []);
```

### Performance Optimization

#### Lazy Theme Loading
```javascript
// Only load theme-specific assets when needed
const loadThemeAssets = async (theme) => {
  if (theme === 'light') {
    await import('./styles/light-theme.css');
  }
};
```

#### Memoization
```javascript
// Memoize theme-dependent calculations
const chartColors = useMemo(() => {
  return theme === 'dark' ? darkChartColors : lightChartColors;
}, [theme]);
```

### Implementation Tasks

#### 1. Update All Charts
- Apply theme-aware colors
- Update tooltips
- Adjust grid/axis colors
- Test readability

#### 2. Handle Special Cases
- Update shadows
- Theme-aware images
- Adjust opacity values
- Fix edge cases

#### 3. Implement Smooth Transitions
- Add transition properties
- Handle animation pausing
- Test performance
- Optimize re-renders

#### 4. System Integration
- Detect system preference
- Respect user choice
- Persist selection
- Handle changes

### Files to Modify
- All chart components - Theme colors
- `src/components/shared/CursorSpotlight.jsx` - Theme-aware
- `src/components/shared/ParticleGrid.jsx` - Theme-aware
- `src/components/shared/StatusBadge.jsx` - Theme adjustments
- `src/index.css` - Shadow system

---

## Phase 7 Deliverables

### Sprint 7.1 Outputs
- ✅ Light mode palette defined
- ✅ Theme context created
- ✅ ThemeToggle component built
- ✅ CSS variables system implemented
- ✅ All components use variables

### Sprint 7.2 Outputs
- ✅ Charts themed for both modes
- ✅ Special cases handled
- ✅ Smooth transitions implemented
- ✅ System preference detected
- ✅ Performance optimized

### Success Metrics
- Both themes meet WCAG AA contrast
- Theme switch is smooth (300ms)
- No flash of unstyled content
- Charts readable in both modes
- User preference persisted
- System preference respected

---

## Complete Overhaul Summary

### Phase 4: Typography ✅
- Ultra-thin fonts (200-400 weight)
- Reflective shading on statistics
- Enterprise aesthetic

### Phase 5: Layout ✅
- Collapsible sidebar navigation
- Smooth animations
- Mobile-responsive

### Phase 6: Monochrome ✅
- Monochromatic base
- Strategic color accents
- Enhanced chart animations
- Scroll effects

### Phase 7: Light Mode ✅
- Full light/dark mode
- Theme toggle
- Smooth transitions
- Accessibility maintained

**Total Timeline**: 9 sprints, ~40-50 hours
**Result**: Enterprise-grade application inspired by Google AI Studio
