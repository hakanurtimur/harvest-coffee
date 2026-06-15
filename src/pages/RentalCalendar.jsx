import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Package, User, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, parse, getDay } from 'date-fns';

export default function RentalCalendar() {
  const [user, setUser] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

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

  const { data: rentals = [], isLoading } = useQuery({
    queryKey: ['all-rentals-calendar'],
    queryFn: () => base44.entities.Rental.list(),
  });

  if (!user || user.role !== 'admin') {
    return <div className="text-center py-12">Loading...</div>;
  }

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const getRentalsForDay = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return rentals.filter(rental => {
      const start = rental.rental_start_date;
      const end = rental.rental_end_date;
      return dateStr >= start && dateStr <= end && rental.status === 'active';
    });
  };

  const getUpcomingRentalsForDay = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return rentals.filter(rental => {
      return rental.rental_start_date === dateStr && rental.status === 'upcoming';
    });
  };

  const getExpiringRentalsForDay = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return rentals.filter(rental => {
      return rental.rental_end_date === dateStr && rental.status === 'active';
    });
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + direction)));
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const totalActiveRentals = rentals.filter(r => r.status === 'active').length;
  const totalUpcomingRentals = rentals.filter(r => r.status === 'upcoming').length;
  const expiringThisMonth = rentals.filter(r => {
    const endDate = parse(r.rental_end_date, 'yyyy-MM-dd', new Date());
    return r.status === 'active' && 
           endDate >= monthStart && 
           endDate <= monthEnd;
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-amber-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          Rental Calendar
        </h1>
        <p className="text-amber-700">Visual overview of rental activity</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <p className="text-sm text-green-700 mb-1">Active Rentals</p>
              <p className="text-3xl font-bold text-green-900">{totalActiveRentals}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <p className="text-sm text-blue-700 mb-1">Upcoming This Month</p>
              <p className="text-3xl font-bold text-blue-900">{totalUpcomingRentals}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <p className="text-sm text-orange-700 mb-1">Expiring This Month</p>
              <p className="text-3xl font-bold text-orange-900">{expiringThisMonth}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="p-4">
              <p className="text-sm text-amber-700 mb-1">Total Rentals</p>
              <p className="text-3xl font-bold text-amber-900">{rentals.length}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Calendar */}
      <Card className="border-amber-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-amber-900">
              {format(currentMonth, 'MMMM yyyy')}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth(-1)}
                className="border-amber-200 hover:bg-amber-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date())}
                className="border-amber-200 hover:bg-amber-50"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth(1)}
                className="border-amber-200 hover:bg-amber-50"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b border-amber-200 bg-amber-50">
            {weekDays.map(day => (
              <div key={day} className="p-3 text-center text-sm font-semibold text-amber-900">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const dayRentals = getRentalsForDay(day);
              const upcomingRentals = getUpcomingRentalsForDay(day);
              const expiringRentals = getExpiringRentalsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={idx}
                  className={`min-h-28 p-2 border-b border-r border-amber-100 ${
                    !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                  } ${isToday ? 'bg-amber-50' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${
                      isToday ? 'bg-amber-900 text-white w-7 h-7 rounded-full flex items-center justify-center' :
                      isCurrentMonth ? 'text-amber-900' : 'text-gray-400'
                    }`}>
                      {format(day, 'd')}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {dayRentals.slice(0, 3).map(rental => (
                      <div
                        key={rental.id}
                        className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded truncate"
                        title={`${rental.product_name} - ${rental.customer_name}`}
                      >
                        <Package className="w-3 h-3 inline mr-1" />
                        {rental.product_name.split(' ').slice(0, 2).join(' ')}
                      </div>
                    ))}

                    {upcomingRentals.map(rental => (
                      <div
                        key={rental.id}
                        className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded truncate"
                        title={`Starting: ${rental.product_name} - ${rental.customer_name}`}
                      >
                        <Clock className="w-3 h-3 inline mr-1" />
                        Start: {rental.product_name.split(' ').slice(0, 2).join(' ')}
                      </div>
                    ))}

                    {expiringRentals.map(rental => (
                      <div
                        key={rental.id}
                        className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded truncate"
                        title={`Expiring: ${rental.product_name} - ${rental.customer_name}`}
                      >
                        <CalendarIcon className="w-3 h-3 inline mr-1" />
                        End: {rental.product_name.split(' ').slice(0, 2).join(' ')}
                      </div>
                    ))}

                    {dayRentals.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{dayRentals.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="border-amber-100">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span className="text-gray-700">Active Rental</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
              <span className="text-gray-700">Starting Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div>
              <span className="text-gray-700">Expiring Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-50 border border-amber-300 rounded"></div>
              <span className="text-gray-700">Today</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}