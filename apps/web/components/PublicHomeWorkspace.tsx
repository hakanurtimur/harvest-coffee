"use client";

import { getHarvestApi } from "@/lib/harvest-api";
import { useV2Enabled } from "@/lib/v2-pages";
import { Order, Product } from "@/lib/domain";
import { ArrowRight, Award, Coffee, Leaf, Plus, ShoppingCart, Star, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PublicHomeV2Workspace from "./PublicHomeV2Workspace";

type CartState = Record<string, number>;

export default function PublicHomeWorkspace() {
  const api = useMemo(() => getHarvestApi(), []);
  const v2Enabled = useV2Enabled("/home");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cart, setCart] = useState<CartState>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const syncAuth = () => {
      setIsAuthenticated(window.localStorage.getItem("harvest_mock_auth") === "logged-in");
    };

    syncAuth();
    window.addEventListener("harvest_mock_auth_changed", syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener("harvest_mock_auth_changed", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  useEffect(() => {
    void api.getProducts().then(setProducts);
  }, [api]);

  useEffect(() => {
    if (!isAuthenticated) {
      setOrders([]);
      return;
    }

    void api.getOrders().then(setOrders);
  }, [api, isAuthenticated]);

  const getMostOrderedProducts = () => {
    if (!orders.length || !products.length) return [];

    const productCounts: Record<string, { count: number; quantity: number }> = {};
    orders.forEach((order) => {
      order.items?.forEach((item) => {
        if (!productCounts[item.productId]) productCounts[item.productId] = { count: 0, quantity: 0 };
        productCounts[item.productId].count += 1;
        productCounts[item.productId].quantity += item.quantity;
      });
    });

    return Object.entries(productCounts)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 4)
      .map(([productId]) => products.find((product) => product.id === productId))
      .filter((product): product is Product => Boolean(product));
  };

  const handleQuickAdd = (productId: string) => {
    if (!isAuthenticated) {
      window.location.href = "/login?next=%2Fproducts";
      return;
    }

    setCart((previousCart) => ({ ...previousCart, [productId]: (previousCart[productId] || 0) + 1 }));
  };

  const mostOrderedProducts = getMostOrderedProducts();
  const featuredProduct = products.find((product) => product.category === "Single Origin" || product.category === "Blend") || products[0];
  const cartQuantity = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);

  if (v2Enabled) {
    return (
      <PublicHomeV2Workspace
        cartQuantity={cartQuantity}
        featuredProduct={featuredProduct}
        isAuthenticated={isAuthenticated}
        mostOrderedProducts={mostOrderedProducts}
        onQuickAdd={handleQuickAdd}
        products={products}
      />
    );
  }

  return (
    <div className="min-h-screen">
      <section className="relative min-h-[90vh] flex items-center overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 -mt-8">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=80')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-transparent" />

        <div className="relative z-10 px-8 sm:px-16 lg:px-24 max-w-3xl">
          <div className="mb-6">
            <span className="text-xs font-bold tracking-[0.2em] text-amber-400 uppercase">Our Philosophy · Exceptional Quality</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight" style={{ fontFamily: "Georgia, serif" }}>
            It all began with a modest concept: Create <em className="text-amber-400 not-italic">amazing</em> coffee
          </h1>

          <p className="text-xl text-gray-200 mb-10">
            Coffee is our craft, our ritual, our passion and we want to share it with you.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-md bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-4 text-base transition-colors"
            >
              Discover Products
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center rounded-md border border-white text-white bg-white/10 hover:bg-white/20 px-8 py-4 text-base font-semibold transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>

        <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 flex-col items-center gap-2">
          <span className="text-white/50 text-xs tracking-[0.3em] uppercase rotate-90 whitespace-nowrap">Scroll Down</span>
          <div className="w-px h-16 bg-white/30" />
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-xs font-bold tracking-[0.2em] text-amber-600 uppercase mb-3 block">
                Because We Love Coffee
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-amber-900 mb-6" style={{ fontFamily: "Georgia, serif" }}>
                Our <em className="not-italic text-amber-600">Mission</em>
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                Everything we do is a matter of heart, body and soul. Our mission is to provide sustainably sourced, hand-picked,
                micro-roasted quality coffee. Great coffee is our passion and we want to share it with you.
              </p>
              <Link
                href="/about"
                className="inline-flex items-center justify-center rounded-md border border-amber-900 text-amber-900 hover:bg-amber-50 px-4 py-2 font-semibold transition-colors"
              >
                Learn More
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>

            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80"
                alt="Coffee beans"
                className="rounded-2xl shadow-2xl w-full h-80 object-cover"
              />
              <div className="absolute -bottom-6 -left-6 bg-amber-900 text-white p-6 rounded-2xl shadow-xl">
                <p className="text-3xl font-bold">15+</p>
                <p className="text-amber-200 text-sm">Years of Excellence</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-amber-900 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { icon: Leaf, title: "Sustainably Sourced", desc: "Fairtrade certified beans from ethical farms" },
              { icon: Award, title: "Micro-Roasted", desc: "Hand-crafted roasting for peak flavour" },
              { icon: Star, title: "B2B Excellence", desc: "Tailored wholesale programs for your business" },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-center gap-3">
                <div className="p-3 bg-amber-800 rounded-full">
                  <item.icon className="w-7 h-7 text-amber-300" />
                </div>
                <h3 className="text-lg font-bold">{item.title}</h3>
                <p className="text-amber-200 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&q=80')" }}
            />
            <div className="absolute inset-0 bg-black/60" />
            <div className="relative z-10 py-20 px-10 text-center text-white">
              <span className="text-xs font-bold tracking-[0.2em] text-amber-400 uppercase mb-3 block">Become a Partner</span>
              <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "Georgia, serif" }}>
                Explore <em className="not-italic text-amber-400">Wholesale</em>
              </h2>
              <p className="text-gray-200 text-lg mb-8 max-w-xl mx-auto">
                Personalised to your specific needs. We help build coffee programs to grow your business.
              </p>
              {isAuthenticated ? (
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center rounded-md bg-amber-500 hover:bg-amber-400 text-black font-bold px-10 py-4 transition-colors"
                >
                  Order Now <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              ) : (
                <Link
                  href="/login?next=%2Fproducts"
                  className="inline-flex items-center justify-center rounded-md bg-amber-500 hover:bg-amber-400 text-black font-bold px-10 py-4 transition-colors"
                >
                  Get in Touch <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {featuredProduct && (
        <section className="py-16 px-4 bg-amber-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <span className="text-xs font-bold tracking-[0.2em] text-amber-600 uppercase mb-2 block">
                Staff Favourite · Featured Coffee
              </span>
              <h2 className="text-4xl font-bold text-amber-900" style={{ fontFamily: "Georgia, serif" }}>
                {featuredProduct.name}
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                {featuredProduct.imageUrl ? (
                  <img src={featuredProduct.imageUrl} alt={featuredProduct.name} className="rounded-2xl shadow-xl w-full h-96 object-cover" />
                ) : (
                  <div className="rounded-2xl bg-amber-200 w-full h-96 flex items-center justify-center">
                    <Coffee className="w-24 h-24 text-amber-700" />
                  </div>
                )}
              </div>
              <div>
                <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 mb-4 px-2.5 py-0.5 text-xs font-semibold">
                  {featuredProduct.category}
                </span>
                <p className="text-gray-600 text-lg leading-relaxed mb-6">{featuredProduct.description}</p>
                {isAuthenticated && (
                  <p className="text-3xl font-bold text-amber-900 mb-6">£{featuredProduct.price?.toFixed(2)}</p>
                )}
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center rounded-md bg-amber-900 hover:bg-amber-800 text-white px-8 py-2 font-semibold transition-colors"
                >
                  Discover Products <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {isAuthenticated && mostOrderedProducts.length > 0 && (
        <section className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="w-6 h-6 text-amber-600" />
                <h2 className="text-3xl font-bold text-amber-900" style={{ fontFamily: "Georgia, serif" }}>
                  Quick Order
                </h2>
              </div>
              <p className="text-gray-500">Your most frequently ordered products — one click to reorder</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {mostOrderedProducts.map((product) => (
                <article key={product.id} className="border border-amber-100 rounded-xl bg-white hover:shadow-lg transition-all overflow-hidden">
                  {product.imageUrl && (
                    <div className="h-40 overflow-hidden rounded-t-xl bg-gray-50">
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-amber-900 text-sm">{product.name}</h3>
                      <p className="text-xs text-gray-500">
                        {product.category}
                        {product.weight ? ` · ${product.weight}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-amber-900">£{product.price?.toFixed(2)}</span>
                      <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-xs font-semibold">
                        Popular
                      </span>
                    </div>
                    <button
                      onClick={() => handleQuickAdd(product.id)}
                      className="w-full inline-flex items-center justify-center rounded-md bg-amber-900 hover:bg-amber-800 text-white px-3 py-2 text-sm font-semibold transition-colors"
                      type="button"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Quick Add
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {cartQuantity > 0 && (
              <div className="mt-6">
                <div className="bg-gradient-to-r from-amber-900 to-amber-800 border-0 shadow-lg rounded-xl">
                  <div className="p-4">
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" />
                        <span className="font-semibold">{cartQuantity} items added</span>
                      </div>
                      <Link
                        href="/products"
                        className="inline-flex items-center justify-center rounded-md bg-white text-amber-900 hover:bg-amber-50 px-4 py-2 font-semibold transition-colors"
                      >
                        Continue to Cart <ShoppingCart className="w-4 h-4 ml-2" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
