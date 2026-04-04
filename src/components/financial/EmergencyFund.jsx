import { motion } from 'framer-motion';
import { formatCurrency } from '../../utils/formatCurrency';

export default function EmergencyFund({ metrics, riskFactors, businessInfo }) {
  if (!metrics) return null;

  const pct = metrics.emergencyFundPercent;
  const barColor = pct < 33 ? 'bg-gap' : pct < 66 ? 'bg-underinsured' : 'bg-covered';

  const riskLabels = riskFactors?.risks
    ? Object.values(riskFactors.risks).map((r) => r.label)
    : [];
  const multiplier = riskFactors?.emergencyFundMultiplier || 3;
  const monthlySaving = metrics.emergencyFundGap > 0
    ? formatCurrency(metrics.emergencyFundGap / 6)
    : null;

  return (
    <div className="glass-card p-5">
      <h3 className="text-lg font-heading font-semibold text-text-primary mb-1">Emergency Fund</h3>
      <p className="text-sm text-text-secondary mb-4">
        Recommended: {formatCurrency(metrics.recommendedEmergencyFund)} (based on {metrics.monthsOfRunway < 3 ? 'high' : 'moderate'} risk location)
      </p>

      <div className="w-full bg-white/5 rounded-full h-4 mb-3 overflow-hidden">
        <motion.div
          className={`h-4 rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, pct)}%` }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
          style={{
            boxShadow: pct >= 66 ? '0 0 20px rgba(16, 185, 129, 0.4)' : pct >= 33 ? '0 0 20px rgba(245, 158, 11, 0.4)' : '0 0 20px rgba(239, 68, 68, 0.4)'
          }}
        />
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-text-secondary">
          Current: {formatCurrency(metrics.currentReserves)} ({pct}%)
        </span>
        {metrics.emergencyFundGap > 0 && (
          <span className="text-gap font-medium">
            Gap: {formatCurrency(metrics.emergencyFundGap)}
          </span>
        )}
      </div>

      {riskLabels.length > 0 && (
        <p className="text-sm text-text-secondary mt-4">
          Because your business is in a {riskLabels.join(', ')} area, we recommend {multiplier} months of reserves instead of the standard 3.
        </p>
      )}

      {metrics.emergencyFundGap > 0 && (
        <motion.div
          className="mt-4 rounded-lg bg-underinsured/10 border border-underinsured/30 p-4 backdrop-blur-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          <p className="text-sm text-underinsured font-medium">
            You need an additional {formatCurrency(metrics.emergencyFundGap)} to reach the recommended level. Consider saving {monthlySaving}/month to reach your goal in 6 months.
          </p>
        </motion.div>
      )}
    </div>
  );
}
