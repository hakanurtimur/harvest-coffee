import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Save, X, Sparkles, Package, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  image_url: '',
  category: 'Cups & Lids',
  weight: '',
  stock_status: 'in_stock',
  stock_quantity: 100,
  low_stock_threshold: 10,
};

export default function AdminProducts() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [aiLoading, setAiLoading] = useState(false);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const checkAdmin = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser.role !== 'admin') window.location.href = '/';
      } catch {
        window.location.href = '/';
      }
    };
    checkAdmin();
  }, []);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products-list'],
    queryFn: () => base44.entities.Product.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const handleEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      image_url: product.image_url || '',
      category: product.category || 'Cups & Lids',
      weight: product.weight || '',
      stock_status: product.stock_status || 'in_stock',
      stock_quantity: product.stock_quantity || 0,
      low_stock_threshold: product.low_stock_threshold || 10,
    });
    setShowForm(true);
  };

  const handleSave = () => {
    const data = { ...form, price: parseFloat(form.price), stock_quantity: parseInt(form.stock_quantity) };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleGenerateAI = async () => {
   if (!form.name) {
     alert('Please enter a product name first.');
     return;
   }
    setAiLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a B2B coffee supply company product copywriter. Write a compelling, professional product description in English for the following product: "${form.name}"${form.category ? ` (Category: ${form.category})` : ''}${form.weight ? `, Size/Weight: ${form.weight}` : ''}. 
      
      Write 2-3 sentences that highlight key benefits for coffee shops, cafes, and hospitality businesses. Focus on quality, practicality, and professional use. Keep it concise and sales-oriented.`,
      response_json_schema: {
        type: 'object',
        properties: { description: { type: 'string' } },
      },
    });
    setForm((prev) => ({ ...prev, description: result.description }));
    setAiLoading(false);
  };

  const stockStatusConfig = {
    in_stock: { label: 'In Stock', className: 'bg-green-100 text-green-800' },
    low_stock: { label: 'Low Stock', className: 'bg-yellow-100 text-yellow-800' },
    out_of_stock: { label: 'Out of Stock', className: 'bg-red-100 text-red-800' },
  };

  if (!user || user.role !== 'admin') return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-amber-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>Product Management</h1>
          <p className="text-amber-700">Add, edit products and generate content with AI</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="bg-amber-900 hover:bg-amber-800">
            <Plus className="w-4 h-4 mr-2" />
            New Product
          </Button>
        )}
      </div>

      {/* Product Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-amber-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                <CardTitle className="text-amber-900">{editingId ? 'Edit Product' : 'Add New Product'}</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Product Name *</label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., 12oz Black Ripple Cup" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Price (£) *</label>
                    <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="10.00" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Kategori</label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single Origin">Single Origin</SelectItem>
                        <SelectItem value="Blend">Blend</SelectItem>
                        <SelectItem value="Decaf">Decaf</SelectItem>
                        <SelectItem value="Specialty">Specialty</SelectItem>
                        <SelectItem value="Cups & Lids">Cups & Lids</SelectItem>
                        <SelectItem value="Cleaning & Maintenance">Cleaning & Maintenance</SelectItem>
                        <SelectItem value="Accessories">Accessories</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Size / Weight</label>
                    <Input value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="e.g., 12oz, 900g, 1000pcs" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Stock Status</label>
                    <Select value={form.stock_status} onValueChange={(v) => setForm({ ...form, stock_status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_stock">In Stock</SelectItem>
                        <SelectItem value="low_stock">Low Stock</SelectItem>
                        <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Stock Quantity</label>
                    <Input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Product Image URL</label>
                  <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700">Product Description</label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleGenerateAI}
                      disabled={aiLoading}
                      className="border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                      {aiLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
                      Generate with AI
                    </Button>
                  </div>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Product description... or generate automatically with AI"
                    className="min-h-24"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={handleSave} className="bg-amber-900 hover:bg-amber-800" disabled={createMutation.isPending || updateMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="w-4 h-4 mr-2" /> Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-lg" />)}
        </div>
      ) : products.length === 0 ? (
        <Card className="border-2 border-dashed border-amber-200">
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 text-amber-300 mx-auto mb-4" />
            <p className="text-amber-900 font-semibold">No products yet</p>
            <p className="text-gray-500 text-sm">Click the button above to add a new product</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product, index) => (
            <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
              <Card className="border-amber-100 hover:shadow-lg transition-all">
                {product.image_url && (
                  <div className="h-40 overflow-hidden rounded-t-xl bg-gray-50">
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-amber-900">{product.name}</h3>
                      <p className="text-xs text-gray-500">{product.category}{product.weight ? ` • ${product.weight}` : ''}</p>
                    </div>
                    <span className="text-lg font-bold text-amber-900 whitespace-nowrap">£{product.price?.toFixed(2)}</span>
                  </div>
                  {product.description && (
                    <p className="text-xs text-gray-600 line-clamp-2">{product.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <Badge className={stockStatusConfig[product.stock_status]?.className || 'bg-gray-100 text-gray-700'}>
                      {stockStatusConfig[product.stock_status]?.label}
                    </Badge>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(product)} className="text-blue-600 hover:bg-blue-50 h-8 w-8">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { if (confirm('Are you sure you want to delete this product?')) deleteMutation.mutate(product.id); }}
                        className="text-red-600 hover:bg-red-50 h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}