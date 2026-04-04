import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { motion } from 'framer-motion';
import { formatCurrency } from '../../utils/formatCurrency';

export default function CashFlowChart({ data }) {
  if (!data?.length) return null;

  return (
    <motion.div
      className="bg-card rounded-xl shadow-sm border border-gray-100 p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Monthly Cash Flow</h3>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v) => formatCurrency(v)} />
          <Legend />
          <ReferenceLine y={0} stroke="#94a3b8" />
          <Bar dataKey="totalIncome" name="Income" fill="#10b981" radius={[4,4,0,0]} />
          <Bar dataKey="totalExpenses" name="Expenses" fill="#b91c1c" radius={[4,4,0,0]} />
          <Line dataKey="netCashFlow" name="Net Cash Flow" type="monotone" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="text-xs text-text-secondary mt-3">
        ⚠️ December: Equipment repair ($2,847) caused a negative cash flow month
      </p>
    </motion.div>
  );
}
