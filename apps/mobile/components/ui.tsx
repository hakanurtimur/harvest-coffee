import {
  orderStatusLabels,
  paymentMethodLabels,
  paymentStatusLabels,
  Product,
  Rental,
  RentalStatus,
  Order,
} from "@harvest/domain";
import { ReactNode, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Pressable,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

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
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboardAvoider}>
        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function ScrollContent({ children }: { children: ReactNode }) {
  return (
    <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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
  const outerSize = size;
  const innerSize = Math.round(size * 0.58);

  return (
    <View style={[styles.stamp, { height: outerSize, width: outerSize }]}>
      <View style={[styles.stampInner, { height: innerSize, width: innerSize }]}>
        <Text style={styles.stampIcon}>HC</Text>
      </View>
      <Text style={styles.stampTop}>Harvest Coffee</Text>
      <Text style={styles.stampBottom}>Premium B2B Supply</Text>
    </View>
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
  const disabled = product.stockStatus === "out_of_stock" || product.stockQuantity === 0;

  return (
    <FadeInView style={styles.productCard}>
      <Image accessibilityLabel={product.name} source={{ uri: product.imageUrl || fallbackImage }} style={styles.productImage} />
      <View style={styles.cardCopy}>
        <View style={styles.rowBetween}>
          <Text style={styles.category}>{product.category}</Text>
          <View style={[styles.stockPill, disabled && styles.stockPillMuted]}>
            <Text style={[styles.stock, disabled && styles.stockMuted]}>{product.stockStatus.replaceAll("_", " ")}</Text>
          </View>
        </View>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.description}>{product.description}</Text>
        <View style={styles.productFooter}>
          <View>
            <Text style={styles.price}>{formatCurrency(product.price)}</Text>
            <Text style={styles.muted}>{product.weight || `${product.stockQuantity} in stock`}</Text>
          </View>
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
        <Metric label="Total" value={formatCurrency(order.totalAmount)} />
        <Metric label="Delivery address" value={order.deliveryAddress} />
        {order.trackingNumber ? <Metric label="Tracking" value={order.trackingNumber} /> : null}
        {order.estimatedDeliveryDate ? <Metric label="Estimated delivery" value={formatDate(order.estimatedDeliveryDate)} /> : null}
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
  background: "#f5ecdf",
  border: "#e2d0bd",
  foreground: "#2a1a12",
  muted: "#8b7b6c",
  primary: "#6a3814",
  secondary: "#fffaf4",
};

export const styles = StyleSheet.create({
  badge: {
    backgroundColor: "#f3e8da",
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
    fontSize: 12,
    fontWeight: "800",
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
    fontSize: 17,
    fontWeight: "900",
  },
  category: {
    color: "#a65b1a",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  center: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  description: {
    color: "#615447",
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
    backgroundColor: "#fff",
    borderColor: "#dcc9b7",
    borderRadius: 12,
    borderWidth: 1,
    color: colors.foreground,
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
    color: "#a65b1a",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  list: {
    gap: 10,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 86,
  },
  loadingText: {
    color: colors.primary,
    fontWeight: "800",
    marginTop: 14,
  },
  metric: {
    gap: 3,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  metricValue: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: "800",
  },
  muted: {
    color: colors.muted,
    fontSize: 13,
  },
  name: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: "900",
  },
  outlineButton: {
    alignItems: "center",
    borderColor: "#d9c7b5",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  outlineButtonText: {
    color: colors.primary,
    fontWeight: "900",
  },
  price: {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: "900",
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
    color: "#fff",
    fontWeight: "900",
  },
  productCard: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  productImage: {
    backgroundColor: colors.border,
    height: 126,
    width: "100%",
  },
  productFooter: {
    alignItems: "center",
    backgroundColor: "#fbf2e8",
    borderColor: "#eadccb",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginTop: 2,
    padding: 10,
  },
  quantityStepper: {
    alignItems: "center",
    backgroundColor: "#fffaf4",
    borderColor: "#eadccb",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    padding: 3,
  },
  quantityButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 10,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  quantityText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },
  quantityValue: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: "900",
    minWidth: 20,
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
    fontSize: 24,
    fontWeight: "900",
  },
  stock: {
    color: "#704118",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  stockMuted: {
    color: "#7a6b5d",
  },
  stockPill: {
    backgroundColor: "#f4e3cf",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  stockPillMuted: {
    backgroundColor: "#eee6dc",
  },
  statusBanner: {
    backgroundColor: "#fff4df",
    borderColor: "#e2c7aa",
    borderRadius: 12,
    borderWidth: 1,
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statusBannerError: {
    backgroundColor: "#fff1ee",
    borderColor: "#edb9ad",
  },
  statusBannerSuccess: {
    backgroundColor: "#f1f7e9",
    borderColor: "#cbdcab",
  },
  statusBody: {
    color: "#6f5c4c",
    fontSize: 12,
    lineHeight: 16,
  },
  statusTitle: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900",
  },
  statusTitleError: {
    color: "#9a3412",
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
    color: "#a65b1a",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  splashTitle: {
    color: colors.foreground,
    fontSize: 34,
    fontWeight: "900",
  },
  splashWrap: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  stamp: {
    alignItems: "center",
    borderColor: "rgba(106, 56, 20, 0.38)",
    borderRadius: 999,
    borderWidth: 1.5,
    justifyContent: "center",
    position: "relative",
  },
  stampBottom: {
    bottom: 15,
    color: "rgba(106, 56, 20, 0.58)",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 1.5,
    position: "absolute",
    textTransform: "uppercase",
  },
  stampIcon: {
    color: "rgba(106, 56, 20, 0.72)",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  stampInner: {
    alignItems: "center",
    borderColor: "rgba(106, 56, 20, 0.24)",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
  },
  stampTop: {
    color: "rgba(106, 56, 20, 0.62)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.7,
    position: "absolute",
    textTransform: "uppercase",
    top: 14,
  },
  textArea: {
    minHeight: 68,
    textAlignVertical: "top",
  },
  total: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "900",
  },
});
