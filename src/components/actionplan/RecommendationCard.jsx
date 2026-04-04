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

export default function RecommendationCard({ item, financialMetrics }) {
  const config = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.recommended;
  const Icon = config.icon;
  const avgCost = item.estimatedAnnualPremium
    ? Math.round((item.estimatedAnnualPremium.low + item.estimatedAnnualPremium.high) / 2 / 12)
    : null;

  const crossRef = getFinancialCrossRef(item, financialMetrics);
  const isActionable = item.status === 'gap' || item.status === 'underinsured';

  return (
    <div className={`rounded-xl border p-5 ${config.bg}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 mt-0.5 ${config.color}`} />
        <div className="flex-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h4 className="font-heading font-semibold text-text-primary">{item.name}</h4>
              {item.locationDependent && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-text-secondary">
                  📍 Location Risk
                </span>
              )}
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.color} ${config.bg}`}>
              {item.statusLabel || config.label}
            </span>
          </div>
          <p className="text-sm text-text-secondary mt-1">{item.whyItMatters}</p>

          {crossRef && (
            <p className="text-sm text-text-primary mt-2 bg-white/60 rounded-lg px-3 py-2 border border-gray-100">
              💡 {crossRef}
            </p>
          )}

          {avgCost && (
            <p className="text-sm mt-2">
              <span className="text-text-secondary">Estimated cost: </span>
              <span className="font-medium text-text-primary">{formatCurrency(avgCost)}/mo</span>
            </p>
          )}

          {isActionable && (
            <button className="mt-3 px-4 py-1.5 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors">
              Get Quote
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
