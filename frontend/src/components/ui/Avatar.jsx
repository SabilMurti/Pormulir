import { cn, getInitials } from '../../utils/helpers';

const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
};

export function Avatar({ 
  src, 
  alt, 
  name, 
  size = 'md', 
  className 
}) {
  const initials = getInitials(name || alt);

  if (src) {
    return (
      <img
        src={src}
        alt={alt || name}
        className={cn(
          'rounded-full object-cover ring-2 ring-white',
          sizes[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-medium',
        sizes[size],
        className
      )}
    >
      {initials}
    </div>
  );
}

export function AvatarGroup({ children, max = 4, className }) {
  const items = Array.isArray(children) ? children : [children];
  const visible = items.slice(0, max);
  const remaining = items.length - max;

  return (
    <div className={cn('flex -space-x-2', className)}>
      {visible}
      {remaining > 0 && (
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600 ring-2 ring-white">
          +{remaining}
        </div>
      )}
    </div>
  );
}

export default Avatar;
