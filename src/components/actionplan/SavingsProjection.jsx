import { motion } from 'framer-motion';
import { formatCurrency } from '../../utils/formatCurrency';

const MotionDiv = motion.div;

function getAggregateMonthlyCost(items, phase) {
  return (items || [])
    .filter((item) => !phase || item.executionPhase === phase)
    .reduce((sum, item) => sum + Number(item.estimatedMonthlyCost || 0), 0);
}

function getBudgetReadiness(metrics, immediateCost) {
  const monthlyNet = Number(metrics?.averageMonthlyIncome || 0) - Number(metrics?.averageMonthlyExpenses || 0);
  const runway = Number(metrics?.monthsOfRunway || 0);

  if (immediateCost <= 0) {
    return {
      label: 'Needs quote review',
      detail: 'SafeGuard can prioritize the work, but some actions still need carrier or agent pricing to judge timing.',
    };
  }

  if (monthlyNet > immediateCost * 2) {
    return {
      label: 'Can absorb now',
      detail: `Your current monthly margin appears strong enough to carry about ${formatCurrency(immediateCost)}/month in immediate insurance upgrades.`,
    };
  }

  if (runway >= 4) {
    return {
      label: 'Phase over time',
      detail: `The business can likely stage these changes, but timing them across the next renewal cycle will protect reserves.`,
    };
  }

  return {
    label: 'Defer until margin improves',
    detail: `Your reserve position is thin right now, so bind the most critical protection first and phase the rest behind revenue improvement.`,
  };
}

export default function SavingsProjection({ metrics, items, projectedScore }) {
  if (!metrics) {
    return null;
  }

  const monthlyNet = Number(metrics.averageMonthlyIncome || 0) - Number(metrics.averageMonthlyExpenses || 0);
  const immediateCost = getAggregateMonthlyCost(items, 'Now');
  const renewalCost = getAggregateMonthlyCost(items, 'This renewal cycle');
  const readiness = getBudgetReadiness(metrics, immediateCost);

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      className="glass-card p-5"
    >
      <h3 className="text-2xl font-heading font-light tracking-[-0.02em] text-text-primary">
        Coverage budget readiness
      </h3>
      <p className="mt-1 text-sm text-text-secondary">
        This panel uses your current cashflow and reserve posture to help stage the plan without pretending to be a quote.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="surface-panel rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-text-secondary">Monthly margin</p>
          <p className="mt-2 text-2xl font-heading font-light tracking-[-0.03em] text-text-primary">
            {formatCurrency(monthlyNet)}
          </p>
        </div>

        <div className="surface-panel rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-text-secondary">Immediate actions</p>
          <p className="mt-2 text-2xl font-heading font-light tracking-[-0.03em] text-text-primary">
            {immediateCost > 0 ? `${formatCurrency(immediateCost)}/mo` : 'Needs review'}
          </p>
        </div>

        <div className="surface-panel rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-text-secondary">Renewal-cycle actions</p>
          <p className="mt-2 text-2xl font-heading font-light tracking-[-0.03em] text-text-primary">
            {renewalCost > 0 ? `${formatCurrency(renewalCost)}/mo` : 'None queued'}
          </p>
        </div>

        <div className="surface-panel rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-text-secondary">Projected protection</p>
          <p className="mt-2 text-2xl font-heading font-light tracking-[-0.03em] text-primary">
            {projectedScore}%
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/5 p-4">
        <p className="text-sm font-medium text-text-primary">{readiness.label}</p>
        <p className="mt-1 text-sm leading-6 text-text-secondary">{readiness.detail}</p>
      </div>
    </MotionDiv>
  );
}
