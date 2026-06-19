import { Feather } from "@expo/vector-icons";
import { Order, OrderStatus, PaymentStatus, orderStatusLabels, paymentStatusLabels } from "@harvest/domain";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, EmptyState, Field, fontFamilies, formatCurrency, formatDate, ScrollContent, SectionTitle, StatusBanner, styles } from "../components/ui";
import { useMobileState } from "../lib/mobile-state";

const orderStatusOptions: OrderStatus[] = ["preparing", "in_transit", "delivered", "cancelled"];
const paymentStatusOptions: PaymentStatus[] = ["pending", "paid", "failed"];
type StatusFilter = "all" | OrderStatus;
type PaymentFilter = "all" | PaymentStatus;
type ViewMode = "cards" | "list";

const statusIcon: Record<OrderStatus, keyof typeof Feather.glyphMap> = {
  cancelled: "x-circle",
  delivered: "check-circle",
  in_transit: "truck",
  preparing: "package",
};

const statusTone: Record<OrderStatus, { background: string; border: string; color: string }> = {
  cancelled: colors.status.danger,
  delivered: colors.status.success,
  in_transit: colors.status.warning,
  preparing: colors.status.info,
};

const paymentTone: Record<PaymentStatus, { background: string; border: string; color: string; icon: keyof typeof Feather.glyphMap }> = {
  failed: { ...colors.status.danger, icon: "x-circle" },
  paid: { ...colors.status.success, icon: "check-circle" },
  pending: { ...colors.status.warning, icon: "clock" },
};

export default function AdminOrdersScreen() {
  const { orders, updateOrder } = useMobileState();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  const sortedOrders = useMemo(
    () => [...orders].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [orders],
  );
  const filteredOrders = useMemo(
    () => sortedOrders.filter((order) => {
      const statusMatches = statusFilter === "all" || order.status === statusFilter;
      const paymentMatches = paymentFilter === "all" || order.paymentStatus === paymentFilter;
      return statusMatches && paymentMatches;
    }),
    [paymentFilter, sortedOrders, statusFilter],
  );
  const openOrders = orders.filter((order) => order.status !== "delivered" && order.status !== "cancelled").length;
  const pendingPayments = orders.filter((order) => order.paymentStatus === "pending").length;
  const revenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  const saveOrder = async (id: string, input: Partial<Pick<Order, "estimatedDeliveryDate" | "paymentStatus" | "status" | "trackingNumber">>) => {
    setSavingOrderId(id);
    setMessage(null);
    try {
      const updated = await updateOrder(id, input);
      setMessage({ text: `Order #${updated.orderNumber} updated.`, tone: "success" });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Order could not be updated.", tone: "error" });
    } finally {
      setSavingOrderId(null);
    }
  };

  return (
    <ScrollContent>
      <SectionTitle eyebrow="Operations" title="Orders" />

      {message ? <StatusBanner title={message.tone === "success" ? "Order updated" : "Order update failed"} body={message.text} tone={message.tone} /> : null}

      <View style={orderStyles.metricsGrid}>
        <AdminSummaryCard icon="shopping-bag" label="Total orders" value={String(orders.length)} />
        <AdminSummaryCard icon="activity" label="Open" value={String(openOrders)} />
        <AdminSummaryCard icon="clock" label="Pending" value={String(pendingPayments)} />
        <AdminSummaryCard icon="credit-card" label="Revenue" value={formatCurrency(revenue).replace("GBP ", "£")} />
      </View>

      <View style={orderStyles.filterCard}>
        <View style={orderStyles.filterHeader}>
          <View style={orderStyles.filterTitleRow}>
            <Feather color={colors.primary} name="filter" size={15} />
            <Text style={orderStyles.filterTitle}>Filters</Text>
          </View>
          <Text style={orderStyles.filterCount}>{filteredOrders.length} orders</Text>
        </View>

        <FilterGroup
          label="Status"
          options={[
            { label: "All statuses", value: "all" },
            ...orderStatusOptions.map((status) => ({ label: orderStatusLabels[status], value: status })),
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
        />
        <FilterGroup
          label="Payment"
          options={[
            { label: "All payments", value: "all" },
            ...paymentStatusOptions.map((status) => ({ label: paymentStatusLabels[status], value: status })),
          ]}
          value={paymentFilter}
          onChange={setPaymentFilter}
        />
      </View>

      <View style={orderStyles.queueHeader}>
        <View>
          <Text style={orderStyles.queueEyebrow}>Operations</Text>
          <Text style={orderStyles.queueTitle}>Manage order queue</Text>
        </View>
        <View style={orderStyles.queueActions}>
          <Text style={orderStyles.queueRevenue}>{formatCurrency(revenue).replace("GBP ", "£")}</Text>
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
        </View>
      </View>

      {filteredOrders.length === 0 ? (
        <EmptyState title="No orders found" body="No orders match the selected filters." />
      ) : viewMode === "list" ? (
        <View style={orderStyles.listPanel}>
          {filteredOrders.map((order) => (
            <AdminOrderListItem key={order.id} order={order} />
          ))}
        </View>
      ) : (
        filteredOrders.map((order) => (
          <AdminOrderCard key={order.id} order={order} saving={savingOrderId === order.id} saveOrder={saveOrder} />
        ))
      )}
    </ScrollContent>
  );
}

function AdminSummaryCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={orderStyles.metricCard}>
      <View style={orderStyles.metricIcon}>
        <Feather color={colors.primary} name={icon} size={16} />
      </View>
      <Text style={orderStyles.metricLabel}>{label}</Text>
      <Text style={orderStyles.metricValue}>{value}</Text>
    </View>
  );
}

