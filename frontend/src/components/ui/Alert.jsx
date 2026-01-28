import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/helpers';

const variants = {
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: Info,
    iconColor: 'text-blue-500',
  },
  success: {
    container: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    icon: CheckCircle,
    iconColor: 'text-emerald-500',
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-800',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icon: AlertCircle,
    iconColor: 'text-red-500',
  },
};

export function Alert({ 
  variant = 'info', 
  title, 
  children, 
  className,
}) {
  const config = variants[variant];
  const Icon = config.icon;

  return (
    <div className={cn(
      'flex gap-3 p-4 rounded-xl border',
      config.container,
      className
    )}>
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', config.iconColor)} />
      <div>
        {title && (
          <p className="font-medium mb-1">{title}</p>
        )}
        <div className="text-sm opacity-90">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Alert;
