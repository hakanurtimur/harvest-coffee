import { Feather } from "@expo/vector-icons";
import { Rental } from "@harvest/domain";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, EmptyState, fontFamilies, formatCurrency, formatDate, ScrollContent, SectionTitle, styles } from "../components/ui";
import { getExpiringRentals, getMonthlyOrderData, getTopCustomers } from "../lib/admin-analytics";
import { useMobileState } from "../lib/mobile-state";

type ReportTab = "rentals" | "sales" | "customers";

const reportTabs: Array<{ icon: keyof typeof Feather.glyphMap; label: string; value: ReportTab }> = [
  { icon: "calendar", label: "Rentals", value: "rentals" },
  { icon: "bar-chart-2", label: "Sales", value: "sales" },
  { icon: "users", label: "Customers", value: "customers" },
];

const rentalStatusConfig = {
  active: { icon: "check-circle", label: "Active", tone: colors.status.success },
  expired: { icon: "archive", label: "Expired", tone: colors.status.neutral },
  expiring: { icon: "alert-triangle", label: "Expiring", tone: colors.status.warning },
  upcoming: { icon: "clock", label: "Upcoming", tone: colors.status.info },
} as const;

export default function AdminReportsScreen() {
  const { orders, rentals, users } = useMobileState();
  const [activeTab, setActiveTab] = useState<ReportTab>("rentals");

  const rentalStats = useMemo(() => {
    const activeRentals = rentals.filter((rental) => rental.status === "active");
    const upcomingRentals = rentals.filter((rental) => rental.status === "upcoming");
    const expiredRentals = rentals.filter((rental) => rental.status === "expired");
    const expiringRentals = getExpiringRentals(rentals);

    return { activeRentals, expiredRentals, expiringRentals, upcomingRentals };
  }, [rentals]);

  const monthlyData = useMemo(() => getMonthlyOrderData(orders), [orders]);
  const topCustomers = useMemo(() => getTopCustomers(orders), [orders]);
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  const nonAdminUsers = users.filter((user) => user.role !== "admin");
  const maxMonthlyRevenue = Math.max(...monthlyData.map((row) => row.revenue), 1);
  const maxCustomerSpent = Math.max(...topCustomers.map((customer) => customer.totalSpent), 1);

  return (
    <ScrollContent>
      <SectionTitle eyebrow="Admin" title="Reports" />

      <View style={reportStyles.tabCard}>
        {reportTabs.map((tab) => {
          const active = activeTab === tab.value;
          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              key={tab.value}
              onPress={() => setActiveTab(tab.value)}
              style={({ pressed }) => [reportStyles.tabButton, active && reportStyles.tabButtonActive, pressed && styles.pressed]}
            >
              <Feather color={active ? colors.onPrimary : colors.muted} name={tab.icon} size={15} />
              <Text style={[reportStyles.tabText, active && reportStyles.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {activeTab === "rentals" ? (
        <RentalReports
          activeRentals={rentalStats.activeRentals}
          expiredRentals={rentalStats.expiredRentals}
          expiringRentals={rentalStats.expiringRentals}
          upcomingRentals={rentalStats.upcomingRentals}
        />
      ) : null}

      {activeTab === "sales" ? (
        <SalesReports
          averageOrderValue={averageOrderValue}
          maxMonthlyRevenue={maxMonthlyRevenue}
          monthlyData={monthlyData}
          orderCount={orders.length}
          totalRevenue={totalRevenue}
        />
      ) : null}

      {activeTab === "customers" ? (
        <CustomerReports
          customerCount={nonAdminUsers.length}
          maxCustomerSpent={maxCustomerSpent}
          orderCount={orders.length}
          topCustomers={topCustomers}
          totalRevenue={totalRevenue}
        />
      ) : null}
    </ScrollContent>
  );
}

function RentalReports({
  activeRentals,
  expiredRentals,
  expiringRentals,
  upcomingRentals,
}: {
  activeRentals: Rental[];
  expiredRentals: Rental[];
  expiringRentals: Rental[];
  upcomingRentals: Rental[];
}) {
  const totalRentals = activeRentals.length + upcomingRentals.length + expiredRentals.length;
  const rentalRows = [
    { config: rentalStatusConfig.active, count: activeRentals.length, value: "active" },
    { config: rentalStatusConfig.upcoming, count: upcomingRentals.length, value: "upcoming" },
    { config: rentalStatusConfig.expiring, count: expiringRentals.length, value: "next 3 days" },
    { config: rentalStatusConfig.expired, count: expiredRentals.length, value: "expired" },
  ];
  const maxCount = Math.max(...rentalRows.map((row) => row.count), 1);

  return (
    <>
      <View style={reportStyles.metricsGrid}>
        <ReportMetric icon="check-circle" label="Active" value={String(activeRentals.length)} />
        <ReportMetric icon="clock" label="Upcoming" value={String(upcomingRentals.length)} />
        <ReportMetric icon="alert-triangle" label="Expiring" value={String(expiringRentals.length)} />
        <ReportMetric icon="archive" label="Expired" value={String(expiredRentals.length)} />
      </View>

      <ReportPanel eyebrow="Rentals" title="Rental status distribution">
        {totalRentals === 0 ? (
          <EmptyState body="No rental data yet." title="No rentals" />
        ) : (
          <View style={reportStyles.rowStack}>
            {rentalRows.map((row) => (
              <ReportProgressRow
                color={row.config.tone.color}
                icon={row.config.icon}
                key={row.config.label}
                label={row.config.label}
                sublabel={row.value}
                value={String(row.count)}
                width={(row.count / maxCount) * 100}
              />
            ))}
          </View>
        )}
      </ReportPanel>

      <ReportPanel eyebrow="Attention" title="Expiring rentals">
        {expiringRentals.length === 0 ? (
          <Text style={reportStyles.emptyText}>No rentals expiring soon.</Text>
        ) : (
          <View style={reportStyles.rowStack}>
            {expiringRentals.map((rental) => (
              <RentalAlert key={rental.id} rental={rental} />
            ))}
          </View>
        )}
      </ReportPanel>
    </>
  );
}

function SalesReports({
  averageOrderValue,
  maxMonthlyRevenue,
  monthlyData,
  orderCount,
  totalRevenue,
}: {
  averageOrderValue: number;
  maxMonthlyRevenue: number;
  monthlyData: Array<{ count: number; month: string; revenue: number }>;
  orderCount: number;
  totalRevenue: number;
}) {
  return (
    <>
      <View style={reportStyles.metricsGrid}>
        <ReportMetric icon="shopping-bag" label="Orders" value={String(orderCount)} />
        <ReportMetric icon="credit-card" label="Revenue" value={formatCurrency(totalRevenue).replace("GBP ", "£")} />
        <ReportMetric icon="activity" label="Avg order" value={formatCurrency(averageOrderValue).replace("GBP ", "£")} />
        <ReportMetric icon="calendar" label="Periods" value={String(monthlyData.length)} />
      </View>

      <ReportPanel eyebrow="Sales" title="Monthly orders & revenue">
        {monthlyData.length === 0 ? (
          <EmptyState body="No sales data yet." title="No sales" />
        ) : (
          <View style={reportStyles.rowStack}>
            {monthlyData.map((row) => (
              <ReportProgressRow
                color={colors.primary}
                icon="bar-chart-2"
                key={row.month}
                label={row.month}
                sublabel={`${row.count} orders`}
                value={formatCurrency(row.revenue).replace("GBP ", "£")}
                width={(row.revenue / maxMonthlyRevenue) * 100}
              />
            ))}
          </View>
        )}
      </ReportPanel>
    </>
  );
}

function CustomerReports({
  customerCount,
  maxCustomerSpent,
  orderCount,
  topCustomers,
  totalRevenue,
}: {
  customerCount: number;
  maxCustomerSpent: number;
  orderCount: number;
  topCustomers: Array<{ email: string; orderCount: number; pendingPayment: number; totalSpent: number }>;
  totalRevenue: number;
}) {
  return (
    <>
      <View style={reportStyles.metricsGrid}>
        <ReportMetric icon="users" label="Customers" value={String(customerCount)} />
        <ReportMetric icon="shopping-bag" label="Orders" value={String(orderCount)} />
        <ReportMetric icon="credit-card" label="Revenue" value={formatCurrency(totalRevenue).replace("GBP ", "£")} />
        <ReportMetric icon="alert-circle" label="Pending" value={formatCurrency(topCustomers.reduce((sum, customer) => sum + customer.pendingPayment, 0)).replace("GBP ", "£")} />
      </View>

      <ReportPanel eyebrow="Customers" title="Top customers by revenue">
        {topCustomers.length === 0 ? (
          <EmptyState body="No customers yet." title="No customers" />
        ) : (
          <View style={reportStyles.rowStack}>
            {topCustomers.map((customer, index) => (
              <CustomerReportRow
                customer={customer}
                index={index}
                key={customer.email}
                maxCustomerSpent={maxCustomerSpent}
              />
            ))}
          </View>
        )}
      </ReportPanel>
    </>
  );
}

function ReportMetric({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={reportStyles.metricCard}>
      <View style={reportStyles.metricIcon}>
        <Feather color={colors.primary} name={icon} size={16} />
      </View>
      <Text style={reportStyles.metricLabel}>{label}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit style={reportStyles.metricValue}>{value}</Text>
    </View>
  );
}

function ReportPanel({
  children,
  eyebrow,
  title,
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <View style={reportStyles.panel}>
      <View style={reportStyles.panelHeader}>
        <Text style={reportStyles.panelEyebrow}>{eyebrow}</Text>
        <Text style={reportStyles.panelTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function ReportProgressRow({
  color,
  icon,
  label,
  sublabel,
  value,
  width,
}: {
  color: string;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  sublabel: string;
  value: string;
  width: number;
}) {
  const progress = Math.max(0.08, Math.min(width / 100, 1));

  return (
    <View style={reportStyles.progressRow}>
      <View style={reportStyles.progressTop}>
        <View style={reportStyles.progressTitleBlock}>
          <View style={reportStyles.progressIcon}>
            <Feather color={color} name={icon} size={14} />
          </View>
          <View style={reportStyles.progressCopy}>
            <Text numberOfLines={1} style={reportStyles.progressLabel}>{label}</Text>
            <Text numberOfLines={1} style={reportStyles.progressSublabel}>{sublabel}</Text>
          </View>
        </View>
        <Text style={reportStyles.progressValue}>{value}</Text>
      </View>
      <View style={reportStyles.progressTrack}>
        <View style={[reportStyles.progressFill, { backgroundColor: color, flex: progress }]} />
        <View style={{ flex: 1 - progress }} />
      </View>
    </View>
  );
}

function RentalAlert({ rental }: { rental: Rental }) {
  return (
    <View style={reportStyles.alertRow}>
      <View style={reportStyles.alertIcon}>
        <Feather color={colors.status.warning.color} name="alert-triangle" size={15} />
      </View>
      <View style={reportStyles.alertCopy}>
        <Text numberOfLines={1} style={reportStyles.alertTitle}>{rental.productName}</Text>
        <Text numberOfLines={1} style={reportStyles.alertMeta}>{rental.customerName || rental.customerEmail}</Text>
      </View>
      <Text style={reportStyles.alertDate}>{formatDate(rental.endDate)}</Text>
    </View>
  );
}

function CustomerReportRow({
  customer,
  index,
  maxCustomerSpent,
}: {
  customer: { email: string; orderCount: number; pendingPayment: number; totalSpent: number };
  index: number;
  maxCustomerSpent: number;
}) {
  return (
    <View style={reportStyles.customerRow}>
      <View style={reportStyles.rankPill}>
        <Text style={reportStyles.rankText}>{index + 1}</Text>
      </View>
      <View style={reportStyles.customerCopy}>
        <View style={reportStyles.customerHeader}>
          <Text numberOfLines={1} style={reportStyles.customerEmail}>{customer.email}</Text>
          <Text style={reportStyles.customerRevenue}>{formatCurrency(customer.totalSpent).replace("GBP ", "£")}</Text>
        </View>
        <Text style={reportStyles.customerMeta}>{customer.orderCount} orders · {formatCurrency(customer.pendingPayment).replace("GBP ", "£")} pending</Text>
        <View style={reportStyles.progressTrack}>
          <View style={[reportStyles.progressFill, { backgroundColor: colors.primary, flex: Math.max(0.08, Math.min(customer.totalSpent / maxCustomerSpent, 1)) }]} />
          <View style={{ flex: 1 - Math.max(0.08, Math.min(customer.totalSpent / maxCustomerSpent, 1)) }} />
        </View>
      </View>
    </View>
  );
}

const reportStyles = StyleSheet.create({
  alertCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  alertDate: {
    color: colors.status.warning.color,
    fontFamily: fontFamilies.bold,
    fontSize: 12,
    textAlign: "right",
  },
  alertIcon: {
    alignItems: "center",
    backgroundColor: colors.status.warning.background,
    borderColor: colors.status.warning.border,
    borderRadius: 13,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  alertMeta: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 17,
  },
  alertRow: {
    alignItems: "center",
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.status.warning.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 11,
  },
  alertTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  customerCopy: {
    flex: 1,
    gap: 7,
    minWidth: 0,
  },
  customerEmail: {
    color: colors.foreground,
    flex: 1,
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  customerHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  customerMeta: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 17,
  },
  customerRevenue: {
    color: colors.primary,
    fontFamily: fontFamilies.bold,
    fontSize: 13,
  },
  customerRow: {
    alignItems: "flex-start",
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 11,
  },
  emptyText: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
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
  panel: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 15,
    borderWidth: 1,
    gap: 13,
    padding: 12,
  },
  panelEyebrow: {
    color: colors.primary,
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  panelHeader: {
    gap: 2,
  },
  panelTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.bold,
    fontSize: 19,
    lineHeight: 24,
  },
  progressCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  progressFill: {
    borderRadius: 999,
  },
  progressIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  progressLabel: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  progressRow: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 11,
  },
  progressSublabel: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 17,
  },
  progressTitleBlock: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 10,
    minWidth: 0,
  },
  progressTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
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
    fontSize: 13,
    textAlign: "right",
  },
  rankPill: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  rankText: {
    color: colors.primary,
    fontFamily: fontFamilies.bold,
    fontSize: 12,
  },
  rowStack: {
    gap: 10,
  },
  tabButton: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 10,
  },
  tabButtonActive: {
    backgroundColor: colors.foreground,
  },
  tabCard: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    padding: 4,
  },
  tabText: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
  },
  tabTextActive: {
    color: colors.onPrimary,
  },
});
