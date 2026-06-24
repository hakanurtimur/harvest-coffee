"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { requestToast } from "@/components/ui/sonner";
import { Combobox } from "@/components/ui/combobox";
import AdminPageHeader from "@/components/AdminPageHeader";
import { useCreateProductMutation, useDeleteProductMutation, useProductsQuery, useUpdateProductMutation } from "@/lib/harvest-query";
import { getHarvestIntegrations } from "@/lib/integrations";
import type { Product } from "@/lib/domain";
import { Edit2, Loader2, Package, Plus, Save, Sparkles, Trash2, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

type ProductForm = {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  category: Product["category"];
  weight: string;
  stockStatus: Product["stockStatus"];
  stockQuantity: string;
  lowStockThreshold: string;
};

const emptyForm: ProductForm = {
  name: "",
  description: "",
  price: "",
  imageUrl: "",
  category: "Cups & Lids",
  weight: "",
  stockStatus: "in_stock",
  stockQuantity: "100",
  lowStockThreshold: "10",
};

const categories: Product["category"][] = ["Single Origin", "Blend", "Decaf", "Specialty", "Cups & Lids", "Cleaning & Maintenance", "Accessories"];
const categoryOptions = categories.map((category) => ({ label: category, value: category }));

const stockStatusConfig = {
  in_stock: { label: "In Stock", className: "border-[hsl(var(--status-success)/0.24)] bg-[hsl(var(--status-success)/0.08)] text-[hsl(var(--status-success))]" },
  low_stock: { label: "Low Stock", className: "border-[hsl(var(--status-warning)/0.24)] bg-[hsl(var(--status-warning)/0.08)] text-[hsl(var(--status-warning))]" },
  out_of_stock: { label: "Out of Stock", className: "border-[hsl(var(--status-danger)/0.24)] bg-[hsl(var(--status-danger)/0.08)] text-[hsl(var(--status-danger))]" },
} satisfies Record<Product["stockStatus"], { label: string; className: string }>;
const stockStatusOptions = Object.entries(stockStatusConfig).map(([value, config]) => ({ label: config.label, value }));

export default function AdminProductsV2Workspace() {
  const integrations = useMemo(() => getHarvestIntegrations(), []);
  const productsQuery = useProductsQuery();
  const createProductMutation = useCreateProductMutation();
  const updateProductMutation = useUpdateProductMutation();
  const deleteProductMutation = useDeleteProductMutation();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [message, setMessage] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const products = productsQuery.data ?? [];
  const isLoading = productsQuery.isLoading;
  const isSaving = createProductMutation.isPending || updateProductMutation.isPending;

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name || "",
      description: product.description || "",
      price: String(product.price ?? ""),
      imageUrl: product.imageUrl || "",
      category: product.category || "Cups & Lids",
      weight: product.weight || "",
      stockStatus: product.stockStatus || "in_stock",
      stockQuantity: String(product.stockQuantity ?? 0),
      lowStockThreshold: String(product.lowStockThreshold ?? 10),
    });
    setShowForm(true);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    try {
      const input = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        imageUrl: form.imageUrl,
        category: form.category,
        weight: form.weight,
        stockStatus: form.stockStatus,
        stockQuantity: Number.parseInt(form.stockQuantity, 10) || 0,
        lowStockThreshold: Number.parseInt(form.lowStockThreshold, 10) || 10,
      };

      if (editingId) {
        await updateProductMutation.mutateAsync({ id: editingId, input });
        setMessage("Product updated.");
      } else {
        await createProductMutation.mutateAsync(input);
        setMessage("Product created.");
      }
      handleCancel();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Product could not be saved.");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setForm(emptyForm);
    setEditingId(null);
    setAiLoading(false);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    setMessage("");
    try {
      await deleteProductMutation.mutateAsync(productToDelete.id);
      setMessage("Product deleted.");
      setProductToDelete(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Product could not be deleted.");
    }
  };

  const handleGenerateAI = async () => {
    if (!form.name) {
      requestToast.error({ title: "Please enter a product name first." });
      return;
    }

    setAiLoading(true);
    try {
      const generated = await requestToast.promise(
        integrations.generateProductDescription({
          category: form.category,
          productName: form.name,
          weight: form.weight,
        }),
        {
          loading: "Generating description...",
          success: "Description generated.",
          error: (error) => error instanceof Error ? error.message : "Description could not be generated.",
        },
      );
      setForm((current) => ({
        ...current,
        description: generated.description,
      }));
      setMessage(generated.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Description could not be generated.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="harvest-theme space-y-5 text-foreground">
      <AdminPageHeader
        title="Product Management"
        description="Add, edit products and generate content with AI"
        actions={
          !showForm ? (
            <Button className="h-10 rounded-md px-4" onClick={() => setShowForm(true)} type="button">
              <Plus className="h-4 w-4" />
              New Product
            </Button>
          ) : null
        }
      />

      {message && (
        <section className="rounded-xl border border-[hsl(var(--status-warning)/0.24)] bg-[hsl(var(--status-warning)/0.08)] px-4 py-3 text-sm font-bold text-[hsl(var(--status-warning))]">
          {message}
        </section>
      )}

      {showForm && (
        <form className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-primary/5" onSubmit={handleSave}>
          <header className="border-b border-border bg-muted px-5 py-4">
            <h2 className="text-lg font-black text-foreground">{editingId ? "Edit Product" : "Add New Product"}</h2>
          </header>
          <div className="space-y-4 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="Product Name *" value={form.name} onChange={(value) => setForm({ ...form, name: value })} placeholder="e.g., 12oz Black Ripple Cup" required />
              <TextInput label="Price (£) *" type="number" value={form.price} onChange={(value) => setForm({ ...form, price: value })} placeholder="10.00" required />
              <SelectInput disabled={isSaving} label="Kategori" options={categoryOptions} value={form.category} onChange={(value) => setForm({ ...form, category: value as Product["category"] })} />
              <TextInput label="Size / Weight" value={form.weight} onChange={(value) => setForm({ ...form, weight: value })} placeholder="e.g., 12oz, 900g, 1000pcs" />
              <SelectInput disabled={isSaving} label="Stock Status" options={stockStatusOptions} value={form.stockStatus} onChange={(value) => setForm({ ...form, stockStatus: value as Product["stockStatus"] })} />
              <TextInput label="Stock Quantity" type="number" value={form.stockQuantity} onChange={(value) => setForm({ ...form, stockQuantity: value })} />
            </div>

            <TextInput label="Product Image URL" value={form.imageUrl} onChange={(value) => setForm({ ...form, imageUrl: value })} placeholder="https://..." />

            <div>
              <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label className="text-sm font-black text-foreground">Product Description</label>
                <button
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[hsl(var(--chart-4)/0.24)] bg-[hsl(var(--chart-4)/0.08)] px-3 text-sm font-black text-[hsl(var(--chart-4))] transition-colors hover:bg-[hsl(var(--chart-4)/0.12)] disabled:opacity-60"
                  disabled={aiLoading}
                  onClick={() => void handleGenerateAI()}
                  type="button"
                >
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generate with AI
                </button>
              </div>
              <textarea
                className="min-h-28 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Product description... or generate automatically with AI"
              />
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button className="h-10 rounded-md px-4" disabled={isSaving} type="submit">
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Button className="h-10 rounded-md px-4" onClick={handleCancel} type="button" variant="outline">
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="h-64 animate-pulse rounded-lg bg-muted" />)}
        </div>
      ) : products.length === 0 ? (
        <section className="rounded-2xl border-2 border-dashed border-border bg-card">
          <div className="p-12 text-center">
            <Package className="mx-auto mb-4 h-16 w-16 text-primary/35" />
            <p className="font-black text-foreground">No products yet</p>
            <p className="text-sm font-semibold text-muted-foreground">Click the button above to add a new product</p>
          </div>
        </section>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard handleDelete={setProductToDelete} handleEdit={handleEdit} key={product.id} product={product} />
          ))}
        </div>
      )}
      <AlertDialog
        confirmLabel="Delete product"
        description={productToDelete ? `This will permanently delete "${productToDelete.name}" from the product catalog.` : "This product will be deleted."}
        onConfirm={() => void handleDelete()}
        onOpenChange={(open) => {
          if (!open) setProductToDelete(null);
        }}
        open={Boolean(productToDelete)}
        title="Delete product?"
        tone="destructive"
      />
    </div>
  );
}

