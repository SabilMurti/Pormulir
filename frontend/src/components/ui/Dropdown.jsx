import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/helpers';

export function Dropdown({ 
  trigger, 
  children, 
  align = 'left',
  className,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      
      {isOpen && (
        <div 
          className={cn(
            'absolute z-50 mt-2 min-w-[200px] bg-white rounded-xl shadow-lg border border-slate-200 py-1 animate-slide-down',
            align === 'right' && 'right-0',
            align === 'left' && 'left-0',
            className
          )}
          onClick={() => setIsOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({ 
  children, 
  icon: Icon, 
  onClick, 
  danger = false,
  className,
}) {
  return (
    <button
      className={cn(
        'w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors',
        danger 
          ? 'text-red-600 hover:bg-red-50' 
          : 'text-slate-700 hover:bg-slate-50',
        className
      )}
      onClick={onClick}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}

export function DropdownDivider() {
  return <div className="my-1 border-t border-slate-100" />;
}

export function Select({ 
  label, 
  value, 
  onChange, 
  options, 
  placeholder = 'Select...',
  className,
  error,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = options.find(opt => opt.value === value);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <div ref={selectRef} className="relative">
        <button
          type="button"
          className={cn(
            'input flex items-center justify-between w-full text-left',
            error && 'input-error',
            className
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={!selected ? 'text-slate-400' : ''}>
            {selected?.label || placeholder}
          </span>
          <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', isOpen && 'rotate-180')} />
        </button>
        
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 max-h-60 overflow-auto animate-slide-down">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className={cn(
                  'w-full text-left px-4 py-2 text-sm transition-colors',
                  option.value === value 
                    ? 'bg-primary-50 text-primary-700' 
                    : 'text-slate-700 hover:bg-slate-50'
                )}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

export default Dropdown;