function ViewModeToggle({
  onChange,
  value,
}: {
  onChange: (value: ViewMode) => void;
  value: ViewMode;
}) {
  const options: Array<{ icon: keyof typeof Feather.glyphMap; label: string; value: ViewMode }> = [
    { icon: "layout", label: "Cards", value: "cards" },
    { icon: "list", label: "List", value: "list" },
  ];

  return (
    <View style={orderStyles.viewToggle}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [orderStyles.viewToggleButton, active && orderStyles.viewToggleButtonActive, pressed && styles.pressed]}
          >
            <Feather color={active ? colors.onPrimary : colors.foreground} name={option.icon} size={14} />
            <Text style={[orderStyles.viewToggleText, active && orderStyles.viewToggleTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function FilterGroup<TValue extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: TValue) => void;
  options: Array<{ label: string; value: TValue }>;
  value: TValue;
}) {
  return (
    <View style={orderStyles.filterGroup}>
      <Text style={orderStyles.controlLabel}>{label}</Text>
      <View style={orderStyles.chips}>
        {options.map((option) => {
          const active = value === option.value;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              key={option.value}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [orderStyles.filterChip, active && orderStyles.filterChipActive, pressed && styles.pressed]}
            >
              <Text style={[orderStyles.filterChipText, active && orderStyles.filterChipTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function AdminOrderListItem({ order }: { order: Order }) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const primaryItem = order.items[0]?.productName ?? "Order items";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/order/${order.id}`)}
      style={({ pressed }) => [orderStyles.listItem, pressed && styles.pressed]}
    >
      <View style={orderStyles.listTopRow}>
        <View style={orderStyles.listTitleBlock}>
          <Text style={orderStyles.listOrderNumber}>#{order.orderNumber}</Text>
          <Text numberOfLines={1} style={orderStyles.listCustomer}>{order.customerName || order.customerEmail}</Text>
        </View>
        <Text style={orderStyles.listTotal}>{formatCurrency(order.totalAmount).replace("GBP ", "£")}</Text>
      </View>

      <View style={orderStyles.listMetaRow}>
        <Text numberOfLines={1} style={orderStyles.listMeta}>{primaryItem}{itemCount > 1 ? ` · ${itemCount} units` : ""}</Text>
        <Text style={orderStyles.listDate}>{formatDate(order.createdAt)}</Text>
      </View>

      <View style={orderStyles.listFooter}>
        <View style={orderStyles.listBadges}>
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </View>
        <Feather color={colors.primary} name="chevron-right" size={18} />
      </View>
    </Pressable>
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
  const trackingChanged = trackingNumber.trim() !== (order.trackingNumber ?? "");
  const etaChanged = estimatedDeliveryDate.trim() !== (order.estimatedDeliveryDate ?? "");
  const canSaveTracking = trackingChanged || etaChanged;

  useEffect(() => {
    setTrackingNumber(order.trackingNumber ?? "");
    setEstimatedDeliveryDate(order.estimatedDeliveryDate ?? "");
  }, [order.estimatedDeliveryDate, order.trackingNumber]);

  return (
    <View style={orderStyles.orderCard}>
      <View style={orderStyles.orderCardHeader}>
        <View style={orderStyles.orderTitleBlock}>
          <Text style={orderStyles.orderNumber}>Order #{order.orderNumber}</Text>
          <View style={orderStyles.metaLine}>
            <Feather color={colors.primary} name="calendar" size={13} />
            <Text style={orderStyles.orderDate}>{formatDate(order.createdAt)}</Text>
          </View>
          <View style={orderStyles.metaLine}>
            <Feather color={colors.primary} name="user" size={13} />
            <Text numberOfLines={1} style={orderStyles.customerText}>{order.customerName || order.customerEmail}</Text>
          </View>
        </View>
        <View style={orderStyles.totalBlock}>
          <Text style={orderStyles.totalLabel}>Total</Text>
          <Text style={orderStyles.totalValue}>{formatCurrency(order.totalAmount).replace("GBP ", "£")}</Text>
        </View>
      </View>

      <View style={orderStyles.badges}>
        <OrderStatusBadge status={order.status} />
        <PaymentStatusBadge status={order.paymentStatus} />
      </View>

      <View style={orderStyles.productsPanel}>
        <Text style={orderStyles.panelLabel}>Products</Text>
        {order.items.map((item) => (
          <View key={`${order.id}-${item.productId}`} style={orderStyles.itemRow}>
            <Text numberOfLines={1} style={orderStyles.itemName}>{item.productName}</Text>
            <Text style={orderStyles.itemQuantity}>x{item.quantity}</Text>
            <Text style={orderStyles.itemPrice}>{formatCurrency(item.subtotal).replace("GBP ", "£")}</Text>
          </View>
        ))}
      </View>

      <View style={orderStyles.controlsPanel}>
        <ChoiceGroup<OrderStatus>
          disabled={saving}
          label="Status"
          onChange={(status) => void saveOrder(order.id, { status })}
          options={orderStatusOptions.map((status) => ({ label: orderStatusLabels[status], value: status }))}
          value={order.status}
        />
        <ChoiceGroup<PaymentStatus>
          disabled={saving}
          label="Payment"
          onChange={(paymentStatus) => void saveOrder(order.id, { paymentStatus })}
          options={paymentStatusOptions.map((status) => ({ label: paymentStatusLabels[status], value: status }))}
          value={order.paymentStatus}
        />

        <View style={orderStyles.fieldGrid}>
          <View style={orderStyles.fieldBlock}>
            <Text style={orderStyles.controlLabel}>Tracking</Text>
            <Field
              editable={!saving}
              onChangeText={setTrackingNumber}
              placeholder="Tracking ref"
              value={trackingNumber}
            />
          </View>
          <View style={orderStyles.fieldBlock}>
            <Text style={orderStyles.controlLabel}>ETA</Text>
            <Field
              editable={!saving}
              onChangeText={setEstimatedDeliveryDate}
              placeholder="YYYY-MM-DD"
              value={estimatedDeliveryDate}
            />
          </View>
        </View>
      </View>

      <View style={orderStyles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: saving || !canSaveTracking }}
          disabled={saving || !canSaveTracking}
          onPress={() => void saveOrder(order.id, { trackingNumber: trackingNumber.trim(), estimatedDeliveryDate: estimatedDeliveryDate.trim() })}
          style={({ pressed }) => [
            orderStyles.saveButton,
            pressed && !saving && canSaveTracking && styles.pressed,
            (saving || !canSaveTracking) && styles.disabled,
          ]}
        >
          <Feather color={colors.onPrimary} name="save" size={15} />
          <Text style={orderStyles.saveButtonText}>{saving ? "Saving" : "Save tracking"}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push(`/order/${order.id}`)} style={({ pressed }) => [orderStyles.detailButton, pressed && styles.pressed]}>
          <Text style={orderStyles.detailButtonText}>Details</Text>
          <Feather color={colors.primary} name="arrow-right" size={15} />
        </Pressable>
      </View>
    </View>
  );
}

function ChoiceGroup<TValue extends string>({
  disabled,
  label,
  onChange,
  options,
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: TValue) => void;
  options: Array<{ label: string; value: TValue }>;
  value: TValue;
}) {
  return (
    <View style={orderStyles.choiceGroup}>
      <Text style={orderStyles.controlLabel}>{label}</Text>
      <View style={orderStyles.choiceTrack}>
        {options.map((option) => {
          const active = value === option.value;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled, selected: active }}
              disabled={disabled || active}
              key={option.value}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [orderStyles.choiceButton, active && orderStyles.choiceButtonActive, pressed && !disabled && styles.pressed]}
            >
              <Text numberOfLines={1} style={[orderStyles.choiceText, active && orderStyles.choiceTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const tone = statusTone[status];
  return (
    <View style={[orderStyles.statusBadge, { backgroundColor: tone.background, borderColor: tone.border }]}>
      <Feather color={tone.color} name={statusIcon[status]} size={13} />
      <Text style={[orderStyles.statusText, { color: tone.color }]}>{orderStatusLabels[status]}</Text>
    </View>
  );
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const tone = paymentTone[status];
  return (
    <View style={[orderStyles.statusBadge, { backgroundColor: tone.background, borderColor: tone.border }]}>
      <Feather color={tone.color} name={tone.icon} size={13} />
      <Text style={[orderStyles.statusText, { color: tone.color }]}>{paymentStatusLabels[status]}</Text>
    </View>
  );
}

const orderStyles = StyleSheet.create({
  actions: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 9,
    paddingTop: 12,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  choiceButton: {
    alignItems: "center",
    borderRadius: 11,
    flex: 1,
    justifyContent: "center",
    minHeight: 38,
    minWidth: 76,
    paddingHorizontal: 8,
  },
  choiceButtonActive: {
    backgroundColor: colors.foreground,
  },
  choiceGroup: {
    gap: 7,
  },
  choiceText: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 11,
  },
  choiceTextActive: {
    color: colors.onPrimary,
  },
  choiceTrack: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    padding: 4,
  },
  controlLabel: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  controlsPanel: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 12,
    paddingTop: 12,
  },
  customerText: {
    color: colors.muted,
    flex: 1,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
  },
  detailButton: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 13,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    minHeight: 46,
  },
  detailButtonText: {
    color: colors.primary,
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
  },
  fieldBlock: {
    flex: 1,
    gap: 7,
    minWidth: 138,
  },
  fieldGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filterCard: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 15,
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  filterChip: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: colors.foreground,
    borderColor: colors.foreground,
  },
  filterChipText: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
  },
  filterChipTextActive: {
    color: colors.onPrimary,
  },
  filterCount: {
    color: colors.primary,
    fontFamily: fontFamilies.bold,
    fontSize: 14,
  },
  filterGroup: {
    gap: 7,
  },
  filterHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  filterTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
  },
  filterTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
  },
  itemName: {
    color: colors.foreground,
    flex: 1,
    fontFamily: fontFamilies.medium,
    fontSize: 13,
  },
  itemPrice: {
    color: colors.primary,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
  },
  itemQuantity: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
    minWidth: 28,
    textAlign: "right",
  },
  itemRow: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 9,
    paddingTop: 8,
  },
  listBadges: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  listCustomer: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
  },
  listDate: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 11,
  },
  listFooter: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  listItem: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 9,
    padding: 12,
  },
  listMeta: {
    color: colors.foreground,
    flex: 1,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
  },
  listMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  listOrderNumber: {
    color: colors.foreground,
    fontFamily: fontFamilies.bold,
    fontSize: 15,
  },
  listPanel: {
    gap: 9,
  },
  listTitleBlock: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  listTopRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  listTotal: {
    color: colors.primary,
    fontFamily: fontFamilies.bold,
    fontSize: 15,
  },
  metaLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  metricCard: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexBasis: "48%",
    flexGrow: 1,
    gap: 6,
    minHeight: 112,
    padding: 12,
  },
  metricIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceSoft,
    borderRadius: 12,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  metricLabel: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    textTransform: "uppercase",
  },
  metricValue: {
    color: colors.foreground,
    fontFamily: fontFamilies.bold,
    fontSize: 22,
    lineHeight: 27,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  orderCard: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 15,
    borderWidth: 1,
    gap: 12,
    overflow: "hidden",
    padding: 12,
    shadowColor: colors.foreground,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.035,
    shadowRadius: 16,
  },
  orderCardHeader: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  orderDate: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
  },
  orderNumber: {
    color: colors.foreground,
    fontFamily: fontFamilies.bold,
    fontSize: 17,
    lineHeight: 22,
  },
  orderTitleBlock: {
    flex: 1,
    gap: 5,
    minWidth: 0,
  },
  panelLabel: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  productsPanel: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 13,
    borderWidth: 1,
    gap: 8,
    padding: 10,
  },
  queueEyebrow: {
    color: colors.primary,
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  queueActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    width: "100%",
  },
  queueHeader: {
    alignItems: "flex-start",
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 15,
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  queueRevenue: {
    color: colors.primary,
    fontFamily: fontFamilies.bold,
    fontSize: 18,
  },
  queueTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.bold,
    fontSize: 18,
    marginTop: 2,
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 13,
    flex: 1,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    minHeight: 46,
  },
  saveButtonText: {
    color: colors.onPrimary,
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
  },
  statusBadge: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  statusText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 11,
  },
  totalBlock: {
    alignItems: "flex-end",
    gap: 2,
  },
  totalLabel: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    textTransform: "uppercase",
  },
  totalValue: {
    color: colors.primary,
    fontFamily: fontFamilies.bold,
    fontSize: 18,
  },
  viewToggle: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: "row",
    gap: 3,
    padding: 3,
  },
  viewToggleButton: {
    alignItems: "center",
    borderRadius: 10,
    flexDirection: "row",
    gap: 5,
    minHeight: 32,
    paddingHorizontal: 9,
  },
  viewToggleButtonActive: {
    backgroundColor: colors.foreground,
  },
  viewToggleText: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 11,
  },
  viewToggleTextActive: {
    color: colors.onPrimary,
  },
});
