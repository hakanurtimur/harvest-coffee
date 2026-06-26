import { Feather } from "@expo/vector-icons";
import { CustomerSegment, User, customerSegmentLabels } from "@harvest/domain";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, EmptyState, Field, fontFamilies, formatCurrency, ScrollContent, SectionTitle, StatusBanner, styles } from "../components/ui";
import { getOrdersForUser } from "../lib/admin-analytics";
import { useMobileState } from "../lib/mobile-state";

type CustomerRow = User & {
  lastOrderDate?: string;
  orderCount: number;
  totalSpent: number;
};
type SegmentFilter = "all" | CustomerSegment;
type ViewMode = "cards" | "list";

const segmentOptions: CustomerSegment[] = ["new", "regular", "vip", "lapsed", "at_risk"];
const filterOptions: SegmentFilter[] = ["all", ...segmentOptions];

const segmentConfig: Record<CustomerSegment, { icon: keyof typeof Feather.glyphMap; label: string; tone: typeof colors.status.success }> = {
  at_risk: { icon: "alert-triangle", label: customerSegmentLabels.at_risk, tone: colors.status.danger },
  lapsed: { icon: "pause-circle", label: customerSegmentLabels.lapsed, tone: colors.status.neutral },
  new: { icon: "user-plus", label: customerSegmentLabels.new, tone: colors.status.info },
  regular: { icon: "refresh-cw", label: customerSegmentLabels.regular, tone: colors.status.success },
  vip: { icon: "star", label: customerSegmentLabels.vip, tone: colors.status.info },
};

