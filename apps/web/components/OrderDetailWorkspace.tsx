"use client";

import OrderDetailV2Workspace from "@/components/OrderDetailV2Workspace";
import LoadingState from "@/components/LoadingState";
import { Combobox } from "@/components/ui/combobox";
import { getHarvestApi } from "@/lib/harvest-api";
import { useV2Enabled } from "@/lib/v2-pages";
import { Order, paymentMethodLabels, paymentStatusLabels } from "@/lib/domain";
import { ArrowLeft, CreditCard, FileText, MapPin, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const paymentMethodOptions = Object.entries(paymentMethodLabels).map(([value, label]) => ({ label, value }));

export default function OrderDetailWorkspace({ orderId }: { orderId: string }) {
  const v2Enabled = useV2Enabled("/orderdetails");

  if (v2Enabled) {
    return <OrderDetailV2Workspace orderId={orderId} />;
  }

  return <LegacyOrderDetailWorkspace orderId={orderId} />;
}

function LegacyOrderDetailWorkspace({ orderId }: { orderId: string }) {
  const api = useMemo(() => getHarvestApi(), []);
  const [order, setOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    setIsLoading(true);
    setMessage("");
    setLoadError("");
    try {
      setOrder(orderId ? await api.getOrder(orderId) : null);
    } catch (error) {
      setOrder(null);
      setLoadError(error instanceof Error ? error.message : "Order could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  };

  const updatePayment = async (patch: Pick<Order, "paymentMethod"> | Pick<Order, "paymentStatus">) => {
    if (!order) return;
    setIsSaving(true);
    setMessage("");
    try {
      const updated = await api.updateOrder(order.id, patch);
      setOrder(updated);
      setMessage(`Order #${updated.orderNumber} updated.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Order could not be updated.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <header className="topbar">
        <div>
          <p>Dealer order</p>
          <h1>{order ? `#${order.orderNumber}` : "Order details"}</h1>
        </div>
        <button className="ghost-button" onClick={loadOrder} disabled={isLoading}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      {message && <section className={message.includes("disabled") || message.includes("could not") ? "notice error" : "notice"}>{message}</section>}

      <div className="detail-actions">
        <Link href="/orders" className="ghost-link">
          <ArrowLeft size={16} />
          Back to orders
        </Link>
      </div>

      {isLoading ? (
        <section className="orders-section">
          <LoadingState
            description="Fetching order status, payment details, delivery address, and items."
            minHeight="min-h-[260px]"
            title="Loading order"
          />
        </section>
      ) : !order ? (
        <section className="orders-section">
          <div className="loading-panel">{loadError || "Order not found."}</div>
        </section>
      ) : (
        <section className="detail-grid">
          <div className="detail-main">
            <section className="orders-section detail-card">
              <div className="section-head compact">
                <div>
                  <p>Order items</p>
                  <h2>{order.items.length} item set</h2>
                </div>
                <strong>GBP {order.totalAmount.toFixed(2)}</strong>
              </div>
              <div className="item-list">
                {order.items.map((item) => (
                  <div className="item-row" key={item.productId}>
                    <div>
                      <strong>{item.productName}</strong>
                      <span>{item.quantity} x GBP {item.price.toFixed(2)}</span>
                    </div>
                    <b>GBP {item.subtotal.toFixed(2)}</b>
                  </div>
                ))}
              </div>
            </section>

            {order.deliveryAddress && (
              <section className="orders-section detail-card">
                <div className="section-head compact">
                  <div>
                    <p>Delivery</p>
                    <h2><MapPin size={18} /> Address</h2>
                  </div>
                </div>
                <p className="detail-copy">{order.deliveryAddress}</p>
              </section>
            )}

            {order.notes && (
              <section className="orders-section detail-card">
                <div className="section-head compact">
                  <div>
                    <p>Notes</p>
                    <h2><FileText size={18} /> Order notes</h2>
                  </div>
                </div>
                <p className="detail-copy">{order.notes}</p>
              </section>
            )}
          </div>

          <aside className="order-pane detail-payment">
            <div className="section-head compact">
              <div>
                <p>Payment</p>
                <h2><CreditCard size={18} /> Information</h2>
              </div>
            </div>
            <label>
              <span>Method</span>
              <Combobox
                value={order.paymentMethod}
                onChange={(value) => updatePayment({ paymentMethod: value as Order["paymentMethod"] })}
                disabled={isSaving}
                loading={isSaving}
                options={paymentMethodOptions}
                placeholder="Payment method"
              />
            </label>
            <div className="payment-line">
              <span>Status</span>
              <strong>{paymentStatusLabels[order.paymentStatus]}</strong>
            </div>
            {order.paymentStatus === "pending" && (
              <button className="primary-button" onClick={() => updatePayment({ paymentStatus: "paid" })} disabled={isSaving}>
                Mark payment notified
              </button>
            )}
          </aside>
        </section>
      )}
    </>
  );
}
