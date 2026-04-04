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
  const avgPremium = Number.isFinite(policy.estimatedAnnualPremium?.low) && Number.isFinite(policy.estimatedAnnualPremium?.high)
    ? Math.round((policy.estimatedAnnualPremium.low + policy.estimatedAnnualPremium.high) / 2)
    : null;

  const isGap = policy.status === 'gap';
  const showLocationBadge = policy.locationDependent && isGap;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -4, scale: 1.01 }}
      className={`glass-card p-5 ${
        isGap ? 'border-gap/40' :
        policy.status === 'underinsured' ? 'border-underinsured/40' :
        'border-white/10'
      }`}
    >
      <div className="mb-2 flex items-start justify-between">
        <h4 className="font-heading font-semibold text-text-primary">{policy.name}</h4>
        <StatusBadge status={badgeStatus} label={policy.statusLabel} />
      </div>
      <p className="mb-3 text-sm text-text-secondary">{policy.description}</p>

      {showLocationBadge && (
        <span className="mb-3 inline-block rounded-full border border-gap/30 bg-gap/20 px-2 py-0.5 text-xs font-medium text-gap">
          Location Risk
        </span>
      )}

      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-text-secondary">Recommended Limit</span>
          <span className="font-medium text-text-primary">{policy.recommendedLimit}</span>
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
            <span className="font-medium text-text-primary">{formatCurrency(avgPremium)}</span>
          </div>
        )}
      </div>

      {isGap && policy.priority === 'critical' && (
        <div className="mt-3 rounded-lg border border-gap/20 bg-gap/10 p-2">
          <p className="text-xs font-medium text-gap">Why it matters: {policy.whyItMatters}</p>
        </div>
      )}
    </motion.div>
  );
}
