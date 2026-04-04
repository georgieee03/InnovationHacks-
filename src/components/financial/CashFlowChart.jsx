import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { motion } from 'framer-motion';
import { formatCurrency } from '../../utils/formatCurrency';

export default function CashFlowChart({ data }) {
  if (!data?.length) return null;

  return (
    <motion.div
      className="glass-card p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Monthly Cash Flow</h3>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.3}/>
            </linearGradient>
            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8}/>
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.3}/>
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} />
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
          <Legend />
          <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
          <Bar 
            dataKey="totalIncome" 
            name="Income" 
            fill="url(#incomeGradient)" 
            radius={[6,6,0,0]}
            animationDuration={800}
            animationBegin={0}
          />
          <Bar 
            dataKey="totalExpenses" 
            name="Expenses" 
            fill="url(#expenseGradient)" 
            radius={[6,6,0,0]}
            animationDuration={800}
            animationBegin={200}
          />
          <Line 
            dataKey="netCashFlow" 
            name="Net Cash Flow" 
            type="monotone" 
            stroke="#06b6d4" 
            strokeWidth={3} 
            dot={{ r: 5, fill: '#06b6d4', strokeWidth: 2, stroke: '#0a0e1a' }}
            filter="url(#glow)"
            animationDuration={1000}
            animationBegin={400}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="text-xs text-text-secondary mt-3">
        ⚠️ December: Equipment repair ($2,847) caused a negative cash flow month
      </p>
    </motion.div>
  );
}
