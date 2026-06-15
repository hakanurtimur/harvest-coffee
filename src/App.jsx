import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Outlet } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { useLocation } from 'react-router-dom';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AdminDashboard from './pages/AdminDashboard';
import AdminOrders from './pages/AdminOrders';
import AdminProducts from './pages/AdminProducts';
import StockManagement from './pages/StockManagement';
import CustomerManagement from './pages/CustomerManagement';
import AdminLayout from './components/AdminLayout';
import AdminSettings from './pages/AdminSettings';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import AdminRentals from './pages/AdminRentals';
import RentalCalendar from './pages/RentalCalendar';
import Rentals from './pages/Rentals';
import CreateRental from './pages/CreateRental';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

// Admin Layout Component - wraps all admin routes with persistent sidebar
const AdminLayoutRoutes = () => {
  const location = useLocation();
  const pageNameMap = {
    '/admin': 'AdminDashboard',
    '/AdminOrders': 'AdminOrders',
    '/AdminProducts': 'AdminProducts',
    '/StockManagement': 'StockManagement',
    '/CustomerManagement': 'CustomerManagement',
    '/AdminSettings': 'AdminSettings',
    '/Reports': 'Reports',
    '/AdminRentals': 'AdminRentals',
  };
  const currentPageName = pageNameMap[location.pathname] || 'AdminDashboard';
  
  return (
    <AdminLayout currentPageName={currentPageName}>
      <Outlet />
    </AdminLayout>
  );
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      {/* Admin Routes with persistent sidebar layout */}
      <Route element={<AdminLayoutRoutes />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/AdminOrders" element={<AdminOrders />} />
        <Route path="/AdminProducts" element={<AdminProducts />} />
        <Route path="/StockManagement" element={<StockManagement />} />
        <Route path="/CustomerManagement" element={<CustomerManagement />} />
        <Route path="/AdminSettings" element={<AdminSettings />} />
        <Route path="/Reports" element={<Reports />} />
        <Route path="/AdminRentals" element={<AdminRentals />} />
        <Route path="/RentalCalendar" element={<RentalCalendar />} />
      </Route>
      
      <Route path="/Notifications" element={<LayoutWrapper currentPageName="Notifications"><Notifications /></LayoutWrapper>} />
      <Route path="/Rentals" element={<LayoutWrapper currentPageName="Rentals"><Rentals /></LayoutWrapper>} />
      <Route path="/CreateRental" element={<LayoutWrapper currentPageName="CreateRental"><CreateRental /></LayoutWrapper>} />
      <Route path="/Rentals" element={<LayoutWrapper currentPageName="Rentals"><Rentals /></LayoutWrapper>} />
      <Route path="/CreateRental" element={<LayoutWrapper currentPageName="CreateRental"><CreateRental /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App