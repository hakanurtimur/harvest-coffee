import { Order } from "@harvest/domain";
import { useState } from "react";
import { Alert } from "react-native";
import { DealerShell } from "../components/dealer-shell";
import { EmptyState, Field, OrderDetailContent, PrimaryButton, ScrollContent, SectionTitle } from "../components/ui";
import { useMobileState } from "../lib/mobile-state";

export default function TrackOrderScreen() {
  const { api } = useMobileState();
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    const normalized = orderNumber.trim();
    if (!normalized) {
      Alert.alert("Order number required", "Enter an order number to track.");
      return;
    }

    setLoading(true);
    try {
      setOrder(await api.getOrderByNumber(normalized));
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DealerShell title="Track Order">
      <ScrollContent>
        <SectionTitle eyebrow="Tracking" title="Find an order" />
        <Field autoCapitalize="characters" onChangeText={setOrderNumber} placeholder="HC20480914" value={orderNumber} />
        <PrimaryButton disabled={loading} label={loading ? "Searching..." : "Track order"} onPress={search} />
        {order ? <OrderDetailContent order={order} /> : null}
        {!order && searched ? (
          <EmptyState title="Order not found" body="No order matched that order number in the mock dealer data." />
        ) : null}
      </ScrollContent>
    </DealerShell>
  );
}
