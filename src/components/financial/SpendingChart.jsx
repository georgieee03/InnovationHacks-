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
      className="bg-card rounded-xl shadow-sm border border-gray-100 p-5"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Spending by Category</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%"
            outerRadius={100} innerRadius={50} paddingAngle={2}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => formatCurrency(v)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
