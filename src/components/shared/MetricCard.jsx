import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const TREND_ICONS = {
  up: <TrendingUp className="w-4 h-4 text-covered" />,
  down: <TrendingDown className="w-4 h-4 text-gap" />,
  neutral: <Minus className="w-4 h-4 text-text-secondary" />,
};

export default function MetricCard({ title, value, subtitle, trend, color }) {
  return (
    <div className="bg-card rounded-xl shadow-sm border border-gray-100 p-5">
      <p className="text-sm text-text-secondary font-medium">{title}</p>
      <p className={`text-2xl font-heading font-bold mt-1 ${color || 'text-text-primary'}`}>
        {value}
      </p>
      {(subtitle || trend) && (
        <div className="flex items-center gap-1.5 mt-2">
          {trend && TREND_ICONS[trend]}
          {subtitle && <span className="text-xs text-text-secondary">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