function ProductCard({ handleDelete, handleEdit, product }: { handleDelete: (product: Product) => void; handleEdit: (product: Product) => void; product: Product }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-primary/5 transition-shadow hover:shadow-md hover:shadow-primary/10">
      {product.imageUrl && (
        <div className="h-40 overflow-hidden bg-muted">
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        </div>
      )}
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-black text-foreground">{product.name}</h3>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">{product.category}{product.weight ? ` • ${product.weight}` : ""}</p>
          </div>
          <span className="whitespace-nowrap text-lg font-black text-primary">£{product.price?.toFixed(2)}</span>
        </div>
        {product.description && <p className="line-clamp-2 text-xs font-semibold leading-5 text-muted-foreground">{product.description}</p>}
        <div className="flex items-center justify-between gap-3">
          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${stockStatusConfig[product.stockStatus]?.className || "border-gray-200 bg-gray-50 text-gray-700"}`}>
            {stockStatusConfig[product.stockStatus]?.label}
          </span>
          <div className="flex gap-1">
            <button className="rounded-md p-2 text-[hsl(var(--status-info))] transition-colors hover:bg-[hsl(var(--status-info)/0.08)]" onClick={() => handleEdit(product)} type="button" aria-label={`Edit ${product.name}`}>
              <Edit2 className="h-4 w-4" />
            </button>
            <button className="rounded-md p-2 text-[hsl(var(--status-danger))] transition-colors hover:bg-[hsl(var(--status-danger)/0.08)]" onClick={() => handleDelete(product)} type="button" aria-label={`Delete ${product.name}`}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-black text-foreground">{label}</span>
      <input
        className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}

function SelectInput({
  disabled = false,
  label,
  onChange,
  options,
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-black text-foreground">{label}</span>
      <Combobox
        className="rounded-md"
        disabled={disabled}
        loading={disabled}
        value={value}
        onChange={onChange}
        options={options}
        placeholder={label}
      />
    </label>
  );
}
