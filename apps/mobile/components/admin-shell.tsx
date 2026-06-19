import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, usePathname } from "expo-router";
import { ReactNode, useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useMobileState } from "../lib/mobile-state";
import { AppScreen, BrandStamp, colors, fontFamilies, initials, LoadingState, StatusBanner } from "./ui";

const adminTabs = [
  { href: "/admin-dashboard", icon: "grid", label: "Dashboard" },
  { href: "/admin-orders", icon: "shopping-cart", label: "Orders" },
  { href: "/admin-products", icon: "package", label: "Products" },
  { href: "/admin-stock", icon: "archive", label: "Stock" },
  { href: "/admin-customers", icon: "users", label: "Customers" },
  { href: "/admin-reports", icon: "bar-chart-2", label: "Reports" },
  { href: "/admin-settings", icon: "settings", label: "Settings" },
  { href: "/admin-rental-calendar", icon: "calendar", label: "Calendar" },
] as const;

const primaryAdminTabs = adminTabs.slice(0, 4);
const moreAdminTabs = adminTabs.slice(4);

const adminRouteTitles: Record<string, string> = {
  "/admin-customers": "Customers",
  "/admin-dashboard": "Dashboard",
  "/admin-orders": "Orders",
  "/admin-products": "Products",
  "/admin-rental-calendar": "Calendar",
  "/admin-reports": "Reports",
  "/admin-settings": "Settings",
  "/admin-stock": "Stock",
  "/notifications": "Notifications",
};

function isAdminTabActive(pathname: string, href: string) {
  if (href === "/admin-orders" && pathname.startsWith("/order/")) return true;
  return pathname === href;
}

function getAdminTitle(pathname: string) {
  if (pathname.startsWith("/order/")) return "Order Detail";
  return adminRouteTitles[pathname] ?? "Admin";
}

function isMainAdminRoute(pathname: string) {
  return adminTabs.some((tab) => tab.href === pathname);
}

function getAdminBackRoute(pathname: string) {
  if (pathname.startsWith("/order/")) return "/admin-orders";
  return "/admin-dashboard";
}

