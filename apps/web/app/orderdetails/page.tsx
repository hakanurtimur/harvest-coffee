import AppShell from "@/components/AppShell";
import OrderDetailWorkspace from "@/components/OrderDetailWorkspace";

export default async function LegacyOrderDetailsPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id = "" } = await searchParams;

  return (
    <AppShell>
      <OrderDetailWorkspace orderId={id} />
    </AppShell>
  );
}
