import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { Package, ShoppingBag, Users, DollarSign, CreditCard, TrendingUp, Clock, CheckCircle, Truck, Bell, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

const translations = {
  en: {
    adminPanel: 'Admin Panel',
    businessStats: 'Business statistics and reports',
    totalOrders: 'Total Orders',
    totalRevenue: 'Total Revenue',
    collectedPayment: 'Collected',
    pendingPayment: 'Pending Payment',
    stockAlerts: 'Stock Alerts',
    lowStockWarning: 'products in low stock',
    noStockWarning: 'products out of stock',
    goToStock: 'Go to Stock Management',
    salesTrends: 'Sales Trends',
    days7: '7 Days',
    days30: '30 Days',
    days90: '90 Days',
    categorySales: 'Sales by Category',
    orderStatus: 'Order Status',
    customerAcquisition: 'Customer Acquisition Sources',
    paymentMethods: 'Payment Methods Distribution',
    recentActivity: 'Recent Activities',
    topCustomers: 'Top Customers',
    customer: 'Customer',
    orderCount: 'Orders',
    totalSpent: 'Total Spent',
    bestCustomers: 'Best Customers',
    topProducts: 'Top Products',
    revenue: 'Revenue',
    quantity: 'Quantity',
    preparing: 'Preparing',
    inTransit: 'In Transit',
    delivered: 'Delivered',
  }
};

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [timeRange, setTimeRange] = useState('week');
  const [language, setLanguage] = useState('en');
  const t = translations[language];

  useEffect(() => {
    const checkAdmin = async () => {
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
    checkAdmin();
  }, []);

  const { data: orders = [] } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list(),
  });

  if (!user || user.role !== 'admin') {
    return <div className="text-center py-12">Yükleniyor...</div>;
  }

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const paidOrders = orders.filter(o => o.payment_status === 'paid');
  const paidRevenue = paidOrders.reduce((sum, order) => sum + order.total_amount, 0);
  const pendingRevenue = totalRevenue - paidRevenue;

  const productSales = {};
  orders.forEach(order => {
    order.items?.forEach(item => {
      if (!productSales[item.product_name]) {
        productSales[item.product_name] = { quantity: 0, revenue: 0 };
      }
      productSales[item.product_name].quantity += item.quantity;
      productSales[item.product_name].revenue += item.subtotal;
    });
  });

  const productSalesData = Object.entries(productSales)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  const customerStats = {};
  orders.forEach(order => {
    const customer = order.created_by;
    if (!customerStats[customer]) {
      customerStats[customer] = {
        email: customer,
        orderCount: 0,
        totalSpent: 0,
        pendingPayment: 0,
      };
    }
    customerStats[customer].orderCount++;
    customerStats[customer].totalSpent += order.total_amount;
    if (order.payment_status === 'pending') {
      customerStats[customer].pendingPayment += order.total_amount;
    }
  });

  const topCustomers = Object.values(customerStats)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);

  const paymentMethods = {
    bank_transfer: { count: 0, amount: 0 },
    credit_card: { count: 0, amount: 0 },
    paypal: { count: 0, amount: 0 },
  };

  orders.forEach(order => {
    if (order.payment_method && paymentMethods[order.payment_method]) {
      paymentMethods[order.payment_method].count++;
      paymentMethods[order.payment_method].amount += order.total_amount;
    }
  });

  const paymentMethodData = Object.entries(paymentMethods)
    .filter(([_, data]) => data.count > 0)
    .map(([method, data]) => ({
      name: method === 'bank_transfer' ? (language === 'tr' ? 'Havale/EFT' : 'Bank Transfer') : method === 'credit_card' ? (language === 'tr' ? 'Kredi Kartı' : 'Credit Card') : 'PayPal',
      value: data.amount,
      count: data.count,
    }));

  const COLORS = ['#78350f', '#f59e0b', '#fbbf24'];

  const lowStockProducts = products.filter(p => 
    (p.stock_quantity || 0) <= (p.low_stock_threshold || 10) && (p.stock_quantity || 0) > 0
  );
  const outOfStockProducts = products.filter(p => (p.stock_quantity || 0) === 0);

  const statusBreakdown = {
    preparing: { count: 0, revenue: 0 },
    in_transit: { count: 0, revenue: 0 },
    delivered: { count: 0, revenue: 0 },
  };

  orders.forEach(order => {
    if (statusBreakdown[order.status]) {
      statusBreakdown[order.status].count++;
      statusBreakdown[order.status].revenue += order.total_amount;
    }
  });

  const statusData = Object.entries(statusBreakdown).map(([status, data]) => ({
    name: language === 'tr' ? 
      (status === 'preparing' ? 'Hazırlanıyor' : status === 'in_transit' ? 'Kargoda' : 'Teslim Edildi')
      : (status === 'preparing' ? 'Preparing' : status === 'in_transit' ? 'In Transit' : 'Delivered'),
    orders: data.count,
    revenue: data.revenue,
  }));

  const getSalesTrendData = () => {
    const now = new Date();
    const daysToShow = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
    const trendData = [];

    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = subDays(now, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.created_date);
        return orderDate >= dayStart && orderDate <= dayEnd;
      });

      const dayRevenue = dayOrders.reduce((sum, order) => sum + order.total_amount, 0);
      
      trendData.push({
        date: format(date, timeRange === 'week' ? 'EEE' : 'MMM dd'),
        revenue: dayRevenue,
        orders: dayOrders.length,
      });
    }

    return trendData;
  };

  const salesTrendData = getSalesTrendData();

  const categorySales = {};
  orders.forEach(order => {
    order.items?.forEach(item => {
      const product = products.find(p => p.name === item.product_name);
      const category = product?.category || 'Other';
      if (!categorySales[category]) {
        categorySales[category] = { category, quantity: 0, revenue: 0 };
      }
      categorySales[category].quantity += item.quantity;
      categorySales[category].revenue += item.subtotal;
    });
  });

  const categorySalesData = Object.values(categorySales).sort((a, b) => b.revenue - a.revenue);

  const recentActivities = orders
    .slice(0, 10)
    .map(order => ({
      id: order.id,
      type: order.created_date === order.updated_date ? 'new_order' : 'status_update',
      order_number: order.order_number,
      customer: order.created_by,
      status: order.status,
      amount: order.total_amount,
      timestamp: order.updated_date || order.created_date,
    }))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const getActivityIcon = (type) => {
    if (type === 'new_order') return <Package className="w-5 h-5 text-blue-600" />;
    return <Truck className="w-5 h-5 text-orange-600" />;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-5xl font-bold text-amber-900 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
          {t.adminPanel}
        </h1>
        <p className="text-amber-600 text-sm font-medium">{t.businessStats}</p>
      </div>

      {/* Stock Alerts */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Package className="w-6 h-6 text-yellow-700" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">{t.stockAlerts}</h3>
                <div className="space-y-1 text-sm">
                  {lowStockProducts.length > 0 && (
                    <p className="text-yellow-800">
                      <span className="font-bold">{lowStockProducts.length}</span> {t.lowStockWarning}
                    </p>
                  )}
                  {outOfStockProducts.length > 0 && (
                    <p className="text-red-800">
                      <span className="font-bold">{outOfStockProducts.length}</span> {t.noStockWarning}
                    </p>
                  )}
                </div>
                <Link to={createPageUrl('StockManagement')}>
                  <Button size="sm" className="mt-3 bg-amber-900 hover:bg-amber-800">
                    {t.goToStock}
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border-amber-100 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 mb-1">{t.totalRevenue}</p>
                <p className="text-3xl font-bold text-green-900">£{totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="w-12 h-12 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-100 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 mb-1">{t.collectedPayment}</p>
                <p className="text-3xl font-bold text-purple-900">£{paidRevenue.toFixed(2)}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-100 bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 mb-1">{t.pendingPayment}</p>
                <p className="text-3xl font-bold text-orange-900">£{pendingRevenue.toFixed(2)}</p>
              </div>
              <Clock className="w-12 h-12 text-orange-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Trend Chart */}
      <Card className="border-amber-100">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-amber-900">{t.salesTrends}</CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={timeRange === 'week' ? 'default' : 'outline'}
                onClick={() => setTimeRange('week')}
                className={timeRange === 'week' ? 'bg-amber-900 hover:bg-amber-800' : ''}
              >
                {t.days7}
              </Button>
              <Button
                size="sm"
                variant={timeRange === 'month' ? 'default' : 'outline'}
                onClick={() => setTimeRange('month')}
                className={timeRange === 'month' ? 'bg-amber-900 hover:bg-amber-800' : ''}
              >
                {t.days30}
              </Button>
              <Button
                size="sm"
                variant={timeRange === 'all' ? 'default' : 'outline'}
                onClick={() => setTimeRange('all')}
                className={timeRange === 'all' ? 'bg-amber-900 hover:bg-amber-800' : ''}
              >
                {t.days90}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesTrendData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#78350f" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#78350f" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" style={{ fontSize: '12px' }} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#78350f" fillOpacity={1} fill="url(#colorRevenue)" name={t.revenue + ' (£)'} />
              <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#f59e0b" strokeWidth={2} name={t.orderCount} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-amber-100">
          <CardHeader>
            <CardTitle className="text-amber-900">{t.categorySales}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categorySalesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" style={{ fontSize: '12px' }} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" fill="#78350f" name={t.revenue + ' (£)'} />
                <Bar yAxisId="right" dataKey="quantity" fill="#f59e0b" name={t.quantity} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-amber-100">
          <CardHeader>
            <CardTitle className="text-amber-900">{t.orderStatus}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="orders" fill="#3b82f6" name={language === 'tr' ? 'Sipariş Sayısı' : 'Order Count'} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Chart */}
      <Card className="border-amber-100">
        <CardHeader>
          <CardTitle className="text-amber-900">{t.paymentMethods}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentMethodData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentMethodData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `£${value.toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Product and Customer Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-amber-100">
          <CardHeader>
            <CardTitle className="text-amber-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              {t.topProducts}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {productSalesData.slice(0, 8).map((product, index) => (
                <div key={product.name} className="flex items-center justify-between p-3 bg-amber-50/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center">
                      <span className="text-amber-900 font-semibold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-amber-900 text-sm">{product.name}</p>
                      <p className="text-xs text-gray-600">{product.quantity} {language === 'tr' ? 'adet' : 'units'}</p>
                    </div>
                  </div>
                  <span className="font-bold text-green-700">£{product.revenue.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-100">
          <CardHeader>
            <CardTitle className="text-amber-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t.bestCustomers}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCustomers.map((customer, index) => (
                <div key={customer.email} className="flex items-center justify-between p-3 bg-amber-50/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center">
                      <span className="text-amber-900 font-semibold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-amber-900 text-sm">{customer.email ? customer.email.split('@')[0] : 'Unknown'}</p>
                      <p className="text-xs text-gray-600">{customer.orderCount} {t.orderCount}</p>
                    </div>
                  </div>
                  <span className="font-bold text-green-700">£{customer.totalSpent.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}