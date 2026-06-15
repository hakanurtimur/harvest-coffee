"use client";

import { getHarvestApi } from "@/lib/harvest-api";
import { useV2Enabled } from "@/lib/v2-pages";
import { Order, OrderStatus, PaymentStatus } from "@/lib/domain";
import { ArrowRight, Calendar, CheckCircle, Clock, Package, Truck, XCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import OrdersV2Workspace from "./OrdersV2Workspace";

export default function OrdersWorkspace() {
  const v2Enabled = useV2Enabled("/orders");
  const api = useMemo(() => getHarvestApi(), []);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (v2Enabled) return;

    const loadOrders = async () => {
      setIsLoading(true);
      const nextOrders = await api.getOrders();
      setOrders([...nextOrders].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)));
      setIsLoading(false);
    };

    void loadOrders();
  }, [api, v2Enabled]);

  if (v2Enabled) {
    return <OrdersV2Workspace />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-amber-900 mb-2" style={{ fontFamily: "Georgia, serif" }}>
          My Orders
        </h1>
        <p className="text-amber-700">Track all your orders here</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-48 bg-gray-100 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <section className="border-2 border-dashed border-amber-200 rounded-xl bg-white">
          <div className="p-12 text-center">
            <Package className="w-16 h-16 text-amber-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-amber-900 mb-2">No orders yet</h3>
            <p className="text-gray-600 mb-6">Start browsing products and place your first order</p>
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-md bg-amber-900 hover:bg-amber-800 text-white px-4 py-2 font-semibold transition-colors"
            >
              Go to Products
            </Link>
          </div>
        </section>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="rounded-xl border border-amber-100 bg-white hover:shadow-xl transition-all duration-300 overflow-hidden">
              <header className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-amber-900 mb-2">Order #{order.orderNumber}</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {formatOrderDate(order.createdAt)}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <OrderStatusBadge status={order.status} />
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </div>
                </div>
              </header>

              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Products:</p>
                    <div className="space-y-1">
                      {order.items?.slice(0, 3).map((item) => (
                        <p key={`${order.id}-${item.productId}`} className="text-sm text-amber-900">
                          • {item.productName} <span className="text-gray-600">x{item.quantity}</span>
                        </p>
                      ))}
                      {order.items?.length > 3 && (
                        <p className="text-sm text-gray-500">+{order.items.length - 3} more products</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-amber-100">
                    <span className="text-2xl font-bold text-amber-900">£{order.totalAmount.toFixed(2)}</span>
                    <Link
                      href={`/orderdetails?id=${order.id}`}
                      className="inline-flex items-center justify-center rounded-md bg-amber-900 hover:bg-amber-800 text-white px-4 py-2 font-semibold transition-colors"
                    >
                      Details
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function formatOrderDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = {
    preparing: {
      label: "Preparing",
      icon: Package,
      className: "bg-blue-100 text-blue-800 border-blue-200",
    },
    in_transit: {
      label: "In Transit",
      icon: Truck,
      className: "bg-orange-100 text-orange-800 border-orange-200",
    },
    delivered: {
      label: "Delivered",
      icon: CheckCircle,
      className: "bg-green-100 text-green-800 border-green-200",
    },
    cancelled: {
      label: "Cancelled",
      icon: XCircle,
      className: "bg-red-100 text-red-800 border-red-200",
    },
  }[status];

  const Icon = config.icon;
  return (
    <span className={`${config.className} border flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm`}>
      <Icon className="w-4 h-4" />
      <span className="font-medium">{config.label}</span>
    </span>
  );
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const config = {
    pending: {
      label: "Pending",
      icon: Clock,
      className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    },
    paid: {
      label: "Paid",
      icon: CheckCircle,
      className: "bg-green-100 text-green-800 border-green-200",
    },
    failed: {
      label: "Failed",
      icon: XCircle,
      className: "bg-red-100 text-red-800 border-red-200",
    },
  }[status];

  const Icon = config.icon;
  return (
    <span className={`${config.className} border flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm`}>
      <Icon className="w-4 h-4" />
      <span className="font-medium">{config.label}</span>
    </span>
  );
}
