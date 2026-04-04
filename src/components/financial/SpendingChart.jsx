import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { formatCategoryLabel } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatCurrency';
import useTheme from '../../hooks/useTheme';
import useScrollAnimation, { scrollFadeInUp } from '../../hooks/useScrollAnimation';

const MotionDiv = motion.div;

export default function SpendingChart({ data }) {
  const { theme } = useTheme();
  const { ref, controls, inView, prefersReducedMotion } = useScrollAnimation();
  const chartColors = theme === 'light'
    ? {
        tooltipBackground: 'rgba(255, 255, 255, 0.96)',
        tooltipBorder: 'rgba(15, 23, 42, 0.1)',
        tooltipText: '#0a0a0b',
        tooltipShadow: '0 18px 34px rgba(15, 23, 42, 0.12)',
        legend: '#52525b',
        sliceStroke: 'rgba(255, 255, 255, 0.9)',
        categories: {
          rent: '#9333ea',
          supplies: '#2563eb',
          payroll: '#059669',
          utilities: '#d97706',
          equipment: '#dc2626',
          subscriptions: '#7c3aed',
          miscellaneous: '#64748b',
        },
      }
    : {
        tooltipBackground: 'rgba(17, 17, 19, 0.96)',
        tooltipBorder: 'rgba(255,255,255,0.1)',
        tooltipText: '#fafafa',
        tooltipShadow: '0 18px 34px rgba(0, 0, 0, 0.35)',
        legend: '#a1a1aa',
        sliceStroke: 'rgba(17, 17, 19, 0.88)',
        categories: {
          rent: '#8b5cf6',
          supplies: '#3b82f6',
          payroll: '#10b981',
          utilities: '#f59e0b',
          equipment: '#ef4444',
          subscriptions: '#6366f1',
          miscellaneous: '#94a3b8',
        },
      };

  if (!data) return null;

  const chartData = Object.entries(data).map(([key, value]) => ({
    name: formatCategoryLabel(key),
    value: Math.round(value * 100) / 100,
    color: chartColors.categories[key] || chartColors.categories.miscellaneous,
  }));

  if (!chartData.length) return null;

  return (
    <MotionDiv
      ref={ref}
      className="glass-card p-5"
      initial="hidden"
      animate={controls}
      variants={scrollFadeInUp}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
    >
      <h3 className="mb-4 text-2xl font-heading font-light tracking-[-0.02em] text-text-primary">Spending by Category</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <defs>
            {chartData.map((entry, index) => (
              <radialGradient key={`gradient-${index}`} id={`gradient-${index}`}>
                <stop offset="0%" stopColor={entry.color} stopOpacity={0.95} />
                <stop offset="100%" stopColor={entry.color} stopOpacity={0.6} />
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
            isAnimationActive={prefersReducedMotion ? false : inView}
            animationBegin={0}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={`url(#gradient-${index})`}
                stroke={chartColors.sliceStroke}
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [formatCurrency(value), name]}
            contentStyle={{
              backgroundColor: chartColors.tooltipBackground,
              border: `1px solid ${chartColors.tooltipBorder}`,
              borderRadius: '12px',
              boxShadow: chartColors.tooltipShadow,
            }}
            labelStyle={{ color: chartColors.tooltipText, fontWeight: 400 }}
            itemStyle={{ color: chartColors.tooltipText }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', color: chartColors.legend, paddingTop: '8px' }} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </MotionDiv>
  );
}
