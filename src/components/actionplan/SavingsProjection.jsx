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
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="glass-card p-5"
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
          <defs>
            <linearGradient id="reservesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4}/>
              <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
          <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12, fill: '#94a3b8' }} />
          <Tooltip 
            formatter={(v) => formatCurrency(v)}
            contentStyle={{ 
              backgroundColor: 'rgba(10, 14, 26, 0.95)', 
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              backdropFilter: 'blur(16px)'
            }}
            labelStyle={{ color: '#f1f5f9' }}
          />
          <ReferenceLine 
            y={target} 
            stroke="#10b981" 
            strokeDasharray="5 5" 
            strokeWidth={2}
            label={{ value: 'Target', position: 'right', fontSize: 11, fill: '#10b981' }} 
          />
          <Area 
            type="monotone" 
            dataKey="reserves" 
            stroke="#06b6d4" 
            fill="url(#reservesGradient)" 
            strokeWidth={3}
            animationDuration={1200}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
