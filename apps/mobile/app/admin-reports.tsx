import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AdminShell } from "../components/admin-shell";
import { AdminMetricCard, AdminPanel, OptionChip, ProgressRow } from "../components/admin-ui";
import { formatCurrency, ScrollContent, SectionTitle, styles } from "../components/ui";
import { getExpiringRentals, getMonthlyOrderData, getTopCustomers } from "../lib/admin-analytics";
import { useMobileState } from "../lib/mobile-state";

type ReportTab = "rentals" | "sales" | "customers";

export default function AdminReportsScreen() {
  const { orders, rentals, users } = useMobileState();
  const [activeTab, setActiveTab] = useState<ReportTab>("rentals");
  const activeRentals = rentals.filter((rental) => rental.status === "active");
  const upcomingRentals = rentals.filter((rental) => rental.status === "upcoming");
  const expiredRentals = rentals.filter((rental) => rental.status === "expired");
  const expiringRentals = getExpiringRentals(rentals);
  const monthlyData = getMonthlyOrderData(orders);
  const topCustomers = getTopCustomers(orders);
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const maxMonthlyRevenue = Math.max(...monthlyData.map((row) => row.revenue), 1);
  const maxCustomerSpent = Math.max(...topCustomers.map((customer) => customer.totalSpent), 1);
  const nonAdminUsers = users.filter((user) => user.role !== "admin");

  return (
    <AdminShell title="Reports">
      <ScrollContent>
        <SectionTitle eyebrow="Admin" title="Reports" />
        <View style={reportStyles.chips}>
          <OptionChip active={activeTab === "rentals"} label="Rental Reports" onPress={() => setActiveTab("rentals")} />
          <OptionChip active={activeTab === "sales"} label="Sales Reports" onPress={() => setActiveTab("sales")} />
          <OptionChip active={activeTab === "customers"} label="Customer Analysis" onPress={() => setActiveTab("customers")} />
        </View>

        {activeTab === "rentals" ? (
          <>
            <View style={reportStyles.grid}>
              <AdminMetricCard label="Active rentals" value={String(activeRentals.length)} />
              <AdminMetricCard label="Upcoming" value={String(upcomingRentals.length)} />
              <AdminMetricCard label="Expiring soon" value={String(expiringRentals.length)} />
              <AdminMetricCard label="Expired" value={String(expiredRentals.length)} />
            </View>
            <AdminPanel title="Expiring Rentals (Next 3 Days)">
              {expiringRentals.length === 0 ? (
                <Text style={styles.description}>No rentals expiring soon.</Text>
              ) : (
                expiringRentals.map((rental) => (
                  <ProgressRow
                    key={rental.id}
                    label={rental.productName}
                    sublabel={rental.customerName || rental.customerEmail}
                    value={rental.endDate}
                    width={100}
                  />
                ))
              )}
            </AdminPanel>
          </>
        ) : null}

        {activeTab === "sales" ? (
          <AdminPanel title="Monthly Orders & Revenue">
            {monthlyData.length === 0 ? (
              <Text style={styles.description}>No sales data yet.</Text>
            ) : (
              monthlyData.map((row) => (
                <ProgressRow
                  key={row.month}
                  label={row.month}
                  sublabel={`${row.count} orders`}
                  value={formatCurrency(row.revenue)}
                  width={(row.revenue / maxMonthlyRevenue) * 100}
                />
              ))
            )}
          </AdminPanel>
        ) : null}

        {activeTab === "customers" ? (
          <>
            <View style={reportStyles.grid}>
              <AdminMetricCard label="Customers" value={String(nonAdminUsers.length)} />
              <AdminMetricCard label="Orders" value={String(orders.length)} />
              <AdminMetricCard label="Revenue" value={formatCurrency(totalRevenue)} />
            </View>
            <AdminPanel title="Top Customers by Revenue">
              {topCustomers.length === 0 ? (
                <Text style={styles.description}>No customers yet.</Text>
              ) : (
                topCustomers.map((customer) => (
                  <ProgressRow
                    key={customer.email}
                    label={customer.email}
                    sublabel={`${customer.orderCount} orders`}
                    value={formatCurrency(customer.totalSpent)}
                    width={(customer.totalSpent / maxCustomerSpent) * 100}
                  />
                ))
              )}
            </AdminPanel>
          </>
        ) : null}
      </ScrollContent>
    </AdminShell>
  );
}

const reportStyles = StyleSheet.create({
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  grid: {
    gap: 10,
  },
});
