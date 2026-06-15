import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { LayoutDashboard, Package, ShoppingBag, Users, LogOut, Menu, X, BarChart3, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const menuItems = [
  { path: '/admin', name: 'Dashboard', icon: BarChart3, pageName: 'AdminDashboard' },
  { path: createPageUrl('AdminOrders'), name: 'Orders', icon: ShoppingBag, pageName: 'AdminOrders' },
  { path: createPageUrl('AdminProducts'), name: 'Products', icon: Package, pageName: 'AdminProducts' },
  { path: createPageUrl('StockManagement'), name: 'Stock', icon: Package, pageName: 'StockManagement' },
  { path: createPageUrl('CustomerManagement'), name: 'Customers', icon: Users, pageName: 'CustomerManagement' },
  { path: '/Reports', name: 'Reports', icon: BarChart3, pageName: 'Reports' },
  { path: '/AdminSettings', name: 'Settings', icon: Settings, pageName: 'AdminSettings' },
];

export default function AdminLayout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser.role !== 'admin') {
          window.location.href = '/';
        }
      } catch (error) {
        window.location.href = '/';
      }
    };
    checkAuth();
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg">Admin access required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
        <Link to="/admin" className="flex items-center gap-2">
          <div className="p-2 bg-purple-600 rounded-lg">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white">Admin</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-400 hover:bg-slate-700 rounded-lg"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="hidden md:fixed md:inset-0 md:bg-black md:bg-opacity-0 md:z-40" onClick={() => {}} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-slate-800 border-r border-slate-700 z-50 transition-all duration-300 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
        {/* Sidebar Header */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-slate-700">
          <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center w-full' : ''}`}>
            <div className="p-2 bg-purple-600 rounded-lg">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-lg font-bold text-white">Admin Panel</h1>
                <p className="text-xs text-purple-300">MANAGEMENT</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex p-2 text-slate-400 hover:bg-slate-700 rounded-lg"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-2 text-slate-400 hover:bg-slate-700 rounded-lg"
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
                  // Smooth scroll to top on navigation
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                  sidebarCollapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span className="font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Profile - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.full_name || user?.email}</p>
                <p className="text-xs text-slate-400">Administrator</p>
              </div>
            )}
            {!sidebarCollapsed && (
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-white hover:bg-slate-700"
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