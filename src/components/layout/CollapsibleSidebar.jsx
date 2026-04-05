import { useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  Shield,
  ClipboardCheck,
  FileSignature,
  ReceiptText,
  Camera,
  BadgeCheck,
  TrendingUp,
  Calculator,
  AlertTriangle,
  Trophy,
  FileText,
  MessageCircle,
  GraduationCap,
  Moon,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import NavigationItem from './NavigationItem';
import BusinessInfo from './BusinessInfo';
import Tooltip from '../shared/Tooltip';
import useKeyboardNav from '../../hooks/useKeyboardNav';
import useSwipeGesture from '../../hooks/useSwipeGesture';

const animationTransition = { duration: 0.3, ease: [0.4, 0, 0.2, 1] };
const MotionAside = motion.aside;
const MotionDiv = motion.div;
const MotionSpan = motion.span;
const MotionButton = motion.button;

export default function CollapsibleSidebar({
  viewportMode,
  isExpanded,
  isMobileOpen,
  activeTab,
  businessInfo,
  financialMetrics,
  gapAnalysis,
  onNavigate,
  onHoverExpandedChange,
  onMobileOpen,
  onMobileClose,
}) {
  const drawerRef = useRef(null);
  const lastFocusedElementRef = useRef(null);
  const gapCount = Array.isArray(gapAnalysis)
    ? gapAnalysis.filter((item) => item.status === 'gap' || item.status === 'underinsured').length
    : 0;

  const navigationItems = useMemo(() => ([
    { id: 'financial', label: 'Financial Overview', shortLabel: 'Financial', icon: BarChart3, section: 'main' },
    { id: 'insurance', label: 'Insurance Analyzer', shortLabel: 'Insurance', icon: Shield, section: 'main', badge: gapCount > 0 ? { text: `${gapCount} gaps`, color: 'danger' } : null },
    { id: 'actionplan', label: 'Action Plan', shortLabel: 'Action Plan', icon: ClipboardCheck, section: 'main' },
    { id: 'contracts', label: 'Contracts', shortLabel: 'Contracts', icon: FileSignature, section: 'main' },
    { id: 'quotes', label: 'Quotes', shortLabel: 'Quotes', icon: ReceiptText, section: 'main' },
    { id: 'receipts', label: 'Receipts', shortLabel: 'Receipts', icon: Camera, section: 'main' },
    { id: 'compliance', label: 'Compliance', shortLabel: 'Compliance', icon: BadgeCheck, section: 'main' },
    { id: 'growth', label: 'Growth', shortLabel: 'Growth', icon: TrendingUp, section: 'main' },
    { id: 'calculators', label: 'Calculators', shortLabel: 'Calculators', icon: Calculator, section: 'main' },
    { id: 'simulator', label: 'Risk Simulator', shortLabel: 'Simulator', icon: AlertTriangle, section: 'main' },
    { id: 'challenges', label: 'Challenges', shortLabel: 'Challenges', icon: Trophy, section: 'main' },
    { id: 'report', label: 'Health Report', shortLabel: 'Health Report', icon: FileText, section: 'main' },
    { id: 'chat', label: 'Chat', shortLabel: 'Chat', icon: MessageCircle, section: 'main' },
    { id: 'learn', label: 'Learn', shortLabel: 'Learn', icon: GraduationCap, section: 'main' },
    { id: 'settings', label: 'Settings', shortLabel: 'Settings', icon: Settings, section: 'footer', disabled: true },
  ]), [gapCount]);

  const showExpanded = viewportMode === 'mobile' ? true : isExpanded;
  const sidebarWidth = showExpanded ? 280 : 64;
  const mainItems = navigationItems.filter((item) => item.section === 'main');
  const footerItems = navigationItems.filter((item) => item.section === 'footer');
  const focusIndexById = useMemo(
    () => new Map(
      navigationItems
        .filter((item) => !item.disabled)
        .map((item, index) => [item.id, index]),
    ),
    [navigationItems],
  );
  const { setItemRef, focusFirst, handleKeyDown } = useKeyboardNav({
    isEnabled: true,
    onEscape: viewportMode === 'mobile' && isMobileOpen ? onMobileClose : undefined,
  });

  useSwipeGesture({
    enabled: viewportMode === 'mobile',
    isDrawerOpen: isMobileOpen,
    drawerWidth: 280,
    onSwipeOpen: onMobileOpen,
    onSwipeClose: onMobileClose,
  });

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    document.body.classList.toggle('sidebar-open', viewportMode === 'mobile' && isMobileOpen);

    return () => document.body.classList.remove('sidebar-open');
  }, [viewportMode, isMobileOpen]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    if (viewportMode === 'mobile' && isMobileOpen) {
      lastFocusedElementRef.current = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

      const frameId = window.requestAnimationFrame(() => focusFirst());
      return () => window.cancelAnimationFrame(frameId);
    }

    if (viewportMode === 'mobile' && !isMobileOpen && lastFocusedElementRef.current instanceof HTMLElement) {
      lastFocusedElementRef.current.focus();
      lastFocusedElementRef.current = null;
    }

    return undefined;
  }, [viewportMode, isMobileOpen, focusFirst]);

  useEffect(() => {
    if (viewportMode !== 'mobile' || !isMobileOpen || !drawerRef.current) return undefined;

    const drawerElement = drawerRef.current;

    const trapFocus = (event) => {
      if (event.key !== 'Tab') return;

      const focusableElements = Array.from(
        drawerElement.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );

      if (!focusableElements.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    drawerElement.addEventListener('keydown', trapFocus);
    return () => drawerElement.removeEventListener('keydown', trapFocus);
  }, [viewportMode, isMobileOpen]);

  const sidebarContent = (
    <MotionAside
      id="primary-navigation"
      ref={drawerRef}
      role="navigation"
      aria-label="Main navigation"
      aria-expanded={showExpanded}
      tabIndex={viewportMode === 'mobile' ? -1 : undefined}
      onMouseEnter={() => onHoverExpandedChange?.(true)}
      onMouseLeave={() => onHoverExpandedChange?.(false)}
      onKeyDown={handleKeyDown}
      animate={viewportMode === 'mobile' ? { x: 0 } : { width: sidebarWidth }}
      initial={viewportMode === 'mobile' ? { x: -280 } : false}
      exit={viewportMode === 'mobile' ? { x: -280 } : undefined}
      transition={animationTransition}
      className={`sidebar-shell fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-white/10 backdrop-blur-xl ${
        viewportMode === 'mobile' ? 'shadow-2xl' : ''
      }`}
      style={{ width: viewportMode === 'mobile' ? 280 : sidebarWidth }}
    >
      <div className={`flex h-[88px] items-center border-b border-white/10 ${showExpanded ? 'justify-between px-5' : 'justify-center px-2'}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.045] text-primary shadow-[0_10px_24px_rgba(0,0,0,0.2)]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <AnimatePresence initial={false}>
            {showExpanded && (
              <MotionDiv
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-lg font-normal tracking-[-0.02em] text-text-primary">SafeGuard</p>
                <p className="text-[11px] font-light uppercase tracking-[0.05em] text-text-secondary">Enterprise workspace</p>
              </MotionDiv>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className={`flex-1 overflow-y-auto py-4 ${showExpanded ? 'px-3' : 'px-2'}`}>
          <div className="space-y-1">
            {mainItems.map((item, index) => (
              <MotionDiv
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <NavigationItem
                  item={item}
                  isActive={activeTab === item.id}
                  isExpanded={showExpanded}
                  buttonRef={setItemRef(focusIndexById.get(item.id))}
                  onClick={() => onNavigate?.(item.id)}
                />
              </MotionDiv>
            ))}
          </div>
        </div>

        <div className={`border-t border-white/8 py-4 ${showExpanded ? 'px-3' : 'px-2'}`}>
          <BusinessInfo
            businessInfo={businessInfo}
            financialMetrics={financialMetrics}
            isExpanded={showExpanded}
          />

          <div className="mt-3 space-y-1">
            {footerItems.map((item) => (
              <NavigationItem
                key={item.id}
                item={item}
                isActive={false}
                isExpanded={showExpanded}
                onClick={() => {}}
              />
            ))}

            <Tooltip
              content="Theme toggle arrives in Phase 7"
              side="right"
              delay={300}
              disabled={showExpanded}
            >
              <button
                type="button"
                disabled
                title="Theme toggle arrives in Phase 7"
                aria-label="Theme toggle arrives in Phase 7"
                className={`sidebar-action-surface focus-ring-control mt-1 flex w-full items-center rounded-2xl py-3 text-left text-text-secondary opacity-70 ${
                  showExpanded ? 'gap-3 px-3' : 'justify-center px-2'
                }`}
              >
                <Moon className="h-4 w-4 shrink-0" />
                <AnimatePresence initial={false}>
                  {showExpanded && (
                    <MotionSpan
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm font-normal tracking-[-0.01em]"
                    >
                      Theme Toggle
                    </MotionSpan>
                  )}
                </AnimatePresence>
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </MotionAside>
  );

  if (viewportMode === 'mobile') {
    return (
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <MotionButton
              key="backdrop"
              type="button"
              aria-label="Close navigation drawer"
              className="sidebar-backdrop fixed inset-0 z-30 border-0 bg-transparent p-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={animationTransition}
              onClick={onMobileClose}
            />
            {sidebarContent}
          </>
        )}
      </AnimatePresence>
    );
  }

  return sidebarContent;
}
