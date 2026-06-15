import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, TrendingUp, DollarSign, Package } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CustomerManagement() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

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

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['all-orders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
    },
  });

  if (!user || user.role !== 'admin') {
    return <div className="text-center py-12">Yükleniyor...</div>;
  }

  // Calculate customer statistics
  const customerStats = users.map(customer => {
    const customerOrders = orders.filter(o => o.created_by === customer.email);
    const totalSpent = customerOrders.reduce((sum, o) => sum + o.total_amount, 0);
    return {
      ...customer,
      orderCount: customerOrders.length,
      totalSpent,
    };
  }).sort((a, b) => b.totalSpent - a.totalSpent);

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

  const handleSegmentChange = (userId, segment) => {
    updateUserMutation.mutate({ id: userId, data: { customer_segment: segment } });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-amber-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          Müşteri Yönetimi
        </h1>
        <p className="text-amber-700">Müşteri bilgileri ve segmentasyon</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-amber-100 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 mb-1">Toplam Müşteri</p>
                  <p className="text-3xl font-bold text-blue-900">{users.length}</p>
                </div>
                <Users className="w-12 h-12 text-blue-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-amber-100 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700 mb-1">VIP Müşteriler</p>
                  <p className="text-3xl font-bold text-purple-900">
                    {users.filter(u => u.customer_segment === 'vip').length}
                  </p>
                </div>
                <TrendingUp className="w-12 h-12 text-purple-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-amber-100 bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 mb-1">Ort. Sipariş Değeri</p>
                  <p className="text-3xl font-bold text-green-900">
                    £{orders.length > 0 ? (orders.reduce((sum, o) => sum + o.total_amount, 0) / orders.length).toFixed(2) : '0.00'}
                  </p>
                </div>
                <DollarSign className="w-12 h-12 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-amber-100 bg-gradient-to-br from-amber-50 to-amber-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-700 mb-1">Toplam Sipariş</p>
                  <p className="text-3xl font-bold text-amber-900">{orders.length}</p>
                </div>
                <Package className="w-12 h-12 text-amber-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Customer List */}
      <Card className="border-amber-100">
        <CardHeader>
          <CardTitle className="text-amber-900">Müşteriler</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-amber-50 border-b-2 border-amber-200">
                <tr>
                  <th className="text-left p-4 font-semibold text-amber-900">Müşteri</th>
                  <th className="text-center p-4 font-semibold text-amber-900">Segment</th>
                  <th className="text-center p-4 font-semibold text-amber-900">Sipariş Sayısı</th>
                  <th className="text-right p-4 font-semibold text-amber-900">Toplam Harcama</th>
                  <th className="text-center p-4 font-semibold text-amber-900">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {customerStats.map((customer) => (
                  <tr key={customer.id} className="border-b border-amber-50 hover:bg-amber-50/50">
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-amber-900">{customer.full_name || customer.email}</p>
                        <p className="text-sm text-gray-600">{customer.email}</p>
                        {customer.company_name && (
                          <p className="text-xs text-gray-500">{customer.company_name}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {getSegmentBadge(customer.customer_segment || 'new')}
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-semibold text-amber-900">{customer.orderCount}</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-bold text-green-700">£{customer.totalSpent.toFixed(2)}</span>
                    </td>
                    <td className="p-4">
                      <Select
                        value={customer.customer_segment || 'new'}
                        onValueChange={(value) => handleSegmentChange(customer.id, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Yeni</SelectItem>
                          <SelectItem value="regular">Düzenli</SelectItem>
                          <SelectItem value="vip">VIP</SelectItem>
                          <SelectItem value="lapsed">Pasif</SelectItem>
                          <SelectItem value="at_risk">Risk Altında</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}