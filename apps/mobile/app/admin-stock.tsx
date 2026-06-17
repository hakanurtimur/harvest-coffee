import { Product } from "@harvest/domain";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { AdminShell } from "../components/admin-shell";
import { AdminMetricCard } from "../components/admin-ui";
import { Badge, Card, Field, formatCurrency, ScrollContent, SectionTitle, StatusBanner, styles } from "../components/ui";
import { getStockStatus } from "../lib/admin-analytics";
import { useMobileState } from "../lib/mobile-state";

export default function AdminStockScreen() {
  const { products, updateProduct } = useMobileState();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [stockQuantity, setStockQuantity] = useState("0");
  const [lowStockThreshold, setLowStockThreshold] = useState("10");

  const lowStockProducts = products.filter((product) => product.stockQuantity <= product.lowStockThreshold && product.stockQuantity > 0);
  const outOfStockProducts = products.filter((product) => product.stockQuantity === 0);
  const totalStockValue = products.reduce((sum, product) => sum + product.stockQuantity * product.price, 0);

  const edit = (product: Product) => {
    setEditingId(product.id);
    setStockQuantity(String(product.stockQuantity || 0));
    setLowStockThreshold(String(product.lowStockThreshold || 10));
    setMessage("");
  };

  const cancel = () => {
    setEditingId(null);
    setStockQuantity("0");
    setLowStockThreshold("10");
  };

  const save = async (product: Product) => {
    const nextQuantity = Number.parseInt(stockQuantity, 10) || 0;
    const nextThreshold = Number.parseInt(lowStockThreshold, 10) || 0;
    setSavingId(product.id);
    setMessage("");
    try {
      const updated = await updateProduct(product.id, {
        lowStockThreshold: nextThreshold,
        stockQuantity: nextQuantity,
        stockStatus: getStockStatus(nextQuantity, nextThreshold),
      });
      cancel();
      if (updated.stockQuantity <= updated.lowStockThreshold && updated.stockQuantity > 0) {
        setMessage("Low stock email notification is mocked for now; Base44 SendEmail will be wired later.");
      } else {
        setMessage("Stock updated.");
      }
    } catch (error) {
      Alert.alert("Stock update failed", error instanceof Error ? error.message : "Stock could not be updated.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AdminShell title="Stock">
      <ScrollContent>
        <SectionTitle eyebrow="Inventory" title="Stock management" />
        {message ? <StatusBanner title={message} /> : null}
        <View style={stockStyles.grid}>
          <AdminMetricCard label="Total products" value={String(products.length)} />
          <AdminMetricCard label="Low stock" value={String(lowStockProducts.length)} />
          <AdminMetricCard label="Out of stock" value={String(outOfStockProducts.length)} />
          <AdminMetricCard label="Stock value" value={formatCurrency(totalStockValue)} />
        </View>

        {lowStockProducts.length > 0 ? (
          <Card>
            <Text style={styles.cardTitle}>Low Stock Alerts</Text>
            {lowStockProducts.map((product) => (
              <View key={product.id} style={stockStyles.alertRow}>
                <View style={styles.flex}>
                  <Text style={styles.name}>{product.name}</Text>
                  <Text style={styles.muted}>Current {product.stockQuantity} · Threshold {product.lowStockThreshold}</Text>
                </View>
                <Badge label="!" />
              </View>
            ))}
          </Card>
        ) : null}

        {products.map((product) => {
          const editing = editingId === product.id;
          return (
            <Card key={product.id}>
              <View style={styles.rowBetween}>
                <View style={styles.flex}>
                  <Text style={styles.cardTitle}>{product.name}</Text>
                  <Text style={styles.muted}>{product.category} · {product.weight}</Text>
                </View>
                <Text style={styles.price}>{formatCurrency(product.stockQuantity * product.price)}</Text>
              </View>
              <View style={styles.badgeRow}>
                <Badge label={product.stockStatus.replaceAll("_", " ")} />
                <Badge label={`${product.stockQuantity} units`} />
                <Badge label={`Threshold ${product.lowStockThreshold}`} />
              </View>
              {editing ? (
                <>
                  <Field keyboardType="number-pad" onChangeText={setStockQuantity} placeholder="Current stock" value={stockQuantity} />
                  <Field keyboardType="number-pad" onChangeText={setLowStockThreshold} placeholder="Low stock threshold" value={lowStockThreshold} />
                  <View style={stockStyles.actions}>
                    <Pressable accessibilityRole="button" disabled={savingId === product.id} onPress={() => void save(product)} style={({ pressed }) => [styles.primaryButton, stockStyles.action, pressed && styles.pressed, savingId === product.id && styles.disabled]}>
                      <Text style={styles.primaryButtonText}>{savingId === product.id ? "Saving..." : "Save"}</Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" onPress={cancel} style={({ pressed }) => [styles.outlineButton, stockStyles.action, pressed && styles.pressed]}>
                      <Text style={styles.outlineButtonText}>Cancel</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <Pressable accessibilityRole="button" onPress={() => edit(product)} style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed]}>
                  <Text style={styles.outlineButtonText}>Edit stock</Text>
                </Pressable>
              )}
            </Card>
          );
        })}
      </ScrollContent>
    </AdminShell>
  );
}

const stockStyles = StyleSheet.create({
  action: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  alertRow: {
    alignItems: "center",
    borderTopColor: "#eadccb",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingTop: 11,
  },
  grid: {
    gap: 10,
  },
});
