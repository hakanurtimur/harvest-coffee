import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package, Calendar, MapPin, Truck, CheckCircle, Search, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import OrderStatusBadge from '../components/orders/OrderStatusBadge';
import PaymentStatusBadge from '../components/orders/PaymentStatusBadge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useLanguage } from '../Layout';

export default function TrackOrder() {
  const { t } = useLanguage();
  const urlParams = new URLSearchParams(window.location.search);
  const initialOrderNumber = urlParams.get('order_number') || '';
  
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [searchOrderNumber, setSearchOrderNumber] = useState(initialOrderNumber);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['track-order', searchOrderNumber],
    queryFn: async () => {
      if (!searchOrderNumber) return [];
      return await base44.entities.Order.filter({ order_number: searchOrderNumber });
    },
    enabled: !!searchOrderNumber,
  });

  const order = orders[0];

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchOrderNumber(orderNumber);
  };

  const getStatusProgress = (status) => {
    const statuses = ['preparing', 'in_transit', 'delivered'];
    return ((statuses.indexOf(status) + 1) / statuses.length) * 100;
  };

  const getStatusIcon = (status, currentStatus) => {
    const statuses = ['preparing', 'in_transit', 'delivered'];
    const currentIndex = statuses.indexOf(currentStatus);
    const statusIndex = statuses.indexOf(status);
    
    if (statusIndex < currentIndex) {
      return <CheckCircle className="w-8 h-8 text-green-600" />;
    } else if (statusIndex === currentIndex) {
      if (status === 'preparing') return <Package className="w-8 h-8 text-blue-600" />;
      if (status === 'in_transit') return <Truck className="w-8 h-8 text-orange-600" />;
      if (status === 'delivered') return <CheckCircle className="w-8 h-8 text-green-600" />;
    }
    return <div className="w-8 h-8 rounded-full border-2 border-gray-300" />;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-amber-900 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
          Track Your Order
        </h1>
        <p className="text-amber-700">Enter your order number to track its status</p>
      </div>

      {/* Search Box */}
      <Card className="max-w-2xl mx-auto border-amber-200">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Order Number
              </label>
              <div className="flex gap-2">
                <Input
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="e.g., HC12345678"
                  className="flex-1"
                />
                <Button type="submit" className="bg-amber-900 hover:bg-amber-800">
                  <Search className="w-4 h-4 mr-2" />
                  Track
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Loading */}
      {isLoading && (
        <div className="max-w-4xl mx-auto">
          <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
        </div>
      )}

      {/* Order Not Found */}
      {!isLoading && searchOrderNumber && !order && (
        <Card className="max-w-2xl mx-auto border-2 border-dashed border-amber-200">
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 text-amber-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-amber-900 mb-2">
              Order Not Found
            </h3>
            <p className="text-gray-600 mb-6">
              We couldn't find an order with number: <strong>{searchOrderNumber}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Please check your order number and try again.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Order Tracking Details */}
      {!isLoading && order && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-6"
        >
          {/* Order Header */}
          <Card className="border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-3xl text-amber-900 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
                    Order #{order.order_number}
                  </CardTitle>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Ordered: {format(new Date(order.created_date), 'dd MMMM yyyy')}</span>
                    </div>
                    {order.estimated_delivery_date && (
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        <span>Est. Delivery: {format(new Date(order.estimated_delivery_date), 'dd MMMM yyyy')}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <OrderStatusBadge status={order.status} />
                  <PaymentStatusBadge status={order.payment_status} />
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Tracking Progress */}
          <Card className="border-amber-100">
            <CardHeader>
              <CardTitle className="text-xl text-amber-900">Delivery Status</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {/* Progress Bar */}
              <div className="mb-8">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-600 via-orange-600 to-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${getStatusProgress(order.status)}%` }}
                  />
                </div>
              </div>

              {/* Status Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Preparing */}
                <div className="text-center">
                  <div className="flex justify-center mb-3">
                    {getStatusIcon('preparing', order.status)}
                  </div>
                  <h4 className={`font-semibold mb-1 ${order.status === 'preparing' ? 'text-blue-900' : 'text-gray-600'}`}>
                    Preparing
                  </h4>
                  <p className="text-xs text-gray-500">Your order is being prepared</p>
                </div>

                {/* In Transit */}
                <div className="text-center">
                  <div className="flex justify-center mb-3">
                    {getStatusIcon('in_transit', order.status)}
                  </div>
                  <h4 className={`font-semibold mb-1 ${order.status === 'in_transit' ? 'text-orange-900' : 'text-gray-600'}`}>
                    In Transit
                  </h4>
                  <p className="text-xs text-gray-500">On the way to you</p>
                  {order.tracking_number && order.status === 'in_transit' && (
                    <p className="text-xs text-amber-900 font-medium mt-1">
                      Tracking: {order.tracking_number}
                    </p>
                  )}
                </div>

                {/* Delivered */}
                <div className="text-center">
                  <div className="flex justify-center mb-3">
                    {getStatusIcon('delivered', order.status)}
                  </div>
                  <h4 className={`font-semibold mb-1 ${order.status === 'delivered' ? 'text-green-900' : 'text-gray-600'}`}>
                    Delivered
                  </h4>
                  <p className="text-xs text-gray-500">Order completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          {order.delivery_address && (
            <Card className="border-amber-100">
              <CardHeader>
                <CardTitle className="text-xl text-amber-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 whitespace-pre-line">{order.delivery_address}</p>
              </CardContent>
            </Card>
          )}

          {/* Order Items */}
          <Card className="border-amber-100">
            <CardHeader>
              <CardTitle className="text-xl text-amber-900">Order Items</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-3 border-b border-amber-50 last:border-0">
                    <div>
                      <p className="font-semibold text-amber-900">{item.product_name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-amber-900">£{item.subtotal.toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t-2 border-amber-200">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-semibold text-amber-900">Total</span>
                  <span className="text-2xl font-bold text-amber-900">£{order.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Back to Orders */}
          <div className="text-center">
            <Link to={createPageUrl('Orders')}>
              <Button variant="outline" className="border-amber-900 text-amber-900 hover:bg-amber-50">
                <ArrowLeft className="w-4 h-4 mr-2" />
                View All Orders
              </Button>
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}