export default function AdminCustomersScreen() {
  const { orders, updateUser, users } = useMobileState();
  const [message, setMessage] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState<SegmentFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const customerStats = useMemo<CustomerRow[]>(() => users
    .filter((user) => user.role !== "admin")
    .map((customer) => {
      const customerOrders = getOrdersForUser(orders, customer);
      const totalSpent = customerOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      const lastOrderDate = customerOrders
        .map((order) => order.createdAt)
        .sort((a, b) => Date.parse(b) - Date.parse(a))[0];

      return {
        ...customer,
        lastOrderDate,
        orderCount: customerOrders.length,
        totalSpent,
      };
    })
    .sort((a, b) => b.totalSpent - a.totalSpent), [orders, users]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customerStats.filter((customer) => {
      const segment = customer.customerSegment || "new";
      const segmentMatches = segmentFilter === "all" || segment === segmentFilter;
      const searchMatches = !query
        || (customer.fullName || "").toLowerCase().includes(query)
        || customer.email.toLowerCase().includes(query)
        || (customer.companyName || "").toLowerCase().includes(query);

      return segmentMatches && searchMatches;
    });
  }, [customerStats, search, segmentFilter]);

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  const vipCount = customerStats.filter((user) => (user.customerSegment || "new") === "vip").length;
  const activeCustomers = customerStats.filter((customer) => customer.orderCount > 0).length;
  const maxSpent = Math.max(...customerStats.map((customer) => customer.totalSpent), 1);

  const changeSegment = async (userId: string, customerSegment: CustomerSegment) => {
    setSavingUserId(userId);
    setMessage(null);
    try {
      await updateUser(userId, { customerSegment });
      setMessage({ text: "Customer segment updated.", tone: "success" });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Customer segment could not be updated.", tone: "error" });
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <ScrollContent>
      <SectionTitle eyebrow="Admin" title="Customer management" />
      {message ? <StatusBanner title={message.text} tone={message.tone} /> : null}

      <View style={customerStyles.metricsGrid}>
        <CustomerMetric icon="users" label="Customers" value={String(customerStats.length)} />
        <CustomerMetric icon="activity" label="Active" value={String(activeCustomers)} />
        <CustomerMetric icon="star" label="VIP" value={String(vipCount)} />
        <CustomerMetric icon="credit-card" label="Avg order" value={formatCurrency(averageOrderValue).replace("GBP ", "£")} />
      </View>

      <View style={customerStyles.controlCard}>
        <View style={customerStyles.controlHeader}>
          <View style={customerStyles.controlTitleBlock}>
            <Text style={customerStyles.controlEyebrow}>Customers</Text>
            <Text style={customerStyles.controlTitle}>Customer list</Text>
            <Text style={customerStyles.controlCount}>{filteredCustomers.length} shown · {orders.length} orders</Text>
          </View>
          <ViewModeToggle onChange={setViewMode} value={viewMode} />
        </View>

        <View style={customerStyles.searchField}>
          <Feather color={colors.muted} name="search" size={16} />
          <Field onChangeText={setSearch} placeholder="Search customer, email, company" value={search} />
        </View>

        <View style={customerStyles.filterRow}>
          {filterOptions.map((segment) => {
            const active = segmentFilter === segment;
            const label = segment === "all" ? "All" : customerSegmentLabels[segment];
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                key={segment}
                onPress={() => setSegmentFilter(segment)}
                style={({ pressed }) => [customerStyles.filterChip, active && customerStyles.filterChipActive, pressed && styles.pressed]}
              >
                <Text style={[customerStyles.filterText, active && customerStyles.filterTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {filteredCustomers.length === 0 ? (
        <EmptyState title="No customers found" body="No customer records match the selected filters." />
      ) : viewMode === "list" ? (
        <View style={customerStyles.customerList}>
          {filteredCustomers.map((customer) => (
            <CustomerListItem
              changeSegment={changeSegment}
              customer={customer}
              key={customer.id}
              maxSpent={maxSpent}
              saving={savingUserId === customer.id}
            />
          ))}
        </View>
      ) : (
        <View style={customerStyles.customerList}>
          {filteredCustomers.map((customer) => (
            <CustomerCard
              changeSegment={changeSegment}
              customer={customer}
              key={customer.id}
              maxSpent={maxSpent}
              saving={savingUserId === customer.id}
            />
          ))}
        </View>
      )}
    </ScrollContent>
  );
}

function CustomerMetric({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={customerStyles.metricCard}>
      <View style={customerStyles.metricIcon}>
        <Feather color={colors.primary} name={icon} size={16} />
      </View>
      <Text style={customerStyles.metricLabel}>{label}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit style={customerStyles.metricValue}>{value}</Text>
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
    { icon: "grid", label: "Cards", value: "cards" },
    { icon: "list", label: "List", value: "list" },
  ];

  return (
    <View style={customerStyles.viewToggle}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [customerStyles.viewToggleButton, active && customerStyles.viewToggleButtonActive, pressed && styles.pressed]}
          >
            <Feather color={active ? colors.onPrimary : colors.muted} name={option.icon} size={14} />
            <Text style={[customerStyles.viewToggleText, active && customerStyles.viewToggleTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function CustomerListItem({
  changeSegment,
  customer,
  maxSpent,
  saving,
}: CustomerItemProps) {
  const segment = customer.customerSegment || "new";
  const initials = getInitials(customer);

  return (
    <View style={customerStyles.listItem}>
      <View style={customerStyles.customerTopRow}>
        <View style={customerStyles.avatar}>
          <Text style={customerStyles.avatarText}>{initials}</Text>
        </View>
        <View style={customerStyles.customerTitleBlock}>
          <Text numberOfLines={1} style={customerStyles.customerName}>{customer.fullName || customer.email}</Text>
          <Text numberOfLines={1} style={customerStyles.customerEmail}>{customer.email}</Text>
          {customer.companyName ? <Text numberOfLines={1} style={customerStyles.companyName}>{customer.companyName}</Text> : null}
        </View>
        <View style={customerStyles.customerValueBlock}>
          <Text style={customerStyles.customerValue}>{formatCurrency(customer.totalSpent).replace("GBP ", "£")}</Text>
          <Text style={customerStyles.orderCount}>{customer.orderCount} orders</Text>
        </View>
      </View>

      <SpendProgress customer={customer} maxSpent={maxSpent} />

      <View style={customerStyles.customerFooter}>
        <SegmentPill segment={segment} />
        {customer.lastOrderDate ? <Text style={customerStyles.lastOrder}>Last {formatShortDate(customer.lastOrderDate)}</Text> : <Text style={customerStyles.lastOrder}>No orders yet</Text>}
      </View>

      <SegmentSelector activeSegment={segment} changeSegment={changeSegment} customerId={customer.id} saving={saving} />
    </View>
  );
}

function CustomerCard({
  changeSegment,
  customer,
  maxSpent,
  saving,
}: CustomerItemProps) {
  const segment = customer.customerSegment || "new";
  const initials = getInitials(customer);

  return (
    <View style={customerStyles.customerCard}>
      <View style={customerStyles.cardHeader}>
        <View style={customerStyles.avatarLarge}>
          <Text style={customerStyles.avatarLargeText}>{initials}</Text>
        </View>
        <View style={customerStyles.customerTitleBlock}>
          <Text numberOfLines={2} style={customerStyles.cardName}>{customer.fullName || customer.email}</Text>
          <Text numberOfLines={1} style={customerStyles.customerEmail}>{customer.email}</Text>
          {customer.companyName ? <Text numberOfLines={1} style={customerStyles.companyName}>{customer.companyName}</Text> : null}
        </View>
      </View>

      <View style={customerStyles.cardStatsRow}>
        <View style={customerStyles.cardStat}>
          <Text style={customerStyles.cardStatLabel}>Orders</Text>
          <Text style={customerStyles.cardStatValue}>{customer.orderCount}</Text>
        </View>
        <View style={customerStyles.cardStat}>
          <Text style={customerStyles.cardStatLabel}>Spent</Text>
          <Text style={customerStyles.cardStatValue}>{formatCurrency(customer.totalSpent).replace("GBP ", "£")}</Text>
        </View>
        <View style={customerStyles.cardStat}>
          <Text style={customerStyles.cardStatLabel}>Segment</Text>
          <Text style={customerStyles.cardStatValue}>{customerSegmentLabels[segment]}</Text>
        </View>
      </View>

      <SpendProgress customer={customer} maxSpent={maxSpent} />

      <View style={customerStyles.customerFooter}>
        <SegmentPill segment={segment} />
        {customer.lastOrderDate ? <Text style={customerStyles.lastOrder}>Last {formatShortDate(customer.lastOrderDate)}</Text> : <Text style={customerStyles.lastOrder}>No orders yet</Text>}
      </View>

      <SegmentSelector activeSegment={segment} changeSegment={changeSegment} customerId={customer.id} saving={saving} />
    </View>
  );
}

type CustomerItemProps = {
  changeSegment: (userId: string, segment: CustomerSegment) => Promise<void>;
  customer: CustomerRow;
  maxSpent: number;
  saving: boolean;
};

function SpendProgress({ customer, maxSpent }: { customer: CustomerRow; maxSpent: number }) {
  const progress = Math.max(0.08, Math.min(customer.totalSpent / maxSpent, 1));

  return (
    <View style={customerStyles.progressBlock}>
      <View style={customerStyles.progressHeader}>
        <Text style={customerStyles.progressLabel}>Revenue contribution</Text>
        <Text style={customerStyles.progressValue}>{formatCurrency(customer.totalSpent).replace("GBP ", "£")}</Text>
      </View>
      <View style={customerStyles.progressTrack}>
        <View style={[customerStyles.progressFill, { flex: progress }]} />
        <View style={{ flex: 1 - progress }} />
      </View>
    </View>
  );
}

function SegmentPill({ segment }: { segment: CustomerSegment }) {
  const config = segmentConfig[segment] || segmentConfig.new;

  return (
    <View style={[customerStyles.segmentPill, { backgroundColor: config.tone.background, borderColor: config.tone.border }]}>
      <Feather color={config.tone.color} name={config.icon} size={13} />
      <Text style={[customerStyles.segmentText, { color: config.tone.color }]}>{config.label}</Text>
    </View>
  );
}

function SegmentSelector({
  activeSegment,
  changeSegment,
  customerId,
  saving,
}: {
  activeSegment: CustomerSegment;
  changeSegment: (userId: string, segment: CustomerSegment) => Promise<void>;
  customerId: string;
  saving: boolean;
}) {
  return (
    <View style={customerStyles.segmentSelector}>
      <Text style={customerStyles.controlLabel}>Segment</Text>
      <View style={customerStyles.segmentChips}>
        {segmentOptions.map((segment) => {
          const active = activeSegment === segment;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: saving, selected: active }}
              disabled={saving}
              key={segment}
              onPress={() => {
                if (!active) void changeSegment(customerId, segment);
              }}
              style={({ pressed }) => [customerStyles.segmentChip, active && customerStyles.segmentChipActive, pressed && !saving && styles.pressed, saving && styles.disabled]}
            >
              <Text style={[customerStyles.segmentChipText, active && customerStyles.segmentChipTextActive]}>{customerSegmentLabels[segment]}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function getInitials(customer: CustomerRow) {
  const source = customer.fullName || customer.companyName || customer.email;
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "HC";
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

const customerStyles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  avatarLarge: {
    alignItems: "center",
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: 17,
    borderWidth: 1,
    height: 54,
    justifyContent: "center",
    width: 54,
  },
  avatarLargeText: {
    color: colors.primary,
    fontFamily: fontFamilies.bold,
    fontSize: 15,
  },
  avatarText: {
    color: colors.primary,
    fontFamily: fontFamilies.bold,
    fontSize: 13,
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  cardName: {
    color: colors.foreground,
    fontFamily: fontFamilies.bold,
    fontSize: 17,
    lineHeight: 22,
  },
  cardStat: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: 13,
    borderWidth: 1,
    flex: 1,
    gap: 3,
    padding: 10,
  },
  cardStatLabel: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 11,
  },
  cardStatsRow: {
    flexDirection: "row",
    gap: 8,
  },
  cardStatValue: {
    color: colors.foreground,
    fontFamily: fontFamilies.bold,
    fontSize: 14,
    lineHeight: 19,
  },
  companyName: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 17,
  },
  controlCard: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 15,
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  controlCount: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 17,
  },
  controlEyebrow: {
    color: colors.primary,
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  controlHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  controlLabel: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  controlTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.bold,
    fontSize: 20,
    lineHeight: 25,
  },
  controlTitleBlock: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  customerCard: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 15,
    borderWidth: 1,
    gap: 13,
    padding: 12,
  },
  customerEmail: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 17,
  },
  customerFooter: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
  },
  customerList: {
    gap: 12,
  },
  customerName: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 15,
    lineHeight: 20,
  },
  customerTitleBlock: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  customerTopRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  customerValue: {
    color: colors.primary,
    fontFamily: fontFamilies.bold,
    fontSize: 16,
    lineHeight: 21,
    textAlign: "right",
  },
  customerValueBlock: {
    alignItems: "flex-end",
    gap: 2,
  },
  filterChip: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: colors.foreground,
    borderColor: colors.foreground,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  filterText: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
  },
  filterTextActive: {
    color: colors.onPrimary,
  },
  listItem: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 15,
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  lastOrder: {
    color: colors.muted,
    flex: 1,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "right",
  },
  metricCard: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexBasis: "48%",
    flexGrow: 1,
    gap: 6,
    minHeight: 106,
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
    fontSize: 20,
    lineHeight: 25,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  orderCount: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "right",
  },
  progressBlock: {
    gap: 8,
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
  progressHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 11,
    textTransform: "uppercase",
  },
  progressTrack: {
    backgroundColor: colors.progressTrack,
    borderRadius: 999,
    flexDirection: "row",
    height: 9,
    overflow: "hidden",
  },
  progressValue: {
    color: colors.primary,
    fontFamily: fontFamilies.bold,
    fontSize: 12,
  },
  searchField: {
    gap: 8,
  },
  segmentChip: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  segmentChipActive: {
    backgroundColor: colors.foreground,
    borderColor: colors.foreground,
  },
  segmentChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  segmentChipText: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
  },
  segmentChipTextActive: {
    color: colors.onPrimary,
  },
  segmentPill: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  segmentSelector: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 8,
    paddingTop: 12,
  },
  segmentText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 11,
  },
  viewToggle: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    padding: 4,
  },
  viewToggleButton: {
    alignItems: "center",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    minHeight: 34,
    paddingHorizontal: 10,
  },
  viewToggleButtonActive: {
    backgroundColor: colors.foreground,
  },
  viewToggleText: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
  },
  viewToggleTextActive: {
    color: colors.onPrimary,
  },
});
