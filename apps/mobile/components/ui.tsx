import {
  orderStatusLabels,
  paymentMethodLabels,
  paymentStatusLabels,
  Product,
  Rental,
  RentalStatus,
  Order,
} from "@harvest/domain";
import { ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
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
  return <SafeAreaView style={styles.screen}>{children}</SafeAreaView>;
}

export function ScrollContent({ children }: { children: ReactNode }) {
  return <ScrollView contentContainerStyle={styles.list}>{children}</ScrollView>;
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

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.kicker}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export function EmptyState({ body, title }: { body: string; title: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.description}>{body}</Text>
    </View>
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
    <Pressable disabled={disabled} onPress={onPress} style={[styles.primaryButton, disabled && styles.disabled]}>
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
    <Pressable disabled={disabled} onPress={onPress} style={[styles.outlineButton, disabled && styles.disabled]}>
      <Text style={styles.outlineButtonText}>{label}</Text>
    </Pressable>
  );
}

export function Field(props: TextInputProps) {
  return <TextInput placeholderTextColor={colors.muted} {...props} style={[styles.input, props.multiline && styles.textArea, props.style]} />;
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
    <View style={styles.productCard}>
      <Image source={{ uri: product.imageUrl || fallbackImage }} style={styles.productImage} />
      <View style={styles.cardCopy}>
        <View style={styles.rowBetween}>
          <Text style={styles.category}>{product.category}</Text>
          <Text style={styles.stock}>{product.stockStatus.replaceAll("_", " ")}</Text>
        </View>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.description}>{product.description}</Text>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.price}>{formatCurrency(product.price)}</Text>
            <Text style={styles.muted}>{product.weight || `${product.stockQuantity} in stock`}</Text>
          </View>
          <View style={styles.quantity}>
            <Pressable disabled={quantity === 0} style={[styles.quantityButton, quantity === 0 && styles.disabled]} onPress={onDecrease}>
              <Text style={styles.quantityText}>-</Text>
            </Pressable>
            <Text style={styles.quantityValue}>{quantity}</Text>
            <Pressable disabled={disabled} style={[styles.quantityButton, disabled && styles.disabled]} onPress={onIncrease}>
              <Text style={styles.quantityText}>+</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

export function OrderCard({ order, onPress }: { order: Order; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
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
  );
}

export function RentalCard({ rental, onPress }: { rental: Rental; onPress?: () => void }) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={styles.card}>
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
    height: 132,
    width: "100%",
  },
  quantity: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  quantityButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 10,
    height: 36,
    justifyContent: "center",
    width: 36,
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
    color: "#7a6b5d",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "capitalize",
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
