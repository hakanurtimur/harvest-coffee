import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

export default function PaymentStatusBadge({ status }) {
  const statusConfig = {
    pending: {
      label: 'Pending',
      icon: Clock,
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
    paid: {
      label: 'Paid',
      icon: CheckCircle,
      className: 'bg-green-100 text-green-800 border-green-200',
    },
    failed: {
      label: 'Failed',
      icon: XCircle,
      className: 'bg-red-100 text-red-800 border-red-200',
    },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <Badge className={`${config.className} border flex items-center gap-1.5 px-3 py-1.5`}>
      <Icon className="w-4 h-4" />
      <span className="font-medium">{config.label}</span>
    </Badge>
  );
}