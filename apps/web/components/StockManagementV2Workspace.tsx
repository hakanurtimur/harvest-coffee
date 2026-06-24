"use client";

import { Card } from "@/components/ui/card";
import { requestToast } from "@/components/ui/sonner";
import AdminPageHeader from "@/components/AdminPageHeader";
import { useProductsQuery, useUpdateProductMutation } from "@/lib/harvest-query";
import { getHarvestIntegrations } from "@/lib/integrations";
import type { Product } from "@/lib/domain";
import { AlertTriangle, Edit2, Package, Save, TrendingDown, TrendingUp, X } from "lucide-react";
import { useMemo, useState } from "react";

type EditValues = {
  stockQuantity: string;
  lowStockThreshold: string;
};

export default function StockManagementV2Workspace() {
  const integrations = useMemo(() => getHarvestIntegrations(), []);
  const productsQuery = useProductsQuery();
  const updateProductMutation = useUpdateProductMutation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<EditValues>({ stockQuantity: "0", lowStockThreshold: "10" });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const products = productsQuery.data ?? [];
  const isLoading = productsQuery.isLoading;

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
      const updated = await updateProductMutation.mutateAsync({ id: product.id, input: {
        stockQuantity,
        lowStockThreshold,
        stockStatus: getStockStatus(stockQuantity, lowStockThreshold),
      } });
      setEditingId(null);
      setEditValues({ stockQuantity: "0", lowStockThreshold: "10" });
      if (updated.stockQuantity <= updated.lowStockThreshold && updated.stockQuantity > 0) {
        const notification = await requestToast.promise(
          integrations.sendLowStockEmail({
            lowStockThreshold: updated.lowStockThreshold,
            productName: updated.name,
            stockQuantity: updated.stockQuantity,
          }),
          {
            loading: "Sending low stock alert...",
            success: "Low stock alert handled.",
            error: (error) => error instanceof Error ? error.message : "Low stock alert failed.",
          },
        );
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
    <div className="harvest-theme space-y-5 text-foreground">
      <AdminPageHeader title="Stock Management" description="Product stock levels and management" />

      {message && (
        <section className="rounded-lg border border-[hsl(var(--status-warning)/0.24)] bg-[hsl(var(--status-warning)/0.08)] px-4 py-3 text-sm font-bold text-[hsl(var(--status-warning))]">
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
        <section className="overflow-hidden rounded-lg border border-[hsl(var(--status-warning)/0.24)] bg-[hsl(var(--status-warning)/0.08)]">
          <header className="border-b border-[hsl(var(--status-warning)/0.18)] px-5 py-4">
            <h2 className="flex items-center gap-2 text-lg font-black text-[hsl(var(--status-warning))]">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alerts
            </h2>
          </header>
          <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            {lowStockProducts.map((product) => (
              <article className="rounded-lg border-2 border-[hsl(var(--status-warning)/0.26)] bg-card p-4" key={product.id}>
                <div className="mb-2 flex items-start justify-between gap-3">
                  <p className="font-black text-foreground">{product.name}</p>
                  <span className="rounded-full bg-[hsl(var(--status-warning)/0.12)] px-2 py-0.5 text-xs font-black text-[hsl(var(--status-warning))]">!</span>
                </div>
                <div className="space-y-1 text-sm font-semibold text-muted-foreground">
                  <p>Current: <span className="font-black text-[hsl(var(--status-warning))]">{product.stockQuantity || 0} units</span></p>
                  <p>Threshold: {product.lowStockThreshold || 10} units</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <header className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-black text-foreground">All Products - Stock Status</h2>
        </header>
        <div className="p-5">
          {isLoading ? (
            <div className="h-48 animate-pulse rounded-lg bg-muted" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead className="border-b-2 border-border bg-muted/40">
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
                    <tr className="border-b border-border transition-colors hover:bg-muted/40" key={product.id}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="h-12 w-12 rounded-lg object-cover" />
                          ) : (
                            <div className="grid h-12 w-12 place-items-center rounded-lg bg-muted">
                              <Package className="h-5 w-5 text-primary" />
                            </div>
                          )}
                          <div>
                            <p className="font-black text-foreground">{product.name}</p>
                            <p className="text-xs font-semibold text-muted-foreground">{product.weight}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="rounded-md bg-muted px-2 py-1 text-sm font-bold text-primary">{product.category}</span>
                      </td>
                      <td className="p-4 text-center"><StockBadge product={product} /></td>
                      <td className="p-4 text-center">
                        {editingId === product.id ? (
                          <input
                            className="h-10 w-20 rounded-md border border-input bg-background px-2 text-center text-sm font-bold text-foreground outline-none focus:border-primary"
                            disabled={savingId === product.id}
                            min="0"
                            onChange={(event) => setEditValues({ ...editValues, stockQuantity: event.target.value })}
                            type="number"
                            value={editValues.stockQuantity}
                          />
                        ) : (
                          <span className="font-black text-foreground">{product.stockQuantity || 0}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {editingId === product.id ? (
                          <input
                            className="h-10 w-20 rounded-md border border-input bg-background px-2 text-center text-sm font-bold text-foreground outline-none focus:border-primary"
                            disabled={savingId === product.id}
                            min="0"
                            onChange={(event) => setEditValues({ ...editValues, lowStockThreshold: event.target.value })}
                            type="number"
                            value={editValues.lowStockThreshold}
                          />
                        ) : (
                          <span className="font-semibold text-muted-foreground">{product.lowStockThreshold || 10}</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-black text-[hsl(var(--status-success))]">£{((product.stockQuantity || 0) * product.price).toFixed(2)}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          {editingId === product.id ? (
                            <>
                              <button
                                aria-label={`Save ${product.name}`}
                                className="rounded-md bg-[hsl(var(--status-success))] p-2 text-white transition-colors hover:opacity-90 disabled:opacity-60"
                                disabled={savingId === product.id}
                                onClick={() => void handleSave(product)}
                                type="button"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                aria-label="Cancel"
                                className="rounded-md border border-border bg-background p-2 text-muted-foreground transition-colors hover:bg-muted"
                                disabled={savingId === product.id}
                                onClick={handleCancel}
                                type="button"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              aria-label={`Edit ${product.name}`}
                              disabled={savingId === product.id}
                              className="rounded-md border border-border bg-background p-2 text-primary transition-colors hover:bg-muted"
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
    blue: "border-[hsl(var(--status-info)/0.18)] bg-[hsl(var(--status-info)/0.08)] text-[hsl(var(--status-info))]",
    yellow: "border-[hsl(var(--status-warning)/0.18)] bg-[hsl(var(--status-warning)/0.08)] text-[hsl(var(--status-warning))]",
    red: "border-[hsl(var(--status-danger)/0.18)] bg-[hsl(var(--status-danger)/0.08)] text-[hsl(var(--status-danger))]",
    green: "border-[hsl(var(--status-success)/0.18)] bg-[hsl(var(--status-success)/0.08)] text-[hsl(var(--status-success))]",
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
  return <th className={`p-4 text-sm font-black text-primary ${alignment}`}>{children}</th>;
}

function StockBadge({ product }: { product: Product }) {
  const quantity = product.stockQuantity || 0;
  const threshold = product.lowStockThreshold || 10;

  if (quantity === 0) return <span className="inline-flex rounded-full border border-[hsl(var(--status-danger)/0.24)] bg-[hsl(var(--status-danger)/0.08)] px-2.5 py-1 text-xs font-black text-[hsl(var(--status-danger))]">Out of Stock</span>;
  if (quantity <= threshold) return <span className="inline-flex rounded-full border border-[hsl(var(--status-warning)/0.24)] bg-[hsl(var(--status-warning)/0.08)] px-2.5 py-1 text-xs font-black text-[hsl(var(--status-warning))]">Low Stock</span>;
  return <span className="inline-flex rounded-full border border-[hsl(var(--status-success)/0.24)] bg-[hsl(var(--status-success)/0.08)] px-2.5 py-1 text-xs font-black text-[hsl(var(--status-success))]">In Stock</span>;
}

function getStockStatus(stockQuantity: number, lowStockThreshold: number): Product["stockStatus"] {
  if (stockQuantity <= 0) return "out_of_stock";
  if (stockQuantity <= lowStockThreshold) return "low_stock";
  return "in_stock";
}
