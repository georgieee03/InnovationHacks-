import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { formatCurrency } from '../../utils/formatCurrency';

export default function SavingsProjection({ metrics }) {
  if (!metrics) return null;

  const target = metrics.recommendedEmergencyFund;
  const current = metrics.currentReserves;
  const monthlySavings = Math.round(metrics.averageMonthlyIncome - metrics.averageMonthlyExpenses);

  // Project 12 months of savings
  const data = [];
  for (let i = 0; i <= 12; i++) {
    data.push({
      month: i === 0 ? 'Now' : `Mo ${i}`,
      reserves: Math.min(target, Math.round(current + monthlySavings * i)),
      target,
    });
  }

  const monthsToTarget = monthlySavings > 0
    ? Math.ceil((target - current) / monthlySavings)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card rounded-xl shadow-sm border border-gray-100 p-5"
    >
      <h3 className="text-lg font-heading font-semibold text-text-primary mb-1">Reserve Projection</h3>
      <p className="text-sm text-text-secondary mb-4">
        {monthlySavings > 0
          ? `At ${formatCurrency(monthlySavings)}/mo net savings, you'll reach your emergency fund target in ~${monthsToTarget} months`
          : 'Increase net savings to build your emergency fund'
        }
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v) => formatCurrency(v)} />
          <ReferenceLine y={target} stroke="#10b981" strokeDasharray="5 5" label={{ value: 'Target', position: 'right', fontSize: 11 }} />
          <Area type="monotone" dataKey="reserves" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
