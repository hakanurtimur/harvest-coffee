"use client";

import AdminOrdersV2Workspace from "@/components/AdminOrdersV2Workspace";
import { getHarvestApi } from "@/lib/harvest-api";
import { useV2Enabled } from "@/lib/v2-pages";
import {
  Order,
  OrderStatus,
  orderStatusLabels,
  PaymentStatus,
  paymentStatusLabels,
} from "@/lib/domain";
import { RefreshCw, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const orderStatusOptions: OrderStatus[] = ["preparing", "in_transit", "delivered"];
const paymentStatusOptions: PaymentStatus[] = ["pending", "paid", "failed"];

export default function AdminOrdersWorkspace() {
  const v2Enabled = useV2Enabled("/adminorders");

  if (v2Enabled) {
    return <AdminOrdersV2Workspace />;
  }

  return <LegacyAdminOrdersWorkspace />;
}

function LegacyAdminOrdersWorkspace() {
  const api = useMemo(() => getHarvestApi(), []);
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);

  useEffect(() => {
    void loadOrders();
  }, []);

  const loadOrders = async () => {
    setIsLoading(true);
    setMessage("");
    setOrders(await api.getOrders());
    setIsLoading(false);
  };

  const updateOrder = async (id: string, input: Partial<Pick<Order, "status" | "paymentStatus" | "trackingNumber" | "estimatedDeliveryDate">>) => {
    setSavingOrderId(id);
    setMessage("");
    try {
      const updated = await api.updateOrder(id, input);
      setOrders((current) => current.map((order) => order.id === id ? updated : order));
      setMessage(`Order #${updated.orderNumber} updated.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Order could not be updated.");
    } finally {
      setSavingOrderId(null);
    }
  };

  const openOrders = orders.filter((order) => order.status !== "delivered").length;
  const pendingPayments = orders.filter((order) => order.paymentStatus === "pending").length;
  const revenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <>
      <header className="topbar">
        <div>
          <p>Admin</p>
          <h1>Orders</h1>
        </div>
        <button className="ghost-button" onClick={loadOrders} disabled={isLoading}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      {message && <section className={message.includes("disabled") || message.includes("could not") ? "notice error" : "notice"}>{message}</section>}

      <section className="metrics" aria-label="Order overview">
        <div>
          <span>Total orders</span>
          <strong>{orders.length}</strong>
        </div>
        <div>
          <span>Open orders</span>
          <strong>{openOrders}</strong>
        </div>
        <div>
          <span>Pending payments</span>
          <strong>{pendingPayments}</strong>
        </div>
      </section>

      <section className="orders-section">
        <div className="section-head">
          <div>
            <p>Operations</p>
            <h2>Manage order queue</h2>
          </div>
          <strong>GBP {revenue.toFixed(2)}</strong>
        </div>

        <div className="admin-orders-list">
          {isLoading ? (
            <div className="loading-panel">Loading orders...</div>
          ) : orders.map((order) => (
            <article className="admin-order-card" key={order.id}>
              <div className="admin-order-main">
                <strong>#{order.orderNumber}</strong>
                <span>{order.customerName || order.customerEmail}</span>
                <span>{order.items.length} item set</span>
                <b>GBP {order.totalAmount.toFixed(2)}</b>
              </div>

              <div className="admin-order-controls">
                <label>
                  <span>Status</span>
                  <select
                    value={order.status}
                    onChange={(event) => updateOrder(order.id, { status: event.target.value as OrderStatus })}
                    disabled={savingOrderId === order.id}
                  >
                    {orderStatusOptions.map((status) => (
                      <option value={status} key={status}>{orderStatusLabels[status]}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Payment</span>
                  <select
                    value={order.paymentStatus}
                    onChange={(event) => updateOrder(order.id, { paymentStatus: event.target.value as PaymentStatus })}
                    disabled={savingOrderId === order.id}
                  >
                    {paymentStatusOptions.map((status) => (
                      <option value={status} key={status}>{paymentStatusLabels[status]}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Tracking</span>
                  <input
                    defaultValue={order.trackingNumber}
                    onBlur={(event) => {
                      if (event.target.value !== (order.trackingNumber ?? "")) {
                        void updateOrder(order.id, { trackingNumber: event.target.value });
                      }
                    }}
                    disabled={savingOrderId === order.id}
                    placeholder="Tracking ref"
                  />
                </label>

                <label>
                  <span>ETA</span>
                  <input
                    type="date"
                    defaultValue={order.estimatedDeliveryDate}
                    onBlur={(event) => {
                      if (event.target.value !== (order.estimatedDeliveryDate ?? "")) {
                        void updateOrder(order.id, { estimatedDeliveryDate: event.target.value });
                      }
                    }}
                    disabled={savingOrderId === order.id}
                  />
                </label>

                <div className="save-indicator">
                  {savingOrderId === order.id && <Save size={16} />}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
