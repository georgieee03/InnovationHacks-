# Phase 5: Layout Restructure & Sidebar Navigation

## 🎯 Objective
Replace horizontal tab navigation with a collapsible sidebar, restructure layout for enterprise aesthetic, and implement smooth navigation animations.

## 📅 Timeline: 3 Sprints (~12-15 hours)

---

## Sprint 5.1: Sidebar Architecture & Design (4-5 hours)

### Goals
- Design collapsible sidebar structure
- Plan navigation hierarchy
- Define collapsed/expanded states
- Create responsive behavior

### Sidebar Design Specifications

#### Layout Structure
```
┌─────────────────────────────────────┐
│ [☰] SafeGuard        [Theme] [User] │ ← Top Bar (fixed)
├─────────────────────────────────────┤
│ │                                   │
│ │  Sidebar (collapsible)            │
│ │  - Logo/Brand                     │
│ │  - Navigation Items               │
│ │  - Business Info (collapsed)      │
│ │  - Settings                       │
│ │                                   │
│ │                    Main Content   │
│ │                    Area           │
│ │                                   │
└─────────────────────────────────────┘
```

#### Sidebar States

**Expanded State** (280px width)
```
┌──────────────────────┐
│ [☰] SafeGuard       │
├──────────────────────┤
│                      │
│ 📊 Financial         │
│ 🛡️  Insurance        │
│ ✅ Action Plan       │
│ 🧮 Calculators       │
│ ⚠️  Risk Simulator   │
│ 🏆 Challenges        │
│ 📄 Health Report     │
│ 💬 Chat              │
│ 🎓 Learn             │
│                      │
│ ─────────────────    │
│                      │
│ Maria's Bakery       │
│ Houston, TX          │
│ $45K/mo revenue      │
│                      │
│ ─────────────────    │
│                      │
│ ⚙️  Settings         │
│ 🌓 Theme Toggle      │
└──────────────────────┘
```

**Collapsed State** (64px width)
```
┌────┐
│ ☰  │
├────┤
│    │
│ 📊 │
│ 🛡️  │
│ ✅ │
│ 🧮 │
│ ⚠️  │
│ 🏆 │
│ 📄 │
│ 💬 │
│ 🎓 │
│    │
│ ── │
│    │
│ MB │
│    │
│ ── │
│    │
│ ⚙️  │
│ 🌓 │
└────┘
```

### Navigation Items Structure

```javascript
const navigationItems = [
  {
    id: 'financial',
    label: 'Financial Overview',
    icon: BarChart3,
    shortLabel: 'Financial',
    badge: null,
    section: 'main'
  },
  {
    id: 'insurance',
    label: 'Insurance Analyzer',
    icon: Shield,
    shortLabel: 'Insurance',
    badge: { text: '3 gaps', color: 'danger' },
    section: 'main'
  },
  // ... more items
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    shortLabel: 'Settings',
    section: 'footer'
  }
];
```

### Responsive Behavior

**Desktop (>1024px)**
- Sidebar defaults to expanded
- Toggle button collapses to 64px
- Main content adjusts width smoothly

**Tablet (768px - 1024px)**
- Sidebar defaults to collapsed
- Hover expands temporarily
- Click locks expanded state

**Mobile (<768px)**
- Sidebar becomes overlay drawer
- Hamburger menu in top bar
- Slides in from left
- Backdrop overlay when open

### Animation Specifications

**Expand/Collapse Animation**
- Duration: 300ms
- Easing: cubic-bezier(0.4, 0, 0.2, 1)
- Properties: width, padding, opacity (for text)
- Stagger: Icons → Text → Business info (50ms each)

**Navigation Item Hover**
- Background: rgba(255, 255, 255, 0.05)
- Border-left: 3px solid primary color
- Transform: translateX(4px)
- Duration: 200ms

**Active State**
- Background: rgba(6, 182, 212, 0.1)
- Border-left: 3px solid primary
- Icon: Scale 1.1
- Text: font-weight 500

### Implementation Tasks

