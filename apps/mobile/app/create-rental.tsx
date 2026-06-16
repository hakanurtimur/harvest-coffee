import { Product } from "@harvest/domain";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { DealerShell } from "../components/dealer-shell";
import { Card, Field, PrimaryButton, ScrollContent, SectionTitle, styles } from "../components/ui";
import { useMobileState } from "../lib/mobile-state";

export default function CreateRentalScreen() {
  const { createRental, currentUser, products } = useMobileState();
  const rentalProducts = useMemo(() => products.filter((product) => product.category.toLowerCase().includes("machine") || product.weight?.toLowerCase().includes("rental")), [products]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(rentalProducts[0] ?? products[0] ?? null);
  const [startDate, setStartDate] = useState("2026-06-16");
  const [endDate, setEndDate] = useState("2026-07-16");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selectedProduct && products.length > 0) setSelectedProduct(rentalProducts[0] ?? products[0]);
  }, [products, rentalProducts, selectedProduct]);

  const submit = async () => {
    if (!currentUser || !selectedProduct || saving) return;
    if (!startDate.trim() || !endDate.trim()) {
      Alert.alert("Rental dates required", "Add a start and end date.");
      return;
    }

    setSaving(true);
    try {
      await createRental({
        customerEmail: currentUser.email,
        customerName: currentUser.companyName || currentUser.fullName,
        endDate: endDate.trim(),
        notes: notes.trim() || undefined,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        startDate: startDate.trim(),
      });
      Alert.alert("Rental created", "The rental request has been created.");
      router.replace("/rentals");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DealerShell title="Create Rental">
      <ScrollContent>
        <SectionTitle eyebrow="Rental request" title="Create rental" />
        <Card>
          <Text style={styles.cardTitle}>Product</Text>
          {(rentalProducts.length ? rentalProducts : products).map((product) => {
            const active = selectedProduct?.id === product.id;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                key={product.id}
                onPress={() => setSelectedProduct(product)}
                style={({ pressed }) => [rentalStyles.productOption, active && rentalStyles.productOptionActive, pressed && styles.pressed]}
              >
                <View style={styles.flex}>
                  <Text style={[styles.name, active && rentalStyles.activeText]}>{product.name}</Text>
                  <Text style={[styles.muted, active && rentalStyles.activeMuted]}>{product.weight || product.category}</Text>
                </View>
                <Text style={[rentalStyles.optionState, active && rentalStyles.optionStateActive]}>{active ? "Selected" : "Select"}</Text>
              </Pressable>
            );
          })}
        </Card>
        <Card>
          <Text style={styles.cardTitle}>Rental details</Text>
          <Field onChangeText={setStartDate} placeholder="Start date, e.g. 2026-06-16" value={startDate} />
          <Field onChangeText={setEndDate} placeholder="End date, e.g. 2026-07-16" value={endDate} />
          <Field multiline onChangeText={setNotes} placeholder="Notes" value={notes} />
          <PrimaryButton disabled={saving || !selectedProduct} label={saving ? "Creating rental..." : "Create rental"} onPress={submit} />
        </Card>
      </ScrollContent>
    </DealerShell>
  );
}

const rentalStyles = StyleSheet.create({
  activeMuted: {
    color: "#f6e7d4",
  },
  activeText: {
    color: "#fff",
  },
  optionState: {
    color: "#704118",
    fontSize: 12,
    fontWeight: "900",
  },
  optionStateActive: {
    color: "#fff",
  },
  productOption: {
    alignItems: "center",
    borderColor: "#eadccb",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 11,
  },
  productOptionActive: {
    backgroundColor: "#704118",
    borderColor: "#704118",
  },
});
