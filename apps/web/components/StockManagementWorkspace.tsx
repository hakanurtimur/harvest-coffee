"use client";

import StockManagementV2Workspace from "@/components/StockManagementV2Workspace";
import { getHarvestApi } from "@/lib/harvest-api";
import { useV2Enabled } from "@/lib/v2-pages";
import type { Product } from "@/lib/domain";
import { AlertTriangle, Edit2, Package, Save, TrendingDown, TrendingUp, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type EditValues = {
  stockQuantity: string;
  lowStockThreshold: string;
};

export default function StockManagementWorkspace() {
  const v2Enabled = useV2Enabled("/stockmanagement");

  if (v2Enabled) {
    return <StockManagementV2Workspace />;
  }

  return <LegacyStockManagementWorkspace />;
}

function LegacyStockManagementWorkspace() {
  const api = useMemo(() => getHarvestApi(), []);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<EditValues>({ stockQuantity: "0", lowStockThreshold: "10" });
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    const nextProducts = await api.getProducts();
    setProducts(nextProducts);
    setIsLoading(false);
  };

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
        setMessage("Low stock email notification is mocked for now; Base44 SendEmail will be wired later.");
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
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-amber-900 mb-2" style={{ fontFamily: "Georgia, serif" }}>
          Stock Management
        </h1>
        <p className="text-amber-700">Product stock levels and management</p>
      </div>

      {message && <section className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{message}</section>}

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard label="Total Products" value={String(products.length)} icon={<Package className="w-12 h-12 text-blue-600 opacity-50" />} className="from-blue-50 to-blue-100 text-blue-900" />
        <SummaryCard label="Low Stock" value={String(lowStockProducts.length)} icon={<AlertTriangle className="w-12 h-12 text-yellow-600 opacity-50" />} className="from-yellow-50 to-yellow-100 text-yellow-900" />
        <SummaryCard label="Out of Stock" value={String(outOfStockProducts.length)} icon={<TrendingDown className="w-12 h-12 text-red-600 opacity-50" />} className="from-red-50 to-red-100 text-red-900" />
        <SummaryCard label="Stock Value" value={`£${totalStockValue.toFixed(2)}`} icon={<TrendingUp className="w-12 h-12 text-green-600 opacity-50" />} className="from-green-50 to-green-100 text-green-900" />
      </section>

      {lowStockProducts.length > 0 && (
        <section className="rounded-xl border border-yellow-200 bg-yellow-50">
          <header className="border-b border-yellow-200 p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-yellow-900">
              <AlertTriangle className="w-5 h-5" />
              Low Stock Alerts
            </h2>
          </header>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockProducts.map((product) => (
              <article className="p-4 bg-white rounded-lg border-2 border-yellow-300" key={product.id}>
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-amber-900">{product.name}</p>
                  <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">!</span>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">Current: <span className="font-bold text-yellow-900">{product.stockQuantity || 0} units</span></p>
                  <p className="text-gray-600">Threshold: {product.lowStockThreshold || 10} units</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-amber-100 bg-white">
        <header className="p-6 border-b border-amber-100">
          <h2 className="text-lg font-semibold text-amber-900">All Products - Stock Status</h2>
        </header>
        <div className="p-6">
          {isLoading ? (
            <div className="h-48 bg-gray-100 animate-pulse rounded-lg" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead className="bg-amber-50 border-b-2 border-amber-200">
                  <tr>
                    <th className="text-left p-4 font-semibold text-amber-900">Product</th>
                    <th className="text-left p-4 font-semibold text-amber-900">Category</th>
                    <th className="text-center p-4 font-semibold text-amber-900">Status</th>
                    <th className="text-center p-4 font-semibold text-amber-900">Current Stock</th>
                    <th className="text-center p-4 font-semibold text-amber-900">Threshold</th>
                    <th className="text-right p-4 font-semibold text-amber-900">Stock Value</th>
                    <th className="text-center p-4 font-semibold text-amber-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr className="border-b border-amber-50 hover:bg-amber-50/50" key={product.id}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded-lg" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-amber-100 grid place-items-center">
                              <Package className="w-5 h-5 text-amber-700" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-amber-900">{product.name}</p>
                            <p className="text-xs text-gray-600">{product.weight}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-amber-800 bg-amber-100 px-2 py-1 rounded">{product.category}</span>
                      </td>
                      <td className="p-4 text-center"><StockBadge product={product} /></td>
                      <td className="p-4 text-center">
                        {editingId === product.id ? (
                          <input
                            className="w-20 rounded-md border border-gray-200 px-2 py-2 text-center"
                            type="number"
                            min="0"
                            value={editValues.stockQuantity}
                            onChange={(event) => setEditValues({ ...editValues, stockQuantity: event.target.value })}
                          />
                        ) : (
                          <span className="font-semibold text-amber-900">{product.stockQuantity || 0}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {editingId === product.id ? (
                          <input
                            className="w-20 rounded-md border border-gray-200 px-2 py-2 text-center"
                            type="number"
                            min="0"
                            value={editValues.lowStockThreshold}
                            onChange={(event) => setEditValues({ ...editValues, lowStockThreshold: event.target.value })}
                          />
                        ) : (
                          <span className="text-gray-600">{product.lowStockThreshold || 10}</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-bold text-green-700">£{((product.stockQuantity || 0) * product.price).toFixed(2)}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          {editingId === product.id ? (
                            <>
                              <button className="rounded-md bg-green-600 p-2 text-white hover:bg-green-700" disabled={savingId === product.id} onClick={() => void handleSave(product)} type="button" aria-label={`Save ${product.name}`}>
                                <Save className="w-4 h-4" />
                              </button>
                              <button className="rounded-md border border-gray-200 p-2 text-gray-700 hover:bg-gray-50" onClick={handleCancel} type="button" aria-label="Cancel">
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button className="rounded-md border border-amber-300 p-2 text-amber-900 hover:bg-amber-50" onClick={() => handleEdit(product)} type="button" aria-label={`Edit ${product.name}`}>
                              <Edit2 className="w-4 h-4" />
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

function SummaryCard({ label, value, icon, className }: { label: string; value: string; icon: React.ReactNode; className: string }) {
  return (
    <article className={`rounded-xl border border-amber-100 bg-gradient-to-br p-6 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm opacity-80 mb-1">{label}</p>
          <strong className="text-3xl font-bold">{value}</strong>
        </div>
        {icon}
      </div>
    </article>
  );
}

function StockBadge({ product }: { product: Product }) {
  const quantity = product.stockQuantity || 0;
  const threshold = product.lowStockThreshold || 10;

  if (quantity === 0) return <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">Out of Stock</span>;
  if (quantity <= threshold) return <span className="inline-flex rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800">Low Stock</span>;
  return <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">In Stock</span>;
}

function getStockStatus(stockQuantity: number, lowStockThreshold: number): Product["stockStatus"] {
  if (stockQuantity <= 0) return "out_of_stock";
  if (stockQuantity <= lowStockThreshold) return "low_stock";
  return "in_stock";
}
