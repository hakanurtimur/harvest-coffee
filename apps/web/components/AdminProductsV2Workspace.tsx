"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getHarvestApi } from "@/lib/harvest-api";
import type { Product } from "@harvest/domain";
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
  in_stock: { label: "In Stock", className: "border-green-200 bg-green-50 text-green-800" },
  low_stock: { label: "Low Stock", className: "border-yellow-200 bg-yellow-50 text-yellow-800" },
  out_of_stock: { label: "Out of Stock", className: "border-red-200 bg-red-50 text-red-800" },
} satisfies Record<Product["stockStatus"], { label: string; className: string }>;

export default function AdminProductsV2Workspace() {
  const api = useMemo(() => getHarvestApi(), []);
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const loadProducts = async () => {
    setIsLoading(true);
    const nextProducts = await api.getProducts();
    setProducts(nextProducts);
    setIsLoading(false);
  };

  useEffect(() => {
    void loadProducts();
  }, []);

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
    <div className="space-y-5 text-[#3a2619]">
      <section className="rounded-lg border border-[#e8daca] bg-[#fffdf8] p-5 shadow-sm shadow-[#8a461c]/5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-normal text-[#3a2619] md:text-4xl">Product Management</h1>
            <p className="mt-2 text-sm font-semibold text-[#8f7461]">Add, edit products and generate content with AI</p>
          </div>
          {!showForm && (
            <Button className="h-10 rounded-md px-4" onClick={() => setShowForm(true)} type="button">
              <Plus className="h-4 w-4" />
              New Product
            </Button>
          )}
        </div>
      </section>

      {message && (
        <section className="rounded-lg border border-[#ead7b8] bg-[#fff8e8] px-4 py-3 text-sm font-bold text-[#7c3514]">
          {message}
        </section>
      )}

      {showForm && (
        <form className="overflow-hidden rounded-lg border border-[#e8daca] bg-[#fffdf8] shadow-sm shadow-[#8a461c]/5" onSubmit={handleSave}>
          <header className="border-b border-[#eadccf] bg-[#fff8ed] px-5 py-4">
            <h2 className="text-lg font-black text-[#3a2619]">{editingId ? "Edit Product" : "Add New Product"}</h2>
          </header>
          <div className="space-y-4 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="Product Name *" value={form.name} onChange={(value) => setForm({ ...form, name: value })} placeholder="e.g., 12oz Black Ripple Cup" required />
              <TextInput label="Price (£) *" type="number" value={form.price} onChange={(value) => setForm({ ...form, price: value })} placeholder="10.00" required />
              <SelectInput label="Kategori" value={form.category} onChange={(value) => setForm({ ...form, category: value })}>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </SelectInput>
              <TextInput label="Size / Weight" value={form.weight} onChange={(value) => setForm({ ...form, weight: value })} placeholder="e.g., 12oz, 900g, 1000pcs" />
              <SelectInput label="Stock Status" value={form.stockStatus} onChange={(value) => setForm({ ...form, stockStatus: value as Product["stockStatus"] })}>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </SelectInput>
              <TextInput label="Stock Quantity" type="number" value={form.stockQuantity} onChange={(value) => setForm({ ...form, stockQuantity: value })} />
            </div>

            <TextInput label="Product Image URL" value={form.imageUrl} onChange={(value) => setForm({ ...form, imageUrl: value })} placeholder="https://..." />

            <div>
              <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label className="text-sm font-black text-[#5c3a25]">Product Description</label>
                <button
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-purple-200 bg-purple-50 px-3 text-sm font-black text-purple-800 transition-colors hover:bg-purple-100 disabled:opacity-60"
                  disabled={aiLoading}
                  onClick={() => void handleGenerateAI()}
                  type="button"
                >
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generate with AI
                </button>
              </div>
              <textarea
                className="min-h-28 w-full rounded-md border border-[#e3d1bd] bg-white px-3 py-2 text-sm font-semibold text-[#3a2619] outline-none transition-colors focus:border-[#8a461c]"
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
          {[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="h-64 animate-pulse rounded-lg bg-[#f3e8da]" />)}
        </div>
      ) : products.length === 0 ? (
        <section className="rounded-lg border-2 border-dashed border-[#e0cdb9] bg-[#fffdf8]">
          <div className="p-12 text-center">
            <Package className="mx-auto mb-4 h-16 w-16 text-[#cda66d]" />
            <p className="font-black text-[#3a2619]">No products yet</p>
            <p className="text-sm font-semibold text-[#8f7461]">Click the button above to add a new product</p>
          </div>
        </section>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard handleDelete={handleDelete} handleEdit={handleEdit} key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ handleDelete, handleEdit, product }: { handleDelete: (product: Product) => Promise<void>; handleEdit: (product: Product) => void; product: Product }) {
  return (
    <article className="overflow-hidden rounded-lg border border-[#e8daca] bg-[#fffdf8] shadow-sm shadow-[#8a461c]/5 transition-shadow hover:shadow-md hover:shadow-[#8a461c]/10">
      {product.imageUrl && (
        <div className="h-40 overflow-hidden bg-[#f8efe3]">
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        </div>
      )}
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-black text-[#3a2619]">{product.name}</h3>
            <p className="mt-1 text-xs font-semibold text-[#8f7461]">{product.category}{product.weight ? ` • ${product.weight}` : ""}</p>
          </div>
          <span className="whitespace-nowrap text-lg font-black text-[#7c3514]">£{product.price?.toFixed(2)}</span>
        </div>
        {product.description && <p className="line-clamp-2 text-xs font-semibold leading-5 text-[#7f6554]">{product.description}</p>}
        <div className="flex items-center justify-between gap-3">
          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${stockStatusConfig[product.stockStatus]?.className || "border-gray-200 bg-gray-50 text-gray-700"}`}>
            {stockStatusConfig[product.stockStatus]?.label}
          </span>
          <div className="flex gap-1">
            <button className="rounded-md p-2 text-blue-700 transition-colors hover:bg-blue-50" onClick={() => handleEdit(product)} type="button" aria-label={`Edit ${product.name}`}>
              <Edit2 className="h-4 w-4" />
            </button>
            <button className="rounded-md p-2 text-red-700 transition-colors hover:bg-red-50" onClick={() => void handleDelete(product)} type="button" aria-label={`Delete ${product.name}`}>
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
      <span className="mb-1.5 block text-sm font-black text-[#5c3a25]">{label}</span>
      <input
        className="h-11 w-full rounded-md border border-[#e3d1bd] bg-white px-3 text-sm font-semibold text-[#3a2619] outline-none transition-colors focus:border-[#8a461c]"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}

function SelectInput({ children, label, onChange, value }: { children: React.ReactNode; label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-black text-[#5c3a25]">{label}</span>
      <select
        className="h-11 w-full rounded-md border border-[#e3d1bd] bg-white px-3 text-sm font-semibold text-[#3a2619] outline-none transition-colors focus:border-[#8a461c]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </label>
  );
}
