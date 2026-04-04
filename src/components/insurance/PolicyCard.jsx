import StatusBadge from '../shared/StatusBadge';
import { formatCurrency } from '../../utils/formatCurrency';

const STATUS_MAP = {
  covered: 'covered',
  underinsured: 'underinsured',
  gap: 'gap',
  'not-applicable': 'covered',
};

export default function PolicyCard({ policy }) {
  if (!policy) return null;

  const badgeStatus = STATUS_MAP[policy.status] || 'gap';
  const avgPremium = policy.estimatedAnnualPremium
    ? Math.round((policy.estimatedAnnualPremium.low + policy.estimatedAnnualPremium.high) / 2)
    : null;

  return (
    <div className={`bg-card rounded-xl shadow-sm border p-5 ${
      policy.status === 'gap' ? 'border-gap/30' :
      policy.status === 'underinsured' ? 'border-underinsured/30' :
      'border-gray-100'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-heading font-semibold text-text-primary">{policy.name}</h4>
        <StatusBadge status={badgeStatus} label={policy.statusLabel} />
      </div>
      <p className="text-sm text-text-secondary mb-3">{policy.description}</p>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-text-secondary">Recommended Limit</span>
          <span className="text-text-primary font-medium">{policy.recommendedLimit}</span>
        </div>
        {policy.currentLimit && (
          <div className="flex justify-between">
            <span className="text-text-secondary">Your Current Limit</span>
            <span className={`font-medium ${policy.status === 'underinsured' ? 'text-underinsured' : 'text-text-primary'}`}>
              {policy.currentLimit}
            </span>
          </div>
        )}
        {avgPremium && (
          <div className="flex justify-between">
            <span className="text-text-secondary">Est. Annual Premium</span>
            <span className="text-text-primary font-medium">{formatCurrency(avgPremium)}</span>
          </div>
        )}
      </div>

      {policy.status === 'gap' && policy.priority === 'critical' && (
        <div className="mt-3 p-2 bg-gap/5 rounded-lg">
          <p className="text-xs text-gap font-medium">⚠️ {policy.whyItMatters}</p>
        </div>
      )}
    </div>
  );
}
