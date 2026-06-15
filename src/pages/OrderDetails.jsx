import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calendar, MapPin, FileText, CreditCard, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import OrderStatusBadge from '../components/orders/OrderStatusBadge';
import PaymentStatusBadge from '../components/orders/PaymentStatusBadge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useLanguage } from '../Layout';

export default function OrderDetails() {
  const { t } = useLanguage();
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('id');
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const orders = await base44.entities.Order.filter({ id: orderId });
      return orders[0];
    },
    enabled: !!orderId,
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Order.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-gray-100 animate-pulse rounded-lg w-48" />
        <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-gray-600">{t.orderNotFound}</p>
          <Link to={createPageUrl('Orders')}>
            <Button className="mt-4">{t.backToOrders}</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const paymentMethodLabels = {
    bank_transfer: 'Havale / EFT',
    credit_card: 'Kredi Kartı',
    paypal: 'PayPal',
    cash_on_delivery: 'Kapıda Ödeme'
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to={createPageUrl('Orders')}>
        <Button variant="ghost" className="text-amber-900 hover:bg-amber-50">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.backToOrders}
        </Button>
      </Link>

      {/* Order Header */}
      <Card className="border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <CardTitle className="text-3xl text-amber-900 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
                {t.order} #{order.order_number}
              </CardTitle>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(order.created_date), 'dd MMMM yyyy, HH:mm')}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <OrderStatusBadge status={order.status} />
              <PaymentStatusBadge status={order.payment_status} />
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-amber-100">
            <CardHeader className="border-b bg-white">
              <CardTitle className="text-xl text-amber-900">{t.orderItemsTitle}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {order.items?.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center justify-between py-4 border-b border-amber-50 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-amber-900 mb-1">{item.product_name}</p>
                      <p className="text-sm text-gray-600">
                        {item.quantity} {t.pcs} x £{item.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-amber-900">
                        £{item.subtotal.toFixed(2)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Total */}
              <div className="mt-6 pt-6 border-t-2 border-amber-200">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-semibold text-amber-900">{t.totalAmount}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-amber-900">
                      £{order.total_amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          {order.delivery_address && (
            <Card className="border-amber-100">
              <CardHeader className="border-b bg-white">
                <CardTitle className="text-xl text-amber-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {t.deliveryAddressTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 whitespace-pre-line">{order.delivery_address}</p>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {order.notes && (
            <Card className="border-amber-100">
              <CardHeader className="border-b bg-white">
                <CardTitle className="text-xl text-amber-900 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {t.orderNotesTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 whitespace-pre-line">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Payment Section */}
        <div className="space-y-6">
          <Card className="border-amber-100 sticky top-24">
            <CardHeader className="border-b bg-gradient-to-r from-amber-50 to-orange-50">
              <CardTitle className="text-xl text-amber-900">{t.paymentInfo}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Payment Method */}
              <div>
                <p className="text-sm text-gray-600 mb-2">{t.paymentMethodLabel}</p>
                <Select
                  value={order.payment_method}
                  onValueChange={(value) => updateOrderMutation.mutate({ id: order.id, data: { payment_method: value } })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        {t.bankTransfer}
                      </div>
                    </SelectItem>
                    <SelectItem value="credit_card">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        {t.creditCard}
                      </div>
                    </SelectItem>
                    <SelectItem value="paypal">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        {t.paypal}
                      </div>
                    </SelectItem>
                    <SelectItem value="cash_on_delivery">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        {t.cashOnDelivery}
                      </div>
                    </SelectItem>
                    </SelectContent>
                    </Select>
                    </div>

              {/* Payment Status */}
              <div>
                <p className="text-sm text-gray-600 mb-2">{t.paymentStatus}</p>
                <PaymentStatusBadge status={order.payment_status} />
              </div>

              {/* Payment Action */}
              {order.payment_status === 'pending' && (
                <Button
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {order.payment_method === 'bank_transfer' ? t.notifyPayment : 
                   order.payment_method === 'cash_on_delivery' ? t.completeOrder : 
                   t.makePayment}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPaymentModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl"
          >
            <Card className="border-0">
              <CardHeader className="border-b bg-amber-50">
                <CardTitle className="text-xl text-amber-900">{t.payment}</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="bg-amber-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600 mb-2">{t.amountToPay}</p>
                  <p className="text-3xl font-bold text-amber-900">
                    £{order.total_amount.toFixed(2)}
                  </p>
                </div>

                <div className="space-y-3">
                  {order.payment_method === 'bank_transfer' ? (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">{t.bankDetails}</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <p>{t.bankName}</p>
                        <p>{t.iban}</p>
                        <p>{t.reference}: {order.order_number}</p>
                      </div>
                      <Button
                        onClick={() => {
                          updateOrderMutation.mutate({ 
                            id: order.id, 
                            data: { payment_status: 'paid' } 
                          });
                          setShowPaymentModal(false);
                        }}
                        className="w-full mt-4 bg-green-600 hover:bg-green-700"
                      >
                        {t.notifyPayment}
                      </Button>
                    </div>
                  ) : order.payment_method === 'paypal' ? (
                    <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                      <p className="text-sm text-blue-800">
                        {t.paypalRedirect}
                      </p>
                      <Button
                        onClick={() => {
                          window.open('https://www.paypal.com/checkoutnow', '_blank');
                          setShowPaymentModal(false);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {t.payWithPayPal}
                      </Button>
                    </div>
                  ) : order.payment_method === 'cash_on_delivery' ? (
                    <div className="p-4 bg-green-50 rounded-lg space-y-3">
                      <p className="text-sm text-green-800">
                        {t.cashOnDeliveryNote}
                      </p>
                      <Button
                        onClick={() => {
                          updateOrderMutation.mutate({ 
                            id: order.id, 
                            data: { payment_status: 'paid' } 
                          });
                          setShowPaymentModal(false);
                        }}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {t.completeOrder}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        {t.creditCardNote}
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-full"
                  variant="outline"
                >
                  {t.close}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}