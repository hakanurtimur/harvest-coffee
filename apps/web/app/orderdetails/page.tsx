import AppShell from "@/components/AppShell";
import OrderDetailWorkspace from "@/components/OrderDetailWorkspace";

export default async function OrderDetailsPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id = "" } = await searchParams;

  return (
    <AppShell>
      <OrderDetailWorkspace orderId={id} />
    </AppShell>
  );
}
