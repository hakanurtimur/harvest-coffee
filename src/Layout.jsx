import React, { useState, useEffect, createContext, useContext } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Coffee, ShoppingBag, Package, LogIn, LogOut, User, UserCircle, Info, Mail, Menu, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/components/translations';
import BottomNav from '@/components/BottomNav';
import { motion } from 'framer-motion';

export const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const isAdminPage = currentPageName?.includes('Admin') || ['StockManagement', 'CustomerManagement', 'Reports'].includes(currentPageName);

  useEffect(() => {
    if (isAdminPage) return;
    const checkAuth = async () => {
      const authenticated = await base44.auth.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        try {
          const currentUser = await base44.auth.me();
          setUser(currentUser);
        } catch (error) {
          console.error('Error fetching user:', error);
        }
      }
    };
    checkAuth();
  }, [isAdminPage]);

  useEffect(() => {
    if (isAdminPage) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setIsDarkMode(e.matches);
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    handleChange({ matches: mediaQuery.matches });
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [isAdminPage]);

  // If on admin pages, don't render this layout
  if (isAdminPage) {
    return children;
  }

  const handleLogout = () => {
    base44.auth.logout();
  };



  return (
    <LanguageContext.Provider value={{ language: 'en', setLanguage: () => {}, t: {} }}>
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 md:pb-0 pb-20" style={{ overscrollBehavior: 'none', paddingTop: 'max(0px, env(safe-area-inset-top))', paddingBottom: 'max(5rem, env(safe-area-inset-bottom))' }}>
      <style>{`
        :root {
          --harvest-espresso: #3E2723;
          --harvest-cream: #F5F5DC;
          --harvest-gold: #D4AF37;
          --harvest-light: #F5F5F5;
        }
      `}</style>
      
      {/* Navigation - Hide on mobile */}
      <nav className="hidden md:block bg-white dark:bg-gray-900 border-b border-amber-100 dark:border-gray-700 sticky top-0 z-50 shadow-sm dark:shadow-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-3 group">
              <img
                src="https://media.base44.com/images/public/691daa20af5806873f836b87/d851d43b8_image.png"
                alt="Harvest Coffee Logo"
                className="w-16 h-16 object-contain group-hover:scale-105 transition-transform"
              />
              <div>
                <h1 className="text-2xl font-bold text-amber-900" style={{ fontFamily: 'Georgia, serif' }}>
                  Harvest Coffee
                </h1>
                <p className="text-xs text-amber-700 tracking-wide">PREMIUM B2B</p>
              </div>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-amber-900 hover:bg-amber-50 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Navigation Links */}
            <div className={`fixed md:relative top-20 md:top-auto left-0 right-0 md:flex items-center gap-2 bg-white md:bg-transparent border-b md:border-0 border-amber-100 ${mobileMenuOpen ? 'flex flex-col p-4 gap-1 z-40' : 'hidden md:flex'}`}>
              <Link
                to={createPageUrl('Home')}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${mobileMenuOpen ? 'w-full' : ''} ${
                  currentPageName === 'Home'
                    ? 'bg-amber-900 text-white shadow-md'
                    : 'text-amber-900 hover:bg-amber-50'
                }`}
              >
                <span className="font-medium">Home</span>
              </Link>
              <Link
                to={createPageUrl('About')}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${mobileMenuOpen ? 'w-full' : ''} ${
                  currentPageName === 'About'
                    ? 'bg-amber-900 text-white shadow-md'
                    : 'text-amber-900 hover:bg-amber-50'
                }`}
              >
                <span className="font-medium">About</span>
              </Link>
              <Link
                to={createPageUrl('Contact')}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${mobileMenuOpen ? 'w-full' : ''} ${
                  currentPageName === 'Contact'
                    ? 'bg-amber-900 text-white shadow-md'
                    : 'text-amber-900 hover:bg-amber-50'
                }`}
              >
                <span className="font-medium">Contact</span>
              </Link>
              <Link
                to={createPageUrl('Products')}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${mobileMenuOpen ? 'w-full' : ''} ${
                  currentPageName === 'Products'
                    ? 'bg-amber-900 text-white shadow-md'
                    : 'text-amber-900 hover:bg-amber-50'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="font-medium">Products</span>
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                   to={createPageUrl('Orders')}
                   onClick={() => setMobileMenuOpen(false)}
                   className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${mobileMenuOpen ? 'w-full' : ''} ${
                     currentPageName === 'Orders' || currentPageName === 'OrderDetails'
                       ? 'bg-amber-900 text-white shadow-md'
                       : 'text-amber-900 hover:bg-amber-50'
                   }`}
                  >
                   <Package className="w-4 h-4" />
                   <span className="font-medium">My Orders</span>
                  </Link>
                  <Link
                   to={createPageUrl('Rentals')}
                   onClick={() => setMobileMenuOpen(false)}
                   className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${mobileMenuOpen ? 'w-full' : ''} ${
                     currentPageName === 'Rentals' || currentPageName === 'CreateRental'
                       ? 'bg-amber-900 text-white shadow-md'
                       : 'text-amber-900 hover:bg-amber-50'
                   }`}
                  >
                   <Package className="w-4 h-4" />
                   <span className="font-medium">Rentals</span>
                  </Link>
                  <Link
                   to={createPageUrl('Profile')}
                   onClick={() => setMobileMenuOpen(false)}
                   className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${mobileMenuOpen ? 'w-full' : ''} ${
                     currentPageName === 'Profile'
                       ? 'bg-amber-900 text-white shadow-md'
                       : 'text-amber-900 hover:bg-amber-50'
                   }`}
                  >
                   <UserCircle className="w-4 h-4" />
                   <span className="font-medium">Profile</span>
                  </Link>
                </>
              )}
              

              
              {isAuthenticated ? (
                <div className="flex items-center gap-2 ml-2">
                  <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-lg">
                    <User className="w-4 h-4 text-amber-700" />
                    <span className="text-sm font-medium text-amber-900">{user?.full_name || user?.email}</span>
                  </div>
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    className="text-amber-900 hover:bg-amber-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => base44.auth.redirectToLogin()}
                  className="bg-amber-900 hover:bg-amber-800 ml-2"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Dealer Login</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content with Page Transitions */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:pb-0 pb-24">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Bottom Navigation - Mobile only */}
      <BottomNav isAuthenticated={isAuthenticated} />

      {/* Footer */}
      <footer className="hidden md:block bg-amber-900 dark:bg-gray-900 text-amber-50 dark:text-gray-300 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif' }}>Harvest Coffee</h3>
              <p className="text-amber-200 text-sm">Premium B2B Coffee Supply</p>
              <p className="text-amber-300 text-xs mt-2">The Breeches, Galleyhill Road, Waltham Abbey, EN9 2AQ</p>
            </div>
            <div className="text-center md:text-right text-amber-200 text-sm">
              <p>© 2026 Harvest Coffee. All rights reserved.</p>
            </div>
            </div>
            </div>
            </footer>
      
      {/* Mobile Footer */}
      <footer className="md:hidden bg-amber-900 dark:bg-gray-900 text-amber-50 dark:text-gray-300 py-8 px-4 border-t border-amber-800 dark:border-gray-700 mb-16">
        <div className="text-center">
          <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Georgia, serif' }}>Harvest Coffee</h3>
          <p className="text-amber-200 text-xs">© 2026 All rights reserved</p>
        </div>
      </footer>
            </div>
            </LanguageContext.Provider>
            );
            }