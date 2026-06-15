"use client";

import AdminProductsV2Workspace from "@/components/AdminProductsV2Workspace";
import { getHarvestApi } from "@/lib/harvest-api";
import { useV2Enabled } from "@/lib/v2-pages";
import type { Product } from "@/lib/domain";
import { Edit2, Loader2, Package, Plus, Save, Sparkles, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type ProductForm = {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  category: string;
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

const categories = ["Single Origin", "Blend", "Decaf", "Specialty", "Cups & Lids", "Cleaning & Maintenance", "Accessories"];

const stockStatusConfig = {
  in_stock: { label: "In Stock", className: "bg-green-100 text-green-800" },
  low_stock: { label: "Low Stock", className: "bg-yellow-100 text-yellow-800" },
  out_of_stock: { label: "Out of Stock", className: "bg-red-100 text-red-800" },
} satisfies Record<Product["stockStatus"], { label: string; className: string }>;

export default function AdminProductsWorkspace() {
  const v2Enabled = useV2Enabled("/adminproducts");

  if (v2Enabled) {
    return <AdminProductsV2Workspace />;
  }

  return <LegacyAdminProductsWorkspace />;
}

function LegacyAdminProductsWorkspace() {
  const api = useMemo(() => getHarvestApi(), []);
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    void loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    const nextProducts = await api.getProducts();
    setProducts(nextProducts);
    setIsLoading(false);
  };

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
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
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
        const updated = await api.updateProduct(editingId, input);
        setProducts((current) => current.map((product) => (product.id === updated.id ? updated : product)));
        setMessage("Product updated.");
      } else {
        const created = await api.createProduct(input);
        setProducts((current) => [created, ...current]);
        setMessage("Product created.");
      }
      handleCancel();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Product could not be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setForm(emptyForm);
    setEditingId(null);
    setAiLoading(false);
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    setMessage("");
    try {
      await api.deleteProduct(product.id);
      setProducts((current) => current.filter((item) => item.id !== product.id));
      setMessage("Product deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Product could not be deleted.");
    }
  };

  const handleGenerateAI = async () => {
    if (!form.name) {
      window.alert("Please enter a product name first.");
      return;
    }

    setAiLoading(true);
    window.setTimeout(() => {
      setForm((current) => ({
        ...current,
        description: `${current.name} is prepared for professional coffee shops, cafes, and hospitality businesses. It is selected for reliable service, practical stock handling, and consistent quality across busy service periods.`,
      }));
      setAiLoading(false);
      setMessage("AI description is mocked for now; Base44 InvokeLLM will be wired later.");
    }, 350);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-amber-900 mb-2" style={{ fontFamily: "Georgia, serif" }}>
            Product Management
          </h1>
          <p className="text-amber-700">Add, edit products and generate content with AI</p>
        </div>
        {!showForm && (
          <button className="inline-flex items-center rounded-md bg-amber-900 px-4 py-2 font-medium text-white hover:bg-amber-800" onClick={() => setShowForm(true)} type="button">
            <Plus className="w-4 h-4 mr-2" />
            New Product
          </button>
        )}
      </div>

      {message && <section className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{message}</section>}

      {showForm && (
        <form className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-lg" onSubmit={handleSave}>
          <header className="bg-gradient-to-r from-amber-50 to-orange-50 border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-amber-900">{editingId ? "Edit Product" : "Add New Product"}</h2>
          </header>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput label="Product Name *" value={form.name} onChange={(value) => setForm({ ...form, name: value })} placeholder="e.g., 12oz Black Ripple Cup" required />
              <TextInput label="Price (£) *" type="number" value={form.price} onChange={(value) => setForm({ ...form, price: value })} placeholder="10.00" required />
              <label className="block">
                <span className="text-sm font-medium text-gray-700 mb-1 block">Kategori</span>
                <select className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-gray-900" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
              <TextInput label="Size / Weight" value={form.weight} onChange={(value) => setForm({ ...form, weight: value })} placeholder="e.g., 12oz, 900g, 1000pcs" />
              <label className="block">
                <span className="text-sm font-medium text-gray-700 mb-1 block">Stock Status</span>
                <select className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-gray-900" value={form.stockStatus} onChange={(event) => setForm({ ...form, stockStatus: event.target.value as Product["stockStatus"] })}>
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </label>
              <TextInput label="Stock Quantity" type="number" value={form.stockQuantity} onChange={(value) => setForm({ ...form, stockQuantity: value })} />
            </div>

            <TextInput label="Product Image URL" value={form.imageUrl} onChange={(value) => setForm({ ...form, imageUrl: value })} placeholder="https://..." />

            <div>
              <div className="flex items-center justify-between mb-1 gap-3">
                <label className="text-sm font-medium text-gray-700">Product Description</label>
                <button className="inline-flex items-center rounded-md border border-purple-300 px-3 py-1.5 text-sm font-medium text-purple-700 hover:bg-purple-50" disabled={aiLoading} onClick={() => void handleGenerateAI()} type="button">
                  {aiLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
                  Generate with AI
                </button>
              </div>
              <textarea
                className="min-h-24 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-gray-900"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Product description... or generate automatically with AI"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button className="inline-flex items-center rounded-md bg-amber-900 px-4 py-2 font-medium text-white hover:bg-amber-800 disabled:opacity-60" disabled={isSaving} type="submit">
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button className="inline-flex items-center rounded-md border border-gray-200 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50" onClick={handleCancel} type="button">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="h-48 bg-gray-100 animate-pulse rounded-lg" />)}
        </div>
      ) : products.length === 0 ? (
        <section className="rounded-xl border-2 border-dashed border-amber-200 bg-white">
          <div className="p-12 text-center">
            <Package className="w-16 h-16 text-amber-300 mx-auto mb-4" />
            <p className="text-amber-900 font-semibold">No products yet</p>
            <p className="text-gray-500 text-sm">Click the button above to add a new product</p>
          </div>
        </section>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <article className="overflow-hidden rounded-xl border border-amber-100 bg-white transition-all hover:shadow-lg" key={product.id}>
              {product.imageUrl && (
                <div className="h-40 overflow-hidden rounded-t-xl bg-gray-50">
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-amber-900">{product.name}</h3>
                    <p className="text-xs text-gray-500">{product.category}{product.weight ? ` • ${product.weight}` : ""}</p>
                  </div>
                  <span className="text-lg font-bold text-amber-900 whitespace-nowrap">£{product.price?.toFixed(2)}</span>
                </div>
                {product.description && <p className="text-xs text-gray-600 line-clamp-2">{product.description}</p>}
                <div className="flex items-center justify-between">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${stockStatusConfig[product.stockStatus]?.className || "bg-gray-100 text-gray-700"}`}>
                    {stockStatusConfig[product.stockStatus]?.label}
                  </span>
                  <div className="flex gap-1">
                    <button className="rounded-md p-2 text-blue-600 hover:bg-blue-50" onClick={() => handleEdit(product)} type="button" aria-label={`Edit ${product.name}`}>
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="rounded-md p-2 text-red-600 hover:bg-red-50" onClick={() => void handleDelete(product)} type="button" aria-label={`Delete ${product.name}`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
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
      <span className="text-sm font-medium text-gray-700 mb-1 block">{label}</span>
      <input
        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-gray-900"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}
