"use client";

import AdminOrdersV2Workspace from "@/components/AdminOrdersV2Workspace";
import LoadingState from "@/components/LoadingState";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
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
const orderStatusComboboxOptions = orderStatusOptions.map((status) => ({ label: orderStatusLabels[status], value: status }));
const paymentStatusComboboxOptions = paymentStatusOptions.map((status) => ({ label: paymentStatusLabels[status], value: status }));

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
            <LoadingState
              description="Fetching the latest order queue and payment statuses."
              minHeight="min-h-[260px]"
              title="Loading orders"
            />
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
                  <Combobox
                    value={order.status}
                    onChange={(value) => updateOrder(order.id, { status: value as OrderStatus })}
                    disabled={savingOrderId === order.id}
                    loading={savingOrderId === order.id}
                    options={orderStatusComboboxOptions}
                    placeholder="Status"
                  />
                </label>

                <label>
                  <span>Payment</span>
                  <Combobox
                    value={order.paymentStatus}
                    onChange={(value) => updateOrder(order.id, { paymentStatus: value as PaymentStatus })}
                    disabled={savingOrderId === order.id}
                    loading={savingOrderId === order.id}
                    options={paymentStatusComboboxOptions}
                    placeholder="Payment"
                  />
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
                  <DatePicker
                    disabled={savingOrderId === order.id}
                    id={`legacy-admin-order-eta-${order.id}`}
                    onChange={(value) => {
                      if (value !== (order.estimatedDeliveryDate ?? "")) {
                        void updateOrder(order.id, { estimatedDeliveryDate: value });
                      }
                    }}
                    placeholder="Select ETA"
                    value={order.estimatedDeliveryDate ?? ""}
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
