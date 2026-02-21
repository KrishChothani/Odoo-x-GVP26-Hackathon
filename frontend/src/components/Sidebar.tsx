import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Truck, 
  MapPin, 
  Wrench, 
  DollarSign, 
  TrendingUp, 
  BarChart3 
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const location = useLocation();

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Vehicle Registry',
      path: '/dashboard/vehicle-registry',
      icon: Truck,
    },
    {
      name: 'Trip Dispatcher',
      path: '/dashboard/trip-dispatcher',
      icon: MapPin,
    },
    {
      name: 'Maintenance',
      path: '/dashboard/maintenance',
      icon: Wrench,
    },
    {
      name: 'Trip & Expense',
      path: '/dashboard/trip-expense',
      icon: DollarSign,
    },
    {
      name: 'Performance',
      path: '/dashboard/performance',
      icon: TrendingUp,
    },
    {
      name: 'Analytics',
      path: '/dashboard/analytics',
      icon: BarChart3,
    },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className={`bg-white border-r border-gray-200 ${className}`}>
      <div className="p-6">
        <h2 className="text-lg font-bold text-gray-800">Menu</h2>
      </div>
      <nav className="px-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 mb-1 rounded-lg transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
