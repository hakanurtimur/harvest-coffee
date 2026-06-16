import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { AppScreen, colors, PrimaryButton } from "../components/ui";
import { useMobileState } from "../lib/mobile-state";

export default function LoginScreen() {
  const { booting, isAuthenticated, loadingData, loginDealer } = useMobileState();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!booting && isAuthenticated) router.replace("/products");
  }, [booting, isAuthenticated]);

  const handleLogin = async () => {
    setSubmitting(true);
    try {
      await loginDealer();
      router.replace("/products");
    } catch (error) {
      Alert.alert("Login failed", error instanceof Error ? error.message : "Mock dealer login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScreen>
      <View style={loginStyles.wrap}>
        <View style={loginStyles.card}>
          <Text style={loginStyles.kicker}>Premium B2B Coffee Supply</Text>
          <Text style={loginStyles.title}>Harvest Coffee</Text>
          <Text style={loginStyles.copy}>
            Sign in with the mock dealer account to test products, orders, rentals, tracking, notifications, and profile flows.
          </Text>
          <View style={loginStyles.mockBox}>
            <Text style={loginStyles.mockLabel}>Mock dealer</Text>
            <Text style={loginStyles.mockValue}>dealer@example.com</Text>
          </View>
          <PrimaryButton disabled={submitting || loadingData} label={submitting || loadingData ? "Signing in..." : "Login as dealer"} onPress={handleLogin} />
        </View>
      </View>
    </AppScreen>
  );
}

const loginStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 16,
    padding: 18,
    width: "100%",
  },
  copy: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  kicker: {
    color: "#a65b1a",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  mockBox: {
    backgroundColor: "#fff",
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
    padding: 14,
  },
  mockLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  mockValue: {
    color: colors.foreground,
    fontSize: 17,
    fontWeight: "900",
  },
  title: {
    color: colors.foreground,
    fontSize: 38,
    fontWeight: "900",
  },
  wrap: {
    flex: 1,
    justifyContent: "center",
    padding: 18,
  },
});
