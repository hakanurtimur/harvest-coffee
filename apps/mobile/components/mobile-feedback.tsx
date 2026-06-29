import { Feather } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMobileState } from "../lib/mobile-state";
import { BrandStamp, colors, fontFamilies } from "./ui";

const SNACKBAR_DURATION_MS = 3600;

export function MobileFeedbackOverlay() {
  const insets = useSafeAreaInsets();
  const {
    blockingMessage,
    clearFeedback,
    currentUser,
    feedback,
    isAuthenticated,
    lastSyncedAt,
    loadingData,
  } = useMobileState();
  const snackbarProgress = useRef(new Animated.Value(0)).current;
  const initialSyncLoading = isAuthenticated && loadingData && !lastSyncedAt;
  const loadingLabel =
    blockingMessage ??
    (initialSyncLoading
      ? currentUser?.role === "admin"
        ? "Loading admin workspace"
        : "Loading dealer workspace"
      : null);

  useEffect(() => {
    if (!feedback) {
      snackbarProgress.setValue(0);
      return;
    }

    Animated.timing(snackbarProgress, {
      duration: 220,
      toValue: 1,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(snackbarProgress, {
        duration: 180,
        toValue: 0,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) clearFeedback();
      });
    }, SNACKBAR_DURATION_MS);

    return () => clearTimeout(timer);
  }, [clearFeedback, feedback, snackbarProgress]);

  return (
    <>
      <Modal animationType="fade" transparent visible={Boolean(loadingLabel)}>
        <View style={feedbackStyles.loadingOverlay}>
          <View style={feedbackStyles.loadingCard}>
            <BrandStamp size={86} />
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={feedbackStyles.loadingTitle}>{loadingLabel}</Text>
            <Text style={feedbackStyles.loadingCopy}>Keeping your workspace in sync.</Text>
          </View>
        </View>
      </Modal>

      {feedback ? (
        <Animated.View
          pointerEvents="box-none"
          style={[
            feedbackStyles.snackbarWrap,
            { bottom: insets.bottom + 90 },
            {
              opacity: snackbarProgress,
              transform: [
                {
                  translateY: snackbarProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            onPress={clearFeedback}
            style={[
              feedbackStyles.snackbar,
              feedback.tone === "error" && feedbackStyles.snackbarError,
              feedback.tone === "info" && feedbackStyles.snackbarInfo,
            ]}
          >
            <View
              style={[
                feedbackStyles.snackbarIcon,
                feedback.tone === "error" && feedbackStyles.snackbarIconError,
                feedback.tone === "info" && feedbackStyles.snackbarIconInfo,
              ]}
            >
              <Feather
                color={feedback.tone === "error" ? colors.status.danger.color : feedback.tone === "info" ? colors.status.info.color : colors.status.success.color}
                name={feedback.tone === "error" ? "alert-circle" : feedback.tone === "info" ? "info" : "check-circle"}
                size={18}
              />
            </View>
            <View style={feedbackStyles.snackbarCopy}>
              <Text numberOfLines={1} style={feedbackStyles.snackbarTitle}>{feedback.title}</Text>
              {feedback.body ? <Text numberOfLines={2} style={feedbackStyles.snackbarBody}>{feedback.body}</Text> : null}
            </View>
            <Feather color={colors.muted} name="x" size={17} />
          </Pressable>
        </Animated.View>
      ) : null}
    </>
  );
}

const feedbackStyles = StyleSheet.create({
  loadingCard: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 12,
    padding: 22,
    shadowColor: colors.foreground,
    shadowOffset: { height: 18, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    width: 250,
    elevation: 16,
  },
  loadingCopy: {
    color: colors.muted,
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },
  loadingOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(247, 246, 244, 0.86)",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  loadingTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 16,
    textAlign: "center",
  },
  snackbar: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    shadowColor: colors.foreground,
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 12,
  },
  snackbarBody: {
    color: colors.muted,
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  snackbarCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  snackbarError: {
    borderColor: colors.status.danger.border,
  },
  snackbarIcon: {
    alignItems: "center",
    backgroundColor: colors.status.success.background,
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  snackbarIconError: {
    backgroundColor: colors.status.danger.background,
  },
  snackbarIconInfo: {
    backgroundColor: colors.status.info.background,
  },
  snackbarInfo: {
    borderColor: colors.status.info.border,
  },
  snackbarTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
  },
  snackbarWrap: {
    bottom: 90,
    left: 14,
    position: "absolute",
    right: 14,
    zIndex: 50,
  },
});
