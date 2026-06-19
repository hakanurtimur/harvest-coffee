import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, usePathname } from "expo-router";
import { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppScreen, BrandStamp, colors, FadeInView, fontFamilies } from "./ui";

const navItems = [
  { href: "/home", icon: "home", label: "Home" },
  { href: "/about", icon: "information", label: "About", set: "ionicons" },
  { href: "/products", icon: "shopping-bag", label: "Products" },
  { href: "/contact", icon: "mail", label: "Contact" },
  { href: "/login", icon: "user", label: "Login" },
] as const;

const routeTitles: Record<string, string> = {
  "/about": "About",
  "/contact": "Contact",
  "/home": "Harvest Coffee",
  "/login": "Login",
  "/products": "Products",
};

function isMainPublicRoute(pathname: string) {
  return pathname === "/" || navItems.some((item) => item.href === pathname);
}

export function PublicShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const title = routeTitles[pathname] ?? "Harvest Coffee";
  const isInnerRoute = !isMainPublicRoute(pathname);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/home");
  };

  return (
    <AppScreen>
      <View style={publicStyles.shell}>
        <ScrollView contentContainerStyle={publicStyles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <FadeInView distance={6} style={publicStyles.header}>
            <View style={publicStyles.routeHeader}>
              {isInnerRoute ? (
                <Pressable
                  accessibilityLabel="Go back"
                  accessibilityRole="button"
                  onPress={goBack}
                  style={({ pressed }) => [publicStyles.iconButton, pressed && publicStyles.pressed]}
                >
                  <Feather color={colors.foreground} name="arrow-left" size={23} />
                </Pressable>
              ) : (
                <View style={publicStyles.logoMark}>
                  <BrandStamp size={38} />
                </View>
              )}

              <View style={publicStyles.headerCopy}>
                <Text numberOfLines={1} style={publicStyles.routeTitle}>
                  {title}
                </Text>
                <Text numberOfLines={1} style={publicStyles.routeSubtitle}>Premium B2B Coffee Supply</Text>
              </View>

              <Pressable
                accessibilityLabel="Open login"
                accessibilityRole="button"
                onPress={() => router.push("/login")}
                style={({ pressed }) => [publicStyles.iconButton, pressed && publicStyles.pressed]}
              >
                <Feather color={colors.foreground} name="user" size={20} />
              </Pressable>
            </View>
          </FadeInView>
          {children}
        </ScrollView>

        <FadeInView delay={120} distance={8} style={publicStyles.floatingBarWrap}>
          <View style={publicStyles.floatingBar}>
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  key={item.href}
                  onPress={() => router.push(item.href)}
                  style={({ pressed }) => [publicStyles.floatingItem, active && publicStyles.floatingItemActive, pressed && publicStyles.pressed]}
                >
                  {active ? (
                    <>
                      <LinearGradient
                        colors={colors.navigation.activeGradient}
                        end={{ x: 1, y: 1 }}
                        locations={[0, 0.58, 1]}
                        pointerEvents="none"
                        start={{ x: 0, y: 0 }}
                        style={publicStyles.activeGradient}
                      />
                      <LinearGradient
                        colors={colors.navigation.highlightGradientStrong}
                        end={{ x: 1, y: 1 }}
                        locations={[0, 0.48, 1]}
                        pointerEvents="none"
                        start={{ x: 0, y: 0 }}
                        style={publicStyles.activeTopRadial}
                      />
                      <LinearGradient
                        colors={colors.navigation.warmGlowStrong}
                        end={{ x: 0, y: 0 }}
                        locations={[0, 0.46, 1]}
                        pointerEvents="none"
                        start={{ x: 1, y: 1 }}
                        style={publicStyles.activeBottomRadial}
                      />
                    </>
                  ) : null}
                  {"set" in item && item.set === "ionicons" ? (
                    <Ionicons
                      color={active ? colors.onPrimary : colors.foreground}
                      name={item.icon as keyof typeof Ionicons.glyphMap}
                      size={24}
                      style={publicStyles.floatingIcon}
                    />
                  ) : (
                    <Feather
                      color={active ? colors.onPrimary : colors.foreground}
                      name={item.icon as keyof typeof Feather.glyphMap}
                      size={22}
                      style={publicStyles.floatingIcon}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </FadeInView>
      </View>
    </AppScreen>
  );
}

export const publicStyles = StyleSheet.create({
  content: {
    paddingBottom: 112,
  },
  floatingBar: {
    alignItems: "center",
    backgroundColor: colors.overlay.publicHeader,
    borderColor: colors.overlay.publicHeaderBorder,
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    padding: 8,
    shadowColor: colors.foreground,
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
  },
  floatingBarWrap: {
    alignSelf: "center",
    bottom: 18,
    position: "absolute",
  },
  floatingItem: {
    alignItems: "center",
    borderRadius: 22,
    height: 52,
    justifyContent: "center",
    overflow: "hidden",
    width: 52,
  },
  floatingItemActive: {
    backgroundColor: colors.inverse,
    shadowColor: colors.primary,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
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
  activeBottomRadial: {
    borderRadius: 999,
    bottom: -30,
    height: 78,
    position: "absolute",
    right: -30,
    width: 78,
  },
  floatingIcon: {
    zIndex: 2,
  },
  header: {
    backgroundColor: colors.secondary,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    height: 66,
    justifyContent: "center",
    overflow: "hidden",
    paddingHorizontal: 12,
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
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
  headerCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
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
  routeHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    height: 46,
  },
  routeTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 20,
    lineHeight: 26,
  },
  routeSubtitle: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
  },
  shell: {
    flex: 1,
  },
});
