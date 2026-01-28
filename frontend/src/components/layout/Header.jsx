import { Bell, Search, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import { Dropdown, DropdownItem, DropdownDivider } from '../ui/Dropdown';

export function Header({ title, subtitle, actions }) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-slate-200">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left: Title */}
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          {subtitle && (
            <p className="text-sm text-slate-500">{subtitle}</p>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg w-64">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium text-slate-400 bg-white rounded border border-slate-200">
              ⌘K
            </kbd>
          </div>

          {/* Notifications */}
          <Dropdown
            trigger={
              <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>
            }
            align="right"
          >
            <div className="px-4 py-3 text-sm font-medium text-slate-900 border-b border-slate-100">
              Notifications
            </div>
            <div className="py-3 px-4 text-sm text-slate-500 text-center">
              No new notifications
            </div>
          </Dropdown>

          {/* Custom Actions */}
          {actions}
        </div>
      </div>
    </header>
  );
}

export default Header;
