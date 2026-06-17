import { Order, OrderStatus, PaymentStatus, orderStatusLabels, paymentStatusLabels } from "@harvest/domain";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { AdminShell } from "../components/admin-shell";
import { AdminMetricCard, OptionChip } from "../components/admin-ui";
import { Badge, Card, EmptyState, Field, formatCurrency, formatDate, ScrollContent, SectionTitle, styles } from "../components/ui";
import { useMobileState } from "../lib/mobile-state";

const orderStatusOptions: OrderStatus[] = ["preparing", "in_transit", "delivered", "cancelled"];
const paymentStatusOptions: PaymentStatus[] = ["pending", "paid", "failed"];
type StatusFilter = "all" | OrderStatus;
type PaymentFilter = "all" | PaymentStatus;

export default function AdminOrdersScreen() {
  const { orders, updateOrder } = useMobileState();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);

  const filteredOrders = orders.filter((order) => {
    const statusMatches = statusFilter === "all" || order.status === statusFilter;
    const paymentMatches = paymentFilter === "all" || order.paymentStatus === paymentFilter;
    return statusMatches && paymentMatches;
  });
  const openOrders = orders.filter((order) => order.status !== "delivered" && order.status !== "cancelled").length;
  const pendingPayments = orders.filter((order) => order.paymentStatus === "pending").length;

  const saveOrder = async (id: string, input: Partial<Pick<Order, "estimatedDeliveryDate" | "paymentStatus" | "status" | "trackingNumber">>) => {
    setSavingOrderId(id);
    try {
      const updated = await updateOrder(id, input);
      Alert.alert("Order updated", `Order #${updated.orderNumber} updated.`);
    } catch (error) {
      Alert.alert("Order update failed", error instanceof Error ? error.message : "Order could not be updated.");
    } finally {
      setSavingOrderId(null);
    }
  };

  return (
    <AdminShell title="Orders">
      <ScrollContent>
        <SectionTitle eyebrow="Operations" title="Manage order queue" />
        <View style={orderStyles.grid}>
          <AdminMetricCard label="Total orders" value={String(orders.length)} />
          <AdminMetricCard label="Open orders" value={String(openOrders)} />
          <AdminMetricCard label="Pending payments" value={String(pendingPayments)} />
        </View>

        <Card>
          <Text style={styles.cardTitle}>Filters</Text>
          <Text style={styles.muted}>Status</Text>
          <View style={orderStyles.chips}>
            <OptionChip active={statusFilter === "all"} label="All" onPress={() => setStatusFilter("all")} />
            {orderStatusOptions.map((status) => (
              <OptionChip key={status} active={statusFilter === status} label={orderStatusLabels[status]} onPress={() => setStatusFilter(status)} />
            ))}
          </View>
          <Text style={styles.muted}>Payment</Text>
          <View style={orderStyles.chips}>
            <OptionChip active={paymentFilter === "all"} label="All" onPress={() => setPaymentFilter("all")} />
            {paymentStatusOptions.map((status) => (
              <OptionChip key={status} active={paymentFilter === status} label={paymentStatusLabels[status]} onPress={() => setPaymentFilter(status)} />
            ))}
          </View>
          <Text style={styles.description}>{filteredOrders.length} orders match the selected filters.</Text>
        </Card>

        {filteredOrders.length === 0 ? (
          <EmptyState title="No orders found" body="No orders match the selected filters." />
        ) : (
          filteredOrders.map((order) => (
            <AdminOrderCard key={order.id} order={order} saving={savingOrderId === order.id} saveOrder={saveOrder} />
          ))
        )}
      </ScrollContent>
    </AdminShell>
  );
}

function AdminOrderCard({
  order,
  saveOrder,
  saving,
}: {
  order: Order;
  saveOrder: (id: string, input: Partial<Pick<Order, "estimatedDeliveryDate" | "paymentStatus" | "status" | "trackingNumber">>) => Promise<void>;
  saving: boolean;
}) {
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber ?? "");
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState(order.estimatedDeliveryDate ?? "");

  return (
    <Card>
      <View style={styles.rowBetween}>
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>Order #{order.orderNumber}</Text>
          <Text style={styles.muted}>{formatDate(order.createdAt)} · {order.customerName || order.customerEmail}</Text>
        </View>
        <Text style={styles.total}>{formatCurrency(order.totalAmount)}</Text>
      </View>
      <View style={styles.badgeRow}>
        <Badge label={orderStatusLabels[order.status]} />
        <Badge label={paymentStatusLabels[order.paymentStatus]} />
      </View>
      <View>
        <Text style={styles.muted}>Products</Text>
        {order.items.map((item) => (
          <View key={`${order.id}-${item.productId}`} style={orderStyles.itemRow}>
            <Text style={styles.name}>{item.productName} x{item.quantity}</Text>
            <Text style={styles.price}>{formatCurrency(item.subtotal)}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.muted}>Status</Text>
      <View style={orderStyles.chips}>
        {orderStatusOptions.map((status) => (
          <OptionChip key={status} active={order.status === status} label={orderStatusLabels[status]} onPress={() => void saveOrder(order.id, { status })} />
        ))}
      </View>
      <Text style={styles.muted}>Payment</Text>
      <View style={orderStyles.chips}>
        {paymentStatusOptions.map((status) => (
          <OptionChip key={status} active={order.paymentStatus === status} label={paymentStatusLabels[status]} onPress={() => void saveOrder(order.id, { paymentStatus: status })} />
        ))}
      </View>
      <Field onChangeText={setTrackingNumber} placeholder="Tracking ref" value={trackingNumber} />
      <Field onChangeText={setEstimatedDeliveryDate} placeholder="ETA, e.g. 2026-06-20" value={estimatedDeliveryDate} />
      <View style={orderStyles.actions}>
        <Pressable
          accessibilityRole="button"
          disabled={saving}
          onPress={() => void saveOrder(order.id, { trackingNumber: trackingNumber.trim(), estimatedDeliveryDate: estimatedDeliveryDate.trim() })}
          style={({ pressed }) => [styles.primaryButton, pressed && !saving && styles.pressed, saving && styles.disabled, orderStyles.actionButton]}
        >
          <Text style={styles.primaryButtonText}>{saving ? "Saving..." : "Save tracking"}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push(`/order/${order.id}`)} style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed, orderStyles.actionButton]}>
          <Text style={styles.outlineButtonText}>Details</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const orderStyles = StyleSheet.create({
  actionButton: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  grid: {
    gap: 10,
  },
  itemRow: {
    alignItems: "center",
    borderTopColor: "#eadccb",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    paddingTop: 9,
  },
});
