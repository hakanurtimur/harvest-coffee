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
import { Card, Field, formatCurrency, ProductCard, styles } from "../components/ui";
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
          <Card>
            <Text style={styles.kicker}>Quick order</Text>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>{itemCount} items selected</Text>
              <Text style={styles.total}>{formatCurrency(cartTotal)}</Text>
            </View>
            <Field multiline onChangeText={setDeliveryAddress} placeholder="Delivery address" value={deliveryAddress} />
            <View style={productStyles.methods}>
              {paymentMethods.map((method) => {
                const active = paymentMethod === method;
                return (
                  <Pressable key={method} onPress={() => setPaymentMethod(method)} style={[productStyles.method, active && productStyles.methodActive]}>
                    <Text style={[productStyles.methodText, active && productStyles.methodTextActive]}>{paymentMethodLabels[method]}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Field onChangeText={setNotes} placeholder="Notes" value={notes} />
            <Pressable disabled={itemCount === 0 || saving} onPress={submitOrder} style={[styles.primaryButton, (itemCount === 0 || saving) && styles.disabled]}>
              <Text style={styles.primaryButtonText}>{saving ? "Creating order..." : "Place order"}</Text>
            </Pressable>
          </Card>
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
  method: {
    borderColor: "#dcc9b7",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  methodActive: {
    backgroundColor: "#704118",
    borderColor: "#704118",
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
    gap: 8,
  },
});
