"use client";

import { Card } from "@/components/ui/card";
import { getHarvestApi } from "@/lib/harvest-api";
import { getHarvestIntegrations } from "@/lib/integrations";
import type { Product } from "@/lib/domain";
import { AlertTriangle, Edit2, Package, Save, TrendingDown, TrendingUp, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type EditValues = {
  stockQuantity: string;
  lowStockThreshold: string;
};

export default function StockManagementV2Workspace() {
  const api = useMemo(() => getHarvestApi(), []);
  const integrations = useMemo(() => getHarvestIntegrations(), []);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<EditValues>({ stockQuantity: "0", lowStockThreshold: "10" });
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const loadProducts = async () => {
    setIsLoading(true);
    const nextProducts = await api.getProducts();
    setProducts(nextProducts);
    setIsLoading(false);
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const lowStockProducts = products.filter((product) => product.stockQuantity <= product.lowStockThreshold && product.stockQuantity > 0);
  const outOfStockProducts = products.filter((product) => product.stockQuantity === 0);
  const totalStockValue = products.reduce((sum, product) => sum + product.stockQuantity * product.price, 0);

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setEditValues({
      stockQuantity: String(product.stockQuantity || 0),
      lowStockThreshold: String(product.lowStockThreshold || 10),
    });
    setMessage("");
  };

  const handleSave = async (product: Product) => {
    setSavingId(product.id);
    setMessage("");
    const stockQuantity = Number.parseInt(editValues.stockQuantity, 10) || 0;
    const lowStockThreshold = Number.parseInt(editValues.lowStockThreshold, 10) || 0;

    try {
      const updated = await api.updateProduct(product.id, {
        stockQuantity,
        lowStockThreshold,
        stockStatus: getStockStatus(stockQuantity, lowStockThreshold),
      });
      setProducts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setEditingId(null);
      setEditValues({ stockQuantity: "0", lowStockThreshold: "10" });
      if (updated.stockQuantity <= updated.lowStockThreshold && updated.stockQuantity > 0) {
        const notification = await integrations.sendLowStockEmail({
          lowStockThreshold: updated.lowStockThreshold,
          productName: updated.name,
          stockQuantity: updated.stockQuantity,
        });
        setMessage(notification.message);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Stock could not be updated.");
    } finally {
      setSavingId(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({ stockQuantity: "0", lowStockThreshold: "10" });
  };

  return (
    <div className="space-y-5 text-[#3a2619]">
      <section className="rounded-lg border border-[#e8daca] bg-[#fffdf8] p-5 shadow-sm shadow-[#8a461c]/5 md:p-6">
        <h1 className="text-3xl font-black tracking-normal text-[#3a2619] md:text-4xl">Stock Management</h1>
        <p className="mt-2 text-sm font-semibold text-[#8f7461]">Product stock levels and management</p>
      </section>

      {message && (
        <section className="rounded-lg border border-[#ead7b8] bg-[#fff8e8] px-4 py-3 text-sm font-bold text-[#7c3514]">
          {message}
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Products" value={String(products.length)} icon={Package} tone="blue" />
        <SummaryCard label="Low Stock" value={String(lowStockProducts.length)} icon={AlertTriangle} tone="yellow" />
        <SummaryCard label="Out of Stock" value={String(outOfStockProducts.length)} icon={TrendingDown} tone="red" />
        <SummaryCard label="Stock Value" value={`£${totalStockValue.toFixed(2)}`} icon={TrendingUp} tone="green" />
      </section>

      {lowStockProducts.length > 0 && (
        <section className="overflow-hidden rounded-lg border border-yellow-200 bg-yellow-50">
          <header className="border-b border-yellow-200 px-5 py-4">
            <h2 className="flex items-center gap-2 text-lg font-black text-yellow-900">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alerts
            </h2>
          </header>
          <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            {lowStockProducts.map((product) => (
              <article className="rounded-lg border-2 border-yellow-300 bg-white p-4" key={product.id}>
                <div className="mb-2 flex items-start justify-between gap-3">
                  <p className="font-black text-[#3a2619]">{product.name}</p>
                  <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-black text-yellow-800">!</span>
                </div>
                <div className="space-y-1 text-sm font-semibold text-[#7f6554]">
                  <p>Current: <span className="font-black text-yellow-900">{product.stockQuantity || 0} units</span></p>
                  <p>Threshold: {product.lowStockThreshold || 10} units</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-lg border border-[#e8daca] bg-[#fffdf8] shadow-sm shadow-[#8a461c]/5">
        <header className="border-b border-[#eadccf] px-5 py-4">
          <h2 className="text-lg font-black text-[#3a2619]">All Products - Stock Status</h2>
        </header>
        <div className="p-5">
          {isLoading ? (
            <div className="h-48 animate-pulse rounded-lg bg-[#f3e8da]" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead className="border-b-2 border-[#e8daca] bg-[#fff8ed]">
                  <tr>
                    <TableHead align="left">Product</TableHead>
                    <TableHead align="left">Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Threshold</TableHead>
                    <TableHead align="right">Stock Value</TableHead>
                    <TableHead>Actions</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr className="border-b border-[#f0e2d4] transition-colors hover:bg-[#fff8ed]" key={product.id}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="h-12 w-12 rounded-lg object-cover" />
                          ) : (
                            <div className="grid h-12 w-12 place-items-center rounded-lg bg-[#f0dfca]">
                              <Package className="h-5 w-5 text-[#8a461c]" />
                            </div>
                          )}
                          <div>
                            <p className="font-black text-[#3a2619]">{product.name}</p>
                            <p className="text-xs font-semibold text-[#8f7461]">{product.weight}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="rounded-md bg-[#f0dfca] px-2 py-1 text-sm font-bold text-[#7c3514]">{product.category}</span>
                      </td>
                      <td className="p-4 text-center"><StockBadge product={product} /></td>
                      <td className="p-4 text-center">
                        {editingId === product.id ? (
                          <input
                            className="h-10 w-20 rounded-md border border-[#e3d1bd] bg-white px-2 text-center text-sm font-bold text-[#3a2619] outline-none focus:border-[#8a461c]"
                            min="0"
                            onChange={(event) => setEditValues({ ...editValues, stockQuantity: event.target.value })}
                            type="number"
                            value={editValues.stockQuantity}
                          />
                        ) : (
                          <span className="font-black text-[#3a2619]">{product.stockQuantity || 0}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {editingId === product.id ? (
                          <input
                            className="h-10 w-20 rounded-md border border-[#e3d1bd] bg-white px-2 text-center text-sm font-bold text-[#3a2619] outline-none focus:border-[#8a461c]"
                            min="0"
                            onChange={(event) => setEditValues({ ...editValues, lowStockThreshold: event.target.value })}
                            type="number"
                            value={editValues.lowStockThreshold}
                          />
                        ) : (
                          <span className="font-semibold text-[#7f6554]">{product.lowStockThreshold || 10}</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-black text-green-700">£{((product.stockQuantity || 0) * product.price).toFixed(2)}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          {editingId === product.id ? (
                            <>
                              <button
                                aria-label={`Save ${product.name}`}
                                className="rounded-md bg-green-600 p-2 text-white transition-colors hover:bg-green-700 disabled:opacity-60"
                                disabled={savingId === product.id}
                                onClick={() => void handleSave(product)}
                                type="button"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                aria-label="Cancel"
                                className="rounded-md border border-[#e3d1bd] bg-white p-2 text-[#7f6554] transition-colors hover:bg-[#fff8ed]"
                                onClick={handleCancel}
                                type="button"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              aria-label={`Edit ${product.name}`}
                              className="rounded-md border border-[#e3d1bd] bg-white p-2 text-[#7c3514] transition-colors hover:bg-[#fff8ed]"
                              onClick={() => handleEdit(product)}
                              type="button"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, tone, value }: { icon: React.ComponentType<{ className?: string }>; label: string; tone: "blue" | "yellow" | "red" | "green"; value: string }) {
  const tones = {
    blue: "border-blue-100 bg-blue-50 text-blue-950",
    yellow: "border-yellow-100 bg-yellow-50 text-yellow-950",
    red: "border-red-100 bg-red-50 text-red-950",
    green: "border-green-100 bg-green-50 text-green-950",
  };

  return (
    <Card className={`rounded-lg p-5 shadow-none ${tones[tone]}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold opacity-70">{label}</p>
          <strong className="mt-2 block text-3xl font-black">{value}</strong>
        </div>
        <Icon className="h-10 w-10 flex-shrink-0 opacity-45" />
      </div>
    </Card>
  );
}

function TableHead({ align = "center", children }: { align?: "left" | "center" | "right"; children: React.ReactNode }) {
  const alignment = align === "left" ? "text-left" : align === "right" ? "text-right" : "text-center";
  return <th className={`p-4 text-sm font-black text-[#5c3a25] ${alignment}`}>{children}</th>;
}

function StockBadge({ product }: { product: Product }) {
  const quantity = product.stockQuantity || 0;
  const threshold = product.lowStockThreshold || 10;

  if (quantity === 0) return <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-black text-red-800">Out of Stock</span>;
  if (quantity <= threshold) return <span className="inline-flex rounded-full border border-yellow-200 bg-yellow-50 px-2.5 py-1 text-xs font-black text-yellow-800">Low Stock</span>;
  return <span className="inline-flex rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-black text-green-800">In Stock</span>;
}

function getStockStatus(stockQuantity: number, lowStockThreshold: number): Product["stockStatus"] {
  if (stockQuantity <= 0) return "out_of_stock";
  if (stockQuantity <= lowStockThreshold) return "low_stock";
  return "in_stock";
}
