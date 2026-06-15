import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Package, AlertTriangle, TrendingDown, TrendingUp, Edit2, Save, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StockManagement() {
  const [user, setUser] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser.role !== 'admin') {
          window.location.href = '/';
        }
      } catch (error) {
        window.location.href = '/';
      }
    };
    checkAdmin();
  }, []);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products-stock'],
    queryFn: () => base44.entities.Product.list(),
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: async (updatedProduct) => {
      queryClient.invalidateQueries({ queryKey: ['products-stock'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      // Check if stock is low and send notification
      if (updatedProduct.stock_quantity <= updatedProduct.low_stock_threshold && updatedProduct.stock_quantity > 0) {
        try {
          await base44.integrations.Core.SendEmail({
            to: 'admin@harvestcoffee.com',
            subject: `⚠️ Düşük Stok Uyarısı - ${updatedProduct.name}`,
            body: `UYARI: ${updatedProduct.name} ürününün stok seviyesi kritik seviyede!\n\nMevcut Stok: ${updatedProduct.stock_quantity} adet\nEşik Değeri: ${updatedProduct.low_stock_threshold} adet\n\nLütfen en kısa sürede stok yenilemesi yapınız.`
          });
        } catch (error) {
          console.error('Email gönderilirken hata:', error);
        }
      }
      
      setEditingId(null);
      setEditValues({});
    },
  });

  if (!user || user.role !== 'admin') {
    return <div className="text-center py-12">Yükleniyor...</div>;
  }

  const handleEdit = (product) => {
    setEditingId(product.id);
    setEditValues({
      stock_quantity: product.stock_quantity || 0,
      low_stock_threshold: product.low_stock_threshold || 10,
    });
  };

  const handleSave = (productId) => {
    updateProductMutation.mutate({
      id: productId,
      data: editValues,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  const lowStockProducts = products.filter(p => 
    (p.stock_quantity || 0) <= (p.low_stock_threshold || 10) && (p.stock_quantity || 0) > 0
  );

  const outOfStockProducts = products.filter(p => (p.stock_quantity || 0) === 0);

  const totalStockValue = products.reduce((sum, p) => sum + ((p.stock_quantity || 0) * p.price), 0);

  const getStockBadge = (product) => {
    const quantity = product.stock_quantity || 0;
    const threshold = product.low_stock_threshold || 10;

    if (quantity === 0) {
      return <Badge className="bg-red-100 text-red-800">Out of Stock</Badge>;
    } else if (quantity <= threshold) {
      return <Badge className="bg-yellow-100 text-yellow-800">Low Stock</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800">In Stock</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-amber-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          Stock Management
        </h1>
        <p className="text-amber-700">Product stock levels and management</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-amber-100 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 mb-1">Total Products</p>
                  <p className="text-3xl font-bold text-blue-900">{products.length}</p>
                </div>
                <Package className="w-12 h-12 text-blue-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-amber-100 bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-700 mb-1">Low Stock</p>
                  <p className="text-3xl font-bold text-yellow-900">{lowStockProducts.length}</p>
                </div>
                <AlertTriangle className="w-12 h-12 text-yellow-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-amber-100 bg-gradient-to-br from-red-50 to-red-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700 mb-1">Out of Stock</p>
                  <p className="text-3xl font-bold text-red-900">{outOfStockProducts.length}</p>
                </div>
                <TrendingDown className="w-12 h-12 text-red-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-amber-100 bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 mb-1">Stock Value</p>
                  <p className="text-3xl font-bold text-green-900">£{totalStockValue.toFixed(2)}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="border-b border-yellow-200">
            <CardTitle className="text-yellow-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="p-4 bg-white rounded-lg border-2 border-yellow-300">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-semibold text-amber-900">{product.name}</p>
                    <Badge className="bg-yellow-100 text-yellow-800">!</Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600">Current: <span className="font-bold text-yellow-900">{product.stock_quantity || 0} units</span></p>
                    <p className="text-gray-600">Threshold: {product.low_stock_threshold || 10} units</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock Management Table */}
      <Card className="border-amber-100">
        <CardHeader>
          <CardTitle className="text-amber-900">All Products - Stock Status</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
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
                  <tr key={product.id} className="border-b border-amber-50 hover:bg-amber-50/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <div>
                          <p className="font-semibold text-amber-900">{product.name}</p>
                          <p className="text-xs text-gray-600">{product.weight}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-amber-800 bg-amber-100 px-2 py-1 rounded">
                        {product.category}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {getStockBadge(product)}
                    </td>
                    <td className="p-4 text-center">
                      {editingId === product.id ? (
                        <Input
                          type="number"
                          value={editValues.stock_quantity}
                          onChange={(e) => setEditValues({ ...editValues, stock_quantity: parseInt(e.target.value) || 0 })}
                          className="w-20 text-center"
                          min="0"
                        />
                      ) : (
                        <span className="font-semibold text-amber-900">{product.stock_quantity || 0}</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {editingId === product.id ? (
                        <Input
                          type="number"
                          value={editValues.low_stock_threshold}
                          onChange={(e) => setEditValues({ ...editValues, low_stock_threshold: parseInt(e.target.value) || 0 })}
                          className="w-20 text-center"
                          min="0"
                        />
                      ) : (
                        <span className="text-gray-600">{product.low_stock_threshold || 10}</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-bold text-green-700">
                        £{((product.stock_quantity || 0) * product.price).toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        {editingId === product.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleSave(product.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancel}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(product)}
                            className="border-amber-300"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}