import StatusBadge from '../shared/StatusBadge';
import { formatCurrency } from '../../utils/formatCurrency';

const STATUS_MAP = {
  covered: 'covered',
  underinsured: 'underinsured',
  gap: 'gap',
  'not-applicable': 'covered',
};

export default function PolicyCard({ policy }) {
  if (!policy) {
    return null;
  }

  const badgeStatus = STATUS_MAP[policy.status] || 'gap';
  const avgPremium = policy.estimatedAnnualPremium
    ? Math.round((policy.estimatedAnnualPremium.low + policy.estimatedAnnualPremium.high) / 2)
    : null;

  return (
    <div className={`rounded-xl border bg-card p-5 shadow-sm ${
      policy.status === 'gap'
        ? 'border-gap/30'
        : policy.status === 'underinsured'
          ? 'border-underinsured/30'
          : 'border-gray-100'
    }`}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <h4 className="font-heading font-semibold text-text-primary">{policy.name}</h4>
        <StatusBadge status={badgeStatus} label={policy.statusLabel} />
      </div>

      <p className="mb-3 text-sm text-text-secondary">{policy.description}</p>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-text-secondary">Recommended Limit</span>
          <span className="text-right font-medium text-text-primary">{policy.recommendedLimit}</span>
        </div>
        {policy.currentLimit && (
          <div className="flex justify-between gap-3">
            <span className="text-text-secondary">Your Current Limit</span>
            <span className={`text-right font-medium ${policy.status === 'underinsured' ? 'text-underinsured' : 'text-text-primary'}`}>
              {policy.currentLimit}
            </span>
          </div>
        )}
        {avgPremium && (
          <div className="flex justify-between gap-3">
            <span className="text-text-secondary">Est. Annual Premium</span>
            <span className="text-right font-medium text-text-primary">{formatCurrency(avgPremium)}</span>
          </div>
        )}
      </div>

      {(policy.coverageNotes || policy.urgencyNote || (policy.status === 'gap' && policy.priority === 'critical' && policy.whyItMatters)) && (
        <div className="mt-3 rounded-lg bg-gap/5 p-2 text-xs text-gap">
          {policy.coverageNotes || policy.urgencyNote || policy.whyItMatters}
        </div>
      )}
    </div>
  );
}
