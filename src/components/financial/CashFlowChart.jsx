import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { motion } from 'framer-motion';
import { formatCurrency } from '../../utils/formatCurrency';
import useTheme from '../../hooks/useTheme';
import useScrollAnimation, { scrollFadeInUp } from '../../hooks/useScrollAnimation';

const MotionDiv = motion.div;

export default function CashFlowChart({ data }) {
  const { theme } = useTheme();
  const { ref, controls, inView, prefersReducedMotion } = useScrollAnimation();
  const chartColors = theme === 'light'
    ? {
        income: '#059669',
        expense: '#dc2626',
        primary: '#00CF31',
        grid: 'rgba(15, 23, 42, 0.08)',
        axisText: '#52525b',
        tooltipBackground: 'rgba(255, 255, 255, 0.96)',
        tooltipBorder: 'rgba(15, 23, 42, 0.1)',
        tooltipText: '#0a0a0b',
        cursorFill: 'rgba(0, 207, 49, 0.06)',
        legend: '#52525b',
        zeroLine: 'rgba(15, 23, 42, 0.16)',
        dotStroke: '#ffffff',
        activeDotStroke: '#0a0a0b',
        glow: 'rgba(0, 207, 49, 0.14)',
        tooltipShadow: '0 18px 34px rgba(15, 23, 42, 0.12)',
      }
    : {
        income: '#10b981',
        expense: '#ef4444',
        primary: '#00CF31',
        grid: 'rgba(255, 255, 255, 0.06)',
        axisText: '#71717a',
        tooltipBackground: 'rgba(17, 17, 19, 0.96)',
        tooltipBorder: 'rgba(255,255,255,0.1)',
        tooltipText: '#fafafa',
        cursorFill: 'rgba(255, 255, 255, 0.03)',
        legend: '#a1a1aa',
        zeroLine: 'rgba(255,255,255,0.16)',
        dotStroke: '#111113',
        activeDotStroke: '#fafafa',
        glow: 'rgba(0, 207, 49, 0.18)',
        tooltipShadow: '0 18px 34px rgba(0, 0, 0, 0.35)',
      };

  if (!data?.length) return null;

  const weakestMonth = data.reduce((currentWeakest, month) => {
    if (!currentWeakest || month.netCashFlow < currentWeakest.netCashFlow) {
      return month;
    }
    return currentWeakest;
  }, null);
  const insightText = weakestMonth?.netCashFlow < 0
    ? `${weakestMonth.label}: ${formatCurrency(Math.abs(weakestMonth.netCashFlow))} net outflow month.`
    : `${data.length} month${data.length === 1 ? '' : 's'} of cash flow activity loaded.`;

  return (
    <MotionDiv
      ref={ref}
      className="glass-card p-5"
      initial="hidden"
      animate={controls}
      variants={scrollFadeInUp}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
    >
      <h3 className="mb-4 text-2xl font-heading font-light tracking-[-0.02em] text-text-primary">Monthly Cash Flow</h3>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColors.income} stopOpacity={0.8} />
              <stop offset="100%" stopColor={chartColors.income} stopOpacity={0.24} />
            </linearGradient>
            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColors.expense} stopOpacity={0.78} />
              <stop offset="100%" stopColor={chartColors.expense} stopOpacity={0.22} />
            </linearGradient>
            <filter id="cashFlowGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feFlood floodColor={chartColors.glow} floodOpacity="1" result="glowColor" />
              <feComposite in="glowColor" in2="coloredBlur" operator="in" result="coloredGlow" />
              <feMerge>
                <feMergeNode in="coloredGlow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: chartColors.axisText }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} tick={{ fontSize: 12, fill: chartColors.axisText }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value, name) => [formatCurrency(value), name]}
            cursor={{ fill: chartColors.cursorFill }}
            contentStyle={{
              backgroundColor: chartColors.tooltipBackground,
              border: `1px solid ${chartColors.tooltipBorder}`,
              borderRadius: '12px',
              boxShadow: chartColors.tooltipShadow,
            }}
            labelStyle={{ color: chartColors.tooltipText, fontWeight: 400 }}
            itemStyle={{ color: chartColors.tooltipText }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', color: chartColors.legend, paddingTop: '8px' }} />
          <ReferenceLine y={0} stroke={chartColors.zeroLine} strokeDasharray="3 3" />
          <Bar
            dataKey="totalIncome"
            name="Income"
            fill="url(#incomeGradient)"
            radius={[6, 6, 0, 0]}
            isAnimationActive={prefersReducedMotion ? false : inView}
            animationDuration={800}
            animationBegin={0}
          />
          <Bar
            dataKey="totalExpenses"
            name="Expenses"
            fill="url(#expenseGradient)"
            radius={[6, 6, 0, 0]}
            isAnimationActive={prefersReducedMotion ? false : inView}
            animationDuration={800}
            animationBegin={200}
          />
          <Line
            dataKey="netCashFlow"
            name="Net Cash Flow"
            type="monotone"
            stroke={chartColors.primary}
            strokeWidth={3}
            dot={{ r: 4, fill: chartColors.primary, strokeWidth: 2, stroke: chartColors.dotStroke }}
            activeDot={{ r: 6, fill: chartColors.primary, stroke: chartColors.activeDotStroke, strokeWidth: 2 }}
            filter="url(#cashFlowGlow)"
            isAnimationActive={prefersReducedMotion ? false : inView}
            animationDuration={1000}
            animationBegin={400}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="mt-3 text-xs font-light text-text-secondary">
        {insightText}
      </p>
    </MotionDiv>
  );
}
