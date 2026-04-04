import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

const PRIORITY_CONFIG = {
  critical: { icon: AlertTriangle, color: 'text-gap', bg: 'bg-gap/5 border-gap/20', label: 'Critical' },
  recommended: { icon: AlertCircle, color: 'text-underinsured', bg: 'bg-underinsured/5 border-underinsured/20', label: 'Recommended' },
  conditional: { icon: Info, color: 'text-primary', bg: 'bg-primary/5 border-primary/20', label: 'Optional' },
};

function getFinancialCrossRef(item, financialMetrics) {
  if (!financialMetrics) return null;

  if (item.id === 'equipment_breakdown' && financialMetrics.spendingByCategory?.equipment > 0) {
    return `Your recent equipment spending was ${formatCurrency(financialMetrics.spendingByCategory.equipment)}, indicating active equipment use and repair needs.`;
  }

  if (item.id === 'business_interruption') {
    const months = financialMetrics.monthsOfRunway ?? 0;
    const fixedCosts = financialMetrics.averageMonthlyExpenses ?? 0;
    return `With only ${months.toFixed(1)} months of reserves and ${formatCurrency(fixedCosts)}/month in fixed costs, a forced closure could be financially devastating.`;
  }

  return null;
}

export default function RecommendationCard({ item, financialMetrics, delay = 0 }) {
  const config = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.recommended;
  const Icon = config.icon;
  const avgCost = item.estimatedAnnualPremium
    ? Math.round((item.estimatedAnnualPremium.low + item.estimatedAnnualPremium.high) / 2 / 12)
    : null;

  const crossRef = getFinancialCrossRef(item, financialMetrics);
  const isActionable = item.status === 'gap' || item.status === 'underinsured';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ scale: 1.02, y: -4 }}
      className={`glass-card p-5 border ${config.bg.replace('bg-', 'border-')}`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 mt-0.5 ${config.color}`} />
        <div className="flex-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h4 className="font-heading font-normal tracking-[-0.02em] text-text-primary">{item.name}</h4>
              {item.locationDependent && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-text-secondary">
                  📍 Location Risk
                </span>
              )}
            </div>
            <span className={`text-xs font-normal px-2 py-0.5 rounded-full ${config.color} ${config.bg}`}>
              {item.statusLabel || config.label}
            </span>
          </div>
          <p className="text-sm text-text-secondary mt-1">{item.whyItMatters}</p>

          {crossRef && (
            <p className="text-sm text-text-primary mt-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10">
              💡 {crossRef}
            </p>
          )}

          {avgCost && (
            <p className="text-sm mt-2">
              <span className="text-text-secondary">Estimated cost: </span>
              <span className="font-normal text-text-primary">{formatCurrency(avgCost)}/mo</span>
            </p>
          )}

          {isActionable && (
            <button className="mt-3 px-4 py-1.5 text-sm font-normal rounded-lg bg-primary text-white hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all duration-200">
              Get Quote
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
