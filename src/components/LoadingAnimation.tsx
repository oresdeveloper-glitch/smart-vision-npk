import { Leaf } from 'lucide-react';

export function LeafLoading({ text, subtext }: { text: string; subtext?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-16">
      {/* Animated leaf spinner */}
      <div className="relative w-28 h-28">
        <div className="absolute inset-0 rounded-full border-[3px] border-green-100 dark:border-green-900/30 animate-ping opacity-30" />
        <div className="absolute inset-2 rounded-full border-[3px] border-t-green-500 border-r-green-300 border-b-green-100 dark:border-b-green-800 border-l-green-300 animate-spin" />
        <div className="absolute inset-4 rounded-full border-[3px] border-t-transparent border-r-transparent border-b-green-400 border-l-transparent animate-spin" style={{ animationDuration: '0.8s', animationDirection: 'reverse' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Leaf size={32} className="text-green-600 dark:text-green-400" fill="currentColor" fillOpacity={0.15} />
        </div>
      </div>

      <div className="text-center space-y-1.5">
        <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{text}</p>
        {subtext && (
          <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">{subtext}</p>
        )}
      </div>
    </div>
  );
}

export function Spinner({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function SkeletonCard() {
  return (
    <div className="glass-card rounded-2xl p-4 space-y-3">
      <div className="skeleton h-4 w-2/3" />
      <div className="skeleton h-3 w-full" />
      <div className="skeleton h-3 w-1/2" />
    </div>
  );
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
