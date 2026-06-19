import { router } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { AppScreen, colors, SplashState, styles } from "../components/ui";
import { useMobileState } from "../lib/mobile-state";

export default function BootScreen() {
  const { booting, currentUser, isAuthenticated } = useMobileState();

  useEffect(() => {
    if (booting) return;
    router.replace(isAuthenticated ? currentUser?.role === "admin" ? "/admin-dashboard" : "/products" : "/home");
  }, [booting, currentUser?.role, isAuthenticated]);

  if (booting) return <SplashState />;

  return (
    <AppScreen>
      <View style={styles.center}>
        <Text style={{ color: colors.primary, fontWeight: "900" }}>Opening workspace</Text>
      </View>
    </AppScreen>
  );
}
