import { Order } from "@harvest/domain";
import { useState } from "react";
import { Alert } from "react-native";
import { EmptyState, Field, OrderDetailContent, PrimaryButton, ScrollContent, SectionTitle } from "../components/ui";
import { useMobileState } from "../lib/mobile-state";
import { validateOrderNumber } from "../lib/validation";

export default function TrackOrderScreen() {
  const { api } = useMobileState();
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    const normalized = validateOrderNumber(orderNumber);
    if (!normalized.ok) {
      Alert.alert(normalized.title, normalized.message);
      return;
    }

    setLoading(true);
    try {
      setOrder(await api.getOrderByNumber(normalized.value));
      setSearched(true);
    } catch (error) {
      Alert.alert("Tracking failed", error instanceof Error ? error.message : "The order lookup could not be completed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollContent>
      <SectionTitle eyebrow="Tracking" title="Find an order" />
      <Field autoCapitalize="characters" onChangeText={(value) => setOrderNumber(value.toUpperCase())} placeholder="HC20480914" value={orderNumber} />
      <PrimaryButton disabled={loading} label={loading ? "Searching..." : "Track order"} onPress={search} />
      {order ? <OrderDetailContent order={order} /> : null}
      {!order && searched ? (
        <EmptyState title="Order not found" body="No order matched that order number in the mock dealer data." />
      ) : null}
    </ScrollContent>
  );
}
