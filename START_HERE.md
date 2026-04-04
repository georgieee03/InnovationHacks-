# Enterprise UI Overhaul - Start Here

## What's Changing

**Current**: Bold fonts, colorful gradients, top tabs, dark only
**Target**: Thin fonts (200-400), monochrome (90%), collapsible sidebar, light/dark mode

## Timeline

**Total**: 40-50 hours across 9 sprints in 4 phases

## Phases

### Phase 4: Typography (8-10h)
- Replace fonts with Inter 200-600
- Add reflective gradient shading to numbers
- Create StatValue component

### Phase 5: Sidebar (12-15h)  
- Build collapsible sidebar (280px ↔ 64px)
- Replace top tabs with sidebar nav
- Add mobile drawer + gestures

### Phase 6: Monochrome (8-10h)
- Remove colorful backgrounds
- 90% grayscale, 10% color accents
- Add chart entrance animations
- Add scroll effects

### Phase 7: Light Mode (8-10h)
- Create light mode palette
- Build theme toggle
- Theme all components
- 300ms smooth transitions

## Key Files

**Read First**:
- `EXECUTIVE_SUMMARY.md` - Overview
- `QUICK_REFERENCE.md` - Quick info

**Implementation**:
- `PHASE4_TYPOGRAPHY_PLAN.md` - Font specs
- `PHASE5_LAYOUT_PLAN.md` - Sidebar specs
- `PHASE6_MONOCHROME_PLAN.md` - Color specs
- `PHASE7_LIGHTMODE_PLAN.md` - Theme specs
- `IMPLEMENTATION_GUIDE.md` - Step-by-step

## New Components

**Phase 4**: StatValue.jsx
**Phase 5**: CollapsibleSidebar.jsx, NavigationItem.jsx, TopBar.jsx, BusinessInfo.jsx
**Phase 6**: ScrollProgress.jsx, useScrollAnimation.js
**Phase 7**: ThemeContext.jsx, ThemeToggle.jsx, useTheme.js

## Key Decisions

- **Font**: Inter 200-600
- **Sidebar**: 280px expanded, 64px collapsed
- **Colors**: 90% grayscale, cyan/green/red accents only
- **Animation**: 300ms transitions, 60fps
- **Theme**: Dark default, localStorage + system preference

## Success Criteria

- Fonts 200-400 weight with reflective shading
- Sidebar collapses smoothly
- 90% UI monochrome
- Light/dark mode working
- WCAG AA compliance
- 60fps animations

## Start Implementation

1. Read `PHASE4_TYPOGRAPHY_PLAN.md`
2. Follow Sprint 4.1 tasks
3. Test after each sprint
4. Move to next phase

Done.
