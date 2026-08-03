import { useState, useEffect } from 'react';

interface ProgressCircleProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  animate?: boolean;
}

export function ProgressCircle({
  value, size = 100, strokeWidth = 8, color = '#0F7B0F', label, animate = true,
}: ProgressCircleProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;
  const [animatedOffset, setAnimatedOffset] = useState(animate ? circumference : offset);

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setAnimatedOffset(offset), 200);
      return () => clearTimeout(timer);
    }
  }, [animate, offset]);

  return (
    <div className="relative inline-flex flex-col items-center gap-2">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-100 dark:text-slate-800"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animatedOffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-slate-800 dark:text-white">{Math.round(value)}%</span>
      </div>
      {label && (
        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
      )}
    </div>
  );
}
