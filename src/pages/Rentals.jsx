import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export default function Rentals() {
  const [user, setUser] = useState(null);

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

  const { data: rentals = [], isLoading } = useQuery({
    queryKey: ['my-rentals', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Rental.filter({ customer_email: user.email }, '-created_date');
    },
    enabled: !!user?.email,
  });

  if (!user) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const activeRentals = rentals.filter(r => r.status === 'active').length;
  const upcomingRentals = rentals.filter(r => r.status === 'upcoming').length;

  const getStatusIcon = (status) => {
    const icons = {
      active: CheckCircle,
      upcoming: Clock,
      expired: AlertTriangle,
      cancelled: AlertTriangle,
    };
    return icons[status] || Calendar;
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'text-green-600 bg-green-50',
      upcoming: 'text-blue-600 bg-blue-50',
      expired: 'text-red-600 bg-red-50',
      cancelled: 'text-gray-600 bg-gray-50',
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-amber-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            My Rentals
          </h1>
          <p className="text-amber-700">Track your active and upcoming rental agreements</p>
        </div>
        <Link to="/CreateRental">
          <Button className="bg-amber-900 hover:bg-amber-800">
            Start New Rental
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="p-4">
              <p className="text-sm text-amber-700 mb-1">Total Rentals</p>
              <p className="text-3xl font-bold text-amber-900">{rentals.length}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <p className="text-sm text-green-700 mb-1">Active</p>
              <p className="text-3xl font-bold text-green-900">{activeRentals}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <p className="text-sm text-blue-700 mb-1">Upcoming</p>
              <p className="text-3xl font-bold text-blue-900">{upcomingRentals}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Rentals List */}
      {isLoading ? (
        <div className="text-center py-12">Loading rentals...</div>
      ) : rentals.length === 0 ? (
        <Card className="border-2 border-dashed border-amber-200">
          <CardContent className="p-12 text-center">
            <Calendar className="w-16 h-16 text-amber-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-amber-900 mb-2">No active rentals</h3>
            <p className="text-gray-600 mb-4">Start renting our products today</p>
            <Link to="/CreateRental">
              <Button className="bg-amber-900 hover:bg-amber-800">Create First Rental</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rentals.map((rental, idx) => {
            const StatusIcon = getStatusIcon(rental.status);
            const statusColor = getStatusColor(rental.status);

            return (
              <motion.div
                key={rental.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-all border-amber-100">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded-lg ${statusColor}`}>
                            <StatusIcon className="w-5 h-5" />
                          </div>
                          <h3 className="text-lg font-semibold text-amber-900">
                            {rental.product_name}
                          </h3>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Start: {format(new Date(rental.rental_start_date), 'dd MMM yyyy')}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            End: {format(new Date(rental.rental_end_date), 'dd MMM yyyy')}
                          </div>
                          {rental.notes && (
                            <div className="mt-2 p-2 bg-amber-50 rounded">
                              <p className="text-xs text-amber-900">{rental.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          rental.status === 'active' ? 'bg-green-100 text-green-800' :
                          rental.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                          rental.status === 'expired' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {rental.status.charAt(0).toUpperCase() + rental.status.slice(1)}
                        </div>
                        <Button variant="outline" size="sm" className="gap-2">
                          <FileText className="w-4 h-4" />
                          Invoice
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}