export function AdminShell({ children, title }: { children: ReactNode; title?: string }) {
  const pathname = usePathname();
  const { booting, currentUser, dataError, isAuthenticated, loadingData, logout, notifications } = useMobileState();
  const [moreOpen, setMoreOpen] = useState(false);
  const screenTitle = title ?? getAdminTitle(pathname);
  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const isInnerRoute = !isMainAdminRoute(pathname);

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
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {isInnerRoute ? (
            <Pressable
              accessibilityLabel="Go back"
              accessibilityRole="button"
              onPress={() => router.replace(getAdminBackRoute(pathname))}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            >
              <Feather color={colors.foreground} name="arrow-left" size={20} />
            </Pressable>
          ) : (
            <View style={styles.logoMark}>
              <BrandStamp size={38} />
            </View>
          )}
          <View style={styles.headerCopy}>
            <Text numberOfLines={1} style={styles.title}>{screenTitle}</Text>
            <Text numberOfLines={1} style={styles.subtitle}>{currentUser.fullName || currentUser.email}</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityLabel="Open notifications"
              accessibilityRole="button"
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
              onPress={() => router.push("/notifications")}
            >
              <Feather color={colors.foreground} name="bell" size={19} />
              {unreadCount ? (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable accessibilityLabel="Admin user" accessibilityRole="button" style={({ pressed }) => [styles.userPill, pressed && styles.pressed]}>
              <Text style={styles.userInitials}>{initials(currentUser.fullName)}</Text>
            </Pressable>
          </View>
        </View>
      </View>
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
      <View style={styles.appBar}>
        <View style={styles.appBarContent}>
          {primaryAdminTabs.map((tab) => {
            const active = isAdminTabActive(pathname, tab.href);
            return (
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                key={tab.href}
                onPress={() => router.replace(tab.href)}
                style={({ pressed }) => [styles.tab, active && styles.tabActive, pressed && styles.pressed]}
              >
                {active ? (
                  <>
                    <LinearGradient
                      colors={colors.navigation.activeGradient}
                      end={{ x: 1, y: 1 }}
                      locations={[0, 0.58, 1]}
                      pointerEvents="none"
                      start={{ x: 0, y: 0 }}
                      style={styles.activeGradient}
                    />
                    <LinearGradient
                      colors={colors.navigation.highlightGradient}
                      end={{ x: 1, y: 1 }}
                      locations={[0, 0.5, 1]}
                      pointerEvents="none"
                      start={{ x: 0, y: 0 }}
                      style={styles.activeTopRadial}
                    />
                  </>
                ) : null}
                <Feather color={active ? colors.onPrimary : colors.foreground} name={tab.icon} size={18} style={styles.tabIcon} />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={styles.fabWrap}>
        <Pressable
          accessibilityLabel="Open admin menu"
          accessibilityRole="button"
          accessibilityState={{ expanded: moreOpen, selected: moreAdminTabs.some((tab) => isAdminTabActive(pathname, tab.href)) }}
          onPress={() => setMoreOpen(true)}
          style={({ pressed }) => [
            styles.fab,
            moreAdminTabs.some((tab) => isAdminTabActive(pathname, tab.href)) && styles.fabActive,
            pressed && styles.pressed,
          ]}
        >
          <LinearGradient
            colors={colors.navigation.activeGradient}
            end={{ x: 1, y: 1 }}
            locations={[0, 0.58, 1]}
            pointerEvents="none"
            start={{ x: 0, y: 0 }}
            style={styles.fabGradient}
          />
          <LinearGradient
            colors={colors.navigation.highlightGradient}
            end={{ x: 1, y: 1 }}
            locations={[0, 0.5, 1]}
            pointerEvents="none"
            start={{ x: 0, y: 0 }}
            style={styles.fabGlow}
          />
          <Feather color={colors.onPrimary} name="grid" size={22} style={styles.tabIcon} />
        </Pressable>
      </View>
      <Modal animationType="fade" transparent visible={moreOpen} onRequestClose={() => setMoreOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setMoreOpen(false)}>
          <Pressable style={styles.moreSheet}>
            <View style={styles.moreHeader}>
              <View>
                <Text style={styles.kicker}>Admin menu</Text>
                <Text style={styles.moreTitle}>More routes</Text>
              </View>
              <Pressable accessibilityLabel="Close admin menu" accessibilityRole="button" onPress={() => setMoreOpen(false)} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
                <Feather color={colors.foreground} name="x" size={18} />
              </Pressable>
            </View>
            {moreAdminTabs.map((tab) => {
              const active = isAdminTabActive(pathname, tab.href);
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  key={tab.href}
                  onPress={() => {
                    setMoreOpen(false);
                    router.replace(tab.href);
                  }}
                  style={({ pressed }) => [styles.moreItem, active && styles.moreItemActive, pressed && styles.pressed]}
                >
                  <View style={[styles.moreIcon, active && styles.moreIconActive]}>
                    <Feather color={active ? colors.onPrimary : colors.foreground} name={tab.icon} size={18} />
                  </View>
                  <Text style={styles.moreItemText}>{tab.label}</Text>
                  <Feather color={colors.muted} name="chevron-right" size={18} />
                </Pressable>
              );
            })}
            <View style={styles.moreDivider} />
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setMoreOpen(false);
                handleLogout();
              }}
              style={({ pressed }) => [styles.moreItem, pressed && styles.pressed]}
            >
              <View style={styles.moreIcon}>
                <Feather color={colors.foreground} name="log-out" size={18} />
              </View>
              <Text style={styles.moreItemText}>Logout</Text>
              <Feather color={colors.muted} name="chevron-right" size={18} />
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  activeGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 19,
  },
  activeTopRadial: {
    borderRadius: 999,
    height: 62,
    left: -24,
    position: "absolute",
    top: -26,
    width: 62,
  },
  appBar: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 26,
    borderWidth: 1,
    bottom: 10,
    height: 60,
    left: 12,
    padding: 7,
    position: "absolute",
    right: 82,
    shadowColor: colors.foreground,
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
  },
  appBarContent: {
    flexDirection: "row",
    gap: 5,
    height: "100%",
  },
  bannerWrap: {
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  body: {
    flex: 1,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  header: {
    backgroundColor: colors.secondary,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    height: 66,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  headerActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  headerTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    height: 46,
    justifyContent: "space-between",
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    shadowColor: colors.foreground,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.045,
    shadowRadius: 14,
    width: 44,
  },
  logoMark: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    overflow: "hidden",
    width: 44,
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  fab: {
    alignItems: "center",
    borderRadius: 24,
    height: 56,
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: colors.primary,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    width: 56,
  },
  fabActive: {
    transform: [{ scale: 1.02 }],
  },
  fabGlow: {
    borderRadius: 999,
    height: 72,
    left: -24,
    position: "absolute",
    top: -24,
    width: 72,
  },
  fabGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
  },
  fabWrap: {
    bottom: 10,
    position: "absolute",
    right: 14,
  },
  kicker: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  pressed: {
    opacity: 0.74,
    transform: [{ scale: 0.98 }],
  },
  modalOverlay: {
    backgroundColor: colors.overlay.shellScrim,
    flex: 1,
    justifyContent: "flex-end",
    padding: 14,
  },
  moreHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  moreDivider: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: 2,
  },
  moreIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  moreIconActive: {
    backgroundColor: colors.foreground,
    borderColor: colors.foreground,
  },
  moreItem: {
    alignItems: "center",
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 10,
  },
  moreItemActive: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.primary,
  },
  moreItemText: {
    color: colors.foreground,
    flex: 1,
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
  },
  moreSheet: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    padding: 14,
    shadowColor: colors.foreground,
    shadowOffset: { height: 14, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 26,
  },
  moreTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 18,
  },
  tab: {
    alignItems: "center",
    borderRadius: 19,
    flex: 1,
    gap: 3,
    height: 46,
    justifyContent: "center",
    overflow: "hidden",
    paddingHorizontal: 2,
  },
  tabActive: {
    backgroundColor: colors.inverse,
    shadowColor: colors.primary,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
  },
  tabIcon: {
    zIndex: 2,
  },
  tabText: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 9,
    zIndex: 2,
  },
  tabTextActive: {
    color: colors.onPrimary,
  },
  title: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 20,
    lineHeight: 26,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
  },
  unreadBadge: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderColor: colors.secondary,
    borderRadius: 999,
    borderWidth: 2,
    height: 20,
    justifyContent: "center",
    minWidth: 20,
    position: "absolute",
    right: -4,
    top: -4,
  },
  unreadText: {
    color: colors.onPrimary,
    fontFamily: fontFamilies.bold,
    fontSize: 10,
  },
  userInitials: {
    color: colors.primary,
    fontFamily: fontFamilies.bold,
    fontSize: 12,
  },
  userPill: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
});
