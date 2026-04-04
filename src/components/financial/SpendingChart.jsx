import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatCurrency';

export default function SpendingChart({ data }) {
  if (!data) return null;

  const chartData = Object.entries(data).map(([key, value]) => ({
    name: CATEGORY_LABELS[key] || key,
    value: Math.round(value * 100) / 100,
    color: CATEGORY_COLORS[key] || '#94a3b8',
  }));

  return (
    <motion.div
      className="glass-card p-5"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Spending by Category</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <defs>
            {chartData.map((entry, i) => (
              <radialGradient key={`gradient-${i}`} id={`gradient-${i}`}>
                <stop offset="0%" stopColor={entry.color} stopOpacity={0.9}/>
                <stop offset="100%" stopColor={entry.color} stopOpacity={0.6}/>
              </radialGradient>
            ))}
          </defs>
          <Pie 
            data={chartData} 
            dataKey="value" 
            nameKey="name" 
            cx="50%" 
            cy="50%"
            outerRadius={100} 
            innerRadius={50} 
            paddingAngle={3}
            animationBegin={0}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {chartData.map((entry, i) => (
              <Cell 
                key={i} 
                fill={`url(#gradient-${i})`}
                stroke="rgba(10, 14, 26, 0.5)"
                strokeWidth={2}
              />
            ))}
          </Pie>
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
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
