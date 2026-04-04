import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

const PRIORITY_CONFIG = {
  critical: { icon: AlertTriangle, color: 'text-gap', bg: 'bg-gap/5 border-gap/20', label: 'Critical' },
  recommended: { icon: AlertCircle, color: 'text-underinsured', bg: 'bg-underinsured/5 border-underinsured/20', label: 'Recommended' },
  conditional: { icon: Info, color: 'text-primary', bg: 'bg-primary/5 border-primary/20', label: 'Optional' },
};

export default function RecommendationCard({ item }) {
  const config = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.recommended;
  const Icon = config.icon;
  const avgCost = item.estimatedAnnualPremium
    ? Math.round((item.estimatedAnnualPremium.low + item.estimatedAnnualPremium.high) / 2 / 12)
    : null;

  return (
    <div className={`rounded-xl border p-5 ${config.bg}`}>
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-5 w-5 ${config.color}`} />
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-heading font-semibold text-text-primary">{item.name}</h4>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.color} ${config.bg}`}>
              {item.statusLabel || config.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-text-secondary">{item.whyItMatters}</p>
          {avgCost && (
            <p className="mt-2 text-sm">
              <span className="text-text-secondary">Estimated cost: </span>
              <span className="font-medium text-text-primary">{formatCurrency(avgCost)}/mo</span>
            </p>
          )}
          {item.urgencyNote && <p className="mt-2 text-sm text-gap">{item.urgencyNote}</p>}
        </div>
      </div>
    </div>
  );
}
