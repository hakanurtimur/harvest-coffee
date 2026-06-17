import { CustomerSegment, customerSegmentLabels } from "@harvest/domain";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { AdminShell } from "../components/admin-shell";
import { AdminMetricCard, OptionChip, ProgressRow } from "../components/admin-ui";
import { Card, formatCurrency, ScrollContent, SectionTitle, StatusBanner, styles } from "../components/ui";
import { useMobileState } from "../lib/mobile-state";

const segmentOptions: CustomerSegment[] = ["new", "regular", "vip", "lapsed", "at_risk"];

export default function AdminCustomersScreen() {
  const { orders, updateUser, users } = useMobileState();
  const [message, setMessage] = useState("");
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  const customerStats = users
    .filter((user) => user.role !== "admin")
    .map((customer) => {
      const customerOrders = orders.filter((order) => order.customerEmail === customer.email);
      const totalSpent = customerOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      return { ...customer, orderCount: customerOrders.length, totalSpent };
    })
    .sort((a, b) => b.totalSpent - a.totalSpent);
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  const vipCount = users.filter((user) => user.customerSegment === "vip").length;
  const maxSpent = Math.max(...customerStats.map((customer) => customer.totalSpent), 1);

  const changeSegment = async (userId: string, customerSegment: CustomerSegment) => {
    setSavingUserId(userId);
    setMessage("");
    try {
      await updateUser(userId, { customerSegment });
      setMessage("Customer segment updated.");
    } catch (error) {
      Alert.alert("Segment update failed", error instanceof Error ? error.message : "Customer segment could not be updated.");
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <AdminShell title="Customers">
      <ScrollContent>
        <SectionTitle eyebrow="Admin" title="Customer management" />
        {message ? <StatusBanner tone="success" title={message} /> : null}
        <View style={customerStyles.grid}>
          <AdminMetricCard label="Customers" value={String(customerStats.length)} />
          <AdminMetricCard label="VIP customers" value={String(vipCount)} />
          <AdminMetricCard label="Avg order" value={formatCurrency(averageOrderValue)} />
          <AdminMetricCard label="Orders" value={String(orders.length)} />
        </View>

        {customerStats.map((customer) => (
          <Card key={customer.id}>
            <View style={styles.rowBetween}>
              <View style={styles.flex}>
                <Text style={styles.cardTitle}>{customer.fullName || customer.email}</Text>
                <Text style={styles.muted}>{customer.email}</Text>
                {customer.companyName ? <Text style={styles.muted}>{customer.companyName}</Text> : null}
              </View>
              <Text style={styles.total}>{formatCurrency(customer.totalSpent)}</Text>
            </View>
            <ProgressRow
              label={`${customer.orderCount} orders`}
              sublabel={`Current segment: ${customerSegmentLabels[customer.customerSegment || "new"]}`}
              value={formatCurrency(customer.totalSpent)}
              width={(customer.totalSpent / maxSpent) * 100}
            />
            <Text style={styles.muted}>Segment</Text>
            <View style={customerStyles.chips}>
              {segmentOptions.map((segment) => (
                <OptionChip
                  key={segment}
                  active={(customer.customerSegment || "new") === segment}
                  label={customerSegmentLabels[segment]}
                  onPress={() => {
                    if (savingUserId !== customer.id) void changeSegment(customer.id, segment);
                  }}
                />
              ))}
            </View>
          </Card>
        ))}
      </ScrollContent>
    </AdminShell>
  );
}

const customerStyles = StyleSheet.create({
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  grid: {
    gap: 10,
  },
});
