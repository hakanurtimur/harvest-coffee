import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MapPin, Plus, Trash2, Edit2, Save, X, Package, Activity, Clock, Calendar, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import OrderStatusBadge from '../components/orders/OrderStatusBadge';
import PaymentStatusBadge from '../components/orders/PaymentStatusBadge';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [addressForm, setAddressForm] = useState({ title: '', address: '' });
  const [activeTab, setActiveTab] = useState('info');
  const queryClient = useQueryClient();

  // Fetch user orders
  const { data: orders = [] } = useQuery({
    queryKey: ['user-orders', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Order.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user?.email,
  });

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  const updateUserMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      setShowAddressForm(false);
      setEditingIndex(null);
      setAddressForm({ title: '', address: '' });
    },
  });

  const handleAddAddress = () => {
    if (!addressForm.title.trim() || !addressForm.address.trim()) {
      alert('Lütfen tüm alanları doldurun');
      return;
    }

    const addresses = user?.addresses || [];
    
    if (editingIndex !== null) {
      addresses[editingIndex] = addressForm;
    } else {
      addresses.push(addressForm);
    }

    updateUserMutation.mutate({ addresses });
  };

  const handleEditAddress = (index) => {
    setEditingIndex(index);
    setAddressForm(user.addresses[index]);
    setShowAddressForm(true);
  };

  const handleDeleteAddress = (index) => {
    if (!confirm('Bu adresi silmek istediğinizden emin misiniz?')) return;
    
    const addresses = [...(user?.addresses || [])];
    addresses.splice(index, 1);
    updateUserMutation.mutate({ addresses });
  };

  const handleCancel = () => {
    setShowAddressForm(false);
    setEditingIndex(null);
    setAddressForm({ title: '', address: '' });
  };

  const handleDeleteAccount = async () => {
    try {
      // Delete user account
      await base44.entities.User.delete(user.id);
      // Logout after deletion
      await base44.auth.logout();
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Hesap silme sırasında hata oluştu. Lütfen daha sonra tekrar deneyin.');
    }
  };

  if (!user) {
    return <div className="text-center py-12">Yükleniyor...</div>;
  }

  // Calculate activity metrics
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const recentActivities = orders.slice(0, 10).map(order => ({
    id: order.id,
    type: 'order',
    description: `Order #${order.order_number} - ${order.status === 'preparing' ? 'Preparing' : order.status === 'in_transit' ? 'In Transit' : 'Delivered'}`,
    timestamp: order.updated_date || order.created_date,
    amount: order.total_amount,
  }));

  const getSegmentBadge = (segment) => {
    const segments = {
      new: { label: 'Yeni', className: 'bg-blue-100 text-blue-800' },
      regular: { label: 'Düzenli', className: 'bg-green-100 text-green-800' },
      vip: { label: 'VIP', className: 'bg-purple-100 text-purple-800' },
      lapsed: { label: 'Pasif', className: 'bg-gray-100 text-gray-800' },
      at_risk: { label: 'Risk Altında', className: 'bg-red-100 text-red-800' },
    };
    const config = segments[segment] || segments.new;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-amber-900 dark:text-amber-300 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            Profile
          </h1>
          <p className="text-amber-700 dark:text-amber-400">Manage your account information and history</p>
        </div>
        {user.customer_segment && (
          <div>{getSegmentBadge(user.customer_segment)}</div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="info">Account Info</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="orders">Order History</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Account Info Tab */}
        <TabsContent value="info">
          <Card className="border-amber-100 dark:border-gray-700 dark:bg-gray-800">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 border-b dark:border-gray-700">
              <CardTitle className="text-amber-900 dark:text-amber-300">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="p-6 dark:text-white space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Full Name</label>
                  <p className="text-lg font-semibold text-amber-900 dark:text-amber-300">{user.full_name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Email</label>
                  <p className="text-lg font-semibold text-amber-900 dark:text-amber-300">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Role</label>
                  <p className="text-lg font-semibold text-amber-900 dark:text-amber-300">
                    {user.role === 'admin' ? 'Admin' : 'Dealer'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Customer Segment</label>
                  <div className="mt-1">{getSegmentBadge(user.customer_segment || 'new')}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Total Orders</label>
                  <p className="text-lg font-semibold text-amber-900 dark:text-amber-300">{totalOrders}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Total Spending</label>
                  <p className="text-lg font-semibold text-green-700 dark:text-green-400">£{totalSpent.toFixed(2)}</p>
                </div>
                {user.company_name && (
                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400">Company Name</label>
                    <p className="text-lg font-semibold text-amber-900 dark:text-amber-300">{user.company_name}</p>
                  </div>
                )}
              </div>
              {/* Delete Account Section */}
              <div className="border-t dark:border-gray-700 pt-6">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full sm:w-auto">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
                    <AlertDialogHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                        <AlertDialogTitle className="dark:text-white">Delete Account</AlertDialogTitle>
                      </div>
                      <AlertDialogDescription className="dark:text-gray-400">
                        This action is permanent. Your account will be deleted and the following data will be removed:
                        <ul className="list-disc list-inside mt-3 space-y-1 text-sm">
                          <li>All personal information</li>
                          <li>Order history</li>
                          <li>Saved addresses</li>
                          <li>Account settings</li>
                        </ul>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex gap-3 justify-end">
                      <AlertDialogCancel className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
                        Delete Account
                      </AlertDialogAction>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Addresses Tab */}
        <TabsContent value="addresses">
          <Card className="border-amber-100 dark:border-gray-700 dark:bg-gray-800">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 border-b dark:border-gray-700">
              <div className="flex items-center justify-between">
                <CardTitle className="text-amber-900 dark:text-amber-300 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Delivery Addresses
                </CardTitle>
                {!showAddressForm && (
                  <Button
                  onClick={() => setShowAddressForm(true)}
                  size="sm"
                  className="bg-amber-900 hover:bg-amber-800"
                  >
                  <Plus className="w-4 h-4 mr-2" />
                  New Address
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
          {/* Address Form */}
          <AnimatePresence>
            {showAddressForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-amber-50 dark:bg-gray-700 p-4 rounded-lg space-y-4 dark:text-white"
              >
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Address Title
                  </label>
                  <Input
                    placeholder="e.g., Office, Home, Warehouse"
                    value={addressForm.title}
                    onChange={(e) => setAddressForm({ ...addressForm, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Delivery Address
                  </label>
                  <Textarea
                    placeholder="Enter your full address"
                    value={addressForm.address}
                    onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                    className="min-h-24"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddAddress}
                    className="bg-amber-900 hover:bg-amber-800"
                    disabled={updateUserMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingIndex !== null ? 'Update' : 'Save'}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    disabled={updateUserMutation.isPending}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

              {/* Address List */}
              {user.addresses && user.addresses.length > 0 ? (
                <div className="space-y-3">
                  {user.addresses.map((addr, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-amber-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md dark:hover:bg-gray-700/50 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-amber-900 dark:text-amber-300 mb-1">{addr.title}</h3>
                          <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line">{addr.address}</p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditAddress(index)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteAddress(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No saved addresses yet</p>
                  <p className="text-sm">Add a delivery address to place an order</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchase History Tab */}
        <TabsContent value="orders">
          <Card className="border-amber-100 dark:border-gray-700 dark:bg-gray-800">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 border-b dark:border-gray-700">
              <CardTitle className="text-amber-900 dark:text-amber-300 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-amber-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md dark:hover:bg-gray-700/50 transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-amber-900 dark:text-amber-300">#{order.order_number}</h3>
                            <OrderStatusBadge status={order.status} />
                            <PaymentStatusBadge status={order.payment_status} />
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(order.created_date), 'dd MMM yyyy')}
                            </div>
                            <div className="font-semibold text-amber-900 dark:text-amber-300">
                              £{order.total_amount.toFixed(2)}
                            </div>
                            <div>
                              {order.items?.length || 0} items
                            </div>
                          </div>
                        </div>
                        <Link to={createPageUrl('OrderDetails') + `?id=${order.id}`}>
                          <Button size="sm" className="bg-amber-900 hover:bg-amber-800">
                            Details
                          </Button>
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">No orders yet</p>
                  <p className="text-sm">Browse products to place your first order</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Log Tab */}
        <TabsContent value="activity">
          <Card className="border-amber-100 dark:border-gray-700 dark:bg-gray-800">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 border-b dark:border-gray-700">
              <CardTitle className="text-amber-900 dark:text-amber-300 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Activity History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-4 p-4 bg-amber-50/50 dark:bg-gray-700/50 rounded-lg hover:bg-amber-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{activity.description}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="w-3 h-3" />
                            {format(new Date(activity.timestamp), 'dd MMM yyyy, HH:mm')}
                          </div>
                          <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                            £{activity.amount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <Link to={createPageUrl('OrderDetails') + `?id=${activity.id}`}>
                        <Button size="sm" variant="ghost" className="text-amber-900">
                         View
                        </Button>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">No activity yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}