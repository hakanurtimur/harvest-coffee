import {
  orderStatusLabels,
  paymentMethodLabels,
  paymentStatusLabels,
  Product,
  Rental,
  RentalStatus,
  Order,
} from "@harvest/domain";
import { usePathname } from "expo-router";
import { ReactNode, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Defs, G, Path, Text as SvgText, TextPath } from "react-native-svg";

export const fallbackImage =
  "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80";

const rentalStatusLabels: Record<RentalStatus, string> = {
  active: "Active",
  cancelled: "Cancelled",
  expired: "Expired",
  upcoming: "Upcoming",
};

export function AppScreen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboardAvoider}>
        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function ScrollContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ animated: false, y: 0 });
  }, [pathname]);

  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={[styles.list, { paddingBottom: 96 + insets.bottom }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <AppScreen>
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>{label}</Text>
      </View>
    </AppScreen>
  );
}

export function SplashState() {
  const entrance = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, {
      delay: 80,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [entrance, pulse]);

  return (
    <AppScreen>
      <View style={styles.splashWrap}>
        <Animated.View
          style={[
            styles.splashContent,
            {
              opacity: entrance,
              transform: [
                {
                  translateY: entrance.interpolate({
                    inputRange: [0, 1],
                    outputRange: [14, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Animated.View
            style={{
              transform: [
                {
                  scale: pulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.035],
                  }),
                },
              ],
            }}
          >
            <BrandStamp size={132} />
          </Animated.View>
          <View style={styles.splashCopy}>
            <Text style={styles.splashTitle}>Harvest Coffee</Text>
            <Text style={styles.splashSubtitle}>Premium B2B Coffee Supply</Text>
          </View>
        </Animated.View>
      </View>
    </AppScreen>
  );
}

export function FadeInView({
  children,
  delay = 0,
  distance = 10,
  style,
}: {
  children: ReactNode;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      delay,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [delay, progress]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [distance, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

export function BrandStamp({ size = 96 }: { size?: number }) {
  return (
    <Svg accessibilityRole="image" height={size} viewBox="0 0 160 160" width={size}>
      <Defs>
        <Path d="M 34 80 A 46 46 0 1 1 126 80" id="stampTopArc" />
        <Path d="M 126 80 A 46 46 0 1 1 34 80" id="stampBottomArc" />
      </Defs>
      <Circle cx="80" cy="80" fill="transparent" r="58" stroke={stampColor} strokeOpacity={0.5} strokeWidth="1.4" />
      <Circle cx="80" cy="80" fill="transparent" r="36" stroke={stampColor} strokeOpacity={0.32} strokeWidth="1.1" />
      <SvgText fill={stampColor} fontFamily={fontFamilies.extraBold} fontSize="8.7" fontWeight="900" letterSpacing="3.1">
        <TextPath href="#stampTopArc" startOffset="50%" textAnchor="middle">
          HARVEST COFFEE
        </TextPath>
      </SvgText>
      <SvgText fill={stampColor} fontFamily={fontFamilies.extraBold} fontSize="7" fontWeight="900" letterSpacing="2.3">
        <TextPath href="#stampBottomArc" startOffset="50%" textAnchor="middle">
          PREMIUM B2B SUPPLY
        </TextPath>
      </SvgText>
      <G opacity={0.48} stroke={stampColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
        <Path d="M80 101 C79 91 80 80 84 66" fill="none" />
        <Path d="M84 70 C75 69 68 63 66 54 C76 54 83 59 84 70Z" fill="none" />
        <Path d="M83 81 C94 79 102 72 104 62 C92 62 84 70 83 81Z" fill="none" />
        <Path d="M80 91 C69 90 61 83 59 73 C70 73 78 80 80 91Z" fill="none" />
        <Path d="M87 91 C96 91 104 86 108 78 C98 77 91 82 87 91Z" fill="none" />
        <Path d="M76 105 C78 96 70 90 62 91 C64 99 68 103 76 105Z" fill="none" />
      </G>
      <Circle cx="80" cy="80" fill={stampColor} opacity={0.12} r="2.2" />
    </Svg>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return <FadeInView style={styles.card}>{children}</FadeInView>;
}

export function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <FadeInView distance={6} style={styles.sectionHeader}>
      <Text style={styles.kicker}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </FadeInView>
  );
}

export function EmptyState({ body, title }: { body: string; title: string }) {
  return (
    <FadeInView style={styles.empty}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.description}>{body}</Text>
    </FadeInView>
  );
}

export function StatusBanner({
  body,
  title,
  tone = "info",
}: {
  body?: string;
  title: string;
  tone?: "error" | "info" | "success";
}) {
  return (
    <FadeInView distance={5} style={[styles.statusBanner, tone === "error" && styles.statusBannerError, tone === "success" && styles.statusBannerSuccess]}>
      <Text style={[styles.statusTitle, tone === "error" && styles.statusTitleError]}>{title}</Text>
      {body ? <Text style={styles.statusBody}>{body}</Text> : null}
    </FadeInView>
  );
}

export function ConfirmDialog({
  body,
  confirmLabel = "Confirm",
  confirming,
  destructive,
  onCancel,
  onConfirm,
  title,
  visible,
}: {
  body: string;
  confirmLabel?: string;
  confirming?: boolean;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  visible: boolean;
}) {
  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <View style={styles.confirmOverlay}>
        <FadeInView distance={8} style={styles.confirmCard}>
          <Text style={styles.confirmTitle}>{title}</Text>
          <Text style={styles.confirmBody}>{body}</Text>
          <View style={styles.confirmActions}>
            <Pressable
              accessibilityRole="button"
              disabled={confirming}
              onPress={onCancel}
              style={({ pressed }) => [styles.confirmCancelButton, pressed && !confirming && styles.pressed, confirming && styles.disabled]}
            >
              <Text style={styles.confirmCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={confirming}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.confirmPrimaryButton,
                destructive && styles.confirmDangerButton,
                pressed && !confirming && styles.pressed,
                confirming && styles.disabled,
              ]}
            >
              <Text style={styles.confirmPrimaryText}>{confirming ? "Working..." : confirmLabel}</Text>
            </Pressable>
          </View>
        </FadeInView>
      </View>
    </Modal>
  );
}

export function Badge({ label }: { label: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

export function PrimaryButton({
  disabled,
  label,
  onPress,
}: {
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.primaryButton, pressed && !disabled && styles.pressed, disabled && styles.disabled]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function OutlineButton({
  disabled,
  label,
  onPress,
}: {
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.outlineButton, pressed && !disabled && styles.pressed, disabled && styles.disabled]}
    >
      <Text style={styles.outlineButtonText}>{label}</Text>
    </Pressable>
  );
}

export function Field(props: TextInputProps) {
  return (
    <TextInput
      autoCorrect={props.autoCorrect ?? false}
      placeholderTextColor={colors.muted}
      selectionColor={colors.primary}
      {...props}
      style={[styles.input, props.multiline && styles.textArea, props.style]}
    />
  );
}

export function ProductCard({
  onDecrease,
  onIncrease,
  product,
  quantity,
}: {
  onDecrease: () => void;
  onIncrease: () => void;
  product: Product;
  quantity: number;
}) {
  const disabled = product.stockStatus === "out_of_stock";
  const subtotal = quantity * product.price;

  return (
    <FadeInView style={styles.productCard}>
      <View style={styles.productImageFrame}>
        <Image accessibilityLabel={product.name} source={{ uri: product.imageUrl || fallbackImage }} style={styles.productImage} />
      </View>
      <View style={styles.productInfo}>
        <View style={styles.productTitleRow}>
          <View style={styles.productCopy}>
            <Text style={styles.category}>{product.category}</Text>
            <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
          </View>
          <Text style={styles.price}>{formatCurrency(product.price)}</Text>
        </View>
        <Text style={styles.description} numberOfLines={1}>{product.description}</Text>
        <View style={styles.productMetaRow}>
          <View style={styles.productMeta}>
            <View style={[styles.stockPill, disabled && styles.stockPillMuted]}>
              <Text style={[styles.stock, disabled && styles.stockMuted]}>{product.stockStatus.replaceAll("_", " ")}</Text>
            </View>
            <Text style={styles.muted}>{product.weight || `${product.stockQuantity} in stock`}</Text>
          </View>
          <View style={styles.productAction}>
            <Text style={quantity > 0 ? styles.lineTotal : styles.addHint}>
              {quantity > 0 ? formatCurrency(subtotal) : "Quick add"}
            </Text>
            <View style={styles.quantityStepper}>
              <Pressable
                accessibilityLabel={`Decrease ${product.name} quantity`}
                accessibilityRole="button"
                accessibilityState={{ disabled: quantity === 0 }}
                disabled={quantity === 0}
                style={[styles.quantityButton, quantity === 0 && styles.disabled]}
                onPress={onDecrease}
              >
                <Text style={styles.quantityText}>-</Text>
              </Pressable>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <Pressable
                accessibilityLabel={`Increase ${product.name} quantity`}
                accessibilityRole="button"
                accessibilityState={{ disabled }}
                disabled={disabled}
                style={[styles.quantityButton, disabled && styles.disabled]}
                onPress={onIncrease}
              >
                <Text style={styles.quantityText}>+</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </FadeInView>
  );
}

export function OrderCard({ order, onPress }: { order: Order; onPress: () => void }) {
  return (
    <FadeInView>
      <Pressable accessibilityLabel={`Open order ${order.orderNumber}`} accessibilityRole="button" style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.cardTitle}>{order.orderNumber}</Text>
            <Text style={styles.muted}>{formatDate(order.createdAt)}</Text>
          </View>
          <Text style={styles.total}>{formatCurrency(order.totalAmount)}</Text>
        </View>
        <View style={styles.badgeRow}>
          <Badge label={orderStatusLabels[order.status]} />
          <Badge label={paymentStatusLabels[order.paymentStatus]} />
        </View>
        <Text style={styles.description} numberOfLines={1}>
          {order.items.map((item) => `${item.quantity}x ${item.productName}`).join(", ")}
        </Text>
      </Pressable>
    </FadeInView>
  );
}

export function RentalCard({ rental, onPress }: { rental: Rental; onPress?: () => void }) {
  return (
    <FadeInView>
      <Pressable
        accessibilityLabel={`Rental ${rental.productName}`}
        accessibilityRole={onPress ? "button" : undefined}
        disabled={!onPress}
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && onPress && styles.pressed]}
      >
        <View style={styles.rowBetween}>
          <View style={styles.flex}>
            <Text style={styles.cardTitle}>{rental.productName}</Text>
            <Text style={styles.muted}>{rental.customerName || rental.customerEmail}</Text>
          </View>
          <Badge label={rentalStatusLabels[rental.status]} />
        </View>
        <Metric label="Rental dates" value={`${formatDate(rental.startDate)} - ${formatDate(rental.endDate)}`} />
        {rental.notes ? <Text style={styles.description}>{rental.notes}</Text> : null}
      </Pressable>
    </FadeInView>
  );
}

export function OrderDetailContent({ order }: { order: Order }) {
  return (
    <>
      <Card>
        <View style={styles.badgeRow}>
          <Badge label={orderStatusLabels[order.status]} />
          <Badge label={paymentStatusLabels[order.paymentStatus]} />
          <Badge label={paymentMethodLabels[order.paymentMethod]} />
        </View>
        <Metric label="Created" value={formatDate(order.createdAt)} />
        <Metric label="Total" value={formatCurrency(order.totalAmount)} />
        <Metric label="Delivery address" value={order.deliveryAddress} />
        {order.trackingNumber ? <Metric label="Tracking" value={order.trackingNumber} /> : null}
        {order.estimatedDeliveryDate ? <Metric label="Estimated delivery" value={formatDate(order.estimatedDeliveryDate)} /> : null}
        {order.notes ? <Metric label="Notes" value={order.notes} /> : null}
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Items</Text>
        {order.items.map((item) => (
          <View key={`${order.id}-${item.productId}`} style={styles.itemRow}>
            <View style={styles.flex}>
              <Text style={styles.name}>{item.productName}</Text>
              <Text style={styles.muted}>{item.quantity} x {formatCurrency(item.price)}</Text>
            </View>
            <Text style={styles.price}>{formatCurrency(item.subtotal)}</Text>
          </View>
        ))}
      </Card>
    </>
  );
}

export function formatCurrency(value: number) {
  return `GBP ${value.toFixed(2)}`;
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

export function initials(name?: string) {
  return (name || "Dealer")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export const colors = {
  background: "#f7f6f4",
  border: "#e5e0da",
  borderWarm: "#d9c7b5",
  chart: {
    amber: "#d88b2a",
    areaFill: "rgba(91, 62, 45, 0.085)",
    axisFrame: "rgba(125, 96, 72, 0.16)",
    green: "#4f8f58",
    gridHidden: "rgba(125, 96, 72, 0)",
    gridLine: "rgba(125, 96, 72, 0.15)",
    guideActive: "rgba(154, 84, 28, 0.62)",
    guideIdle: "rgba(154, 84, 28, 0.40)",
    guideSoftActive: "rgba(154, 84, 28, 0.34)",
    guideSoftIdle: "rgba(154, 84, 28, 0.22)",
    muted: "#b89c82",
    pointSurface: "#fffaf4",
    primarySoft: "#d89962",
    primaryTint: "rgba(91, 62, 45, 0.07)",
    purple: "#8361c5",
    series: ["#4d382b", "#d88b2a", "#4f8f58", "#8361c5", "#b89c82", "#9a5a12"],
    tooltipForeground: "#fffaf4",
    tooltipMuted: "rgba(255,255,255,0.68)",
    tooltipSurface: "#201a16",
    xAxisFrame: "rgba(125, 96, 72, 0.20)",
  },
  foreground: "#161311",
  inverse: "#181715",
  metric: {
    blue: { background: "#eef3ff", color: "#31599d" },
    green: { background: "#eef7e9", color: "#2f6b38" },
    orange: { background: "#fff4df", color: "#9a5a12" },
    purple: { background: "#f4efff", color: "#6d4ba8" },
  },
  muted: "#6f6963",
  navigation: {
    activeGradient: ["#24211d", "#171615", "#241d18"],
    highlightGradient: ["rgba(255, 245, 232, 0.5)", "rgba(255, 245, 232, 0.16)", "rgba(255, 245, 232, 0)"],
    highlightGradientStrong: ["rgba(255, 245, 232, 0.55)", "rgba(255, 245, 232, 0.18)", "rgba(255, 245, 232, 0)"],
    warmGlow: ["rgba(117, 89, 68, 0.7)", "rgba(117, 89, 68, 0.22)", "rgba(117, 89, 68, 0)"],
    warmGlowStrong: ["rgba(117, 89, 68, 0.72)", "rgba(117, 89, 68, 0.24)", "rgba(117, 89, 68, 0)"],
  },
  overlay: {
    heroBorder: "rgba(255, 250, 244, 0.72)",
    heroScrim: "rgba(16, 8, 4, 0.64)",
    heroText: "rgba(255, 250, 244, 0.88)",
    heroTextMuted: "rgba(255, 255, 255, 0.72)",
    publicHeader: "rgba(255, 255, 255, 0.94)",
    publicHeaderBorder: "rgba(229, 224, 218, 0.92)",
    scrim: "rgba(25, 22, 19, 0.38)",
    shellScrim: "rgba(17, 15, 13, 0.34)",
  },
  onPrimary: "#ffffff",
  primary: "#4d382b",
  progressTrack: "#eadccb",
  secondary: "#ffffff",
  status: {
    danger: { background: "#fff1ee", border: "#edb9ad", color: "#9a3412" },
    info: { background: "#eef3ff", border: "#cfe0f5", color: "#31599d" },
    neutral: { background: "#f1efec", border: "#e5e0da", color: "#6f6963" },
    success: { background: "#eef7e9", border: "#cbdcab", color: "#2f6b38" },
    warning: { background: "#fff4df", border: "#e2c7aa", color: "#9a5a12" },
  },
  surfaceMuted: "#f1efec",
  surfaceSoft: "#f5efe7",
  surfaceSubtle: "#f4f2ef",
  surfaceRaised: "#fbfaf8",
  surfaceWarm: "#f4ede4",
  textSubtle: "#5f5a54",
};

export const fontFamilies = {
  bold: "PlusJakartaSans_700Bold",
  extraBold: "PlusJakartaSans_800ExtraBold",
  medium: "PlusJakartaSans_500Medium",
  regular: "PlusJakartaSans_400Regular",
  semiBold: "PlusJakartaSans_600SemiBold",
};

const stampColor = colors.primary;

export const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  badgeText: {
    color: colors.primary,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
  },
  card: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  cardCopy: {
    gap: 8,
    padding: 12,
  },
  cardTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 16,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },
  confirmBody: {
    color: colors.muted,
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  confirmCancelButton: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    minWidth: 96,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  confirmCancelText: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
  },
  confirmCard: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
    maxWidth: 360,
    padding: 16,
    shadowColor: colors.foreground,
    shadowOffset: { height: 14, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    width: "88%",
    elevation: 12,
  },
  confirmDangerButton: {
    backgroundColor: colors.status.danger.color,
  },
  confirmOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(21, 18, 15, 0.38)",
    flex: 1,
    justifyContent: "center",
    padding: 22,
  },
  confirmPrimaryButton: {
    alignItems: "center",
    backgroundColor: colors.foreground,
    borderRadius: 12,
    justifyContent: "center",
    minWidth: 104,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  confirmPrimaryText: {
    color: colors.onPrimary,
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
  },
  confirmTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 18,
  },
  category: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 11,
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  center: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  description: {
    color: colors.textSubtle,
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 19,
  },
  disabled: {
    opacity: 0.42,
  },
  empty: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 18,
  },
  flex: {
    flex: 1,
  },
  input: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.foreground,
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  itemRow: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingTop: 12,
  },
  keyboardAvoider: {
    flex: 1,
  },
  kicker: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  list: {
    gap: 8,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 86,
  },
  lineTotal: {
    color: colors.primary,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "right",
  },
  addHint: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "right",
  },
  loadingText: {
    color: colors.primary,
    fontFamily: fontFamilies.semiBold,
    marginTop: 14,
  },
  metric: {
    gap: 3,
  },
  metricLabel: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
    textTransform: "uppercase",
  },
  metricValue: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 16,
  },
  muted: {
    color: colors.muted,
    fontFamily: fontFamilies.regular,
    fontSize: 13,
  },
  name: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 15,
  },
  outlineButton: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  outlineButtonText: {
    color: colors.primary,
    fontFamily: fontFamilies.semiBold,
  },
  price: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 15,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
  },
  primaryButtonText: {
    color: colors.onPrimary,
    fontFamily: fontFamilies.semiBold,
  },
  productCard: {
    alignItems: "flex-start",
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 102,
    padding: 10,
    shadowColor: colors.foreground,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.035,
    shadowRadius: 12,
    elevation: 2,
  },
  productImageFrame: {
    alignItems: "center",
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 74,
    justifyContent: "center",
    overflow: "hidden",
    width: 74,
  },
  productImage: {
    height: "100%",
    resizeMode: "cover",
    width: "100%",
  },
  productAction: {
    alignItems: "flex-end",
    gap: 5,
    minWidth: 96,
    minHeight: 53,
    justifyContent: "flex-end",
  },
  productCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  productFooter: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginTop: 2,
    padding: 10,
  },
  productInfo: {
    flex: 1,
    gap: 7,
    minWidth: 0,
  },
  productMeta: {
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
    flexWrap: "wrap",
    gap: 7,
  },
  productMetaRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  productTitleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  quantityStepper: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    padding: 2,
    width: 96,
  },
  quantityButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 11,
    height: 29,
    justifyContent: "center",
    width: 29,
  },
  quantityText: {
    color: colors.onPrimary,
    fontFamily: fontFamilies.bold,
    fontSize: 20,
    lineHeight: 22,
  },
  quantityValue: {
    color: colors.foreground,
    fontFamily: fontFamilies.bold,
    fontSize: 15,
    minWidth: 18,
    textAlign: "center",
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 22,
  },
  stock: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
    textTransform: "capitalize",
  },
  stockMuted: {
    color: colors.status.neutral.color,
  },
  stockPill: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  stockPillMuted: {
    backgroundColor: colors.status.neutral.background,
  },
  statusBanner: {
    backgroundColor: colors.status.warning.background,
    borderColor: colors.status.warning.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statusBannerError: {
    backgroundColor: colors.status.danger.background,
    borderColor: colors.status.danger.border,
  },
  statusBannerSuccess: {
    backgroundColor: colors.status.success.background,
    borderColor: colors.status.success.border,
  },
  statusBody: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  statusTitle: {
    color: colors.primary,
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
  },
  statusTitleError: {
    color: colors.status.danger.color,
  },
  splashContent: {
    alignItems: "center",
    gap: 18,
  },
  splashCopy: {
    alignItems: "center",
    gap: 5,
  },
  splashSubtitle: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  splashTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 30,
  },
  splashWrap: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  textArea: {
    minHeight: 68,
    textAlignVertical: "top",
  },
  total: {
    color: colors.primary,
    fontFamily: fontFamilies.semiBold,
    fontSize: 17,
  },
});
