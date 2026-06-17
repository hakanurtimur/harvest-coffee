import { router, usePathname } from "expo-router";
import { ReactNode, useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useMobileState } from "../lib/mobile-state";
import { AppScreen, colors, FadeInView, initials, LoadingState, StatusBanner } from "./ui";

const adminTabs = [
  { href: "/admin-dashboard", label: "Dashboard" },
  { href: "/admin-orders", label: "Orders" },
  { href: "/admin-products", label: "Products" },
  { href: "/admin-stock", label: "Stock" },
  { href: "/admin-customers", label: "Customers" },
  { href: "/admin-reports", label: "Reports" },
  { href: "/admin-settings", label: "Settings" },
  { href: "/admin-rental-calendar", label: "Calendar" },
] as const;

export function AdminShell({ children, title }: { children: ReactNode; title: string }) {
  const pathname = usePathname();
  const { booting, currentUser, dataError, isAuthenticated, loadingData, logout } = useMobileState();

  useEffect(() => {
    if (booting) return;
    if (!isAuthenticated) router.replace("/login");
    else if (currentUser?.role !== "admin") router.replace("/products");
  }, [booting, currentUser?.role, isAuthenticated]);

  if (booting || loadingData && !currentUser) return <LoadingState label="Loading admin workspace" />;
  if (!currentUser || currentUser.role !== "admin") return null;

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <AppScreen>
      <FadeInView distance={6} style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>Harvest Coffee Admin</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{currentUser.fullName || currentUser.email}</Text>
          </View>
          <Pressable accessibilityRole="button" style={({ pressed }) => [styles.userPill, pressed && styles.pressed]} onPress={handleLogout}>
            <Text style={styles.userInitials}>{initials(currentUser.fullName)}</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.navContent} horizontal showsHorizontalScrollIndicator={false}>
          {adminTabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                key={tab.href}
                onPress={() => router.replace(tab.href)}
                style={({ pressed }) => [styles.tab, active && styles.tabActive, pressed && styles.pressed]}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </FadeInView>
      <View style={styles.body}>
        {dataError ? (
          <View style={styles.bannerWrap}>
            <StatusBanner tone="error" title="Could not refresh admin data" body={dataError} />
          </View>
        ) : loadingData ? (
          <View style={styles.bannerWrap}>
            <StatusBanner title="Syncing admin data" body="Orders, products, stock, rentals, customers, and reports are being refreshed." />
          </View>
        ) : null}
        {children}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  bannerWrap: {
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  body: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.secondary,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingBottom: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  headerCopy: {
    flex: 1,
    gap: 3,
  },
  headerTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  kicker: {
    color: "#a65b1a",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  navContent: {
    gap: 7,
    paddingTop: 10,
  },
  pressed: {
    opacity: 0.74,
    transform: [{ scale: 0.98 }],
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  tab: {
    borderColor: "#d9c7b5",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
  },
  tabTextActive: {
    color: "#fff",
  },
  title: {
    color: colors.foreground,
    fontSize: 24,
    fontWeight: "900",
  },
  userInitials: {
    color: colors.primary,
    fontWeight: "900",
  },
  userPill: {
    alignItems: "center",
    backgroundColor: "#f3e8da",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
});
