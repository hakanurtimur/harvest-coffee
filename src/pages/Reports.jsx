import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, TrendingUp, Users, Package, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Reports() {
  const [user, setUser] = useState(null);
  const [reportType, setReportType] = useState('all');

  React.useEffect(() => {
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

  const { data: rentals = [] } = useQuery({
    queryKey: ['rentals'],
    queryFn: () => base44.entities.Rental.list(),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  if (!user || user.role !== 'admin') {
    return <div className="text-center py-12">Loading...</div>;
  }

  const activeRentals = rentals.filter(r => r.status === 'active');
  const upcomingRentals = rentals.filter(r => r.status === 'upcoming');
  const expiringRentals = rentals.filter(r => {
    const endDate = new Date(r.rental_end_date);
    const today = new Date();
    const daysUntil = Math.floor((endDate - today) / (1000 * 60 * 60 * 24));
    return r.status === 'active' && daysUntil <= 3 && daysUntil > 0;
  });
  const expiredRentals = rentals.filter(r => r.status === 'expired');

  const customerStats = {};
  orders.forEach(order => {
    const email = order.created_by;
    if (!customerStats[email]) {
      customerStats[email] = { email, orders: 0, spent: 0, lastOrder: null };
    }
    customerStats[email].orders++;
    customerStats[email].spent += order.total_amount;
    customerStats[email].lastOrder = new Date(order.created_date) > new Date(customerStats[email].lastOrder || 0) ? order.created_date : customerStats[email].lastOrder;
  });

  const customerData = Object.values(customerStats)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 10);

  const rentalStatusData = [
    { name: 'Active', value: activeRentals.length, color: '#10b981' },
    { name: 'Upcoming', value: upcomingRentals.length, color: '#3b82f6' },
    { name: 'Expiring Soon', value: expiringRentals.length, color: '#f59e0b' },
    { name: 'Expired', value: expiredRentals.length, color: '#ef4444' }
  ];

  const monthlyOrderData = {};
  orders.forEach(order => {
    const month = new Date(order.created_date).toLocaleString('en-US', { month: 'short' });
    if (!monthlyOrderData[month]) {
      monthlyOrderData[month] = { month, count: 0, revenue: 0 };
    }
    monthlyOrderData[month].count++;
    monthlyOrderData[month].revenue += order.total_amount;
  });

  const monthlyData = Object.values(monthlyOrderData).slice(-6);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-amber-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          Reports
        </h1>
        <p className="text-amber-700">Analytics, rentals, and customer insights</p>
      </div>

      <Tabs defaultValue="rentals" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rentals">Rental Reports</TabsTrigger>
          <TabsTrigger value="sales">Sales Reports</TabsTrigger>
          <TabsTrigger value="customers">Customer Analysis</TabsTrigger>
        </TabsList>

        {/* Rental Reports */}
        <TabsContent value="rentals" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700">Active Rentals</p>
                      <p className="text-3xl font-bold text-green-900">{activeRentals.length}</p>
                    </div>
                    <CheckCircle className="w-12 h-12 text-green-600 opacity-30" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-700">Upcoming</p>
                      <p className="text-3xl font-bold text-blue-900">{upcomingRentals.length}</p>
                    </div>
                    <Clock className="w-12 h-12 text-blue-600 opacity-30" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-700">Expiring Soon</p>
                      <p className="text-3xl font-bold text-yellow-900">{expiringRentals.length}</p>
                    </div>
                    <AlertTriangle className="w-12 h-12 text-yellow-600 opacity-30" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-700">Expired</p>
                      <p className="text-3xl font-bold text-red-900">{expiredRentals.length}</p>
                    </div>
                    <Package className="w-12 h-12 text-red-600 opacity-30" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <Card className="border-amber-100">
            <CardHeader>
              <CardTitle className="text-amber-900">Rental Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={rentalStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name} (${value})`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {rentalStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-amber-100">
            <CardHeader>
              <CardTitle className="text-amber-900">Expiring Rentals (Next 3 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {expiringRentals.length > 0 ? (
                <div className="space-y-3">
                  {expiringRentals.map(rental => (
                    <div key={rental.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div>
                        <p className="font-semibold text-amber-900">{rental.product_name}</p>
                        <p className="text-sm text-gray-600">{rental.customer_name}</p>
                        <p className="text-xs text-yellow-700 mt-1">Expires: {rental.rental_end_date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No rentals expiring soon</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Reports */}
        <TabsContent value="sales" className="space-y-6">
          <Card className="border-amber-100">
            <CardHeader>
              <CardTitle className="text-amber-900">Monthly Orders & Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="count" fill="#3b82f6" name="Orders" />
                  <Bar yAxisId="right" dataKey="revenue" fill="#10b981" name="Revenue (£)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customer Analysis */}
        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700">Total Customers</p>
                    <p className="text-3xl font-bold text-blue-900">{allUsers.filter(u => u.role !== 'admin').length}</p>
                  </div>
                  <Users className="w-12 h-12 text-blue-600 opacity-30" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700">Total Orders</p>
                    <p className="text-3xl font-bold text-purple-900">{orders.length}</p>
                  </div>
                  <Package className="w-12 h-12 text-purple-600 opacity-30" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700">Total Revenue</p>
                    <p className="text-3xl font-bold text-green-900">£{orders.reduce((sum, o) => sum + o.total_amount, 0).toFixed(2)}</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-green-600 opacity-30" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-amber-100">
            <CardHeader>
              <CardTitle className="text-amber-900">Top Customers by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {customerData.map((customer, idx) => (
                  <div key={customer.email} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center font-semibold text-amber-900">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-amber-900">{customer.email}</p>
                        <p className="text-xs text-gray-600">{customer.orders} orders</p>
                      </div>
                    </div>
                    <span className="font-bold text-green-700">£{customer.spent.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}