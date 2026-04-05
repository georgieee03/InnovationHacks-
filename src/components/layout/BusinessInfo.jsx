import { AnimatePresence, motion } from 'framer-motion';
import { MapPin, Building2 } from 'lucide-react';
import { formatCurrencyCompact } from '../../utils/formatCurrency';

const MotionDiv = motion.div;

function getInitials(name) {
  if (!name) return 'SG';

  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export default function BusinessInfo({ businessInfo, financialMetrics, isExpanded }) {
  if (!businessInfo) return null;

  const revenue = businessInfo.monthlyRevenue || financialMetrics?.averageMonthlyIncome || 0;

  return (
    <div className="sidebar-panel rounded-[22px] p-4">
      <AnimatePresence initial={false} mode="wait">
        {isExpanded ? (
          <MotionDiv
            key="expanded"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="space-y-3.5"
          >
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.045] text-[0.92rem] font-semibold text-primary">
                {getInitials(businessInfo.name)}
              </div>
              <div className="min-w-0">
                <p className="text-[0.95rem] font-medium tracking-[-0.014em] text-text-primary">{businessInfo.name}</p>
                <p className="mt-1 text-[0.82rem] text-text-secondary">{businessInfo.type}</p>
              </div>
            </div>
            <div className="space-y-2.5 text-[0.82rem] text-text-secondary">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>{businessInfo.city}, {businessInfo.state}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                <span>{formatCurrencyCompact(revenue)}/mo revenue</span>
              </div>
            </div>
          </MotionDiv>
        ) : (
          <MotionDiv
            key="collapsed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            title={`${businessInfo.name} - ${businessInfo.city}, ${businessInfo.state}`}
            className="flex items-center justify-center"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.045] text-[0.78rem] font-semibold text-primary">
              {getInitials(businessInfo.name)}
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
}
