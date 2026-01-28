import { cn } from '../../utils/helpers';

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className,
}) {
  return (
    <div className={cn('empty-state', className)}>
      {Icon && (
        <Icon className="empty-state-icon" strokeWidth={1.5} />
      )}
      <h3 className="empty-state-title">{title}</h3>
      {description && (
        <p className="empty-state-description">{description}</p>
      )}
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