#### 1. Create CollapsibleSidebar Component
```jsx
// src/components/layout/CollapsibleSidebar.jsx
export default function CollapsibleSidebar({
  isExpanded,
  onToggle,
  activeTab,
  onNavigate
}) {
  // Sidebar logic
}
```

#### 2. Create NavigationItem Component
```jsx
// src/components/layout/NavigationItem.jsx
export default function NavigationItem({
  item,
  isActive,
  isExpanded,
  onClick
}) {
  // Navigation item with animations
}
```

#### 3. Create TopBar Component
```jsx
// src/components/layout/TopBar.jsx
export default function TopBar({
  onMenuToggle,
  businessInfo
}) {
  // Top bar with menu button
}
```

#### 4. Update App.jsx Layout
- Remove TabNavigation
- Add CollapsibleSidebar
- Add TopBar
- Adjust main content area
- Handle responsive states

### Files to Create
- `src/components/layout/CollapsibleSidebar.jsx` - NEW
- `src/components/layout/NavigationItem.jsx` - NEW
- `src/components/layout/TopBar.jsx` - NEW
- `src/components/layout/BusinessInfo.jsx` - NEW (collapsed view)

### Files to Modify
- `src/App.jsx` - Layout restructure
- `src/context/AppContext.jsx` - Add sidebar state
- `src/index.css` - Layout utilities

---

## Sprint 5.2: Sidebar Implementation & Animations (4-5 hours)

### Goals
- Build collapsible sidebar component
- Implement smooth animations
- Add navigation logic
- Handle state management

### Animation Implementation

#### 1. Sidebar Width Transition
```jsx
<motion.aside
  animate={{
    width: isExpanded ? 280 : 64
  }}
  transition={{
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1]
  }}
  className="sidebar"
>
```

#### 2. Text Fade In/Out
```jsx
<AnimatePresence>
  {isExpanded && (
    <motion.span
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2 }}
    >
      {label}
    </motion.span>
  )}
</AnimatePresence>
```

#### 3. Icon Scale on Active
```jsx
<motion.div
  animate={{
    scale: isActive ? 1.1 : 1
  }}
  transition={{ duration: 0.2 }}
>
  <Icon />
</motion.div>
```

#### 4. Staggered Navigation Items
```jsx
{navigationItems.map((item, index) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
  >
    <NavigationItem {...item} />
  </motion.div>
))}
```

### State Management

#### Context Updates
```javascript
// src/context/AppContext.jsx
const [sidebarExpanded, setSidebarExpanded] = useState(true);
const [sidebarLocked, setSidebarLocked] = useState(false);

const toggleSidebar = () => {
  setSidebarExpanded(!sidebarExpanded);
};

const lockSidebar = (locked) => {
  setSidebarLocked(locked);
};
```

### Responsive Behavior Implementation

#### Desktop
```jsx
const [isExpanded, setIsExpanded] = useState(true);

// Toggle on button click
const handleToggle = () => {
  setIsExpanded(!isExpanded);
};
```

#### Tablet
```jsx
const [isExpanded, setIsExpanded] = useState(false);
const [isHovered, setIsHovered] = useState(false);

// Expand on hover
const handleMouseEnter = () => {
  if (!isLocked) setIsHovered(true);
};

// Collapse on mouse leave
const handleMouseLeave = () => {
  if (!isLocked) setIsHovered(false);
};
```

#### Mobile
```jsx
const [isOpen, setIsOpen] = useState(false);

// Overlay drawer
<AnimatePresence>
  {isOpen && (
    <>
      <motion.div
        className="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setIsOpen(false)}
      />
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        exit={{ x: -280 }}
        className="sidebar-drawer"
      >
        {/* Sidebar content */}
      </motion.aside>
    </>
  )}
</AnimatePresence>
```

### Implementation Tasks

#### 1. Build CollapsibleSidebar
- Implement expand/collapse logic
- Add animation variants
- Handle responsive states
- Add keyboard navigation

#### 2. Build NavigationItem
- Active state styling
- Hover effects
- Badge support
- Tooltip for collapsed state

