import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Coffee, Package, Calendar, User, LogOut, Menu, X, FileText, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const menuItems = [
  { path: createPageUrl('Orders'), name: 'My Orders', icon: FileText, pageName: 'Orders' },
  { path: createPageUrl('Products'), name: 'Place Order', icon: Package, pageName: 'Products' },
  { path: createPageUrl('Rentals'), name: 'My Rentals', icon: Calendar, pageName: 'Rentals' },
  { path: '/RentalCalendar', name: 'Rental Calendar', icon: Calendar, pageName: 'RentalCalendar' },
  { path: createPageUrl('Profile'), name: 'Profile', icon: User, pageName: 'Profile' },
];

export default function DealerLayout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Auth error:', error);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Mobile Header */}
      <div className="md:hidden bg-white dark:bg-gray-900 border-b border-amber-200 dark:border-gray-700 p-4 flex items-center justify-between sticky top-0 z-50">
        <Link to={createPageUrl('Home')} className="flex items-center gap-2">
          <img
            src="https://media.base44.com/images/public/691daa20af5806873f836b87/d851d43b8_image.png"
            alt="Harvest Coffee Logo"
            className="w-10 h-10 object-contain"
          />
          <span className="font-bold text-amber-900 dark:text-white">Dealer Portal</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-amber-900 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-gray-800 rounded-lg"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-white dark:bg-gray-900 border-r border-amber-200 dark:border-gray-700 z-40 transition-all duration-300 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
        {/* Sidebar Header */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-amber-200 dark:border-gray-700">
          <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center w-full' : ''}`}>
            <img
              src="https://media.base44.com/images/public/691daa20af5806873f836b87/d851d43b8_image.png"
              alt="Harvest Coffee Logo"
              className="w-10 h-10 object-contain"
            />
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-lg font-bold text-amber-900 dark:text-white">Dealer Portal</h1>
                <p className="text-xs text-amber-700 dark:text-amber-400">B2B PARTNER ACCESS</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex p-2 text-gray-400 hover:bg-amber-50 dark:hover:bg-gray-800 rounded-lg"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-2 text-gray-400 hover:bg-amber-50 dark:hover:bg-gray-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = currentPageName === item.pageName;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  setMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                  sidebarCollapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-amber-900 text-white shadow-md'
                    : 'text-amber-900 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-gray-800'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span className="font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Profile - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-amber-200 dark:border-gray-700">
          <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 bg-amber-900 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'D'}
              </span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-900 dark:text-white truncate">{user?.full_name || user?.email}</p>
                <p className="text-xs text-amber-700 dark:text-amber-500">Dealer Partner</p>
              </div>
            )}
            {!sidebarCollapsed && (
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="icon"
                className="text-amber-700 dark:text-gray-400 hover:bg-amber-50 dark:hover:bg-gray-800"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} min-h-screen`}>
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}