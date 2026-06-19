import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { BrandStamp, colors, FadeInView, fontFamilies, OutlineButton, PrimaryButton } from "../../components/ui";
import { useMobileState } from "../../lib/mobile-state";

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
        <OutlineButton label="Back to public home" onPress={() => router.replace("/home")} />
      </FadeInView>
    </View>
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
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    lineHeight: 21,
  },
  kicker: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  mockBox: {
    backgroundColor: colors.secondary,
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
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
    textTransform: "uppercase",
  },
  mockValue: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 16,
  },
  stampWrap: {
    alignItems: "center",
    marginBottom: 2,
  },
  title: {
    color: colors.foreground,
    fontFamily: fontFamilies.bold,
    fontSize: 30,
  },
  wrap: {
    justifyContent: "center",
    padding: 12,
    paddingVertical: 28,
  },
});
