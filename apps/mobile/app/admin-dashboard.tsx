import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AdminShell } from "../components/admin-shell";
import { AdminMetricCard, AdminPanel, ProgressRow } from "../components/admin-ui";
import { Badge, EmptyState, formatCurrency, ScrollContent, SectionTitle, StatusBanner, styles } from "../components/ui";
import { getCategorySales, getStatusStats, getTopCustomers, getTopProducts } from "../lib/admin-analytics";
import { useMobileState } from "../lib/mobile-state";

export default function AdminDashboardScreen() {
  const { orders, products, users } = useMobileState();
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const paidRevenue = orders.filter((order) => order.paymentStatus === "paid").reduce((sum, order) => sum + order.totalAmount, 0);
  const pendingRevenue = totalRevenue - paidRevenue;
  const lowStockProducts = products.filter((product) => product.stockQuantity <= product.lowStockThreshold && product.stockQuantity > 0);
  const outOfStockProducts = products.filter((product) => product.stockQuantity === 0);
  const topProducts = getTopProducts(orders);
  const topCustomers = getTopCustomers(orders);
  const statusStats = getStatusStats(orders);
  const categorySales = getCategorySales(orders, products);
  const maxProductRevenue = Math.max(...topProducts.map((product) => product.revenue), 1);
  const maxCustomerSpent = Math.max(...topCustomers.map((customer) => customer.totalSpent), 1);

  return (
    <AdminShell title="Dashboard">
      <ScrollContent>
        <SectionTitle eyebrow="Admin" title="Business statistics" />

        {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) ? (
          <Pressable accessibilityRole="button" onPress={() => router.push("/admin-stock")}>
            <StatusBanner
              title="Stock Alerts"
              body={`${lowStockProducts.length} low stock, ${outOfStockProducts.length} out of stock. Tap to manage stock.`}
            />
          </Pressable>
        ) : null}

        <View style={adminStyles.grid}>
          <AdminMetricCard label="Total revenue" value={formatCurrency(totalRevenue)} />
          <AdminMetricCard label="Collected" value={formatCurrency(paidRevenue)} />
          <AdminMetricCard label="Pending" value={formatCurrency(pendingRevenue)} />
          <AdminMetricCard label="Orders" value={String(orders.length)} />
        </View>

        <AdminPanel title="Sales by category">
          {categorySales.length === 0 ? (
            <Text style={styles.description}>No category sales yet.</Text>
          ) : (
            categorySales.slice(0, 6).map((row) => (
              <ProgressRow
                key={row.category}
                label={row.category}
                sublabel={`${row.quantity} units`}
                value={formatCurrency(row.revenue)}
                width={(row.revenue / Math.max(...categorySales.map((item) => item.revenue), 1)) * 100}
              />
            ))
          )}
        </AdminPanel>

        <AdminPanel title="Order status">
          {statusStats.map((row) => (
            <View key={row.status} style={adminStyles.statusRow}>
              <Badge label={row.status.replaceAll("_", " ")} />
              <Text style={styles.description}>{row.count} orders · {formatCurrency(row.revenue)}</Text>
            </View>
          ))}
        </AdminPanel>

        <AdminPanel title="Top products">
          {topProducts.length === 0 ? (
            <EmptyState title="No product sales" body="Orders will populate product rankings." />
          ) : (
            topProducts.slice(0, 6).map((product) => (
              <ProgressRow
                key={product.name}
                label={product.name}
                sublabel={`${product.quantity} units`}
                value={formatCurrency(product.revenue)}
                width={(product.revenue / maxProductRevenue) * 100}
              />
            ))
          )}
        </AdminPanel>

        <AdminPanel title="Best customers">
          {topCustomers.length === 0 ? (
            <Text style={styles.description}>No customers yet.</Text>
          ) : (
            topCustomers.slice(0, 6).map((customer) => (
              <ProgressRow
                key={customer.email}
                label={customer.email.split("@")[0]}
                sublabel={`${customer.orderCount} orders`}
                value={formatCurrency(customer.totalSpent)}
                width={(customer.totalSpent / maxCustomerSpent) * 100}
              />
            ))
          )}
        </AdminPanel>

        <AdminPanel title="Recent activities">
          {orders.slice(0, 8).map((order) => (
            <Pressable key={order.id} style={({ pressed }) => [adminStyles.activity, pressed && styles.pressed]} onPress={() => router.push(`/order/${order.id}`)}>
              <View style={styles.flex}>
                <Text style={styles.name}>Order #{order.orderNumber}</Text>
                <Text style={styles.muted}>{order.customerEmail}</Text>
              </View>
              <Text style={styles.price}>{formatCurrency(order.totalAmount)}</Text>
            </Pressable>
          ))}
        </AdminPanel>

        <Text style={styles.muted}>{users.length} users loaded for admin reporting.</Text>
      </ScrollContent>
    </AdminShell>
  );
}

const adminStyles = StyleSheet.create({
  activity: {
    alignItems: "center",
    borderTopColor: "#eadccb",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingTop: 11,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statusRow: {
    alignItems: "center",
    borderTopColor: "#eadccb",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    paddingTop: 11,
  },
});
