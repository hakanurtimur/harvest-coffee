import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, ShoppingCart, Lock, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import ProductImage from './ProductImage';

export default function ProductCard({ product, quantity, onQuantityChange, isAuthenticated }) {
  const isOutOfStock = product.stock_status === 'out_of_stock';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden h-full hover:shadow-xl transition-all duration-300 border-amber-100 bg-white">
        {/* Product Image */}
        <div className="relative h-64 bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden">
          <ProductImage
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {/* Category Badge */}
          {product.category && (
            <Badge className="absolute top-3 right-3 bg-amber-900 text-white border-0 shadow-lg">
              {product.category}
            </Badge>
          )}
          {/* Stock Status */}
          {product.stock_status === 'low_stock' && (
            <Badge className="absolute top-3 left-3 bg-orange-500 text-white border-0 shadow-lg">
              Low Stock
            </Badge>
          )}
          {isOutOfStock && (
            <Badge className="absolute top-3 left-3 bg-red-600 text-white border-0 shadow-lg">
              Out of Stock
            </Badge>
          )}
        </div>

        <CardContent className="p-6">
          {/* Product Name */}
          <h3 className="text-xl font-bold text-amber-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            {product.name}
          </h3>

          {/* Weight */}
          {product.weight && (
            <p className="text-sm text-amber-700 mb-3">{product.weight}</p>
          )}

          {/* Description */}
          {product.description && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Quantity Controls - Cart Only */}
          {isAuthenticated ? (
            <>
              {!isOutOfStock && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-amber-50 rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onQuantityChange(product.id, Math.max(0, quantity - 1))}
                      className="text-amber-900 hover:bg-amber-100"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-12 text-center font-semibold text-amber-900">
                      {quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onQuantityChange(product.id, quantity + 1)}
                      className="text-amber-900 hover:bg-amber-100"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                   onClick={() => onQuantityChange(product.id, quantity + 1)}
                   className="flex-1 bg-amber-900 hover:bg-amber-800 text-white shadow-md"
                  >
                   <ShoppingCart className="w-4 h-4 mr-2" />
                   Add to Cart
                  </Button>
                </div>
              )}
              
              {isOutOfStock && (
                <Button disabled className="w-full bg-gray-300 text-gray-500">
                  Out of Stock
                </Button>
              )}
            </>
          ) : (
            <div className="bg-gradient-to-r from-blue-50 to-amber-50 border-2 border-amber-200 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-amber-700" />
                <p className="text-sm font-semibold text-amber-900">
                  Sign in to add items
                </p>
              </div>
              <Button
                onClick={() => base44.auth.redirectToLogin()}
                variant="outline"
                className="w-full border-amber-900 text-amber-900 hover:bg-amber-50"
                size="sm"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Dealer Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}