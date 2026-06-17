import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { AppScreen, BrandStamp, colors, FadeInView, PrimaryButton } from "../components/ui";
import { useMobileState } from "../lib/mobile-state";

export default function LoginScreen() {
  const { booting, currentUser, isAuthenticated, loadingData, loginAdmin, loginDealer } = useMobileState();
  const [submitting, setSubmitting] = useState<"admin" | "dealer" | null>(null);

  useEffect(() => {
    if (!booting && isAuthenticated) router.replace(currentUser?.role === "admin" ? "/admin-dashboard" : "/products");
  }, [booting, currentUser?.role, isAuthenticated]);

  const handleDealerLogin = async () => {
    setSubmitting("dealer");
    try {
      await loginDealer();
      router.replace("/products");
    } catch (error) {
      Alert.alert("Login failed", error instanceof Error ? error.message : "Mock dealer login failed.");
    } finally {
      setSubmitting(null);
    }
  };

  const handleAdminLogin = async () => {
    setSubmitting("admin");
    try {
      await loginAdmin();
      router.replace("/admin-dashboard");
    } catch (error) {
      Alert.alert("Login failed", error instanceof Error ? error.message : "Mock admin login failed.");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <AppScreen>
      <View style={loginStyles.wrap}>
        <FadeInView style={loginStyles.card}>
          <View style={loginStyles.stampWrap}>
            <BrandStamp size={86} />
          </View>
          <Text style={loginStyles.kicker}>Premium B2B Coffee Supply</Text>
          <Text style={loginStyles.title}>Harvest Coffee</Text>
          <Text style={loginStyles.copy}>Sign in with mock dealer or admin accounts to test the native parity flows.</Text>
          <View style={loginStyles.mockGrid}>
            <View style={loginStyles.mockBox}>
              <Text style={loginStyles.mockLabel}>Mock dealer</Text>
              <Text style={loginStyles.mockValue}>dealer@example.com</Text>
              <PrimaryButton disabled={Boolean(submitting) || loadingData} label={submitting === "dealer" || loadingData ? "Signing in..." : "Login as dealer"} onPress={handleDealerLogin} />
            </View>
            <View style={loginStyles.mockBox}>
              <Text style={loginStyles.mockLabel}>Mock admin</Text>
              <Text style={loginStyles.mockValue}>ops@example.com</Text>
              <PrimaryButton disabled={Boolean(submitting) || loadingData} label={submitting === "admin" || loadingData ? "Signing in..." : "Login as admin"} onPress={handleAdminLogin} />
            </View>
          </View>
        </FadeInView>
      </View>
    </AppScreen>
  );
}

const loginStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
    padding: 16,
    width: "100%",
  },
  copy: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 21,
  },
  kicker: {
    color: "#a65b1a",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  mockBox: {
    backgroundColor: "#fff",
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  mockGrid: {
    gap: 10,
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
  stampWrap: {
    alignItems: "center",
    marginBottom: 2,
  },
  title: {
    color: colors.foreground,
    fontSize: 34,
    fontWeight: "900",
  },
  wrap: {
    flex: 1,
    justifyContent: "center",
    padding: 12,
  },
});
