import {
  calculateOrderItems,
  calculateOrderTotal,
  PaymentMethod,
  paymentMethodLabels,
  Product,
} from "@harvest/domain";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Card, colors, FadeInView, fallbackImage, Field, fontFamilies, formatCurrency, OutlineButton, ProductCard, StatusBanner, styles } from "../../components/ui";
import { useMobileState } from "../../lib/mobile-state";
import { validateDeliveryAddress } from "../../lib/validation";

const paymentMethods: PaymentMethod[] = ["bank_transfer", "credit_card", "paypal", "cash_on_delivery"];
type CartMessage = { body?: string; title: string; tone: "error" | "info" | "success" };

export default function ProductsScreen() {
  const {
    api,
    cartOpen,
    cartQuantities,
    clearCart,
    closeCart,
    createOrder,
    currentUser,
    deliveryAddress,
    isAuthenticated,
    loadingData,
    products,
    setDeliveryAddress,
    setProductQuantity,
    updateCartQuantity,
  } = useMobileState();
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer");
  const [publicLoading, setPublicLoading] = useState(false);
  const [publicProducts, setPublicProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [cartMessage, setCartMessage] = useState<CartMessage | null>(null);

  useEffect(() => {
    if (isAuthenticated) return;

    let mounted = true;
    setPublicLoading(true);
    void api.getProducts()
      .then((nextProducts) => {
        if (mounted) setPublicProducts(nextProducts);
      })
      .finally(() => {
        if (mounted) setPublicLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [api, isAuthenticated]);

  const cartItems = useMemo(() => calculateOrderItems(products, cartQuantities), [products, cartQuantities]);
  const cartTotal = useMemo(() => calculateOrderTotal(cartItems), [cartItems]);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const submitOrder = async () => {
    if (!currentUser || cartItems.length === 0 || saving) return;
    setCartMessage(null);
    const address = validateDeliveryAddress(deliveryAddress);
    if (!address.ok) {
      setCartMessage({ body: address.message, title: address.title, tone: "error" });
      return;
    }

    setSaving(true);
    try {
      const order = await createOrder({
        customerEmail: currentUser.email,
        customerName: currentUser.companyName || currentUser.fullName,
        deliveryAddress: address.value,
        items: cartItems,
        notes: notes.trim() || undefined,
        paymentMethod,
      });
      clearCart();
      setNotes("");
      closeCart();
      router.push({ pathname: "/order/[id]", params: { created: "1", id: order.id, orderNumber: order.orderNumber } });
    } catch (error) {
      setCartMessage({ body: error instanceof Error ? error.message : "The order could not be created.", title: "Order failed", tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return <PublicProductsScreen loading={publicLoading} products={publicProducts} />;
  }

  return (
    <>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Card>
            <Text style={styles.description}>{loadingData ? "Loading products..." : "No products available."}</Text>
          </Card>
        }
        initialNumToRender={6}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <FadeInView>
            <View style={productStyles.catalogHeader}>
              <View>
                <Text style={styles.kicker}>Catalogue</Text>
                <Text style={productStyles.catalogTitle}>Select products</Text>
              </View>
              <Text style={productStyles.catalogCount}>
                {itemCount ? `${itemCount} in cart` : `${products.length} available`}
              </Text>
            </View>
          </FadeInView>
        }
        maxToRenderPerBatch={6}
        showsVerticalScrollIndicator={false}
        windowSize={7}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            quantity={cartQuantities[item.id] ?? 0}
            onDecrease={() => updateCartQuantity(item.id, -1)}
            onIncrease={() => updateCartQuantity(item.id, 1)}
          />
        )}
      />
      <CartModal
        addresses={currentUser?.addresses ?? []}
        cartItems={cartItems}
        cartTotal={cartTotal}
        deliveryAddress={deliveryAddress}
        message={cartMessage}
        notes={notes}
        onClose={() => {
          setCartMessage(null);
          closeCart();
        }}
        onNotesChange={setNotes}
        onPaymentMethodChange={setPaymentMethod}
        onPlaceOrder={submitOrder}
        onQuantityChange={setProductQuantity}
        onDeliveryAddressChange={setDeliveryAddress}
        paymentMethod={paymentMethod}
        saving={saving}
        visible={cartOpen}
      />
    </>
  );
}

function CartModal({
  addresses,
  cartItems,
  cartTotal,
  deliveryAddress,
  message,
  notes,
  onClose,
  onDeliveryAddressChange,
  onNotesChange,
  onPaymentMethodChange,
  onPlaceOrder,
  onQuantityChange,
  paymentMethod,
  saving,
  visible,
}: {
  addresses: { address: string; title: string }[];
  cartItems: ReturnType<typeof calculateOrderItems>;
  cartTotal: number;
  deliveryAddress: string;
  message?: CartMessage | null;
  notes: string;
  onClose: () => void;
  onDeliveryAddressChange: (address: string) => void;
  onNotesChange: (notes: string) => void;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onPlaceOrder: () => void;
  onQuantityChange: (productId: string, quantity: number) => void;
  paymentMethod: PaymentMethod;
  saving: boolean;
  visible: boolean;
}) {
  const sheetTranslate = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    if (!visible) return;
    sheetTranslate.setValue(28);
    Animated.spring(sheetTranslate, {
      damping: 22,
      mass: 0.9,
      stiffness: 210,
      toValue: 0,
      useNativeDriver: true,
    }).start();
  }, [sheetTranslate, visible]);

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={productStyles.modalOverlay}>
        <Animated.View style={[productStyles.cartSheet, { transform: [{ translateY: sheetTranslate }] }]}>
          <View style={productStyles.cartHandle} />
          <View style={productStyles.cartHeader}>
            <View>
              <Text style={styles.kicker}>Cart</Text>
              <Text style={productStyles.cartTitle}>Review order</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [productStyles.closeButton, pressed && styles.pressed]}>
              <Feather color={colors.foreground} name="x" size={20} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={productStyles.cartContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {message ? <StatusBanner body={message.body} title={message.title} tone={message.tone} /> : null}
            <View style={productStyles.selectedItems}>
              <View style={productStyles.selectedItemsHeader}>
                <Text style={productStyles.fieldLabel}>Selected items</Text>
                <Text style={productStyles.paymentValue}>{cartItems.length} products</Text>
              </View>
              {cartItems.length === 0 ? (
                <Text style={productStyles.emptyCartText}>Cart is empty. Add products from the catalogue first.</Text>
              ) : cartItems.map((item) => (
                <View key={item.productId} style={productStyles.cartItemRow}>
                  <View style={productStyles.selectedItemCopy}>
                    <Text style={productStyles.selectedItemName}>{item.productName}</Text>
                    <Text style={productStyles.selectedItemMeta}>{item.quantity} x {formatCurrency(item.price)}</Text>
                  </View>
                  <View style={productStyles.cartItemActions}>
                    <Text style={productStyles.selectedItemTotal}>{formatCurrency(item.subtotal)}</Text>
                    <View style={productStyles.miniStepper}>
                      <Pressable accessibilityRole="button" onPress={() => onQuantityChange(item.productId, item.quantity - 1)} style={productStyles.miniStepperButton}>
                        <Text style={productStyles.miniStepperText}>-</Text>
                      </Pressable>
                      <Text style={productStyles.miniStepperValue}>{item.quantity}</Text>
                      <Pressable accessibilityRole="button" onPress={() => onQuantityChange(item.productId, item.quantity + 1)} style={productStyles.miniStepperButton}>
                        <Text style={productStyles.miniStepperText}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <View style={productStyles.addressSection}>
              <View style={productStyles.paymentHeader}>
                <Text style={productStyles.fieldLabel}>Delivery address</Text>
                <Text style={productStyles.paymentValue}>{deliveryAddress ? "Selected" : "Required"}</Text>
              </View>
              {addresses.length ? (
                <View style={productStyles.addressList}>
                  {addresses.map((address, index) => {
                    const active = deliveryAddress === address.address;
                    return (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        key={`${address.title}-${index}`}
                        onPress={() => onDeliveryAddressChange(address.address)}
                        style={({ pressed }) => [productStyles.addressOption, active && productStyles.addressOptionActive, pressed && styles.pressed]}
                      >
                        <View style={productStyles.addressRadio}>
                          {active ? <View style={productStyles.addressRadioDot} /> : null}
                        </View>
                        <View style={productStyles.addressCopy}>
                          <Text style={productStyles.addressTitle}>{address.title}</Text>
                          <Text style={productStyles.addressText}>{address.address}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <View style={productStyles.emptyAddress}>
                  <Text style={productStyles.emptyCartText}>No saved delivery address. Add one from Profile before placing an order.</Text>
                  <Pressable accessibilityRole="button" onPress={() => { onClose(); router.push("/profile"); }} style={({ pressed }) => [productStyles.manageAddressButton, pressed && styles.pressed]}>
                    <Text style={productStyles.manageAddressText}>Open Profile</Text>
                  </Pressable>
                </View>
              )}
            </View>

            <View style={productStyles.paymentHeader}>
              <Text style={productStyles.fieldLabel}>Payment method</Text>
              <Text style={productStyles.paymentValue}>{paymentMethodLabels[paymentMethod]}</Text>
            </View>
            <View style={productStyles.methods}>
              {paymentMethods.map((method) => {
                const active = paymentMethod === method;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    key={method}
                    onPress={() => onPaymentMethodChange(method)}
                    style={({ pressed }) => [productStyles.method, active && productStyles.methodActive, pressed && styles.pressed]}
                  >
                    <Text style={[productStyles.methodText, active && productStyles.methodTextActive]}>{paymentMethodLabels[method]}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Field onChangeText={onNotesChange} placeholder="Notes" value={notes} />
          </ScrollView>

          <View style={productStyles.cartFooter}>
            <View>
              <Text style={productStyles.totalLabel}>Total</Text>
              <Text style={productStyles.cartTotal}>{formatCurrency(cartTotal)}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: saving || cartItems.length === 0 }}
              disabled={saving || cartItems.length === 0}
              onPress={onPlaceOrder}
              style={({ pressed }) => [productStyles.placeOrderButton, pressed && !saving && styles.pressed, (saving || cartItems.length === 0) && styles.disabled]}
            >
              <Text style={productStyles.placeOrderText}>{saving ? "Creating..." : "Place order"}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function PublicProductsScreen({ loading, products }: { loading: boolean; products: Product[] }) {
  return (
    <>
      <View style={publicProductStyles.hero}>
        <Text style={publicProductStyles.kicker}>Wholesale Coffee Collection</Text>
        <Text style={publicProductStyles.title}>Premium Coffee Collection</Text>
        <Text style={publicProductStyles.lead}>Carefully sourced coffee and wholesale supplies</Text>
      </View>

      <View style={publicProductStyles.lockCard}>
        <View style={publicProductStyles.lockIcon}>
          <Feather color={colors.foreground} name="lock" size={21} />
        </View>
        <View style={publicProductStyles.lockCopy}>
          <Text style={publicProductStyles.lockTitle}>Login to see prices and place orders</Text>
          <Text style={publicProductStyles.lockBody}>Dealer access keeps pricing and checkout available to approved accounts.</Text>
        </View>
        <OutlineButton label="Dealer Login" onPress={() => router.push("/login")} />
      </View>

      <View style={publicProductStyles.catalog}>
        {loading ? (
          <Card>
            <Text style={styles.description}>Loading products...</Text>
          </Card>
        ) : products.length === 0 ? (
          <Card>
            <Text style={styles.description}>No products available.</Text>
          </Card>
        ) : (
          products.map((product, index) => <PublicProductCard index={index} key={product.id} product={product} />)
        )}
      </View>
    </>
  );
}

function PublicProductCard({ index, product }: { index: number; product: Product }) {
  const isOutOfStock = product.stockStatus === "out_of_stock" || product.stockQuantity === 0;

  return (
    <FadeInView delay={index * 45} style={publicProductStyles.card}>
      <View style={publicProductStyles.imageWrap}>
        <Image accessibilityLabel={product.name} source={{ uri: product.imageUrl || fallbackImage }} style={publicProductStyles.image} />
        {product.category ? (
          <View style={publicProductStyles.categoryBadge}>
            <Text style={publicProductStyles.categoryText}>{product.category}</Text>
          </View>
        ) : null}
        {product.stockStatus === "low_stock" ? (
          <View style={publicProductStyles.stockBadge}>
            <Text style={publicProductStyles.stockText}>Low Stock</Text>
          </View>
        ) : null}
        {isOutOfStock ? (
          <View style={[publicProductStyles.stockBadge, publicProductStyles.stockBadgeMuted]}>
            <Text style={publicProductStyles.stockText}>Out of Stock</Text>
          </View>
        ) : null}
      </View>

      <View style={publicProductStyles.cardBody}>
        <Text style={publicProductStyles.productName}>{product.name}</Text>
        {product.weight ? <Text style={publicProductStyles.weight}>{product.weight}</Text> : null}
        {product.description ? <Text style={publicProductStyles.description}>{product.description}</Text> : null}

        <View style={publicProductStyles.signInBox}>
          <View style={publicProductStyles.signInTitleRow}>
            <Feather color={colors.primary} name="lock" size={15} />
            <Text style={publicProductStyles.signInTitle}>Sign in to add items</Text>
          </View>
          <OutlineButton label="Dealer Login" onPress={() => router.push("/login")} />
        </View>
      </View>
    </FadeInView>
  );
}

const productStyles = StyleSheet.create({
  addressCopy: {
    flex: 1,
    gap: 3,
  },
  addressList: {
    gap: 8,
  },
  addressOption: {
    alignItems: "flex-start",
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },
  addressOptionActive: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.primary,
  },
  addressRadio: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 18,
    justifyContent: "center",
    marginTop: 2,
    width: 18,
  },
  addressRadioDot: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  addressSection: {
    gap: 10,
  },
  addressText: {
    color: colors.muted,
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  addressTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
  },
  catalogCount: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
  },
  catalogHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    paddingTop: 2,
  },
  catalogTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 18,
    lineHeight: 24,
    marginTop: 2,
  },
  cartContent: {
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cartFooter: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-between",
    paddingBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  cartHandle: {
    alignSelf: "center",
    backgroundColor: colors.border,
    borderRadius: 999,
    height: 4,
    marginBottom: 10,
    marginTop: 10,
    width: 42,
  },
  cartHeader: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  cartItemActions: {
    alignItems: "flex-end",
    gap: 8,
  },
  cartItemRow: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingTop: 10,
  },
  cartSheet: {
    backgroundColor: colors.secondary,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: "88%",
    overflow: "hidden",
    shadowColor: colors.foreground,
    shadowOffset: { height: -8, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
  },
  cartTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 20,
    lineHeight: 26,
    marginTop: 2,
  },
  cartTotal: {
    color: colors.foreground,
    fontFamily: fontFamilies.bold,
    fontSize: 19,
    lineHeight: 25,
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  fieldLabel: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
    textTransform: "uppercase",
  },
  emptyAddress: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  emptyCartText: {
    color: colors.muted,
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  method: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  methodActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  methodText: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
  },
  methodTextActive: {
    color: colors.onPrimary,
  },
  methods: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  manageAddressButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  manageAddressText: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
  },
  miniStepper: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    overflow: "hidden",
  },
  miniStepperButton: {
    alignItems: "center",
    height: 30,
    justifyContent: "center",
    width: 34,
  },
  miniStepperText: {
    color: colors.foreground,
    fontFamily: fontFamilies.bold,
    fontSize: 16,
    lineHeight: 18,
  },
  miniStepperValue: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
    minWidth: 24,
    textAlign: "center",
  },
  modalOverlay: {
    backgroundColor: colors.overlay.scrim,
    flex: 1,
    justifyContent: "flex-end",
  },
  paymentHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  paymentValue: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
  },
  placeOrderButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: "center",
    minHeight: 48,
    minWidth: 150,
    paddingHorizontal: 18,
  },
  placeOrderText: {
    color: colors.onPrimary,
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
  },
  selectedItemCopy: {
    flex: 1,
    gap: 3,
  },
  selectedItemMeta: {
    color: colors.muted,
    fontFamily: fontFamilies.regular,
    fontSize: 12,
  },
  selectedItemName: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
  },
  selectedItemRow: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingTop: 10,
  },
  selectedItemTotal: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
  },
  selectedItems: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  selectedItemsHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalLabel: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 11,
    textTransform: "uppercase",
  },
});

const publicProductStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardBody: {
    gap: 10,
    padding: 14,
  },
  catalog: {
    backgroundColor: colors.background,
    gap: 12,
    padding: 12,
    paddingVertical: 26,
  },
  categoryBadge: {
    backgroundColor: colors.overlay.publicHeader,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: "absolute",
    right: 12,
    top: 12,
  },
  categoryText: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 11,
  },
  description: {
    color: colors.muted,
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 21,
  },
  hero: {
    alignItems: "center",
    backgroundColor: colors.background,
    gap: 14,
    padding: 20,
    paddingVertical: 42,
  },
  image: {
    backgroundColor: colors.border,
    height: 230,
    width: "100%",
  },
  imageWrap: {
    backgroundColor: colors.border,
    position: "relative",
  },
  kicker: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    letterSpacing: 1.2,
    textAlign: "center",
    textTransform: "uppercase",
  },
  lead: {
    color: colors.muted,
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 520,
    textAlign: "center",
  },
  lockBody: {
    color: colors.muted,
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  lockCard: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    marginHorizontal: 12,
    marginTop: -18,
    padding: 14,
    shadowColor: colors.foreground,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
  },
  lockCopy: {
    gap: 4,
  },
  lockIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  lockTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 18,
    lineHeight: 23,
  },
  productName: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 21,
    lineHeight: 27,
  },
  signInBox: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginTop: 6,
    padding: 12,
  },
  signInTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
  },
  signInTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
  },
  stockBadge: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: "absolute",
    top: 12,
  },
  stockBadgeMuted: {
    backgroundColor: colors.status.danger.color,
  },
  stockText: {
    color: colors.onPrimary,
    fontFamily: fontFamilies.semiBold,
    fontSize: 11,
  },
  title: {
    color: colors.foreground,
    fontFamily: fontFamilies.bold,
    fontSize: 34,
    lineHeight: 39,
    textAlign: "center",
  },
  weight: {
    color: colors.primary,
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
  },
});
