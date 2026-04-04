import { formatCurrency } from '../../utils/formatCurrency';

export default function EmergencyFund({ metrics }) {
  if (!metrics) return null;

  const pct = metrics.emergencyFundPercent;
  const barColor = pct < 33 ? 'bg-gap' : pct < 66 ? 'bg-underinsured' : 'bg-covered';

  return (
    <div className="bg-card rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-lg font-heading font-semibold text-text-primary mb-1">Emergency Fund</h3>
      <p className="text-sm text-text-secondary mb-4">
        Recommended: {formatCurrency(metrics.recommendedEmergencyFund)} (based on {metrics.monthsOfRunway < 3 ? 'high' : 'moderate'} risk location)
      </p>

      <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
        <div className={`h-4 rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(100, pct)}%` }} />
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
    </div>
  );
}
