import { Order } from "@harvest/domain";
import { useState } from "react";
import { EmptyState, Field, OrderDetailContent, PrimaryButton, ScrollContent, SectionTitle, StatusBanner } from "../components/ui";
import { useMobileState } from "../lib/mobile-state";
import { validateOrderNumber } from "../lib/validation";

export default function TrackOrderScreen() {
  const { api } = useMobileState();
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ body?: string; title: string } | null>(null);

  const search = async () => {
    const normalized = validateOrderNumber(orderNumber);
    if (!normalized.ok) {
      setMessage({ body: normalized.message, title: normalized.title });
      return;
    }

    setMessage(null);
    setLoading(true);
    try {
      setOrder(await api.getOrderByNumber(normalized.value));
      setSearched(true);
    } catch (error) {
      setMessage({ body: error instanceof Error ? error.message : "The order lookup could not be completed.", title: "Tracking failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollContent>
      <SectionTitle eyebrow="Tracking" title="Find an order" />
      {message ? <StatusBanner body={message.body} title={message.title} tone="error" /> : null}
      <Field autoCapitalize="characters" onChangeText={(value) => setOrderNumber(value.toUpperCase())} placeholder="HC20480914" value={orderNumber} />
      <PrimaryButton disabled={loading} label={loading ? "Searching..." : "Track order"} onPress={search} />
      {order ? <OrderDetailContent order={order} /> : null}
      {!order && searched ? (
        <EmptyState title="Order not found" body="No order matched that order number. Check the number and try again." />
      ) : null}
    </ScrollContent>
  );
}
