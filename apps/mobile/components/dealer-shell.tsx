import { router, usePathname } from "expo-router";
import { ReactNode, useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useMobileState } from "../lib/mobile-state";
import { AppScreen, colors, initials, LoadingState } from "./ui";

const tabs = [
  { href: "/products", label: "Products" },
  { href: "/orders", label: "Orders" },
  { href: "/rentals", label: "Rentals" },
  { href: "/profile", label: "Profile" },
] as const;

export function DealerShell({ children, title }: { children: ReactNode; title: string }) {
  const pathname = usePathname();
  const { booting, currentUser, isAuthenticated, loadingData, notifications } = useMobileState();
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  useEffect(() => {
    if (!booting && !isAuthenticated) router.replace("/login");
  }, [booting, isAuthenticated]);

  if (booting || (!isAuthenticated && loadingData)) return <LoadingState label="Loading dealer workspace" />;
  if (!currentUser) return null;

  return (
    <AppScreen>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>Harvest Coffee</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{currentUser.companyName || currentUser.fullName}</Text>
          </View>
          <View style={styles.userPill}>
            <Text style={styles.userInitials}>{initials(currentUser.fullName)}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <Pressable style={styles.actionButton} onPress={() => router.push("/track-order")}>
            <Text style={styles.actionText}>Track order</Text>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={() => router.push("/notifications")}>
            <Text style={styles.actionText}>Notifications{unreadCount ? ` (${unreadCount})` : ""}</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.body}>{children}</View>
      <View style={styles.tabs}>
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Pressable key={tab.href} style={[styles.tab, active && styles.tabActive]} onPress={() => router.replace(tab.href)}>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    borderColor: "#d9c7b5",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  body: {
    flex: 1,
  },
  header: {
    paddingBottom: 10,
    paddingHorizontal: 12,
    paddingTop: 12,
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
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800",
  },
  tab: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    paddingVertical: 12,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
  },
  tabTextActive: {
    color: "#fff",
  },
  tabs: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    bottom: 18,
    flexDirection: "row",
    gap: 4,
    left: 10,
    padding: 5,
    position: "absolute",
    right: 10,
  },
  title: {
    color: colors.foreground,
    fontSize: 26,
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
    height: 44,
    justifyContent: "center",
    width: 44,
  },
});
