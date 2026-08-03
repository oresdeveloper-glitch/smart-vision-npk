interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  children: string;
  pulse?: boolean;
}

const variants = {
  default: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/15 dark:text-green-300 dark:border-green-800/30',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/15 dark:text-emerald-300 dark:border-emerald-800/30',
  warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/15 dark:text-amber-300 dark:border-amber-800/30',
  error: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/15 dark:text-rose-300 dark:border-rose-800/30',
  info: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/15 dark:text-blue-300 dark:border-blue-800/30',
  neutral: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/30 dark:text-slate-300 dark:border-slate-700/30',
};

const dots = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-rose-500',
  info: 'bg-blue-500',
  neutral: 'bg-slate-400',
  default: 'bg-green-500',
};

export function Badge({ variant = 'default', size = 'sm', children, pulse }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${
      size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
    } ${variants[variant]}`}>
      {pulse && (
        <span className={`w-1.5 h-1.5 rounded-full ${dots[variant]} ${pulse ? 'animate-pulse' : ''}`} />
      )}
      {children}
    </span>
  );
}

export function SeverityBadge({ severity, size = 'sm' }: { severity: string; size?: 'sm' | 'md' }) {
  const map: Record<string, { variant: 'success' | 'warning' | 'error' | 'info'; label: string }> = {
    low: { variant: 'success', label: 'Low' },
    moderate: { variant: 'warning', label: 'Moderate' },
    severe: { variant: 'error', label: 'Severe' },
    critical: { variant: 'error', label: 'Critical' },
  };
  const m = map[severity.toLowerCase()] || { variant: 'neutral' as const, label: severity };
  return <Badge variant={m.variant} size={size} pulse>{m.label}</Badge>;
}

export function DeficiencyBadge({ deficiency, size = 'sm' }: { deficiency: string; size?: 'sm' | 'md' }) {
  const map: Record<string, { variant: 'error' | 'warning' | 'info' | 'success'; label: string }> = {
    nitrogen: { variant: 'error', label: 'Nitrogen (N)' },
    phosphorus: { variant: 'warning', label: 'Phosphorus (P)' },
    potassium: { variant: 'info', label: 'Potassium (K)' },
    healthy: { variant: 'success', label: 'Healthy' },
  };
  const m = map[deficiency.toLowerCase()] || { variant: 'neutral' as const, label: deficiency };
  return <Badge variant={m.variant} size={size}>{m.label}</Badge>;
}
