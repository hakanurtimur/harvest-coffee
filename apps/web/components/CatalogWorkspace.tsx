"use client";

import { getHarvestApi, hasHarvestSession } from "@/lib/harvest-api";
import { useV2Enabled } from "@/lib/v2-pages";
import { calculateOrderItems, calculateOrderTotal, Product, User, type PaymentMethod } from "@/lib/domain";
import { Combobox } from "@/components/ui/combobox";
import { requestToast } from "@/components/ui/sonner";
import {
  ArrowRight,
  Building2,
  Check,
  CreditCard,
  Grid3x3,
  List,
  Lock,
  LogIn,
  Minus,
  Plus,
  RotateCw,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import CatalogV2Workspace from "./CatalogV2Workspace";

type Cart = Record<string, number>;
const paymentMethodOptions: Array<{ label: string; value: PaymentMethod }> = [
  { label: "Bank Transfer", value: "bank_transfer" },
  { label: "Credit Card", value: "credit_card" },
  { label: "PayPal", value: "paypal" },
  { label: "Cash on Delivery", value: "cash_on_delivery" },
];

export default function CatalogWorkspace() {
  const v2Enabled = useV2Enabled("/products");
  const api = useMemo(() => getHarvestApi(), []);
  const [cart, setCart] = useState<Cart>({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const syncAuth = () => {
      const authenticated = hasHarvestSession();
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

  if (v2Enabled) {
    return <CatalogV2Workspace />;
  }

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
      requestToast.error({ title: "Delivery address is required." });
      return;
    }

    setIsProcessing(true);
    try {
      const order = await api.createOrder({
        customerEmail: currentUser?.email ?? "dealer@example.com",
        customerName: currentUser?.fullName || currentUser?.companyName || currentUser?.email,
        items: cartItems,
        paymentMethod: paymentMethod as "bank_transfer" | "credit_card" | "paypal" | "cash_on_delivery",
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

  const loginHref = "/login?next=%2Fproducts";

  return (
    <div className="space-y-8 min-h-screen md:pb-0 pb-24">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-amber-900 mb-3" style={{ fontFamily: "Georgia, serif" }}>
          Premium Coffee Collection
        </h1>
        <p className="text-amber-700 text-lg">Carefully sourced coffee and wholesale supplies</p>

        {!isAuthenticated && (
          <div className="mt-6">
            <div className="max-w-2xl mx-auto bg-gradient-to-r from-blue-50 to-amber-50 border-2 border-amber-200 rounded-xl">
              <div className="p-6">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Lock className="w-5 h-5 text-amber-700" />
                  <p className="text-lg font-semibold text-amber-900">Login to see prices and place orders</p>
                </div>
                <a
                  href={loginHref}
                  className="inline-flex items-center justify-center rounded-md bg-amber-900 hover:bg-amber-800 text-white px-4 py-2 font-semibold transition-colors"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Dealer Login
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {isAuthenticated && (
          <div className="border border-amber-200 rounded-xl bg-white">
            <div className="p-3">
              <div className="flex gap-2 justify-center md:justify-start">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                    viewMode === "grid" ? "bg-amber-900 text-white hover:bg-amber-800" : "border border-amber-200 text-amber-900 hover:bg-amber-50"
                  }`}
                >
                  <Grid3x3 className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Card View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                    viewMode === "list" ? "bg-amber-900 text-white hover:bg-amber-800" : "border border-amber-200 text-amber-900 hover:bg-amber-50"
                  }`}
                >
                  <List className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">List View</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {isAuthenticated && cartItems.length > 0 && (
          <div className="bg-gradient-to-r from-amber-900 to-amber-800 border-0 shadow-lg rounded-xl">
            <div className="p-3 md:p-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-white">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="text-sm md:text-base font-semibold">{cartItems.length} items in cart</span>
                </div>
                <button
                  onClick={() => setShowCheckout(true)}
                  className="inline-flex items-center justify-center rounded-md bg-white text-amber-900 hover:bg-amber-50 px-4 py-2 text-sm font-semibold transition-colors w-full sm:w-auto"
                  type="button"
                >
                  Place Order
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="h-96 bg-gray-100 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : isAuthenticated && viewMode === "list" ? (
        <div className="border border-amber-100 rounded-xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-amber-50 to-orange-50 border-b-2 border-amber-200">
                <tr>
                  <th className="text-left p-4 font-semibold text-amber-900">Product</th>
                  <th className="text-left p-4 font-semibold text-amber-900">Category</th>
                  <th className="text-left p-4 font-semibold text-amber-900">Weight</th>
                  <th className="text-center p-4 font-semibold text-amber-900">Quantity</th>
                  <th className="text-center p-4 font-semibold text-amber-900">Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <ProductTableRow key={product.id} product={product} quantity={cart[product.id] || 0} onQuantityChange={handleQuantityChange} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              quantity={cart[product.id] || 0}
              onQuantityChange={handleQuantityChange}
              isAuthenticated={isAuthenticated}
              loginHref={loginHref}
            />
          ))}
        </div>
      )}

      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowCheckout(false)}>
          <div
            onClick={(event) => event.stopPropagation()}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl mx-4"
          >
            <div className="border-b bg-amber-50 p-6">
              <h2 className="text-2xl text-amber-900 font-semibold" style={{ fontFamily: "Georgia, serif" }}>
                Order Summary
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between py-3 border-b">
                    <div className="flex-1">
                      <p className="font-semibold text-amber-900">{item.productName}</p>
                      <p className="text-sm text-gray-600">{item.quantity} items</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.productId, 0)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-amber-900">Total Amount</span>
                  <span className="text-2xl font-bold text-amber-900">£{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-gray-700">Payment Method</span>
                <Combobox
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  options={paymentMethodOptions}
                  placeholder="Payment method"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-gray-700">Delivery Address *</span>
                <textarea
                  value={deliveryAddress}
                  onChange={(event) => setDeliveryAddress(event.target.value)}
                  placeholder="Enter delivery address..."
                  className="min-h-24 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-gray-700">Order Notes (Optional)</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Write any special requests..."
                  className="min-h-20 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20"
                />
              </label>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setShowCheckout(false)}
                  className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="flex-1 rounded-md bg-amber-900 hover:bg-amber-800 text-white px-4 py-2 text-sm font-semibold"
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Confirm Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductTableRow({
  product,
  quantity,
  onQuantityChange,
}: {
  product: Product;
  quantity: number;
  onQuantityChange: (productId: string, quantity: number) => void;
}) {
  const isOutOfStock = product.stockStatus === "out_of_stock";

  return (
    <tr className="border-b border-amber-50 hover:bg-amber-50/50 transition-colors">
      <td className="p-4">
        <div className="flex items-center gap-3">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded-lg" />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-amber-100 flex items-center justify-center text-amber-900 font-bold">
              {product.name.charAt(0)}
            </div>
          )}
          <div>
            <p className="font-semibold text-amber-900">{product.name}</p>
            <p className="text-xs text-gray-600 line-clamp-1">{product.description}</p>
          </div>
        </div>
      </td>
      <td className="p-4">
        <span className="text-sm text-amber-800 bg-amber-100 px-2 py-1 rounded">{product.category}</span>
      </td>
      <td className="p-4 text-gray-700">{product.weight}</td>
      <td className="p-4">
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => onQuantityChange(product.id, Math.max(0, quantity - 1))}
            disabled={isOutOfStock || !quantity}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-amber-300 text-amber-900 disabled:opacity-40"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="w-12 text-center font-semibold text-amber-900">{quantity}</span>
          <button
            type="button"
            onClick={() => onQuantityChange(product.id, quantity + 1)}
            disabled={isOutOfStock}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-amber-300 text-amber-900 disabled:opacity-40"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </td>
      <td className="p-4 text-center">
        {isOutOfStock ? (
          <span className="text-sm text-red-600 font-medium">Out of Stock</span>
        ) : (
          <button
            type="button"
            onClick={() => onQuantityChange(product.id, quantity + 1)}
            className="inline-flex items-center justify-center rounded-md bg-amber-900 hover:bg-amber-800 text-white px-3 py-2 text-sm font-semibold"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Add to Cart
          </button>
        )}
      </td>
    </tr>
  );
}

