"use client";

import MotionReveal from "@/components/MotionReveal";
import PublicSectionHeader from "@/components/PublicSectionHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { requestToast } from "@/components/ui/sonner";
import { hasHarvestSession } from "@/lib/harvest-api";
import { useCreateOrderMutation, useCurrentUserQuery, useProductsQuery } from "@/lib/harvest-query";
import { calculateOrderItems, calculateOrderTotal, type Address, type PaymentMethod, type Product } from "@/lib/domain";
import {
  ArrowRight,
  Check,
  Grid3x3,
  List,
  Lock,
  LogIn,
  Minus,
  PackageCheck,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Cart = Record<string, number>;

const loginHref = "/login?next=%2Fdashboard";
const paymentMethodOptions: Array<{ label: string; value: PaymentMethod }> = [
  { label: "Bank Transfer", value: "bank_transfer" },
  { label: "Credit Card", value: "credit_card" },
  { label: "PayPal", value: "paypal" },
  { label: "Cash on Delivery", value: "cash_on_delivery" },
];

export default function CatalogModernWorkspace() {
  const currentUserQuery = useCurrentUserQuery();
  const productsQuery = useProductsQuery();
  const createOrderMutation = useCreateOrderMutation();
  const [cart, setCart] = useState<Cart>({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const isAuthenticated = hasHarvestSession();
  const currentUser = currentUserQuery.data ?? null;
  const products = productsQuery.data ?? [];
  const isLoading = productsQuery.isLoading;
  const defaultDeliveryAddress = currentUser?.addresses?.[0]?.address ?? "";
  const cartItems = useMemo(() => calculateOrderItems(products, cart), [cart, products]);
  const totalAmount = calculateOrderTotal(cartItems);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cartParam = params.get("cart");
    if (!cartParam) return;

    const preloadedCart = parsePreloadedCart(cartParam);
    if (Object.keys(preloadedCart).length > 0) {
      setCart((current) => ({ ...current, ...preloadedCart }));
      setShowCheckout(true);
    }

    params.delete("cart");
    const nextQuery = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`);
  }, []);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    setCart((current) => {
      const next = { ...current };
      if (newQuantity === 0) delete next[productId];
      else next[productId] = newQuantity;
      return next;
    });
  };

  const openCheckout = () => {
    if (!deliveryAddress.trim() && defaultDeliveryAddress.trim()) {
      setDeliveryAddress(defaultDeliveryAddress);
    }
    setShowCheckout(true);
  };

  const handleCheckout = async () => {
    if (!currentUser?.email) {
      requestToast.error({ title: "Please sign in before placing an order." });
      return;
    }

    const checkoutAddress = deliveryAddress.trim() || defaultDeliveryAddress.trim();
    if (!checkoutAddress) {
      requestToast.error({ title: "Delivery address is required." });
      return;
    }

    const order = await createOrderMutation.mutateAsync({
      customerEmail: currentUser.email,
      customerName: currentUser?.fullName || currentUser?.companyName || currentUser?.email,
      items: cartItems,
      paymentMethod,
      deliveryAddress: checkoutAddress,
      notes,
    });

    setCart({});
    setDeliveryAddress("");
    setNotes("");
    setShowCheckout(false);
    window.location.href = `/orderdetails?id=${order.id}`;
  };

  return (
    <div className="harvest-theme overflow-hidden bg-background text-foreground">
      {isAuthenticated ? (
        <section className="relative px-5 pb-6 pt-0 sm:px-8 lg:px-10">
          <MotionReveal>
            <Card className="overflow-hidden rounded-2xl border-border bg-card p-5 shadow-sm shadow-primary/5 sm:p-6">
              <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <CoffeeBranchAsset className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 -scale-x-100 bg-primary/[0.045]" />
                <div className="relative">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary">Dealer ordering</p>
                  <h1 className="mt-2 text-3xl font-black tracking-normal text-foreground sm:text-4xl">
                    Products
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-muted-foreground">
                    Build quick B2B orders from the live catalog. Select quantities, choose a saved delivery address, then place your order.
                  </p>
                </div>
                <div className="relative grid gap-3 sm:grid-cols-3 lg:min-w-[440px]">
                  <DealerMetric label="Available" value={products.length.toString()} />
                  <DealerMetric label="In cart" value={cartItems.length.toString()} />
                  <DealerMetric label="Total" value={`£${totalAmount.toFixed(2)}`} />
                </div>
              </div>
            </Card>
          </MotionReveal>
        </section>
      ) : (
        <section className="relative px-5 pb-12 pt-32 sm:px-8 lg:px-10">
          <CoffeeBranchAsset className="absolute -left-20 top-10 h-80 w-80 bg-primary/[0.085]" />
          <CoffeeBranchAsset className="absolute -right-24 bottom-0 hidden h-72 w-72 -scale-x-100 bg-primary/[0.06] lg:block" />
          <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
            <MotionReveal>
              <PublicSectionHeader
                className="max-w-3xl"
                description="Carefully sourced coffee and wholesale supplies"
                eyebrow="Wholesale Coffee Collection"
                size="page"
                title="Premium Coffee Collection"
              />
            </MotionReveal>

            <MotionReveal delay={120} variant="right">
              <Card className="rounded-lg border-primary/15 bg-card/82 p-6 shadow-xl shadow-primary/10 backdrop-blur-sm">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-4">
                    <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-display text-2xl font-black text-foreground">Login to see prices and place orders</h2>
                      <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">
                        Dealer access keeps pricing and checkout available to approved accounts.
                      </p>
                    </div>
                  </div>
                  <Button asChildShim className="h-11 rounded-md px-5" variant="default">
                    <Link href={loginHref}>
                      <LogIn className="h-4 w-4" />
                      Dealer Login
                    </Link>
                  </Button>
                </div>
              </Card>
            </MotionReveal>
          </div>
        </section>
      )}

      <section className={`relative px-5 sm:px-8 lg:px-10 ${isAuthenticated ? "bg-background py-4" : "bg-card py-8"}`}>
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4">
            {isAuthenticated && (
              <MotionReveal>
                <Card className="rounded-2xl border-border bg-card p-3 shadow-sm shadow-primary/5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 px-2">
                      <PackageCheck className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-black text-foreground">Quick order catalog</p>
                        <p className="text-xs font-semibold text-muted-foreground">{products.length} products available for dealer ordering</p>
                      </div>
                    </div>
                    <div className="flex rounded-md border border-border bg-secondary/60 p-1">
                      <button
                        type="button"
                        onClick={() => setViewMode("grid")}
                        className={`inline-flex h-10 items-center justify-center gap-2 rounded px-3 text-sm font-bold transition-colors ${
                          viewMode === "grid" ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/70 hover:text-foreground"
                        }`}
                      >
                        <Grid3x3 className="h-4 w-4" />
                        <span className="hidden sm:inline">Card View</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode("list")}
                        className={`inline-flex h-10 items-center justify-center gap-2 rounded px-3 text-sm font-bold transition-colors ${
                          viewMode === "list" ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/70 hover:text-foreground"
                        }`}
                      >
                        <List className="h-4 w-4" />
                        <span className="hidden sm:inline">List View</span>
                      </button>
                    </div>
                  </div>
                </Card>
              </MotionReveal>
            )}

            {isAuthenticated && cartItems.length > 0 && (
              <MotionReveal delay={80}>
                <Card className="rounded-2xl border-sidebar-border bg-sidebar p-4 text-sidebar-foreground shadow-xl shadow-primary/10">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center justify-center gap-3 sm:justify-start">
                      <ShoppingCart className="h-5 w-5 text-sidebar-primary" />
                      <span className="font-bold">{cartItems.length} items in cart</span>
                      <span className="hidden text-sidebar-foreground/55 sm:inline">|</span>
                      <span className="font-display text-xl font-black text-sidebar-primary">£{totalAmount.toFixed(2)}</span>
                    </div>
                    <Button className="h-11 rounded-md bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90" onClick={openCheckout}>
                      Place Order
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              </MotionReveal>
            )}
          </div>
        </div>
      </section>

      <section className={`bg-background px-5 sm:px-8 lg:px-10 ${isAuthenticated ? "py-6 lg:py-8" : "py-10 lg:py-14"}`}>
        <div className="mx-auto max-w-7xl">
          {isLoading ? (
            <LoadingGrid />
          ) : isAuthenticated && viewMode === "list" ? (
            <ProductList products={products} cart={cart} onQuantityChange={handleQuantityChange} />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product, index) => (
                <MotionReveal delay={index * 45} key={product.id} variant="scale">
                  <ProductCard
                    product={product}
                    quantity={cart[product.id] || 0}
                    onQuantityChange={handleQuantityChange}
                    isAuthenticated={isAuthenticated}
                  />
                </MotionReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {showCheckout && (
        <CheckoutModal
          addresses={currentUser?.addresses ?? []}
          cartItems={cartItems}
          deliveryAddress={deliveryAddress}
          isProcessing={createOrderMutation.isPending}
          notes={notes}
          onClose={() => setShowCheckout(false)}
          onConfirm={handleCheckout}
          onDeliveryAddressChange={setDeliveryAddress}
          onNotesChange={setNotes}
          onPaymentMethodChange={setPaymentMethod}
          onRemove={(productId) => handleQuantityChange(productId, 0)}
          paymentMethod={paymentMethod}
          totalAmount={totalAmount}
        />
      )}
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="h-[420px] animate-pulse rounded-lg bg-secondary" />
      ))}
    </div>
  );
}

function DealerMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/80 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-normal text-foreground">{value}</p>
    </div>
  );
}

function parsePreloadedCart(value: string): Cart {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return {};

    return parsed.reduce<Cart>((cart, entry) => {
      if (!Array.isArray(entry)) return cart;
      const [productId, rawQuantity] = entry;
      const quantity = Number(rawQuantity);
      if (typeof productId === "string" && Number.isFinite(quantity) && quantity > 0) {
        cart[productId] = Math.floor(quantity);
      }
      return cart;
    }, {});
  } catch {
    return {};
  }
}

function ProductList({
  cart,
  onQuantityChange,
  products,
}: {
  cart: Cart;
  onQuantityChange: (productId: string, quantity: number) => void;
  products: Product[];
}) {
  return (
    <MotionReveal>
      <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-xl shadow-primary/5">
        <div className="hidden grid-cols-[minmax(360px,1fr)_170px_90px_148px_116px] items-center gap-4 border-b border-border bg-muted/60 px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-muted-foreground xl:grid">
          <span>Product</span>
          <span>Category</span>
          <span>Weight</span>
          <span className="text-center">Quantity</span>
          <span className="text-center">Action</span>
        </div>
        <div className="divide-y divide-border">
          {products.map((product) => (
            <ProductTableRow
              key={product.id}
              product={product}
              quantity={cart[product.id] || 0}
              onQuantityChange={onQuantityChange}
            />
          ))}
        </div>
      </Card>
    </MotionReveal>
  );
}

function ProductTableRow({
  onQuantityChange,
  product,
  quantity,
}: {
  onQuantityChange: (productId: string, quantity: number) => void;
  product: Product;
  quantity: number;
}) {
  const isOutOfStock = product.stockStatus === "out_of_stock";

  return (
    <article className="grid gap-4 px-5 py-4 transition-colors hover:bg-muted/35 xl:grid-cols-[minmax(360px,1fr)_170px_90px_148px_116px] xl:items-center">
      <div className="flex min-w-0 items-center gap-4">
        <ProductImage className="h-16 w-16 flex-shrink-0 rounded-xl" product={product} />
        <div className="min-w-0">
          <p className="truncate text-lg font-black leading-tight tracking-normal text-foreground">{product.name}</p>
          <p className="mt-1 line-clamp-1 max-w-3xl text-sm font-semibold leading-5 text-muted-foreground">{product.description}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 xl:block">
        <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground xl:hidden">Category</span>
        <Badge className="max-w-full justify-center whitespace-normal rounded-full border-border bg-secondary px-3 py-1 text-center text-xs font-black leading-4 text-secondary-foreground shadow-sm">
          {product.category}
        </Badge>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm font-black text-muted-foreground xl:block">
        <span className="text-xs font-black uppercase tracking-[0.12em] xl:hidden">Weight</span>
        <span>{product.weight}</span>
      </div>

      <div className="flex items-center justify-between gap-3 xl:justify-center">
        <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground xl:hidden">Quantity</span>
        <QuantityControl compact disabled={isOutOfStock} onQuantityChange={(value) => onQuantityChange(product.id, value)} quantity={quantity} />
      </div>

      <div className="flex justify-end xl:justify-center">
        {isOutOfStock ? (
          <span className="text-sm font-bold text-destructive">Out of Stock</span>
        ) : (
          <Button className="h-10 w-full rounded-xl px-3 text-sm xl:w-[104px]" onClick={() => onQuantityChange(product.id, quantity + 1)}>
            <ShoppingCart className="h-4 w-4" />
            Add
          </Button>
        )}
      </div>
    </article>
  );
}

function ProductCard({
  isAuthenticated,
  onQuantityChange,
  product,
  quantity,
}: {
  isAuthenticated: boolean;
  onQuantityChange: (productId: string, quantity: number) => void;
  product: Product;
  quantity: number;
}) {
  const isOutOfStock = product.stockStatus === "out_of_stock";

  return (
    <Card className="motion-card flex h-full flex-col overflow-hidden rounded-lg border-border bg-card shadow-sm shadow-primary/5 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/10">
      <div className="relative overflow-hidden bg-secondary">
        <ProductImage className="aspect-[1.18] w-full" product={product} />
        {product.category && <Badge className="absolute right-3 top-3 border-primary/15 bg-card/90 text-foreground backdrop-blur-sm">{product.category}</Badge>}
        {product.stockStatus === "low_stock" && <StockBadge className="absolute left-3 top-3 bg-sidebar-primary text-sidebar-primary-foreground">Low Stock</StockBadge>}
        {isOutOfStock && <StockBadge className="absolute left-3 top-3 bg-destructive text-destructive-foreground">Out of Stock</StockBadge>}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex-1">
          <h3 className="font-display text-2xl font-black leading-tight text-foreground">{product.name}</h3>
          {product.weight && <p className="mt-2 text-sm font-bold text-primary">{product.weight}</p>}
          {product.description && <p className="mt-4 line-clamp-2 text-sm font-medium leading-6 text-muted-foreground">{product.description}</p>}
        </div>

        {isAuthenticated ? (
          <div className="mt-6">
            {!isOutOfStock ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <QuantityControl onQuantityChange={(value) => onQuantityChange(product.id, value)} quantity={quantity} />
                <Button className="h-11 flex-1 rounded-md" onClick={() => onQuantityChange(product.id, quantity + 1)}>
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </Button>
              </div>
            ) : (
              <Button className="h-11 w-full rounded-md" disabled variant="secondary">
                Out of Stock
              </Button>
            )}
          </div>
        ) : (
          <Card className="mt-6 rounded-lg border-primary/15 bg-secondary/70 p-4 shadow-none">
            <div className="mb-3 flex items-center justify-center gap-2 text-sm font-black text-foreground">
              <Lock className="h-4 w-4 text-primary" />
              Sign in to add items
            </div>
            <Button asChildShim className="h-10 w-full rounded-md bg-transparent text-primary hover:bg-background" variant="outline">
              <Link href={loginHref}>
                <LogIn className="h-4 w-4" />
                Dealer Login
              </Link>
            </Button>
          </Card>
        )}
      </div>
    </Card>
  );
}

function ProductImage({ className, product }: { className: string; product: Product }) {
  return product.imageUrl ? (
    <img alt={product.name} className={`${className} object-cover`} src={product.imageUrl} />
  ) : (
    <div className={`${className} grid place-items-center bg-secondary text-primary`}>
      <span className="font-display text-5xl font-black">{product.name.charAt(0)}</span>
    </div>
  );
}

function QuantityControl({
  compact = false,
  disabled = false,
  onQuantityChange,
  quantity,
}: {
  compact?: boolean;
  disabled?: boolean;
  onQuantityChange: (quantity: number) => void;
  quantity: number;
}) {
  return (
    <div className={`flex items-center justify-between rounded-xl border border-border bg-background/70 p-1 ${compact ? "w-[124px]" : "mx-auto w-[132px]"}`}>
      <button
        type="button"
        onClick={() => onQuantityChange(Math.max(0, quantity - 1))}
        disabled={disabled || !quantity}
        className={`${compact ? "h-8 w-8" : "h-9 w-9"} grid place-items-center rounded-lg text-primary transition-colors hover:bg-secondary disabled:opacity-35`}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-10 text-center text-sm font-black text-foreground">{quantity}</span>
      <button
        type="button"
        onClick={() => onQuantityChange(quantity + 1)}
        disabled={disabled}
        className={`${compact ? "h-8 w-8" : "h-9 w-9"} grid place-items-center rounded-lg text-primary transition-colors hover:bg-secondary disabled:opacity-35`}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function CheckoutModal({
  addresses,
  cartItems,
  deliveryAddress,
  isProcessing,
  notes,
  onClose,
  onConfirm,
  onDeliveryAddressChange,
  onNotesChange,
  onPaymentMethodChange,
  onRemove,
  paymentMethod,
  totalAmount,
}: {
  addresses: Address[];
  cartItems: ReturnType<typeof calculateOrderItems>;
  deliveryAddress: string;
  isProcessing: boolean;
  notes: string;
  onClose: () => void;
  onConfirm: () => void;
  onDeliveryAddressChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onPaymentMethodChange: (value: PaymentMethod) => void;
  onRemove: (productId: string) => void;
  paymentMethod: PaymentMethod;
  totalAmount: number;
}) {
  const selectedAddressValue = addresses.some((address) => address.address === deliveryAddress) ? deliveryAddress : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sidebar/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <Card
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border-border bg-card shadow-2xl shadow-sidebar/30"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-border bg-secondary/65 p-6">
          <h2 className="font-display text-3xl font-black text-foreground">Order Summary</h2>
        </div>

        <div className="space-y-6 p-6">
          <div className="space-y-2">
            {cartItems.map((item) => (
              <div key={item.productId} className="flex items-center justify-between gap-4 border-b border-border/70 py-3 last:border-b-0">
                <div>
                  <p className="font-bold text-foreground">{item.productName}</p>
                  <p className="text-sm font-medium text-muted-foreground">{item.quantity} items</p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(item.productId)}
                  className="grid h-9 w-9 place-items-center rounded-md text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-secondary p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-lg font-black text-foreground">Total Amount</span>
              <span className="font-display text-3xl font-black text-primary">£{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-foreground/70">Payment Method</span>
            <Combobox
              value={paymentMethod}
              onChange={(value) => onPaymentMethodChange(value as PaymentMethod)}
              options={paymentMethodOptions}
              placeholder="Payment method"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-foreground/70">Saved Delivery Address</span>
            <Combobox
              value={selectedAddressValue}
              onChange={onDeliveryAddressChange}
              options={
                addresses.length === 0
                  ? [{ disabled: true, label: "No saved addresses in profile", value: "" }]
                  : [
                      { label: "Custom address", value: "" },
                      ...addresses.map((address, index) => ({
                        label: address.title || `Address ${index + 1}`,
                        value: address.address,
                      })),
                    ]
              }
              placeholder="Saved address"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-foreground/70">Delivery Address *</span>
            <textarea
              value={deliveryAddress}
              onChange={(event) => onDeliveryAddressChange(event.target.value)}
              placeholder="Enter delivery address..."
              className={`${fieldClassName} min-h-24 py-3`}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-foreground/70">Order Notes (Optional)</span>
            <textarea
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
              placeholder="Write any special requests..."
              className={`${fieldClassName} min-h-20 py-3`}
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button className="h-11 flex-1 rounded-md" disabled={isProcessing} onClick={onClose} variant="outline">
              Cancel
            </Button>
            <Button className="h-11 flex-1 rounded-md" disabled={isProcessing} onClick={onConfirm}>
              {isProcessing ? (
                "Processing..."
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Confirm Order
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

const fieldClassName =
  "w-full rounded-md border border-border bg-background/70 px-3 py-2 text-sm font-medium text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground/65";

function StockBadge({ children, className }: { children: string; className: string }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-black shadow-lg ${className}`}>{children}</span>;
}

function CoffeeBranchAsset({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: "block",
        maskImage: "url('/assets/coffee-branch-clean.svg')",
        maskPosition: "center",
        maskRepeat: "no-repeat",
        maskSize: "contain",
        WebkitMaskImage: "url('/assets/coffee-branch-clean.svg')",
        WebkitMaskPosition: "center",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
      }}
    />
  );
}
