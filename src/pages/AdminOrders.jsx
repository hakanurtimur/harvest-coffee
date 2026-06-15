import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Calendar, User, Filter, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import OrderStatusBadge from '../components/orders/OrderStatusBadge';
import PaymentStatusBadge from '../components/orders/PaymentStatusBadge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function AdminOrders() {
  const [user, setUser] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const queryClient = useQueryClient();

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

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['all-orders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Order.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-orders'] });
    },
  });

  if (!user || user.role !== 'admin') {
    return <div className="text-center py-12">Yükleniyor...</div>;
  }

  const filteredOrders = orders.filter(order => {
    const statusMatch = statusFilter === 'all' || order.status === statusFilter;
    const paymentMatch = paymentFilter === 'all' || order.payment_status === paymentFilter;
    return statusMatch && paymentMatch;
  });

  const handleStatusChange = async (orderId, newStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    updateOrderMutation.mutate({ id: orderId, data: { status: newStatus } });

    // Send email to customer
    try {
      const statusLabels = {
        preparing: 'Hazırlanıyor',
        in_transit: 'Kargo/Kuryede',
        delivered: 'Teslim Edildi'
      };

      await base44.integrations.Core.SendEmail({
        to: order.created_by,
        subject: `Sipariş Durumu Güncellendi - #${order.order_number}`,
        body: `Merhaba,\n\nSipariş numaranız #${order.order_number} durumu güncellendi.\n\nYeni Durum: ${statusLabels[newStatus]}\n\nSiparişinizin detaylarını hesabınızdan görüntüleyebilirsiniz.\n\nTeşekkürler,\nHarvest Coffee`
      });
    } catch (error) {
      console.error('Email gönderilirken hata:', error);
    }
  };

  const handlePaymentStatusChange = (orderId, newPaymentStatus) => {
    updateOrderMutation.mutate({ id: orderId, data: { payment_status: newPaymentStatus } });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-amber-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          Tüm Siparişler
        </h1>
        <p className="text-amber-700">Tüm müşteri siparişlerini yönetin</p>
      </div>

      {/* Filters */}
      <Card className="border-amber-100">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtreler:</span>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sipariş Durumu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="preparing">Hazırlanıyor</SelectItem>
                <SelectItem value="in_transit">Kargo/Kuryede</SelectItem>
                <SelectItem value="delivered">Teslim Edildi</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Ödeme Durumu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Ödemeler</SelectItem>
                <SelectItem value="pending">Bekliyor</SelectItem>
                <SelectItem value="paid">Ödendi</SelectItem>
                <SelectItem value="failed">Başarısız</SelectItem>
              </SelectContent>
            </Select>
            <div className="ml-auto">
              <span className="text-sm text-gray-600">
                <span className="font-bold text-amber-900">{filteredOrders.length}</span> sipariş
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card className="border-2 border-dashed border-amber-200">
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 text-amber-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-amber-900 mb-2">
              Sipariş bulunamadı
            </h3>
            <p className="text-gray-600">Seçili filtrelere uygun sipariş yok</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-xl transition-all duration-300 border-amber-100">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl text-amber-900 mb-2">
                        Sipariş #{order.order_number}
                      </CardTitle>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(order.created_date), 'dd MMMM yyyy, HH:mm')}
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {order.created_by}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <OrderStatusBadge status={order.status} />
                      <PaymentStatusBadge status={order.payment_status} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Items Summary */}
                    <div>
                      <p className="text-sm text-gray-600 mb-2 font-medium">Ürünler:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between bg-amber-50 p-2 rounded">
                            <span className="text-sm text-amber-900">
                              {item.product_name} <span className="text-gray-600">x{item.quantity}</span>
                            </span>
                            <span className="text-sm font-semibold text-amber-900">
                              £{item.subtotal.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Status Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-amber-100">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Sipariş Durumu
                        </label>
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleStatusChange(order.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="preparing">Hazırlanıyor</SelectItem>
                            <SelectItem value="in_transit">Kargo/Kuryede</SelectItem>
                            <SelectItem value="delivered">Teslim Edildi</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Ödeme Durumu
                        </label>
                        <Select
                          value={order.payment_status}
                          onValueChange={(value) => handlePaymentStatusChange(order.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Bekliyor</SelectItem>
                            <SelectItem value="paid">Ödendi</SelectItem>
                            <SelectItem value="failed">Başarısız</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Tracking Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Tahmini Teslimat Tarihi
                        </label>
                        <input
                          type="date"
                          value={order.estimated_delivery_date || ''}
                          onChange={(e) => updateOrderMutation.mutate({
                            id: order.id,
                            data: { estimated_delivery_date: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Kargo Takip No
                        </label>
                        <input
                          type="text"
                          value={order.tracking_number || ''}
                          onChange={(e) => updateOrderMutation.mutate({
                            id: order.id,
                            data: { tracking_number: e.target.value }
                          })}
                          placeholder="Örn: TR123456789"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                    </div>

                    {/* Total and Action */}
                    <div className="flex items-center justify-between pt-4 border-t border-amber-100">
                      <div>
                        <span className="text-sm text-gray-600">Toplam Tutar</span>
                        <p className="text-2xl font-bold text-amber-900">
                          £{order.total_amount.toFixed(2)}
                        </p>
                      </div>
                      <Link to={createPageUrl('OrderDetails') + `?id=${order.id}`}>
                        <Button className="bg-amber-900 hover:bg-amber-800">
                          Detaylar
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}