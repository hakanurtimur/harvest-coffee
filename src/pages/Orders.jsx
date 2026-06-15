import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Calendar, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import OrderStatusBadge from '../components/orders/OrderStatusBadge';
import PaymentStatusBadge from '../components/orders/PaymentStatusBadge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useLanguage } from '../Layout';

export default function Orders() {
  const { t } = useLanguage();
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-amber-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          {t.myOrdersTitle}
        </h1>
        <p className="text-amber-700">{t.trackAllOrders}</p>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card className="border-2 border-dashed border-amber-200">
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 text-amber-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-amber-900 mb-2">
              {t.noOrdersYet}
            </h3>
            <p className="text-gray-600 mb-6">
              {t.noOrdersDesc}
            </p>
            <Link to={createPageUrl('Products')}>
              <Button className="bg-amber-900 hover:bg-amber-800">
                {t.goToProducts}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-xl transition-all duration-300 border-amber-100">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl text-amber-900 mb-2">
                        {t.order} #{order.order_number}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(order.created_date), 'dd MMMM yyyy, HH:mm')}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <OrderStatusBadge status={order.status} />
                      <PaymentStatusBadge status={order.payment_status} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Items Summary */}
                    <div>
                      <p className="text-sm text-gray-600 mb-2">{t.productsLabel}</p>
                      <div className="space-y-1">
                        {order.items?.slice(0, 3).map((item, idx) => (
                          <p key={idx} className="text-sm text-amber-900">
                            • {item.product_name} <span className="text-gray-600">x{item.quantity}</span>
                          </p>
                        ))}
                        {order.items?.length > 3 && (
                          <p className="text-sm text-gray-500">
                            +{order.items.length - 3} {t.moreProducts}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Total and Action */}
                    <div className="flex items-center justify-between pt-4 border-t border-amber-100">
                      <div>
                        <span className="text-2xl font-bold text-amber-900">
                          £{order.total_amount.toFixed(2)}
                        </span>
                      </div>
                      <Link to={createPageUrl('OrderDetails') + `?id=${order.id}`}>
                        <Button className="bg-amber-900 hover:bg-amber-800">
                          {t.orderDetails}
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