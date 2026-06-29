import * as ExpoLinking from "expo-linking";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { BrandStamp, colors, FadeInView, fontFamilies, OutlineButton, PrimaryButton, StatusBanner } from "../../components/ui";
import { getHarvestProxyEndpoint, getHarvestWebOrigin } from "../../lib/live-api";
import { useMobileState } from "../../lib/mobile-state";

const handledLoginUrls = new Set<string>();

export default function LoginScreen() {
  const { booting, completeLiveLogin, currentUser, isAuthenticated, loadingData } = useMobileState();
  const harvestProxyEndpoint = getHarvestProxyEndpoint();
  const liveLoginEnabled = Boolean(harvestProxyEndpoint);
  const [liveSubmitting, setLiveSubmitting] = useState(false);
  const [message, setMessage] = useState<{ body?: string; title: string } | null>(null);

  useEffect(() => {
    if (!booting && isAuthenticated) router.replace(currentUser?.role === "admin" ? "/admin-dashboard" : "/products");
  }, [booting, currentUser?.role, isAuthenticated]);

  useEffect(() => {
    if (!liveLoginEnabled) return;

    const handleUrl = (url: string | null) => {
      if (!url) return;
      if (handledLoginUrls.has(url)) return;
      handledLoginUrls.add(url);
      const params = getUrlParams(url);
      const error = params.get("error");
      if (error) {
        setMessage({ body: error, title: "Login failed" });
        return;
      }
      const token = params.get("access_token");
      if (!token) return;
      setMessage(null);
      void completeLiveLogin(token).catch((error) => {
        setMessage({ body: error instanceof Error ? error.message : "Base44 Google login failed.", title: "Login failed" });
      });
    };

    void Linking.getInitialURL().then(handleUrl);
    const subscription = Linking.addEventListener("url", (event) => handleUrl(event.url));
    return () => subscription.remove();
  }, [completeLiveLogin, liveLoginEnabled]);

  const handleLiveLogin = async () => {
    const endpoint = getHarvestProxyEndpoint();
    const webOrigin = getHarvestWebOrigin(endpoint);
    if (!endpoint || !webOrigin) return;
    setLiveSubmitting(true);
    setMessage(null);
    try {
      const bridgeUrl = new URL("/mobile-auth/callback", webOrigin);
      bridgeUrl.searchParams.set("return_to", ExpoLinking.createURL("/login"));
      const loginUrl = new URL(endpoint);
      loginUrl.searchParams.set("mode", "google-login");
      loginUrl.searchParams.set("from", bridgeUrl.toString());
      await Linking.openURL(loginUrl.toString());
    } catch (error) {
      setMessage({ body: error instanceof Error ? error.message : "Base44 Google login failed.", title: "Login failed" });
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
            : "Live API configuration is required before opening dealer or admin data."}
        </Text>
        {message ? <StatusBanner body={message.body} title={message.title} tone="error" /> : null}
        {!liveLoginEnabled ? (
          <StatusBanner
            body="Set EXPO_PUBLIC_HARVEST_API_URL to the Harvest web proxy endpoint, then restart Expo."
            title="Live API is not configured"
            tone="info"
          />
        ) : null}
        {liveLoginEnabled ? (
          <View style={loginStyles.liveBox}>
            <Text style={loginStyles.accountLabel}>Base44 Google</Text>
            <PrimaryButton disabled={liveSubmitting || loadingData} label={liveSubmitting || loadingData ? "Opening Google..." : "Continue with Google"} onPress={handleLiveLogin} />
          </View>
        ) : null}
        <OutlineButton label="Back to public home" onPress={() => router.replace("/home")} />
      </FadeInView>
    </View>
  );
}

function getUrlParams(url: string) {
  try {
    return new URL(url).searchParams;
  } catch {
    const [, query = ""] = url.split("?");
    return new URLSearchParams(query);
  }
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
  liveBox: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  accountLabel: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
    textTransform: "uppercase",
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
