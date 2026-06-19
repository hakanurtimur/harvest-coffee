import { Slot, usePathname } from "expo-router";
import { PublicShell } from "../../components/public-shell";
import { useMobileState } from "../../lib/mobile-state";

export default function PublicLayout() {
  const pathname = usePathname();
  const { isAuthenticated } = useMobileState();

  if (isAuthenticated && pathname === "/products") {
    return <Slot />;
  }

  return (
    <PublicShell>
      <Slot />
    </PublicShell>
  );
}
