import { ChevronLeft, Menu, User } from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeToggle from '../shared/ThemeToggle';

const MotionHeader = motion.header;
const MotionDiv = motion.div;

function getInitials(name) {
  if (!name) return 'SG';

  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export default function TopBar({
  activeLabel,
  businessInfo,
  sidebarOffset,
  viewportMode,
  isSidebarExpanded,
  isMobileOpen,
  onMenuToggle,
}) {
  const subtitle = businessInfo
    ? `${businessInfo.name} - ${businessInfo.city}, ${businessInfo.state}`
    : 'Enterprise business resilience dashboard';
  const sidebarLabel = viewportMode === 'mobile'
    ? (isMobileOpen ? 'Close navigation menu' : 'Open navigation menu')
    : (isSidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar');

  return (
    <MotionHeader
      animate={{
        left: viewportMode === 'mobile' ? 0 : sidebarOffset,
        width: viewportMode === 'mobile' ? '100%' : `calc(100% - ${sidebarOffset}px)`,
      }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="topbar-glass fixed top-0 z-30 h-[96px] border-b border-white/10"
    >
      <div className="flex h-full items-center justify-between gap-5 px-5 sm:px-7">
        <div className="flex min-w-0 items-center gap-3.5">
          <button
            type="button"
            onClick={onMenuToggle}
            title={sidebarLabel}
            className="sidebar-action-surface focus-ring-control inline-flex h-12 w-12 items-center justify-center rounded-[18px] text-text-primary transition-all duration-200 hover:border-primary/30 hover:text-primary"
            aria-label={sidebarLabel}
            aria-controls="primary-navigation"
            aria-expanded={viewportMode === 'mobile' ? isMobileOpen : isSidebarExpanded}
          >
            {viewportMode === 'mobile' ? (
              <Menu className="h-5 w-5" />
            ) : (
              <MotionDiv
                animate={{ rotate: isSidebarExpanded ? 0 : 180 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="animate-pulse-subtle"
              >
                <ChevronLeft className="h-5 w-5" />
              </MotionDiv>
            )}
          </button>

          <div className="min-w-0">
            <p className="truncate text-[1.08rem] font-medium tracking-[-0.022em] text-text-primary sm:text-[1.18rem]">{activeLabel}</p>
            <p className="mt-0.5 truncate text-[0.72rem] font-medium uppercase tracking-[0.12em] text-text-secondary">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <ThemeToggle />

          <div className="sidebar-action-surface flex items-center gap-3 rounded-[20px] px-3.5 py-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.045] text-[0.72rem] font-semibold text-primary">
              {getInitials(businessInfo?.name)}
            </div>
            <div className="hidden sm:block">
              <p className="text-[0.94rem] font-medium tracking-[-0.014em] text-text-primary">{businessInfo?.name || 'SafeGuard'}</p>
              <p className="text-[0.66rem] font-medium uppercase tracking-[0.13em] text-text-secondary">Workspace</p>
            </div>
            <User className="hidden h-4 w-4 text-text-secondary sm:block" />
          </div>
        </div>
      </div>
    </MotionHeader>
  );
}