function ProductCard({
  product,
  quantity,
  onQuantityChange,
  isAuthenticated,
  loginHref,
}: {
  product: Product;
  quantity: number;
  onQuantityChange: (productId: string, quantity: number) => void;
  isAuthenticated: boolean;
  loginHref: string;
}) {
  const isOutOfStock = product.stockStatus === "out_of_stock";

  return (
    <article className="overflow-hidden h-full hover:shadow-xl transition-all duration-300 border border-amber-100 bg-white rounded-xl">
      <div className="relative h-64 bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-amber-800">{product.name.charAt(0)}</div>
        )}
        {product.category && (
          <span className="absolute top-3 right-3 bg-amber-900 text-white border-0 shadow-lg rounded-full px-3 py-1 text-xs font-semibold">
            {product.category}
          </span>
        )}
        {product.stockStatus === "low_stock" && (
          <span className="absolute top-3 left-3 bg-orange-500 text-white border-0 shadow-lg rounded-full px-3 py-1 text-xs font-semibold">
            Low Stock
          </span>
        )}
        {isOutOfStock && (
          <span className="absolute top-3 left-3 bg-red-600 text-white border-0 shadow-lg rounded-full px-3 py-1 text-xs font-semibold">
            Out of Stock
          </span>
        )}
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-amber-900 mb-2" style={{ fontFamily: "Georgia, serif" }}>
          {product.name}
        </h3>
        {product.weight && <p className="text-sm text-amber-700 mb-3">{product.weight}</p>}
        {product.description && <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>}

        {isAuthenticated ? (
          <>
            {!isOutOfStock && (
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-amber-50 rounded-lg">
                  <button
                    type="button"
                    onClick={() => onQuantityChange(product.id, Math.max(0, quantity - 1))}
                    className="inline-flex h-10 w-10 items-center justify-center text-amber-900 hover:bg-amber-100 rounded-md"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-semibold text-amber-900">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => onQuantityChange(product.id, quantity + 1)}
                    className="inline-flex h-10 w-10 items-center justify-center text-amber-900 hover:bg-amber-100 rounded-md"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onQuantityChange(product.id, quantity + 1)}
                  className="flex-1 inline-flex items-center justify-center rounded-md bg-amber-900 hover:bg-amber-800 text-white shadow-md px-3 py-2 font-semibold"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </button>
              </div>
            )}
            {isOutOfStock && (
              <button type="button" disabled className="w-full rounded-md bg-gray-300 text-gray-500 px-4 py-2 font-semibold">
                Out of Stock
              </button>
            )}
          </>
        ) : (
          <div className="bg-gradient-to-r from-blue-50 to-amber-50 border-2 border-amber-200 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-amber-700" />
              <p className="text-sm font-semibold text-amber-900">Sign in to add items</p>
            </div>
            <a
              href={loginHref}
              className="w-full inline-flex items-center justify-center rounded-md border border-amber-900 text-amber-900 hover:bg-amber-50 px-3 py-2 text-sm font-semibold transition-colors"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Dealer Login
            </a>
          </div>
        )}
      </div>
    </article>
  );
}
