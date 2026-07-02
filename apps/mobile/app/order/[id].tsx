import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Order } from "@harvest/domain";
import { EmptyState, LoadingState, OrderDetailContent, OutlineButton, ScrollContent, SectionTitle, StatusBanner } from "../../components/ui";
import { useMobileState } from "../../lib/mobile-state";

export default function OrderDetailScreen() {
  const { api, currentUser, orders } = useMobileState();
  const { id } = useLocalSearchParams<{ id: string }>();
  const cachedOrder = orders.find((item) => item.id === id) ?? null;
  const [order, setOrder] = useState<Order | null>(cachedOrder);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!order);
  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    if (cachedOrder) setOrder(cachedOrder);
  }, [cachedOrder]);

  useEffect(() => {
    let mounted = true;

    async function loadOrder() {
      if (!id) return;
      if (!cachedOrder) setLoading(true);
      setError(null);
      try {
        const nextOrder = await api.getOrder(id);
        if (mounted) setOrder(nextOrder);
      } catch (loadError) {
        if (mounted) setError(loadError instanceof Error ? loadError.message : "Order could not be loaded.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadOrder();
    return () => {
      mounted = false;
    };
  }, [api, cachedOrder, id]);

  if (loading) return <LoadingState label="Loading order" />;

  const content = (
      <ScrollContent>
        <OutlineButton label={isAdmin ? "Back to admin orders" : "Back to orders"} onPress={() => router.replace(isAdmin ? "/admin-orders" : "/orders")} />
        {order ? (
          <>
            <SectionTitle eyebrow="Order detail" title={order.orderNumber} />
            <OrderDetailContent order={order} />
          </>
        ) : (
          <>
            {error ? <StatusBanner tone="error" title="Order load failed" body={error} /> : null}
            <EmptyState title="Order not found" body="The selected order could not be loaded." />
          </>
        )}
      </ScrollContent>
  );

  return content;
}
