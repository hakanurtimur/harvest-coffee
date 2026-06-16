import {
  calculateOrderItems,
  calculateOrderTotal,
  PaymentMethod,
  paymentMethodLabels,
} from "@harvest/domain";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { DealerShell } from "../components/dealer-shell";
import { Card, FadeInView, Field, formatCurrency, ProductCard, styles } from "../components/ui";
import { useMobileState } from "../lib/mobile-state";

const paymentMethods: PaymentMethod[] = ["bank_transfer", "credit_card", "paypal", "cash_on_delivery"];

export default function ProductsScreen() {
  const { createOrder, currentUser, deliveryAddress, loadingData, products, setDeliveryAddress } = useMobileState();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer");
  const [saving, setSaving] = useState(false);

  const cartItems = useMemo(() => calculateOrderItems(products, quantities), [products, quantities]);
  const cartTotal = useMemo(() => calculateOrderTotal(cartItems), [cartItems]);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const updateQuantity = (productId: string, delta: number) => {
    setQuantities((current) => {
      const nextQuantity = Math.max(0, (current[productId] ?? 0) + delta);
      const next = { ...current };
      if (nextQuantity === 0) delete next[productId];
      else next[productId] = nextQuantity;
      return next;
    });
  };

  const submitOrder = async () => {
    if (!currentUser || cartItems.length === 0 || saving) return;
    if (deliveryAddress.trim().length < 3) {
      Alert.alert("Delivery address required", "Please add a delivery address before placing the order.");
      return;
    }

    setSaving(true);
    try {
      const order = await createOrder({
        customerEmail: currentUser.email,
        customerName: currentUser.companyName || currentUser.fullName,
        deliveryAddress: deliveryAddress.trim(),
        items: cartItems,
        notes: notes.trim() || undefined,
        paymentMethod,
      });
      setQuantities({});
      setNotes("");
      router.push(`/order/${order.id}`);
      Alert.alert("Order created", `Order ${order.orderNumber} has been created.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DealerShell title="Products">
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Card>
            <Text style={styles.description}>{loadingData ? "Loading products..." : "No products available."}</Text>
          </Card>
        }
        ListHeaderComponent={
          <FadeInView style={productStyles.quickOrder}>
            <View style={productStyles.quickOrderHeader}>
              <View>
                <Text style={styles.kicker}>Quick order</Text>
                <Text style={productStyles.quickOrderTitle}>{itemCount} items selected</Text>
              </View>
              <View style={productStyles.totalPill}>
                <Text style={productStyles.totalLabel}>Total</Text>
                <Text style={productStyles.totalValue}>{formatCurrency(cartTotal)}</Text>
              </View>
            </View>
            <Text style={productStyles.helper}>Build a dealer order from the catalogue below.</Text>
            <Field multiline onChangeText={setDeliveryAddress} placeholder="Delivery address" value={deliveryAddress} />
            <Text style={productStyles.fieldLabel}>Payment method</Text>
            <View style={productStyles.methods}>
              {paymentMethods.map((method) => {
                const active = paymentMethod === method;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    key={method}
                    onPress={() => setPaymentMethod(method)}
                    style={({ pressed }) => [productStyles.method, active && productStyles.methodActive, pressed && styles.pressed]}
                  >
                    <Text style={[productStyles.methodText, active && productStyles.methodTextActive]}>{paymentMethodLabels[method]}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Field onChangeText={setNotes} placeholder="Notes" value={notes} />
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: itemCount === 0 || saving }}
              disabled={itemCount === 0 || saving}
              onPress={submitOrder}
              style={({ pressed }) => [styles.primaryButton, pressed && itemCount > 0 && !saving && styles.pressed, (itemCount === 0 || saving) && styles.disabled]}
            >
              <Text style={styles.primaryButtonText}>{saving ? "Creating order..." : "Place order"}</Text>
            </Pressable>
          </FadeInView>
        }
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            quantity={quantities[item.id] ?? 0}
            onDecrease={() => updateQuantity(item.id, -1)}
            onIncrease={() => updateQuantity(item.id, 1)}
          />
        )}
      />
    </DealerShell>
  );
}

const productStyles = StyleSheet.create({
  fieldLabel: {
    color: "#8b7b6c",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: -3,
    textTransform: "uppercase",
  },
  helper: {
    color: "#6f5c4c",
    fontSize: 13,
    lineHeight: 18,
    marginTop: -4,
  },
  method: {
    borderColor: "#dcc9b7",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  methodActive: {
    backgroundColor: "#6a3814",
    borderColor: "#6a3814",
  },
  methodText: {
    color: "#704118",
    fontSize: 12,
    fontWeight: "800",
  },
  methodTextActive: {
    color: "#fff",
  },
  methods: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  quickOrder: {
    backgroundColor: "#fff8ee",
    borderColor: "#d9bea2",
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  quickOrderHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  quickOrderTitle: {
    color: "#2a1a12",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 3,
  },
  totalLabel: {
    color: "#9b7a5c",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  totalPill: {
    alignItems: "flex-end",
    backgroundColor: "#f3e3d1",
    borderColor: "#e2c7aa",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  totalValue: {
    color: "#6a3814",
    fontSize: 16,
    fontWeight: "900",
  },
});
