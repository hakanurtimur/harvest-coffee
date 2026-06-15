import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

export default function CreateRental() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    product_id: '',
    rental_start_date: '',
    rental_end_date: '',
    notes: '',
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        window.location.href = '/';
      }
    };
    checkAuth();
  }, []);

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const createRentalMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.Rental.create({
        product_id: data.product_id,
        product_name: products.find(p => p.id === data.product_id)?.name || '',
        rental_start_date: data.rental_start_date,
        rental_end_date: data.rental_end_date,
        customer_email: user.email,
        customer_name: user.full_name || user.email,
        status: 'upcoming',
        notes: data.notes,
        reminder_sent: false,
      });
    },
    onSuccess: () => {
      navigate('/Rentals');
    },
  });

  if (!user) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.product_id || !formData.rental_start_date || !formData.rental_end_date) {
      return;
    }
    createRentalMutation.mutate(formData);
  };

  const errors = [];
  if (formData.rental_start_date && formData.rental_end_date) {
    if (new Date(formData.rental_start_date) >= new Date(formData.rental_end_date)) {
      errors.push('End date must be after start date');
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link to="/Rentals">
        <Button variant="ghost" className="text-amber-900 hover:bg-amber-50">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Rentals
        </Button>
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-amber-100">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
            <CardTitle className="text-3xl text-amber-900" style={{ fontFamily: 'Georgia, serif' }}>
              Create Rental Agreement
            </CardTitle>
            <p className="text-amber-700 mt-2">Book a product rental for your business</p>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Product *
                </label>
                <Select
                  value={formData.product_id}
                  onValueChange={(value) => setFormData({ ...formData, product_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a product to rent" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - £{product.price.toFixed(2)}/month
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.rental_start_date}
                    onChange={(e) => setFormData({ ...formData, rental_start_date: e.target.value })}
                    className="border-amber-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.rental_end_date}
                    onChange={(e) => setFormData({ ...formData, rental_end_date: e.target.value })}
                    className="border-amber-200"
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Notes
                </label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any special requirements or notes..."
                  className="border-amber-200"
                />
              </div>

              {/* Errors */}
              {errors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  {errors.map((error, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-red-800">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  ))}
                </div>
              )}

              {/* Summary */}
              {formData.product_id && formData.rental_start_date && formData.rental_end_date && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-900 mb-2">
                    <span className="font-semibold">Rental Duration:</span>{' '}
                    {Math.ceil((new Date(formData.rental_end_date) - new Date(formData.rental_start_date)) / (1000 * 60 * 60 * 24))} days
                  </p>
                  <p className="text-sm text-amber-900">
                    <span className="font-semibold">Monthly Rate:</span> £
                    {products.find(p => p.id === formData.product_id)?.price.toFixed(2) || '0.00'}
                  </p>
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={!formData.product_id || !formData.rental_start_date || !formData.rental_end_date || errors.length > 0 || createRentalMutation.isPending}
                className="w-full bg-amber-900 hover:bg-amber-800"
              >
                {createRentalMutation.isPending ? 'Creating...' : 'Create Rental Agreement'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}