#### 3. Build TopBar
- Menu toggle button
- Breadcrumb navigation
- Theme toggle (Phase 7)
- User menu

#### 4. Integrate with App
- Replace TabNavigation
- Update layout grid
- Test all breakpoints
- Verify animations

### Files to Implement
- Complete CollapsibleSidebar.jsx
- Complete NavigationItem.jsx
- Complete TopBar.jsx
- Complete BusinessInfo.jsx
- Update App.jsx layout

---

## Sprint 5.3: Polish & Responsive Refinement (4-5 hours)

### Goals
- Perfect animations and transitions
- Add micro-interactions
- Implement tooltips for collapsed state
- Mobile optimization
- Accessibility improvements

### Micro-interactions

#### 1. Navigation Item Interactions
- Hover: Background fade + border slide
- Active: Icon bounce + background glow
- Click: Ripple effect
- Badge pulse: For notifications

#### 2. Collapse/Expand Button
- Rotate icon 180° on toggle
- Pulse hint when sidebar can collapse
- Tooltip: "Collapse sidebar" / "Expand sidebar"

#### 3. Business Info Section
- Smooth height transition
- Fade in/out content
- Avatar/initials in collapsed state

### Tooltip Implementation

**For Collapsed State**
```jsx
<Tooltip content={item.label} side="right" delay={300}>
  <NavigationItem {...item} />
</Tooltip>
```

### Accessibility Enhancements

#### Keyboard Navigation
- Tab: Navigate through items
- Enter/Space: Activate item
- Escape: Close mobile drawer
- Arrow keys: Navigate items

#### ARIA Labels
```jsx
<aside
  role="navigation"
  aria-label="Main navigation"
  aria-expanded={isExpanded}
>
  <button
    aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
    aria-controls="sidebar-content"
  >
```

#### Focus Management
- Trap focus in mobile drawer
- Restore focus on close
- Visible focus indicators

### Mobile Optimization

#### Touch Gestures
- Swipe right: Open drawer
- Swipe left: Close drawer
- Tap outside: Close drawer

#### Performance
- Use transform for animations (GPU)
- Lazy load navigation icons
- Optimize re-renders

### Implementation Tasks

#### 1. Add Tooltips
- Install/create tooltip component
- Add to collapsed navigation items
- Position correctly
- Delay for UX

#### 2. Keyboard Navigation
- Implement arrow key navigation
- Add focus trap for mobile
- Test with screen readers

#### 3. Mobile Gestures
- Add swipe detection
- Implement gesture handlers
- Test on touch devices

#### 4. Polish Animations
- Fine-tune timing
- Add spring physics
- Test performance
- Reduce motion support

### Files to Create/Modify
- `src/components/shared/Tooltip.jsx` - NEW (if needed)
- `src/hooks/useSwipeGesture.js` - NEW
- `src/hooks/useKeyboardNav.js` - NEW
- `src/components/layout/CollapsibleSidebar.jsx` - Polish
- `src/components/layout/NavigationItem.jsx` - Polish

---

## Phase 5 Deliverables

### Sprint 5.1 Outputs
- ✅ Sidebar architecture designed
- ✅ Navigation structure defined
- ✅ Responsive behavior planned
- ✅ Animation specifications documented

### Sprint 5.2 Outputs
- ✅ CollapsibleSidebar component built
- ✅ NavigationItem component built
- ✅ TopBar component built
- ✅ Layout restructured in App.jsx
- ✅ Animations implemented

### Sprint 5.3 Outputs
- ✅ Tooltips added for collapsed state
- ✅ Keyboard navigation implemented
- ✅ Mobile gestures added
- ✅ Accessibility enhanced
- ✅ Animations polished

### Success Metrics
- Sidebar collapses smoothly (300ms)
- Navigation items animate on hover
- Mobile drawer works perfectly
- Keyboard navigation functional
- WCAG AA accessibility met
- 60fps animations maintained

---

## Next Phase Preview

**Phase 6**: Monochromatic Design & Color System
- Implement monochromatic base palette
- Strategic color accents (red/green/cyan)
- Subtle gradient backgrounds
- Enhanced chart styling
