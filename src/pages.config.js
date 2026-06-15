import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import Products from './pages/Products';
import AdminProducts from './pages/AdminProducts';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import AdminDashboard from './pages/AdminDashboard';
import AdminOrders from './pages/AdminOrders';
import Profile from './pages/Profile';
import TrackOrder from './pages/TrackOrder';
import StockManagement from './pages/StockManagement';
import CustomerManagement from './pages/CustomerManagement';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Products": Products,
    "Orders": Orders,
    "OrderDetails": OrderDetails,
    "AdminDashboard": AdminDashboard,
    "AdminOrders": AdminOrders,
    "Profile": Profile,
    "TrackOrder": TrackOrder,
    "StockManagement": StockManagement,
    "CustomerManagement": CustomerManagement,
    "AdminProducts": AdminProducts,
    "About": About,
    "Contact": Contact,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};