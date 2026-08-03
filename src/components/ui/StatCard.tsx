import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: { value: number; positive?: boolean };
  color?: string;
  delay?: number;
  subtitle?: string;
}

export function StatCard({ icon, label, value, trend, color = 'primary', delay = 0, subtitle }: StatCardProps) {
  const bgColors: Record<string, string> = {
    primary: 'bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400',
    secondary: 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400',
    accent: 'bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400',
    info: 'bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400',
    rose: 'bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400',
    purple: 'bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-400',
    cyan: 'bg-cyan-50 dark:bg-cyan-900/10 text-cyan-600 dark:text-cyan-400',
  };

  const TrendIcon = trend
    ? trend.value > 0
      ? TrendingUp
      : trend.value < 0
        ? TrendingDown
        : Minus
    : null;

  return (
    <div
      className="card-premium p-5 stagger"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${bgColors[color] || bgColors.primary}`}>
          {icon}
        </div>
        {trend && TrendIcon && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            trend.value > 0
              ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 dark:text-emerald-400'
              : trend.value < 0
                ? 'text-rose-600 bg-rose-50 dark:bg-rose-900/10 dark:text-rose-400'
                : 'text-slate-400 bg-slate-50 dark:bg-slate-800 dark:text-slate-500'
          }`}>
            <TrendIcon size={12} />
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight mb-0.5">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
      {subtitle && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">{subtitle}</p>
      )}
    </div>
  );
}
