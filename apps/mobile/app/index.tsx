import { createMockHarvestApi } from "@harvest/api";
import {
  calculateOrderItems,
  calculateOrderTotal,
  Order,
  PaymentMethod,
  paymentMethodLabels,
  paymentStatusLabels,
  Product,
  User,
} from "@harvest/domain";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const api = createMockHarvestApi();
const fallbackImage =
  "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80";

type Tab = "products" | "orders" | "profile";

export default function MobileDealerApp() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer");
  const [activeTab, setActiveTab] = useState<Tab>("products");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [addressTitle, setAddressTitle] = useState("");
  const [addressText, setAddressText] = useState("");

  const cartItems = useMemo(() => calculateOrderItems(products, quantities), [products, quantities]);
  const cartTotal = useMemo(() => calculateOrderTotal(cartItems), [cartItems]);
  const selectedOrder = orders.find((order) => order.id === selectedOrderId) ?? null;

  useEffect(() => {
    let mounted = true;

    async function load() {
      const users = await api.getUsers();
      const dealer = users.find((user) => user.role === "dealer") ?? (await api.getCurrentUser());
      const productRows = await api.getProducts();
      const orderRows = dealer ? await api.getMyOrders(dealer.email) : [];

      if (!mounted) return;
      setCurrentUser(dealer);
      setProducts(productRows);
      setOrders(orderRows);
      setDeliveryAddress(dealer?.addresses[0]?.address ?? "");
      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const updateQuantity = (productId: string, delta: number) => {
    setQuantities((current) => {
      const nextQuantity = Math.max(0, (current[productId] ?? 0) + delta);
      const next = { ...current };
      if (nextQuantity === 0) delete next[productId];
      else next[productId] = nextQuantity;
      return next;
    });
  };

  const submitOrder = async () => {
    if (!currentUser || cartItems.length === 0 || savingOrder) return;
    if (deliveryAddress.trim().length < 3) {
      Alert.alert("Delivery address required", "Please add a delivery address before placing the order.");
      return;
    }

    setSavingOrder(true);
    try {
      const order = await api.createOrder({
        customerEmail: currentUser.email,
        customerName: currentUser.companyName || currentUser.fullName,
        deliveryAddress: deliveryAddress.trim(),
        items: cartItems,
        notes: notes.trim() || undefined,
        paymentMethod,
      });
      const nextOrders = await api.getMyOrders(currentUser.email);
      setOrders(nextOrders);
      setQuantities({});
      setNotes("");
      setSelectedOrderId(order.id);
      setActiveTab("orders");
      Alert.alert("Order created", `Order ${order.orderNumber} has been created.`);
    } finally {
      setSavingOrder(false);
    }
  };

  const addAddress = async () => {
    if (!currentUser) return;
    if (!addressTitle.trim() || addressText.trim().length < 3) {
      Alert.alert("Address required", "Add an address title and a valid address.");
      return;
    }

    const nextUser = await api.updateUser(currentUser.id, {
      addresses: [
        ...currentUser.addresses,
        {
          title: addressTitle.trim(),
          address: addressText.trim(),
        },
      ],
    });
    setCurrentUser(nextUser);
    setAddressTitle("");
    setAddressText("");
  };

  const deleteAddress = async (index: number) => {
    if (!currentUser) return;
    const nextAddresses = currentUser.addresses.filter((_, itemIndex) => itemIndex !== index);
    const nextUser = await api.updateUser(currentUser.id, { addresses: nextAddresses });
    setCurrentUser(nextUser);
    if (deliveryAddress === currentUser.addresses[index]?.address) {
      setDeliveryAddress(nextAddresses[0]?.address ?? "");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color="#8a4f1d" size="large" />
        <Text style={styles.loadingText}>Loading dealer workspace</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>Harvest Coffee</Text>
            <Text style={styles.title}>{currentUser?.companyName || "Dealer workspace"}</Text>
          </View>
          <View style={styles.userPill}>
            <Text style={styles.userInitials}>{initials(currentUser?.fullName)}</Text>
          </View>
        </View>

        {activeTab === "products" && (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={
              <CartPanel
                cartTotal={cartTotal}
                deliveryAddress={deliveryAddress}
                itemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                notes={notes}
                onAddressChange={setDeliveryAddress}
                onNotesChange={setNotes}
                onPaymentMethodChange={setPaymentMethod}
                onSubmit={submitOrder}
                paymentMethod={paymentMethod}
                saving={savingOrder}
              />
            }
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <ProductCard
                product={item}
                quantity={quantities[item.id] ?? 0}
                onDecrease={() => updateQuantity(item.id, -1)}
                onIncrease={() => updateQuantity(item.id, 1)}
              />
            )}
          />
        )}

        {activeTab === "orders" && (
          <ScrollView contentContainerStyle={styles.list}>
            {selectedOrder ? (
              <OrderDetail order={selectedOrder} onBack={() => setSelectedOrderId(null)} />
            ) : (
              <>
                <SectionTitle eyebrow="My orders" title="Order history" />
                {orders.length === 0 ? (
                  <EmptyState title="No orders yet" body="Create your first order from the product catalogue." />
                ) : (
                  orders.map((order) => (
                    <OrderCard key={order.id} order={order} onPress={() => setSelectedOrderId(order.id)} />
                  ))
                )}
              </>
            )}
          </ScrollView>
        )}

        {activeTab === "profile" && currentUser && (
          <ScrollView contentContainerStyle={styles.list}>
            <SectionTitle eyebrow="Account" title="Profile" />
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{currentUser.fullName}</Text>
              <Text style={styles.muted}>{currentUser.email}</Text>
              <Text style={styles.muted}>{currentUser.companyName}</Text>
              <View style={styles.statsRow}>
                <Metric label="Orders" value={orders.length.toString()} />
                <Metric label="Segment" value={currentUser.customerSegment} />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Delivery addresses</Text>
              {currentUser.addresses.map((address, index) => (
                <View key={`${address.title}-${index}`} style={styles.addressRow}>
                  <Pressable style={styles.addressCopy} onPress={() => setDeliveryAddress(address.address)}>
                    <Text style={styles.name}>{address.title}</Text>
                    <Text style={styles.description}>{address.address}</Text>
                  </Pressable>
                  <Pressable style={styles.smallOutlineButton} onPress={() => deleteAddress(index)}>
                    <Text style={styles.smallOutlineText}>Delete</Text>
                  </Pressable>
                </View>
              ))}

              <TextInput
                onChangeText={setAddressTitle}
                placeholder="Address title"
                placeholderTextColor="#9a8f82"
                style={styles.input}
                value={addressTitle}
              />
              <TextInput
                multiline
                onChangeText={setAddressText}
                placeholder="Delivery address"
                placeholderTextColor="#9a8f82"
                style={[styles.input, styles.textArea]}
                value={addressText}
              />
              <Pressable style={styles.primaryButton} onPress={addAddress}>
                <Text style={styles.primaryButtonText}>Add address</Text>
              </Pressable>
            </View>
          </ScrollView>
        )}

        <View style={styles.tabs}>
          <TabButton active={activeTab === "products"} label="Products" onPress={() => setActiveTab("products")} />
          <TabButton
            active={activeTab === "orders"}
            label={`Orders${orders.length ? ` (${orders.length})` : ""}`}
            onPress={() => setActiveTab("orders")}
          />
          <TabButton active={activeTab === "profile"} label="Profile" onPress={() => setActiveTab("profile")} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CartPanel({
  cartTotal,
  deliveryAddress,
  itemCount,
  notes,
  onAddressChange,
  onNotesChange,
  onPaymentMethodChange,
  onSubmit,
  paymentMethod,
  saving,
}: {
  cartTotal: number;
  deliveryAddress: string;
  itemCount: number;
  notes: string;
  onAddressChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onPaymentMethodChange: (value: PaymentMethod) => void;
  onSubmit: () => void;
  paymentMethod: PaymentMethod;
  saving: boolean;
}) {
  return (
    <View style={styles.cartPanel}>
      <Text style={styles.kicker}>Quick order</Text>
      <View style={styles.cartHeader}>
        <Text style={styles.panelTitle}>{itemCount} items selected</Text>
        <Text style={styles.total}>GBP {cartTotal.toFixed(2)}</Text>
      </View>
      <TextInput
        multiline
        onChangeText={onAddressChange}
        placeholder="Delivery address"
        placeholderTextColor="#9a8f82"
        style={[styles.input, styles.textArea]}
        value={deliveryAddress}
      />
      <View style={styles.methodRow}>
        {(["bank_transfer", "credit_card", "paypal", "cash_on_delivery"] as PaymentMethod[]).map((method) => (
          <Pressable
            key={method}
            onPress={() => onPaymentMethodChange(method)}
            style={[styles.methodButton, paymentMethod === method && styles.methodButtonActive]}
          >
            <Text style={[styles.methodText, paymentMethod === method && styles.methodTextActive]}>
              {paymentMethodLabels[method]}
            </Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        onChangeText={onNotesChange}
        placeholder="Notes"
        placeholderTextColor="#9a8f82"
        style={styles.input}
        value={notes}
      />
      <Pressable
        disabled={itemCount === 0 || saving}
        onPress={onSubmit}
        style={[styles.primaryButton, (itemCount === 0 || saving) && styles.disabledButton]}
      >
        <Text style={styles.primaryButtonText}>{saving ? "Creating order..." : "Place order"}</Text>
      </Pressable>
    </View>
  );
}

function ProductCard({
  product,
  quantity,
  onDecrease,
  onIncrease,
}: {
  product: Product;
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  const disabled = product.stockStatus === "out_of_stock" || product.stockQuantity === 0;

  return (
    <View style={styles.product}>
      <Image source={{ uri: product.imageUrl || fallbackImage }} style={styles.image} />
      <View style={styles.copy}>
        <View style={styles.metaRow}>
          <Text style={styles.category}>{product.category}</Text>
          <Text style={styles.stock}>{product.stockStatus.replaceAll("_", " ")}</Text>
        </View>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.description}>{product.description}</Text>
        <View style={styles.footer}>
          <View>
            <Text style={styles.price}>GBP {product.price.toFixed(2)}</Text>
            <Text style={styles.muted}>{product.weight || `${product.stockQuantity} in stock`}</Text>
          </View>
          <View style={styles.quantity}>
            <Pressable disabled={quantity === 0} style={styles.quantityButton} onPress={onDecrease}>
              <Text style={styles.quantityText}>-</Text>
            </Pressable>
            <Text style={styles.quantityValue}>{quantity}</Text>
            <Pressable disabled={disabled} style={[styles.quantityButton, disabled && styles.disabledButton]} onPress={onIncrease}>
              <Text style={styles.quantityText}>+</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

function OrderCard({ order, onPress }: { order: Order; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cartHeader}>
        <View>
          <Text style={styles.cardTitle}>{order.orderNumber}</Text>
          <Text style={styles.muted}>{new Date(order.createdAt).toLocaleDateString()}</Text>
        </View>
        <Text style={styles.total}>GBP {order.totalAmount.toFixed(2)}</Text>
      </View>
      <View style={styles.badgeRow}>
        <Badge label={order.status.replaceAll("_", " ")} />
        <Badge label={paymentStatusLabels[order.paymentStatus]} />
      </View>
      <Text style={styles.description} numberOfLines={1}>
        {order.items.map((item) => `${item.quantity}x ${item.productName}`).join(", ")}
      </Text>
    </Pressable>
  );
}

function OrderDetail({ order, onBack }: { order: Order; onBack: () => void }) {
  return (
    <>
      <Pressable style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>Back to orders</Text>
      </Pressable>
      <SectionTitle eyebrow="Order detail" title={order.orderNumber} />
      <View style={styles.card}>
        <View style={styles.badgeRow}>
          <Badge label={order.status.replaceAll("_", " ")} />
          <Badge label={paymentStatusLabels[order.paymentStatus]} />
          <Badge label={paymentMethodLabels[order.paymentMethod]} />
        </View>
        <Metric label="Total" value={`GBP ${order.totalAmount.toFixed(2)}`} />
        <Metric label="Delivery address" value={order.deliveryAddress} />
        {order.trackingNumber ? <Metric label="Tracking" value={order.trackingNumber} /> : null}
        {order.estimatedDeliveryDate ? <Metric label="Estimated delivery" value={order.estimatedDeliveryDate} /> : null}
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Items</Text>
        {order.items.map((item) => (
          <View key={`${order.id}-${item.productId}`} style={styles.itemRow}>
            <View>
              <Text style={styles.name}>{item.productName}</Text>
              <Text style={styles.muted}>{item.quantity} x GBP {item.price.toFixed(2)}</Text>
            </View>
            <Text style={styles.price}>GBP {item.subtotal.toFixed(2)}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.kicker}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function EmptyState({ body, title }: { body: string; title: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.description}>{body}</Text>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

function TabButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.tab, active && styles.tabActive]} onPress={onPress}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

function initials(name?: string) {
  return (name || "Dealer")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const styles = StyleSheet.create({
  addressCopy: {
    flex: 1,
    gap: 4,
  },
  addressRow: {
    alignItems: "center",
    borderBottomColor: "#eadccb",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12,
  },
  backButton: {
    alignSelf: "flex-start",
    borderColor: "#d9c7b5",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  backText: {
    color: "#704118",
    fontWeight: "800",
  },
  badge: {
    backgroundColor: "#f3e8da",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  badgeText: {
    color: "#704118",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  card: {
    backgroundColor: "#fffaf4",
    borderColor: "#eadccb",
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  cardTitle: {
    color: "#2a1a12",
    fontSize: 18,
    fontWeight: "900",
  },
  cartHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cartPanel: {
    backgroundColor: "#fffaf4",
    borderColor: "#eadccb",
    borderRadius: 22,
    borderWidth: 1,
    gap: 12,
    marginBottom: 14,
    padding: 16,
  },
  category: {
    color: "#a65b1a",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  copy: {
    gap: 9,
    padding: 14,
  },
  description: {
    color: "#615447",
    lineHeight: 20,
  },
  disabledButton: {
    opacity: 0.42,
  },
  empty: {
    alignItems: "center",
    backgroundColor: "#fffaf4",
    borderColor: "#eadccb",
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 22,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  image: {
    backgroundColor: "#eadccb",
    height: 168,
    width: "100%",
  },
  input: {
    backgroundColor: "#fff",
    borderColor: "#dcc9b7",
    borderRadius: 14,
    borderWidth: 1,
    color: "#2a1a12",
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  itemRow: {
    alignItems: "center",
    borderTopColor: "#eadccb",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
  },
  keyboard: {
    flex: 1,
  },
  kicker: {
    color: "#a65b1a",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  list: {
    gap: 14,
    padding: 16,
    paddingBottom: 104,
  },
  loadingScreen: {
    alignItems: "center",
    backgroundColor: "#f7efe4",
    flex: 1,
    justifyContent: "center",
  },
  loadingText: {
    color: "#704118",
    fontWeight: "800",
    marginTop: 14,
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  methodButton: {
    borderColor: "#dcc9b7",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  methodButtonActive: {
    backgroundColor: "#704118",
    borderColor: "#704118",
  },
  methodRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  methodText: {
    color: "#704118",
    fontSize: 12,
    fontWeight: "800",
  },
  methodTextActive: {
    color: "#fff",
  },
  metric: {
    gap: 3,
  },
  metricLabel: {
    color: "#8b7b6c",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  metricValue: {
    color: "#2a1a12",
    fontSize: 16,
    fontWeight: "800",
  },
  muted: {
    color: "#8b7b6c",
    fontSize: 13,
  },
  name: {
    color: "#2a1a12",
    fontSize: 17,
    fontWeight: "900",
  },
  panelTitle: {
    color: "#2a1a12",
    fontSize: 21,
    fontWeight: "900",
  },
  price: {
    color: "#2a1a12",
    fontSize: 15,
    fontWeight: "900",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#704118",
    borderRadius: 14,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "900",
  },
  product: {
    backgroundColor: "#fffaf4",
    borderColor: "#eadccb",
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  quantity: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  quantityButton: {
    alignItems: "center",
    backgroundColor: "#704118",
    borderRadius: 12,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  quantityText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },
  quantityValue: {
    color: "#2a1a12",
    fontSize: 16,
    fontWeight: "900",
    minWidth: 20,
    textAlign: "center",
  },
  screen: {
    backgroundColor: "#f7efe4",
    flex: 1,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    color: "#2a1a12",
    fontSize: 28,
    fontWeight: "900",
  },
  smallOutlineButton: {
    borderColor: "#d9c7b5",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  smallOutlineText: {
    color: "#704118",
    fontSize: 12,
    fontWeight: "900",
  },
  statsRow: {
    flexDirection: "row",
    gap: 28,
    marginTop: 6,
  },
  stock: {
    color: "#7a6b5d",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  tab: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    paddingVertical: 12,
  },
  tabActive: {
    backgroundColor: "#704118",
  },
  tabText: {
    color: "#704118",
    fontSize: 13,
    fontWeight: "900",
  },
  tabTextActive: {
    color: "#fff",
  },
  tabs: {
    backgroundColor: "#fffaf4",
    borderColor: "#eadccb",
    borderRadius: 999,
    borderWidth: 1,
    bottom: 18,
    flexDirection: "row",
    gap: 6,
    left: 16,
    padding: 6,
    position: "absolute",
    right: 16,
  },
  textArea: {
    minHeight: 74,
    textAlignVertical: "top",
  },
  title: {
    color: "#2a1a12",
    fontSize: 26,
    fontWeight: "900",
    marginTop: 4,
  },
  total: {
    color: "#704118",
    fontSize: 18,
    fontWeight: "900",
  },
  userInitials: {
    color: "#704118",
    fontWeight: "900",
  },
  userPill: {
    alignItems: "center",
    backgroundColor: "#f3e8da",
    borderRadius: 999,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
});
