import { motion } from 'framer-motion';
import StatusBadge from '../shared/StatusBadge';
import { formatCurrency } from '../../utils/formatCurrency';

const STATUS_MAP = {
  covered: 'covered',
  underinsured: 'underinsured',
  gap: 'gap',
  'not-applicable': 'covered',
};

export default function PolicyCard({ policy, delay = 0 }) {
  if (!policy) return null;

  const badgeStatus = STATUS_MAP[policy.status] || 'gap';
  const avgPremium = policy.estimatedAnnualPremium
    ? Math.round((policy.estimatedAnnualPremium.low + policy.estimatedAnnualPremium.high) / 2)
    : null;

  const isGap = policy.status === 'gap';
  const showLocationBadge = policy.locationDependent && isGap;
  const note =
    policy.coverageNotes ||
    policy.urgencyNote ||
    (isGap && policy.priority === 'critical' ? policy.whyItMatters : null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
      className={`rounded-xl border p-5 shadow-sm ${
        isGap
          ? 'border-gap/30 bg-gap/5'
          : policy.status === 'underinsured'
            ? 'border-underinsured/30 bg-card'
            : 'border-gray-100 bg-card'
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <h4 className="font-heading font-semibold text-text-primary">{policy.name}</h4>
        <StatusBadge status={badgeStatus} label={policy.statusLabel} />
      </div>

      <p className="mb-3 text-sm text-text-secondary">{policy.description}</p>

      {showLocationBadge && (
        <span className="mb-3 inline-block rounded-full bg-gap/10 px-2 py-0.5 text-xs font-medium text-gap">
          Location Risk
        </span>
      )}

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

      {note && (
        <div className="mt-3 rounded-lg bg-gap/5 p-2 text-xs text-gap">
          {note}
        </div>
      )}
    </motion.div>
  );
}
