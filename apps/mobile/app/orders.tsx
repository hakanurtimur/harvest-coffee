import { router } from "expo-router";
import { DealerShell } from "../components/dealer-shell";
import { EmptyState, OrderCard, ScrollContent, SectionTitle } from "../components/ui";
import { useMobileState } from "../lib/mobile-state";

export default function OrdersScreen() {
  const { orders } = useMobileState();

  return (
    <DealerShell title="My Orders">
      <ScrollContent>
        <SectionTitle eyebrow="My orders" title="Order history" />
        {orders.length === 0 ? (
          <EmptyState title="No orders yet" body="Create your first order from the product catalogue." />
        ) : (
          orders.map((order) => (
            <OrderCard key={order.id} order={order} onPress={() => router.push(`/order/${order.id}`)} />
          ))
        )}
      </ScrollContent>
    </DealerShell>
  );
}
