import { Slot } from "expo-router";
import { PublicShell } from "../../components/public-shell";
import { useMobileState } from "../../lib/mobile-state";

export default function PublicLayout() {
  const { isAuthenticated } = useMobileState();

  if (isAuthenticated) return <Slot />;

  return (
    <PublicShell>
      <Slot />
    </PublicShell>
  );
}
