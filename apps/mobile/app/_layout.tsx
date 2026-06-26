import { PlusJakartaSans_400Regular } from "@expo-google-fonts/plus-jakarta-sans/400Regular";
import { PlusJakartaSans_500Medium } from "@expo-google-fonts/plus-jakarta-sans/500Medium";
import { PlusJakartaSans_600SemiBold } from "@expo-google-fonts/plus-jakarta-sans/600SemiBold";
import { PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans/700Bold";
import { PlusJakartaSans_800ExtraBold } from "@expo-google-fonts/plus-jakarta-sans/800ExtraBold";
import { useFonts } from "@expo-google-fonts/plus-jakarta-sans/useFonts";
import { Redirect, Stack, usePathname } from "expo-router";
import { Text, TextInput } from "react-native";
import { AdminShell } from "../components/admin-shell";
import { DealerShell } from "../components/dealer-shell";
import { PublicShell } from "../components/public-shell";
import { MobileStateProvider } from "../lib/mobile-state";
import { fontFamilies } from "../components/ui";
import { useMobileState } from "../lib/mobile-state";

let defaultFontsApplied = false;

function applyDefaultFonts() {
  if (defaultFontsApplied) return;
  defaultFontsApplied = true;

  const textDefaults = (Text as unknown as { defaultProps?: { style?: unknown } }).defaultProps ?? {};
  (Text as unknown as { defaultProps: { style?: unknown } }).defaultProps = {
    ...textDefaults,
    style: [textDefaults.style, { fontFamily: fontFamilies.regular }],
  };

  const inputDefaults = (TextInput as unknown as { defaultProps?: { style?: unknown } }).defaultProps ?? {};
  (TextInput as unknown as { defaultProps: { style?: unknown } }).defaultProps = {
    ...inputDefaults,
    style: [inputDefaults.style, { fontFamily: fontFamilies.regular }],
  };
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (!fontsLoaded) return null;
  applyDefaultFonts();

  return (
    <MobileStateProvider>
      <RootStack />
    </MobileStateProvider>
  );
}

function RootStack() {
  const pathname = usePathname();
  const { currentUser, isAuthenticated } = useMobileState();
  const isPublicMarketingPath =
    pathname === "/" ||
    pathname === "/home" ||
    pathname === "/about" ||
    pathname === "/contact";
  const isPrivateDealerPath =
    pathname === "/orders" ||
    pathname === "/rentals" ||
    pathname === "/profile" ||
    pathname === "/notifications" ||
    pathname === "/create-rental" ||
    pathname.startsWith("/order/");
  const isDealerPath = isPrivateDealerPath || pathname === "/track-order" || pathname === "/products";
  const shouldUseDealerShell = isDealerPath && isAuthenticated && currentUser?.role !== "admin";
  const isAdminPath =
    pathname.startsWith("/admin-") ||
    pathname === "/notifications" ||
    pathname.startsWith("/order/");
  const shouldUseAdminShell = isAdminPath && currentUser?.role === "admin";
  const shouldUsePublicShell = !isAuthenticated && pathname === "/track-order";
  const stack = <Stack screenOptions={{ headerShown: false }} />;

  if (!isAuthenticated && (isPrivateDealerPath || isAdminPath)) return <Redirect href="/login" />;
  if (
    isAuthenticated &&
    currentUser?.role === "admin" &&
    (isPublicMarketingPath || pathname === "/products" || pathname === "/track-order")
  ) {
    return <Redirect href="/admin-dashboard" />;
  }
  if (isAuthenticated && currentUser?.role !== "admin" && isPublicMarketingPath) {
    return <Redirect href="/products" />;
  }
  if (shouldUseAdminShell) return <AdminShell>{stack}</AdminShell>;
  if (shouldUsePublicShell) return <PublicShell>{stack}</PublicShell>;
  return shouldUseDealerShell ? <DealerShell>{stack}</DealerShell> : stack;
}
