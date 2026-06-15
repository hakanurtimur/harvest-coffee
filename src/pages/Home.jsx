import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Coffee, Package, ShoppingCart, Plus, Zap, ArrowRight, Star, Leaf, Award } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cart, setCart] = useState({});

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await base44.auth.isAuthenticated();
      setIsAuthenticated(authenticated);
    };
    checkAuth();
  }, []);

  const { data: products = [] } = useQuery({
    queryKey: ['products-home'],
    queryFn: () => base44.entities.Product.list(),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders-home'],
    queryFn: () => base44.entities.Order.list('-created_date'),
    enabled: isAuthenticated,
  });

  const getMostOrderedProducts = () => {
    if (!orders.length || !products.length) return [];
    const productCounts = {};
    orders.forEach(order => {
      order.items?.forEach(item => {
        if (!productCounts[item.product_id]) productCounts[item.product_id] = { count: 0, quantity: 0 };
        productCounts[item.product_id].count += 1;
        productCounts[item.product_id].quantity += item.quantity;
      });
    });
    return Object.entries(productCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 4)
      .map(([productId]) => products.find(p => p.id === productId))
      .filter(Boolean);
  };

  const handleQuickAdd = (productId) => {
    if (!isAuthenticated) { base44.auth.redirectToLogin(); return; }
    setCart(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
  };

  const mostOrderedProducts = getMostOrderedProducts();
  const featuredProduct = products.find(p => p.category === 'Single Origin' || p.category === 'Blend') || products[0];

  return (
    <div className="min-h-screen">

      {/* HERO SECTION - Full bleed with dark overlay */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 -mt-8">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=80')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-transparent" />

        <div className="relative z-10 px-8 sm:px-16 lg:px-24 max-w-3xl">
          {/* Fairtrade badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <span className="text-xs font-bold tracking-[0.2em] text-amber-400 uppercase">Our Philosophy · Exceptional Quality</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            It all began with a modest concept: Create{' '}
            <em className="text-amber-400 not-italic">amazing</em> coffee
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-xl text-gray-200 mb-10"
          >
            Coffee is our craft, our ritual, our passion and we want to share it with you.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link to={createPageUrl('Products')}>
              <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-4 text-base">
                Discover Products
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to={createPageUrl('About')}>
              <Button size="lg" variant="outline" className="border-white text-white bg-white/10 hover:bg-white/20 px-8 py-4 text-base">
                Learn More
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Vertical text label */}
        <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 flex-col items-center gap-2">
          <span className="text-white/50 text-xs tracking-[0.3em] uppercase rotate-90 whitespace-nowrap">Scroll Down</span>
          <div className="w-px h-16 bg-white/30" />
        </div>
      </section>

      {/* MISSION SECTION */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <span className="text-xs font-bold tracking-[0.2em] text-amber-600 uppercase mb-3 block">Because We Love Coffee</span>
              <h2 className="text-4xl md:text-5xl font-bold text-amber-900 mb-6" style={{ fontFamily: 'Georgia, serif' }}>
                Our <em className="not-italic text-amber-600">Mission</em>
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                Everything we do is a matter of heart, body and soul. Our mission is to provide sustainably sourced, hand-picked, micro-roasted quality coffee. Great coffee is our passion and we want to share it with you.
              </p>
              <Link to={createPageUrl('About')}>
                <Button variant="outline" className="border-amber-900 text-amber-900 hover:bg-amber-50">
                  Learn More
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <img
                src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80"
                alt="Coffee beans"
                className="rounded-2xl shadow-2xl w-full h-80 object-cover"
              />
              <div className="absolute -bottom-6 -left-6 bg-amber-900 text-white p-6 rounded-2xl shadow-xl">
                <p className="text-3xl font-bold">15+</p>
                <p className="text-amber-200 text-sm">Years of Excellence</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* VALUES STRIP */}
      <section className="py-16 bg-amber-900 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { icon: Leaf, title: 'Sustainably Sourced', desc: 'Fairtrade certified beans from ethical farms' },
              { icon: Award, title: 'Micro-Roasted', desc: 'Hand-crafted roasting for peak flavour' },
              { icon: Star, title: 'B2B Excellence', desc: 'Tailored wholesale programs for your business' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="p-3 bg-amber-800 rounded-full">
                  <item.icon className="w-7 h-7 text-amber-300" />
                </div>
                <h3 className="text-lg font-bold">{item.title}</h3>
                <p className="text-amber-200 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WHOLESALE CTA */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&q=80')" }}
            />
            <div className="absolute inset-0 bg-black/60" />
            <div className="relative z-10 py-20 px-10 text-center text-white">
              <span className="text-xs font-bold tracking-[0.2em] text-amber-400 uppercase mb-3 block">Become a Partner</span>
              <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Georgia, serif' }}>
                Explore <em className="not-italic text-amber-400">Wholesale</em>
              </h2>
              <p className="text-gray-200 text-lg mb-8 max-w-xl mx-auto">
                Personalised to your specific needs. We help build coffee programs to grow your business.
              </p>
              {isAuthenticated ? (
                <Link to={createPageUrl('Products')}>
                  <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-10">
                    Order Now <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              ) : (
                <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-10" onClick={() => base44.auth.redirectToLogin()}>
                  Get in Touch <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCT */}
      {featuredProduct && (
        <section className="py-16 px-4 bg-amber-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <span className="text-xs font-bold tracking-[0.2em] text-amber-600 uppercase mb-2 block">Staff Favourite · Featured Coffee</span>
              <h2 className="text-4xl font-bold text-amber-900" style={{ fontFamily: 'Georgia, serif' }}>
                {featuredProduct.name}
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
              >
                {featuredProduct.image_url ? (
                  <img src={featuredProduct.image_url} alt={featuredProduct.name} className="rounded-2xl shadow-xl w-full h-96 object-cover" />
                ) : (
                  <div className="rounded-2xl bg-amber-200 w-full h-96 flex items-center justify-center">
                    <Coffee className="w-24 h-24 text-amber-700" />
                  </div>
                )}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Badge className="bg-amber-100 text-amber-800 mb-4">{featuredProduct.category}</Badge>
                <p className="text-gray-600 text-lg leading-relaxed mb-6">{featuredProduct.description}</p>
                {isAuthenticated && (
                  <p className="text-3xl font-bold text-amber-900 mb-6">£{featuredProduct.price?.toFixed(2)}</p>
                )}
                <Link to={createPageUrl('Products')}>
                  <Button className="bg-amber-900 hover:bg-amber-800 text-white px-8">
                    Discover Products <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* QUICK ORDER - Only for authenticated users with order history */}
      {isAuthenticated && mostOrderedProducts.length > 0 && (
        <section className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="w-6 h-6 text-amber-600" />
                <h2 className="text-3xl font-bold text-amber-900" style={{ fontFamily: 'Georgia, serif' }}>
                  Quick Order
                </h2>
              </div>
              <p className="text-gray-500">Your most frequently ordered products — one click to reorder</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {mostOrderedProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-amber-100 hover:shadow-lg transition-all">
                    {product.image_url && (
                      <div className="h-40 overflow-hidden rounded-t-xl bg-gray-50">
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-amber-900 text-sm">{product.name}</h3>
                        <p className="text-xs text-gray-500">{product.category}{product.weight ? ` • ${product.weight}` : ''}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-amber-900">£{product.price?.toFixed(2)}</span>
                        <Badge className="bg-amber-100 text-amber-800 text-xs">Popular</Badge>
                      </div>
                      <Button
                        onClick={() => handleQuickAdd(product.id)}
                        className="w-full bg-amber-900 hover:bg-amber-800"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Quick Add
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {Object.keys(cart).length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                <Card className="bg-gradient-to-r from-amber-900 to-amber-800 border-0 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" />
                        <span className="font-semibold">
                          {Object.values(cart).reduce((sum, qty) => sum + qty, 0)} items added
                        </span>
                      </div>
                      <Link to={createPageUrl('Products')}>
                        <Button className="bg-white text-amber-900 hover:bg-amber-50">
                          Continue to Cart <ShoppingCart className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}