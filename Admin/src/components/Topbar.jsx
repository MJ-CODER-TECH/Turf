import { Bell, Search, Menu, Sun } from 'lucide-react';

export default function Topbar({ title, subtitle, onToggleSidebar }) {
  return (
    <header className="h-16 bg-dark-300/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <Menu size={16} className="text-white/60" />
        </button>
        <div>
          <h1 className="text-white font-display font-bold text-lg leading-none">{title}</h1>
          {subtitle && <p className="text-white/40 text-xs mt-0.5">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-3 py-2 w-56">
          <Search size={14} className="text-white/30 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-white/70 text-sm placeholder-white/30 focus:outline-none w-full"
          />
        </div>

        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
          <Bell size={16} className="text-white/60" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full"></span>
        </button>

        {/* Date */}
        <div className="hidden lg:flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
          <Sun size={14} className="text-primary-400" />
          <span className="text-white/60 text-sm font-medium">
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
        </div>
      </div>
    </header>
  );
}
