import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Package, Truck, CheckCircle } from 'lucide-react';

export default function OrderStatusBadge({ status }) {
  const statusConfig = {
    preparing: {
      label: 'Preparing',
      icon: Package,
      className: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    in_transit: {
      label: 'In Transit',
      icon: Truck,
      className: 'bg-orange-100 text-orange-800 border-orange-200',
    },
    delivered: {
      label: 'Delivered',
      icon: CheckCircle,
      className: 'bg-green-100 text-green-800 border-green-200',
    },
  };

  const config = statusConfig[status] || statusConfig.preparing;
  const Icon = config.icon;

  return (
    <Badge className={`${config.className} border flex items-center gap-1.5 px-3 py-1.5`}>
      <Icon className="w-4 h-4" />
      <span className="font-medium">{config.label}</span>
    </Badge>
  );
}