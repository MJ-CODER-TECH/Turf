import {
  LayoutDashboard, Calendar, MapPin, Users, CreditCard,
  Clock, BarChart3, Settings, ChevronRight, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'bookings', label: 'Bookings', icon: Calendar},
  { id: 'turfs', label: 'Turfs', icon: MapPin },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'slots', label: 'Time Slots', icon: Clock },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
];

export default function Sidebar({ active, onNavigate, collapsed }) {
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';
    
  return (
    <aside className={`fixed left-0 top-0 h-screen bg-dark-300 border-r border-white/5 flex flex-col transition-all duration-300 z-50 ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
        <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-white font-display font-bold text-sm">TZ</span>
        </div>
        {!collapsed && (
          <div>
            <p className="text-white font-display font-bold text-lg leading-none">TurfZone</p>
            <p className="text-primary-400 text-xs font-medium mt-0.5">Admin Panel</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="text-white/30 text-xs font-semibold uppercase tracking-widest px-3 pb-2">
            Main Menu
          </p>
        )}
        {navItems.map(({ id, label, icon: Icon, badge }) => (
          <div
            key={id}
            onClick={() => onNavigate(id)}
            className={`sidebar-item ${active === id ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
            title={collapsed ? label : ''}
          >
            <Icon size={18} className={`flex-shrink-0 ${active === id ? 'text-primary-400' : 'text-white/50'}`} />
            {!collapsed && (
              <>
                <span className="flex-1">{label}</span>
                {badge && (
                  <span className="bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {badge}
                  </span>
                )}
                {active === id && <ChevronRight size={14} className="text-primary-400" />}
              </>
            )}
          </div>
        ))}

        {!collapsed && (
          <p className="text-white/30 text-xs font-semibold uppercase tracking-widest px-3 pb-2 pt-4">
            System
          </p>
        )}
        <div
          onClick={() => onNavigate('settings')}
          className={`sidebar-item ${active === 'settings' ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
          title={collapsed ? 'Settings' : ''}
        >
          <Settings size={18} className={`flex-shrink-0 ${active === 'settings' ? 'text-primary-400' : 'text-white/50'}`} />
          {!collapsed && <span className="flex-1">Settings</span>}
        </div>
      </nav>

      {/* Bottom — click to go to profile page */}
      <div className="p-3 border-t border-white/5">
        <div
          onClick={() => onNavigate('profile')}
          className={`flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer ${active === 'profile' ? 'bg-primary-500/10 border border-primary-500/20' : ''} ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Profile' : ''}
        >
          {/* Avatar */}
          <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            {user?.avatar?.url ? (
              <img src={user.avatar.url} alt="avatar" className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <span className="text-primary-400 font-bold text-xs">{initials}</span>
            )}
          </div>

          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{user?.name || 'Admin'}</p>
                <p className="text-white/40 text-xs truncate">{user?.email || ''}</p>
              </div>
              <LogOut
                size={15}
                className="text-white/30 hover:text-red-400 transition-colors flex-shrink-0"
                onClick={(e) => { e.stopPropagation(); logout(); }}
              />
            </>
          )}
        </div>
      </div>
    </aside>
  );
}