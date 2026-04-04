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
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.01 }}
      className={`rounded-xl border p-5 ${config.bg}`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-5 w-5 ${config.color}`} />
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h4 className="font-heading font-semibold text-text-primary">{item.name}</h4>
              {item.locationDependent && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-text-secondary">
                  Location Risk
                </span>
              )}
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.color} ${config.bg}`}>
              {item.statusLabel || config.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-text-secondary">{item.whyItMatters}</p>

          {crossRef && (
            <p className="mt-2 rounded-lg border border-gray-100 bg-white/60 px-3 py-2 text-sm text-text-primary">
              {crossRef}
            </p>
          )}

          {avgCost && (
            <p className="mt-2 text-sm">
              <span className="text-text-secondary">Estimated cost: </span>
              <span className="font-medium text-text-primary">{formatCurrency(avgCost)}/mo</span>
            </p>
          )}

          {item.urgencyNote && <p className="mt-2 text-sm text-gap">{item.urgencyNote}</p>}

          {isActionable && (
            <button className="mt-3 rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary/90">
              Get Quote
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
