import { ChevronLeft, Menu, Moon, User } from 'lucide-react';
import { motion } from 'framer-motion';

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
      className="topbar-glass fixed top-0 z-30 h-[88px] border-b border-white/10"
    >
      <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            title={sidebarLabel}
            className="focus-ring-control inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-text-primary transition-all duration-200 hover:border-primary/30 hover:bg-white/[0.07]"
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
            <p className="truncate text-lg font-normal tracking-[-0.02em] text-text-primary">{activeLabel}</p>
            <p className="truncate text-xs font-light uppercase tracking-[0.05em] text-text-secondary">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled
            title="Theme toggle arrives in Phase 7"
            aria-label="Theme toggle arrives in Phase 7"
            className="focus-ring-control inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-text-secondary opacity-70"
          >
            <Moon className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/[0.12] text-xs font-medium text-primary">
              {getInitials(businessInfo?.name)}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-normal text-text-primary">{businessInfo?.name || 'SafeGuard'}</p>
              <p className="text-[11px] font-light uppercase tracking-[0.05em] text-text-secondary">Workspace</p>
            </div>
            <User className="hidden h-4 w-4 text-text-secondary sm:block" />
          </div>
        </div>
      </div>
    </MotionHeader>
  );
}
