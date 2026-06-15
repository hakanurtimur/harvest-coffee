import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Home, ShoppingBag, Package, User } from 'lucide-react';

export default function BottomNav({ isAuthenticated }) {
  const location = useLocation();
  const currentPath = location.pathname.replace('/', '');

  const isActive = (path) => currentPath === path.toLowerCase() || (path === '' && currentPath === '');

  const navItems = [
    { icon: Home, label: 'Home', path: '' },
    { icon: ShoppingBag, label: 'Products', path: 'products' },
    ...(isAuthenticated ? [{ icon: Package, label: 'Orders', path: 'orders' }] : []),
    ...(isAuthenticated ? [{ icon: User, label: 'Profile', path: 'profile' }] : []),
  ];

  return (
    <nav className="fixed md:hidden bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-amber-100 dark:border-gray-700 z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path === '' ? '/' : `/${item.path}`}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                active
                  ? 'bg-amber-50 text-amber-900'
                  : 'text-gray-600 hover:text-amber-900'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs mt-0.5 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}