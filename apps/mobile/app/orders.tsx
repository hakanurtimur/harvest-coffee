import { Feather } from "@expo/vector-icons";
import { Order, OrderStatus, orderStatusLabels, paymentStatusLabels } from "@harvest/domain";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, EmptyState, fontFamilies, formatCurrency, formatDate, PrimaryButton, ScrollContent, SectionTitle, styles } from "../components/ui";
import { useMobileState } from "../lib/mobile-state";

type OrderFilter = "all" | OrderStatus;

const filters: { label: string; value: OrderFilter }[] = [
  { label: "All", value: "all" },
  { label: "Preparing", value: "preparing" },
  { label: "In transit", value: "in_transit" },
  { label: "Delivered", value: "delivered" },
];

const statusIcon: Record<OrderStatus, keyof typeof Feather.glyphMap> = {
  delivered: "check-circle",
  in_transit: "truck",
  preparing: "package",
};

const statusTone: Record<OrderStatus, { background: string; color: string }> = {
  delivered: colors.status.success,
  in_transit: colors.status.warning,
  preparing: colors.status.info,
};

export default function OrdersScreen() {
  const { orders } = useMobileState();
  const [filter, setFilter] = useState<OrderFilter>("all");

  const filteredOrders = useMemo(
    () => filter === "all" ? orders : orders.filter((order) => order.status === filter),
    [filter, orders],
  );
  const activeOrders = orders.filter((order) => order.status === "preparing" || order.status === "in_transit").length;

  return (
    <ScrollContent>
      <SectionTitle eyebrow="My orders" title="Order history" />
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/track-order")}
        style={({ pressed }) => [orderStyles.trackCard, pressed && styles.pressed]}
      >
        <View style={orderStyles.trackIcon}>
          <Feather color={colors.foreground} name="search" size={18} />
        </View>
        <View style={orderStyles.trackCopy}>
          <Text style={orderStyles.trackTitle}>Track order</Text>
          <Text style={orderStyles.trackBody}>Find an order by number</Text>
        </View>
        <Feather color={colors.muted} name="chevron-right" size={20} />
      </Pressable>

      <View style={orderStyles.summaryRow}>
        <View style={orderStyles.summaryItem}>
          <Text style={orderStyles.summaryValue}>{orders.length}</Text>
          <Text style={orderStyles.summaryLabel}>Total</Text>
        </View>
        <View style={orderStyles.summaryDivider} />
        <View style={orderStyles.summaryItem}>
          <Text style={orderStyles.summaryValue}>{activeOrders}</Text>
          <Text style={orderStyles.summaryLabel}>Active</Text>
        </View>
        <View style={orderStyles.summaryDivider} />
        <View style={orderStyles.summaryItem}>
          <Text style={orderStyles.summaryValue}>{orders[0] ? formatCurrency(orders[0].totalAmount).replace("GBP ", "£") : "£0.00"}</Text>
          <Text style={orderStyles.summaryLabel}>Latest</Text>
        </View>
      </View>

      <View style={orderStyles.filters}>
        {filters.map((item) => {
          const active = filter === item.value;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              key={item.value}
              onPress={() => setFilter(item.value)}
              style={({ pressed }) => [orderStyles.filterChip, active && orderStyles.filterChipActive, pressed && styles.pressed]}
            >
              <Text style={[orderStyles.filterText, active && orderStyles.filterTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {orders.length === 0 ? (
        <View style={orderStyles.emptyCard}>
          <EmptyState title="No orders yet" body="Create your first order from the product catalogue." />
          <PrimaryButton label="Go to Products" onPress={() => router.push("/products")} />
        </View>
      ) : filteredOrders.length === 0 ? (
        <EmptyState title="No matching orders" body="Try another status filter." />
      ) : (
        filteredOrders.map((order) => (
          <DealerOrderCard key={order.id} order={order} onPress={() => router.push(`/order/${order.id}`)} />
        ))
      )}
    </ScrollContent>
  );
}

function DealerOrderCard({ order, onPress }: { order: Order; onPress: () => void }) {
  const tone = statusTone[order.status];
  const visibleItems = order.items.slice(0, 3);
  const remainingItems = Math.max(0, order.items.length - visibleItems.length);

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [orderStyles.orderCard, pressed && styles.pressed]}>
      <View style={orderStyles.orderHeader}>
        <View style={orderStyles.orderTitleBlock}>
          <Text style={orderStyles.orderNumber}>{order.orderNumber}</Text>
          <Text style={orderStyles.orderDate}>{formatDate(order.createdAt)}</Text>
        </View>
        <Text style={orderStyles.orderTotal}>{formatCurrency(order.totalAmount).replace("GBP ", "£")}</Text>
      </View>

      <View style={orderStyles.statusRow}>
        <View style={[orderStyles.statusBadge, { backgroundColor: tone.background }]}>
          <Feather color={tone.color} name={statusIcon[order.status]} size={13} />
          <Text style={[orderStyles.statusText, { color: tone.color }]}>{orderStatusLabels[order.status]}</Text>
        </View>
        <View style={orderStyles.paymentBadge}>
          <Feather color={colors.primary} name={order.paymentStatus === "paid" ? "check-circle" : "clock"} size={13} />
          <Text style={orderStyles.paymentText}>{paymentStatusLabels[order.paymentStatus]}</Text>
        </View>
      </View>

      <View style={orderStyles.items}>
        {visibleItems.map((item) => (
          <View key={`${order.id}-${item.productId}`} style={orderStyles.itemRow}>
            <Text numberOfLines={1} style={orderStyles.itemName}>{item.productName}</Text>
            <Text style={orderStyles.itemQuantity}>x{item.quantity}</Text>
          </View>
        ))}
        {remainingItems ? <Text style={orderStyles.moreItems}>+{remainingItems} more products</Text> : null}
      </View>

      <View style={orderStyles.orderFooter}>
        <Text style={orderStyles.footerHint}>View details</Text>
        <Feather color={colors.primary} name="arrow-right" size={16} />
      </View>
    </Pressable>
  );
}

const orderStyles = StyleSheet.create({
  emptyCard: {
    gap: 12,
  },
  filterChip: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: colors.foreground,
    borderColor: colors.foreground,
  },
  filterText: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
  },
  filterTextActive: {
    color: colors.onPrimary,
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  footerHint: {
    color: colors.primary,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
  },
  itemName: {
    color: colors.foreground,
    flex: 1,
    fontFamily: fontFamilies.medium,
    fontSize: 13,
  },
  itemQuantity: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
  },
  itemRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  items: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 7,
    padding: 10,
  },
  moreItems: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
  },
  orderCard: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    padding: 12,
    shadowColor: colors.foreground,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
  },
  orderDate: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
  },
  orderFooter: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    justifyContent: "flex-end",
  },
  orderHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  orderNumber: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 16,
  },
  orderTitleBlock: {
    flex: 1,
    gap: 3,
  },
  orderTotal: {
    color: colors.primary,
    fontFamily: fontFamilies.bold,
    fontSize: 18,
  },
  paymentBadge: {
    alignItems: "center",
    backgroundColor: colors.surfaceSoft,
    borderRadius: 999,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  paymentText: {
    color: colors.primary,
    fontFamily: fontFamilies.semiBold,
    fontSize: 11,
  },
  statusBadge: {
    alignItems: "center",
    borderRadius: 999,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  statusText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 11,
  },
  summaryDivider: {
    backgroundColor: colors.border,
    height: 30,
    width: 1,
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
    gap: 2,
  },
  summaryLabel: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    textTransform: "uppercase",
  },
  summaryRow: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    padding: 12,
  },
  summaryValue: {
    color: colors.foreground,
    fontFamily: fontFamilies.bold,
    fontSize: 16,
  },
  trackBody: {
    color: colors.muted,
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  trackCard: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  trackCopy: {
    flex: 1,
    gap: 2,
  },
  trackIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  trackTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
  },
});
