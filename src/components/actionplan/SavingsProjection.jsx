import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { formatCurrency } from '../../utils/formatCurrency';
import useTheme from '../../hooks/useTheme';
import useScrollAnimation, { scrollFadeInUp } from '../../hooks/useScrollAnimation';

const MotionDiv = motion.div;

export default function SavingsProjection({ metrics }) {
  const { theme } = useTheme();
  const { ref, controls, inView, prefersReducedMotion } = useScrollAnimation();
  const chartColors = theme === 'light'
    ? {
        primary: '#0891b2',
        success: '#059669',
        grid: 'rgba(15, 23, 42, 0.08)',
        axisText: '#52525b',
        tooltipBackground: 'rgba(255, 255, 255, 0.96)',
        tooltipBorder: 'rgba(15, 23, 42, 0.1)',
        tooltipText: '#0a0a0b',
        tooltipShadow: '0 18px 34px rgba(15, 23, 42, 0.12)',
      }
    : {
        primary: '#06b6d4',
        success: '#10b981',
        grid: 'rgba(255,255,255,0.06)',
        axisText: '#71717a',
        tooltipBackground: 'rgba(17, 17, 19, 0.96)',
        tooltipBorder: 'rgba(255,255,255,0.1)',
        tooltipText: '#fafafa',
        tooltipShadow: '0 18px 34px rgba(0, 0, 0, 0.35)',
      };

  if (!metrics) return null;

  const target = metrics.recommendedEmergencyFund;
  const current = metrics.currentReserves;
  const monthlySavings = Math.round(metrics.averageMonthlyIncome - metrics.averageMonthlyExpenses);

  const data = [];
  for (let index = 0; index <= 12; index += 1) {
    data.push({
      month: index === 0 ? 'Now' : `Mo ${index}`,
      reserves: Math.min(target, Math.round(current + monthlySavings * index)),
      target,
    });
  }

  const monthsToTarget = monthlySavings > 0
    ? Math.ceil((target - current) / monthlySavings)
    : null;

  return (
    <MotionDiv
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={scrollFadeInUp}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      className="glass-card p-5"
    >
      <h3 className="mb-1 text-2xl font-heading font-light tracking-[-0.02em] text-text-primary">Reserve Projection</h3>
      <p className="mb-4 text-sm font-light text-text-secondary">
        {monthlySavings > 0
          ? `At ${formatCurrency(monthlySavings)}/mo net savings, you'll reach your emergency fund target in about ${monthsToTarget} months`
          : 'Increase net savings to build your emergency fund'}
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="reservesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColors.primary} stopOpacity={0.35} />
              <stop offset="100%" stopColor={chartColors.primary} stopOpacity={0.06} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: chartColors.axisText }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} tick={{ fontSize: 12, fill: chartColors.axisText }} axisLine={false} tickLine={false} />
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
          <ReferenceLine
            y={target}
            stroke={chartColors.success}
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{ value: 'Target', position: 'right', fontSize: 11, fill: chartColors.success }}
          />
          <Area
            type="monotone"
            dataKey="reserves"
            stroke={chartColors.primary}
            fill="url(#reservesGradient)"
            strokeWidth={3}
            isAnimationActive={prefersReducedMotion ? false : inView}
            animationDuration={1200}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </MotionDiv>
  );
}
