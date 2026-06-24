"use client";

import ProductsRouteShell from "@/components/ProductsRouteShell";
import TrackOrderWorkspace from "@/components/TrackOrderWorkspace";

export default function TrackOrderPage() {
  return (
    <ProductsRouteShell>
      {({ authenticated }) => <TrackOrderWorkspace variant={authenticated ? "app" : "public"} />}
    </ProductsRouteShell>
  );
}
