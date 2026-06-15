"use client";

import MotionReveal from "@/components/MotionReveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getHarvestApi } from "@/lib/harvest-api";
import { calculateOrderItems, calculateOrderTotal, type PaymentMethod, type Product, type User } from "@harvest/domain";
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

const loginHref = "/login?next=%2Fproducts";

export default function CatalogV2Workspace() {
  const api = useMemo(() => getHarvestApi(), []);
  const [cart, setCart] = useState<Cart>({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const syncAuth = () => {
      const authenticated = window.localStorage.getItem("harvest_mock_auth") === "logged-in";
      setIsAuthenticated(authenticated);
      if (!authenticated) {
        setCurrentUser(null);
        return;
      }

      void api.getCurrentUser().then((user) => {
        setCurrentUser(user);
        if (user?.addresses?.length === 1) {
          setDeliveryAddress(user.addresses[0].address);
        }
      });
    };

    syncAuth();
    window.addEventListener("harvest_mock_auth_changed", syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener("harvest_mock_auth_changed", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, [api]);

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      setProducts(await api.getProducts());
      setIsLoading(false);
    };

    void loadProducts();
  }, [api]);

  const cartItems = useMemo(() => calculateOrderItems(products, cart), [cart, products]);
  const totalAmount = calculateOrderTotal(cartItems);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    setCart((current) => {
      const next = { ...current };
      if (newQuantity === 0) delete next[productId];
      else next[productId] = newQuantity;
      return next;
    });
  };

  const handleCheckout = async () => {
    if (!deliveryAddress.trim()) {
      window.alert("Lütfen teslimat adresi seçin veya girin");
      return;
    }

    setIsProcessing(true);
    try {
      const order = await api.createOrder({
        customerEmail: currentUser?.email ?? "dealer@example.com",
        customerName: currentUser?.fullName || currentUser?.companyName || currentUser?.email,
        items: cartItems,
        paymentMethod,
        deliveryAddress,
        notes,
      });

      setCart({});
      setDeliveryAddress("");
      setNotes("");
      setShowCheckout(false);
      window.location.href = `/orderdetails?id=${order.id}`;
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="harvest-theme overflow-hidden bg-background text-foreground">
      <section className="relative px-5 pb-12 pt-32 sm:px-8 lg:px-10">
        <CoffeeBranchAsset className="absolute -left-20 top-10 h-80 w-80 bg-primary/[0.085]" />
        <CoffeeBranchAsset className="absolute -right-24 bottom-0 hidden h-72 w-72 -scale-x-100 bg-primary/[0.06] lg:block" />
        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <MotionReveal>
            <p className="mb-5 text-xs font-black uppercase tracking-[0.34em] text-primary">Wholesale Coffee Collection</p>
            <h1 className="font-display max-w-3xl text-5xl font-black leading-tight text-foreground sm:text-6xl">
              Premium Coffee Collection
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-muted-foreground">
              Carefully sourced coffee and wholesale supplies
            </p>
          </MotionReveal>

          {!isAuthenticated && (
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
          )}
        </div>
      </section>

      <section className="relative bg-card px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4">
            {isAuthenticated && (
              <MotionReveal>
                <Card className="rounded-lg border-border bg-background/70 p-3 shadow-none">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 px-2">
                      <PackageCheck className="h-5 w-5 text-primary" />
                      <p className="text-sm font-bold text-foreground">{products.length} products available</p>
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
                <Card className="rounded-lg border-sidebar-border bg-sidebar p-4 text-sidebar-foreground shadow-xl shadow-primary/10">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center justify-center gap-3 sm:justify-start">
                      <ShoppingCart className="h-5 w-5 text-sidebar-primary" />
                      <span className="font-bold">{cartItems.length} items in cart</span>
                      <span className="hidden text-sidebar-foreground/55 sm:inline">|</span>
                      <span className="font-display text-xl font-black text-sidebar-primary">£{totalAmount.toFixed(2)}</span>
                    </div>
                    <Button className="h-11 rounded-md bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90" onClick={() => setShowCheckout(true)}>
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

      <section className="bg-background px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
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
          cartItems={cartItems}
          deliveryAddress={deliveryAddress}
          isProcessing={isProcessing}
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
      <Card className="overflow-hidden rounded-lg border-border bg-card shadow-xl shadow-primary/5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="border-b border-border bg-secondary/70">
              <tr>
                <th className="p-4 text-left text-sm font-black text-foreground">Product</th>
                <th className="p-4 text-left text-sm font-black text-foreground">Category</th>
                <th className="p-4 text-left text-sm font-black text-foreground">Weight</th>
                <th className="p-4 text-center text-sm font-black text-foreground">Quantity</th>
                <th className="p-4 text-center text-sm font-black text-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <ProductTableRow
                  key={product.id}
                  product={product}
                  quantity={cart[product.id] || 0}
                  onQuantityChange={onQuantityChange}
                />
              ))}
            </tbody>
          </table>
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
    <tr className="border-b border-border/70 transition-colors last:border-b-0 hover:bg-secondary/35">
      <td className="p-4">
        <div className="flex items-center gap-4">
          <ProductImage className="h-16 w-16 rounded-md" product={product} />
          <div className="min-w-0">
            <p className="font-display text-lg font-black text-foreground">{product.name}</p>
            <p className="mt-1 line-clamp-1 text-xs font-medium text-muted-foreground">{product.description}</p>
          </div>
        </div>
      </td>
      <td className="p-4">
        <Badge className="border-primary/10 bg-secondary text-secondary-foreground">{product.category}</Badge>
      </td>
      <td className="p-4 text-sm font-medium text-muted-foreground">{product.weight}</td>
      <td className="p-4">
        <QuantityControl disabled={isOutOfStock} onQuantityChange={(value) => onQuantityChange(product.id, value)} quantity={quantity} />
      </td>
      <td className="p-4 text-center">
        {isOutOfStock ? (
          <span className="text-sm font-bold text-destructive">Out of Stock</span>
        ) : (
          <Button className="h-10 rounded-md" onClick={() => onQuantityChange(product.id, quantity + 1)}>
            <ShoppingCart className="h-4 w-4" />
            Add to Cart
          </Button>
        )}
      </td>
    </tr>
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
  disabled = false,
  onQuantityChange,
  quantity,
}: {
  disabled?: boolean;
  onQuantityChange: (quantity: number) => void;
  quantity: number;
}) {
  return (
    <div className="mx-auto flex w-[132px] items-center justify-between rounded-md border border-border bg-background/70 p-1">
      <button
        type="button"
        onClick={() => onQuantityChange(Math.max(0, quantity - 1))}
        disabled={disabled || !quantity}
        className="grid h-9 w-9 place-items-center rounded text-primary transition-colors hover:bg-secondary disabled:opacity-35"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-10 text-center text-sm font-black text-foreground">{quantity}</span>
      <button
        type="button"
        onClick={() => onQuantityChange(quantity + 1)}
        disabled={disabled}
        className="grid h-9 w-9 place-items-center rounded text-primary transition-colors hover:bg-secondary disabled:opacity-35"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function CheckoutModal({
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
            <select
              value={paymentMethod}
              onChange={(event) => onPaymentMethodChange(event.target.value as PaymentMethod)}
              className={fieldClassName}
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="credit_card">Credit Card</option>
              <option value="paypal">PayPal</option>
              <option value="cash_on_delivery">Cash on Delivery</option>
            </select>
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
