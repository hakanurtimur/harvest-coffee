import { Stack } from "expo-router";
import { MobileStateProvider } from "../lib/mobile-state";

export default function RootLayout() {
  return (
    <MobileStateProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </MobileStateProvider>
  );
}
