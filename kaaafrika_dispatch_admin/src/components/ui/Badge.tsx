import { clsx } from 'clsx';
import type { BadgeVariant } from './badgeUtils';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}

const variantMap: Record<BadgeVariant, string> = {
  green:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  red:     'bg-red-50 text-red-700 border-red-200',
  yellow:  'bg-amber-50 text-amber-700 border-amber-200',
  blue:    'bg-blue-50 text-blue-700 border-blue-200',
  slate:   'bg-slate-100 text-slate-600 border-slate-200',
  orange:  'bg-orange-50 text-orange-700 border-orange-200',
  purple:  'bg-purple-50 text-purple-700 border-purple-200',
};

const dotMap: Record<BadgeVariant, string> = {
  green:   'bg-emerald-500',
  emerald: 'bg-emerald-500',
  red:     'bg-red-500',
  yellow:  'bg-amber-500',
  blue:    'bg-blue-500',
  slate:   'bg-slate-400',
  orange:  'bg-orange-500',
  purple:  'bg-purple-500',
};

export function Badge({ label, variant = 'slate', dot = false, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        variantMap[variant],
        className
      )}
    >
      {dot && (
        <span className={clsx('w-1.5 h-1.5 rounded-full', dotMap[variant])} />
      )}
      {label}
    </span>
  );
}
