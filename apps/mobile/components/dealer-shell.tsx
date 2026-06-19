import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, usePathname } from "expo-router";
import { ReactNode, useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { useMobileState } from "../lib/mobile-state";
import { AppScreen, BrandStamp, colors, FadeInView, fontFamilies, initials, LoadingState, StatusBanner } from "./ui";

const tabs = [
  { href: "/products", icon: "shopping-bag", label: "Products" },
  { href: "/orders", icon: "file-text", label: "Orders" },
  { href: "/rentals", icon: "calendar", label: "Rentals" },
  { href: "/profile", icon: "user", label: "Profile" },
] as const;

const routeTitles: Record<string, string> = {
  "/create-rental": "Create Rental",
  "/notifications": "Notifications",
  "/orders": "My Orders",
  "/products": "Products",
  "/profile": "Profile",
  "/rentals": "Rentals",
  "/track-order": "Track Order",
};

function getDealerTitle(pathname: string) {
  if (pathname.startsWith("/order/")) return "Order Detail";
  return routeTitles[pathname] ?? "Dealer";
}

function isTabActive(pathname: string, href: string) {
  if (href === "/orders" && pathname.startsWith("/order/")) return true;
  if (href === "/rentals" && pathname === "/create-rental") return true;
  return pathname === href;
}

function isMainDealerRoute(pathname: string) {
  return tabs.some((tab) => tab.href === pathname);
}

function getDealerBackRoute(pathname: string) {
  if (pathname === "/create-rental") return "/rentals";
  if (pathname === "/notifications" || pathname === "/track-order" || pathname.startsWith("/order/")) return "/orders";
  return "/products";
}

export function DealerShell({ children, title }: { children: ReactNode; title?: string }) {
  const pathname = usePathname();
  const { booting, cartItemCount, currentUser, dataError, isAuthenticated, loadingData, notifications, openCart } = useMobileState();
  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const screenTitle = title ?? getDealerTitle(pathname);
  const isInnerRoute = !isMainDealerRoute(pathname);
  const cartEntry = useRef(new Animated.Value(cartItemCount > 0 ? 1 : 0)).current;
  const [displayCartCount, setDisplayCartCount] = useState(cartItemCount);
  const previousCartCount = useRef(cartItemCount);

  useEffect(() => {
    if (booting) return;
    if (!isAuthenticated) router.replace("/login");
    else if (currentUser?.role === "admin") router.replace("/admin-dashboard");
  }, [booting, currentUser?.role, isAuthenticated]);

  useEffect(() => {
    const wasEmpty = previousCartCount.current === 0;
    previousCartCount.current = cartItemCount;

    if (cartItemCount > 0) {
      setDisplayCartCount(cartItemCount);
      Animated.timing(cartEntry, {
        duration: wasEmpty ? 260 : 120,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: false,
      }).start();
      return;
    }

    Animated.timing(cartEntry, {
      duration: 180,
      easing: Easing.in(Easing.cubic),
      toValue: 0,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) setDisplayCartCount(0);
    });
  }, [cartEntry, cartItemCount]);

  if (booting || (!isAuthenticated && loadingData)) return <LoadingState label="Loading dealer workspace" />;
  if (!currentUser || currentUser.role === "admin") return null;

  const handleCartPress = () => {
    if (pathname !== "/products") router.push("/products");
    if (displayCartCount > 0) openCart();
  };

  return (
    <AppScreen>
      <FadeInView distance={6} style={styles.header}>
        <View style={styles.headerTop}>
          {isInnerRoute ? (
            <Pressable
              accessibilityLabel="Go back"
              accessibilityRole="button"
              onPress={() => router.replace(getDealerBackRoute(pathname))}
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
            <Text style={styles.subtitle}>{currentUser.companyName || currentUser.fullName}</Text>
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
            <Pressable
              accessibilityLabel="Open profile"
              accessibilityRole="button"
              style={({ pressed }) => [styles.userPill, pressed && styles.pressed]}
              onPress={() => router.push("/profile")}
            >
              <Text style={styles.userInitials}>{initials(currentUser.fullName)}</Text>
            </Pressable>
          </View>
        </View>
      </FadeInView>
      <View style={styles.body}>
        {dataError ? (
          <View style={styles.bannerWrap}>
            <StatusBanner tone="error" title="Could not refresh data" body={dataError} />
          </View>
        ) : loadingData ? (
          <View style={styles.bannerWrap}>
            <StatusBanner title="Syncing latest dealer data" body="Products, orders, rentals, and notifications are being refreshed." />
          </View>
        ) : null}
        {children}
      </View>
      <FadeInView delay={120} distance={8} style={styles.tabs}>
        {tabs.map((tab) => {
          const active = isTabActive(pathname, tab.href);
          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              key={tab.href}
              style={({ pressed }) => [styles.tab, active && styles.tabActive, pressed && styles.tabPressed]}
              onPress={() => router.replace(tab.href)}
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
                  <LinearGradient
                    colors={colors.navigation.warmGlow}
                    end={{ x: 0, y: 0 }}
                    locations={[0, 0.48, 1]}
                    pointerEvents="none"
                    start={{ x: 1, y: 1 }}
                    style={styles.activeBottomRadial}
                  />
                </>
              ) : null}
              <Feather color={active ? colors.onPrimary : colors.foreground} name={tab.icon} size={19} style={styles.tabIcon} />
              <Text numberOfLines={1} style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
        <Animated.View
          pointerEvents={cartItemCount > 0 ? "auto" : "none"}
          style={[
            styles.cartSlot,
            {
              marginLeft: cartEntry.interpolate({ inputRange: [0, 1], outputRange: [-8, 2] }),
              opacity: cartEntry,
              transform: [
                { scale: cartEntry.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
              ],
              width: cartEntry.interpolate({ inputRange: [0, 1], outputRange: [0, 54] }),
            },
          ]}
        >
          <Pressable
            accessibilityLabel="Open cart"
            accessibilityRole="button"
            accessibilityState={{ expanded: displayCartCount > 0 }}
            style={({ pressed }) => [styles.cartTab, pressed && styles.tabPressed]}
            onPress={handleCartPress}
          >
            <LinearGradient
              colors={colors.navigation.activeGradient}
              end={{ x: 1, y: 1 }}
              locations={[0, 0.58, 1]}
              pointerEvents="none"
              start={{ x: 0, y: 0 }}
              style={styles.activeGradient}
            />
            <Feather color={colors.onPrimary} name="shopping-cart" size={21} style={styles.tabIcon} />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{displayCartCount > 9 ? "9+" : displayCartCount}</Text>
            </View>
          </Pressable>
        </Animated.View>
      </FadeInView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  activeBottomRadial: {
    borderRadius: 999,
    bottom: -30,
    height: 78,
    position: "absolute",
    right: -30,
    width: 78,
  },
  activeGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
  },
  activeTopRadial: {
    borderRadius: 999,
    height: 64,
    left: -26,
    position: "absolute",
    top: -26,
    width: 64,
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
  bannerWrap: {
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  cartBadge: {
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
    zIndex: 3,
  },
  cartBadgeText: {
    color: colors.onPrimary,
    fontFamily: fontFamilies.bold,
    fontSize: 10,
  },
  cartSlot: {
    height: 48,
    overflow: "visible",
  },
  cartTab: {
    alignItems: "center",
    borderRadius: 20,
    height: 48,
    justifyContent: "center",
    overflow: "visible",
    width: 48,
  },
  header: {
    backgroundColor: colors.secondary,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
  subtitle: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
  },
  tab: {
    alignItems: "center",
    borderRadius: 20,
    flex: 1,
    gap: 3,
    height: 48,
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
  tabPressed: {
    opacity: 0.74,
    transform: [{ scale: 0.98 }],
  },
  tabs: {
    alignSelf: "center",
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 1,
    bottom: 10,
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    padding: 8,
    position: "absolute",
    shadowColor: colors.foreground,
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    width: "94%",
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
  unreadBadge: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderColor: colors.secondary,
    borderRadius: 999,
    borderWidth: 2,
    height: 20,
    justifyContent: "center",
    position: "absolute",
    right: -4,
    top: -4,
    minWidth: 20,
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
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
});
