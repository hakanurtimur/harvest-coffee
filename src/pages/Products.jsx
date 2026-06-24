import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Trash2, ArrowRight, CreditCard, Building2, LogIn, Lock, Grid3x3, List, Plus, Minus, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/products/ProductCard';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useLanguage } from '../Layout';
import { usePullToRefresh } from '../hooks/usePullToRefresh';

export default function Products() {
  const [cart, setCart] = useState({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(null);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'
  const [currentUser, setCurrentUser] = useState(null);
  
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { containerRef, isRefreshing } = usePullToRefresh(async () => {
    await queryClient.refetchQueries({ queryKey: ['products'] });
  });

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await base44.auth.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        try {
          const user = await base44.auth.me();
          setCurrentUser(user);
          // Auto-select address if only one exists
          if (user.addresses && user.addresses.length === 1) {
            setSelectedAddressIndex(0);
            setDeliveryAddress(user.addresses[0].address);
          }
        } catch (error) {
          console.error('Error fetching user:', error);
        }
      }
    };
    checkAuth();
  }, []);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const createOrderMutation = useMutation({
    mutationFn: (orderData) => base44.entities.Order.create(orderData),
    onSuccess: async (newOrder) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      
      // Send email notifications
      try {
        const user = await base44.auth.me();
        
        // Email to customer
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: `Order Received - #${newOrder.order_number}`,
          body: `Hello ${user.full_name || user.email},\n\nYour order has been received successfully!\n\nOrder No: ${newOrder.order_number}\nTotal Amount: £${newOrder.total_amount.toFixed(2)}\nPayment Method: ${newOrder.payment_method === 'bank_transfer' ? 'Bank Transfer' : newOrder.payment_method === 'credit_card' ? 'Credit Card' : 'PayPal'}\n\nYou can track your order status from your account.\n\nThank you,\nHarvest Coffee`
        });
        
        // Email to admin
        await base44.integrations.Core.SendEmail({
          to: 'admin@harvestcoffee.com',
          subject: `New Order - #${newOrder.order_number}`,
          body: `A new order has been received!\n\nOrder No: ${newOrder.order_number}\nCustomer: ${user.email}\nTotal Amount: £${newOrder.total_amount.toFixed(2)}\nPayment Status: ${newOrder.payment_status}\nPayment Method: ${newOrder.payment_method}\n\nYou can view the details from the admin panel.`
        });
      } catch (emailError) {
        console.error('Error sending email:', emailError);
      }
      
      setCart({});
      setDeliveryAddress('');
      setNotes('');
      setShowCheckout(false);
      navigate(createPageUrl('OrderDetails') + `?id=${newOrder.id}`);
    },
  });

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity === 0) {
      const newCart = { ...cart };
      delete newCart[productId];
      setCart(newCart);
    } else {
      setCart({ ...cart, [productId]: newQuantity });
    }
  };

  const cartItems = Object.keys(cart)
    .filter(id => cart[id] > 0)
    .map(id => {
      const product = products.find(p => p.id === id);
      return product ? {
        ...product,
        quantity: cart[id],
        subtotal: product.price * cart[id]
      } : null;
    })
    .filter(Boolean);

  const totalAmount = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

  const handleCheckout = async () => {
    if (!deliveryAddress.trim()) {
      alert('Please select or enter a delivery address.');
      return;
    }

    setIsProcessing(true);

    const orderNumber = 'HC' + Date.now().toString().slice(-8);
    const orderData = {
      order_number: orderNumber,
      items: cartItems.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      })),
      total_amount: totalAmount,
      status: 'preparing',
      payment_method: paymentMethod,
      payment_status: 'pending',
      delivery_address: deliveryAddress,
      notes: notes
    };

    createOrderMutation.mutate(orderData);
    setIsProcessing(false);
  };

  return (
    <div ref={containerRef} className="space-y-8 min-h-screen md:pb-0 pb-24">
      {/* Pull-to-refresh indicator */}
      {isRefreshing && (
        <div className="flex justify-center p-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
            <RotateCw className="w-6 h-6 text-amber-900" />
          </motion.div>
        </div>
      )}

      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-amber-900 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
          {t.premiumCoffeeCollection}
        </h1>
        <p className="text-amber-700 text-lg">
          {t.carefullySourced}
        </p>
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Card className="max-w-2xl mx-auto bg-gradient-to-r from-blue-50 to-amber-50 border-2 border-amber-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Lock className="w-5 h-5 text-amber-700" />
                  <p className="text-lg font-semibold text-amber-900">
                    {t.loginToSeePrices}
                  </p>
                </div>
                <Button
                  onClick={() => base44.auth.redirectToLogin()}
                  className="bg-amber-900 hover:bg-amber-800"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  {t.dealerLoginButton}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* View Mode Toggle & Cart Summary */}
      <div className="flex flex-col gap-4">
        {/* View Mode Toggle - Only for authenticated users */}
        {isAuthenticated && (
          <Card className="border-amber-200">
            <CardContent className="p-3">
              <div className="flex gap-2 justify-center md:justify-start">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-amber-900 hover:bg-amber-800' : 'border-amber-200'}
                >
                  <Grid3x3 className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">{t.cardView}</span>
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-amber-900 hover:bg-amber-800' : 'border-amber-200'}
                >
                  <List className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">{t.listView}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cart Summary Bar */}
        {isAuthenticated && cartItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-r from-amber-900 to-amber-800 border-0 shadow-lg">
              <CardContent className="p-3 md:p-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-white">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="text-sm md:text-base font-semibold">
                      {cartItems.length} {t.itemsInCart}
                    </span>
                  </div>
                  <Button
                    onClick={() => setShowCheckout(true)}
                    className="bg-white text-amber-900 hover:bg-amber-50 w-full sm:w-auto"
                    size="sm"
                  >
                    {t.placeOrder}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Products Display */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-96 bg-gray-100 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : isAuthenticated && viewMode === 'list' ? (
        /* List View for Authenticated Users */
        <Card className="border-amber-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-amber-50 to-orange-50 border-b-2 border-amber-200">
                <tr>
                  <th className="text-left p-4 font-semibold text-amber-900">{t.product}</th>
                  <th className="text-left p-4 font-semibold text-amber-900">{t.category}</th>
                  <th className="text-left p-4 font-semibold text-amber-900">{t.weight}</th>
                  <th className="text-center p-4 font-semibold text-amber-900">{t.quantity}</th>
                  <th className="text-center p-4 font-semibold text-amber-900">{t.action}</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => {
                  const isOutOfStock = product.stock_status === 'out_of_stock';
                  return (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-amber-50 hover:bg-amber-50/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div>
                            <p className="font-semibold text-amber-900">{product.name}</p>
                            <p className="text-xs text-gray-600 line-clamp-1">{product.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-amber-800 bg-amber-100 px-2 py-1 rounded">
                          {product.category}
                        </span>
                      </td>
                      <td className="p-4 text-gray-700">{product.weight}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleQuantityChange(product.id, Math.max(0, (cart[product.id] || 0) - 1))}
                            disabled={isOutOfStock || !cart[product.id]}
                            className="h-8 w-8 border-amber-300"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-12 text-center font-semibold text-amber-900">
                            {cart[product.id] || 0}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleQuantityChange(product.id, (cart[product.id] || 0) + 1)}
                            disabled={isOutOfStock}
                            className="h-8 w-8 border-amber-300"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="p-4">
                        {isOutOfStock ? (
                          <span className="text-sm text-red-600 font-medium">{t.outOfStock}</span>
                        ) : (
                          <Button
                            onClick={() => handleQuantityChange(product.id, (cart[product.id] || 0) + 1)}
                            size="sm"
                            className="bg-amber-900 hover:bg-amber-800"
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            {t.addToCart}
                          </Button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              quantity={cart[product.id] || 0}
              onQuantityChange={handleQuantityChange}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      )}

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCheckout(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl mx-4"
            >
              <Card className="border-0">
                <CardHeader className="border-b bg-amber-50">
                  <CardTitle className="text-2xl text-amber-900" style={{ fontFamily: 'Georgia, serif' }}>
                    {t.orderSummary}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Cart Items */}
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-3 border-b">
                        <div className="flex-1">
                          <p className="font-semibold text-amber-900">{item.name}</p>
                          <p className="text-sm text-gray-600">{item.quantity} items</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleQuantityChange(item.id, 0)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-amber-900">{t.total}</span>
                      <span className="text-2xl font-bold text-amber-900">{cartItems.length} items</span>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">{t.paymentMethod}</label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="w-full text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 className="w-4 h-4" />
                            <span className="truncate">{t.bankTransfer}</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="credit_card">
                          <div className="flex items-center gap-2 text-sm">
                            <CreditCard className="w-4 h-4" />
                            <span className="truncate">{t.creditCard}</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="paypal">
                          <div className="flex items-center gap-2 text-sm">
                            <CreditCard className="w-4 h-4" />
                            <span className="truncate">{t.paypal}</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="cash_on_delivery">
                          <div className="flex items-center gap-2 text-sm">
                            <CreditCard className="w-4 h-4" />
                            <span className="truncate">{t.cashOnDelivery}</span>
                          </div>
                        </SelectItem>
                        </SelectContent>
                        </Select>
                        </div>

                  {/* Delivery Address */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">{t.deliveryAddress} *</label>

                    {currentUser?.addresses && currentUser.addresses.length > 0 && (
                      <div className="space-y-2 mb-3">
                        <Select
                          value={selectedAddressIndex !== null ? selectedAddressIndex.toString() : 'custom'}
                          onValueChange={(value) => {
                            if (value === 'custom') {
                              setSelectedAddressIndex(null);
                              setDeliveryAddress('');
                            } else {
                              const index = parseInt(value);
                              setSelectedAddressIndex(index);
                              setDeliveryAddress(currentUser.addresses[index].address);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a saved address" />
                          </SelectTrigger>
                          <SelectContent>
                            {currentUser.addresses.map((addr, index) => (
                              <SelectItem key={index} value={index.toString()}>
                                {addr.title}
                              </SelectItem>
                            ))}
                            <SelectItem value="custom">Enter a different address</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <Textarea
                      value={deliveryAddress}
                      onChange={(e) => {
                        setDeliveryAddress(e.target.value);
                        setSelectedAddressIndex(null);
                      }}
                      placeholder={currentUser?.addresses?.length > 0 ? "Or enter a different address" : t.deliveryAddressPlaceholder}
                      className="min-h-24"
                      disabled={selectedAddressIndex !== null && selectedAddressIndex >= 0}
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">{t.orderNotes}</label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={t.orderNotesPlaceholder}
                      className="min-h-20"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowCheckout(false)}
                      className="flex-1"
                      disabled={isProcessing}
                      size="sm"
                    >
                      {t.cancel}
                    </Button>
                    <Button
                      onClick={handleCheckout}
                      className="flex-1 bg-amber-900 hover:bg-amber-800 text-white"
                      disabled={isProcessing}
                      size="sm"
                    >
                      {isProcessing ? t.processing : t.confirmOrder}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}