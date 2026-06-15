import OrderDetailWorkspace from "@/components/OrderDetailWorkspace";
import PublicShell from "@/components/PublicShell";

export default async function LegacyOrderDetailsPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id = "" } = await searchParams;

  return (
    <PublicShell>
      <OrderDetailWorkspace orderId={id} />
    </PublicShell>
  );
}
