import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Truck,
  Package,
  Map,
  Wallet,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import logo from '../assets/horizontal_logo.svg';

const navItems = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard'   },
  { to: '/live-map',     icon: Map,             label: 'Live Map'    },
  { to: '/dispatchers',  icon: Truck,           label: 'Dispatchers' },
  { to: '/deliveries',   icon: Package,         label: 'Delivery History'  },
  { to: '/wallet',       icon: Wallet,          label: 'Wallet'      },
  { to: '/settings',     icon: Settings,        label: 'Settings'    },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      toast.error('Logout failed');
    }
  };

  return (
    <aside
      className={clsx(
        'relative flex flex-col bg-slate-800 border-r border-slate-700 transition-all duration-300 ease-in-out flex-shrink-0',
        collapsed ? 'w-[68px]' : 'w-[228px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-center px-4 border-b border-slate-800 h-[72px]">
        {!collapsed ? (
          <img src={logo} alt="KaaAfrika" className="h-8 object-contain" />
        ) : (
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )
            }
          >
            <Icon className="w-4.5 h-4.5 flex-shrink-0 w-[18px] h-[18px]" />
            {!collapsed && (
              <span className="truncate animate-fade-in">{label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer: admin avatar + logout */}
      <div className="border-t border-slate-800 p-3 space-y-1">
        {!collapsed && admin && (
          <div className="flex items-center gap-2.5 px-2 py-2 animate-fade-in">
            <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-white">
                {admin.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-white truncate">{admin.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{admin.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all duration-150"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="animate-fade-in">Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all shadow-md z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
