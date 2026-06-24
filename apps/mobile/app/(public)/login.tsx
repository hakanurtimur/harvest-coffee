import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Linking, StyleSheet, Text, View } from "react-native";
import { BrandStamp, colors, FadeInView, fontFamilies, OutlineButton, PrimaryButton } from "../../components/ui";
import { useMobileState } from "../../lib/mobile-state";

export default function LoginScreen() {
  const { booting, completeLiveLogin, currentUser, isAuthenticated, loadingData, loginAdmin, loginDealer } = useMobileState();
  const liveLoginEnabled = Boolean(process.env.EXPO_PUBLIC_HARVEST_API_URL);
  const [submitting, setSubmitting] = useState<"admin" | "dealer" | null>(null);
  const [liveSubmitting, setLiveSubmitting] = useState(false);

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

  useEffect(() => {
    if (!liveLoginEnabled) return;

    const handleUrl = (url: string | null) => {
      if (!url) return;
      const token = new URL(url).searchParams.get("access_token");
      if (!token) return;
      void completeLiveLogin(token).catch((error) => {
        Alert.alert("Login failed", error instanceof Error ? error.message : "Base44 Google login failed.");
      });
    };

    void Linking.getInitialURL().then(handleUrl);
    const subscription = Linking.addEventListener("url", (event) => handleUrl(event.url));
    return () => subscription.remove();
  }, [completeLiveLogin, liveLoginEnabled]);

  const handleLiveLogin = async () => {
    const endpoint = process.env.EXPO_PUBLIC_HARVEST_API_URL;
    if (!endpoint) return;
    setLiveSubmitting(true);
    try {
      const loginUrl = `${endpoint}?mode=google-login&from=${encodeURIComponent("harvestcoffee://login")}`;
      await Linking.openURL(loginUrl);
    } catch (error) {
      Alert.alert("Login failed", error instanceof Error ? error.message : "Base44 Google login failed.");
    } finally {
      setLiveSubmitting(false);
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
        <Text style={loginStyles.copy}>
          {liveLoginEnabled
            ? "Sign in with Google through Base44 to read live dealer/admin data through the secure web proxy."
            : "Sign in with mock dealer or admin accounts to test the native parity flows."}
        </Text>
        {liveLoginEnabled ? (
          <View style={loginStyles.liveBox}>
            <Text style={loginStyles.mockLabel}>Base44 Google</Text>
            <PrimaryButton disabled={liveSubmitting || loadingData} label={liveSubmitting || loadingData ? "Opening Google..." : "Continue with Google"} onPress={handleLiveLogin} />
          </View>
        ) : null}
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
  liveBox: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 12,
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
