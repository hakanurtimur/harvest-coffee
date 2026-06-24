"use client";

import { getHarvestApi, hasHarvestSession } from "@/lib/harvest-api";
import { Order, Product } from "@/lib/domain";
import { useEffect, useMemo, useState } from "react";
import PublicHomeModernWorkspace from "./PublicHomeModernWorkspace";

type CartState = Record<string, number>;

export default function PublicHomeWorkspace() {
  const api = useMemo(() => getHarvestApi(), []);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cart, setCart] = useState<CartState>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const syncAuth = () => {
      setIsAuthenticated(hasHarvestSession());
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

    void api.getCurrentUser().then((user) => {
      if (!user?.email) {
        setOrders([]);
        return;
      }
      void api.getMyOrders(user.email).then(setOrders);
    });
  }, [api, isAuthenticated]);

  const mostOrderedProducts = useMemo(() => {
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
  }, [orders, products]);

  const handleQuickAdd = (productId: string) => {
    if (!isAuthenticated) {
      window.location.href = "/login?next=%2Fproducts";
      return;
    }

    setCart((previousCart) => ({ ...previousCart, [productId]: (previousCart[productId] || 0) + 1 }));
  };

  const featuredProduct = products.find((product) => product.category === "Single Origin" || product.category === "Blend") || products[0];
  const cartQuantity = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);

  return (
    <PublicHomeModernWorkspace
      cartQuantity={cartQuantity}
      featuredProduct={featuredProduct}
      isAuthenticated={isAuthenticated}
      mostOrderedProducts={mostOrderedProducts}
      onQuickAdd={handleQuickAdd}
      products={products}
    />
  );
}
