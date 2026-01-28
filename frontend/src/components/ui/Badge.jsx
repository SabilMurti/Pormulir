import { cn } from '../../utils/helpers';

const variants = {
  primary: 'badge-primary',
  success: 'badge-success',
  warning: 'badge-warning',
  error: 'badge-error',
  neutral: 'badge-neutral',
};

export function Badge({ 
  children, 
  variant = 'neutral', 
  className,
  dot = false,
}) {
  return (
    <span className={cn('badge', variants[variant], className)}>
      {dot && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full mr-1.5',
          variant === 'success' && 'bg-accent-500',
          variant === 'warning' && 'bg-amber-500',
          variant === 'error' && 'bg-red-500',
          variant === 'primary' && 'bg-primary-500',
          variant === 'neutral' && 'bg-slate-400',
        )} />
      )}
      {children}
    </span>
  );
}

export default Badge;
