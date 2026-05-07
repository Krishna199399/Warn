import { Badge } from './badge';
import { cn } from '@/lib/utils';

const STATUS_VARIANTS = {
  order: {
    PENDING: { variant: 'outline', className: 'border-amber-300 text-amber-700 bg-amber-50' },
    APPROVED: { variant: 'secondary', className: 'bg-blue-50 text-blue-700' },
    SHIPPED: { variant: 'default', className: 'bg-purple-50 text-purple-700' },
    DELIVERED: { variant: 'default', className: 'bg-green-50 text-green-700' },
    CANCELLED: { variant: 'destructive', className: 'bg-red-50 text-red-700' },
  },
  payment: {
    PENDING: { variant: 'outline', className: 'border-amber-300 text-amber-700 bg-amber-50' },
    PAID: { variant: 'default', className: 'bg-green-50 text-green-700' },
    FAILED: { variant: 'destructive', className: 'bg-red-50 text-red-700' },
  },
  user: {
    PENDING: { variant: 'outline', className: 'border-amber-300 text-amber-700 bg-amber-50' },
    APPROVED: { variant: 'default', className: 'bg-green-50 text-green-700' },
    REJECTED: { variant: 'destructive', className: 'bg-red-50 text-red-700' },
  },
  stock: {
    OK: { variant: 'default', className: 'bg-green-50 text-green-700' },
    LOW: { variant: 'default', className: 'bg-amber-50 text-amber-700' },
    OUT: { variant: 'destructive', className: 'bg-red-50 text-red-700' },
  },
};

/**
 * Reusable status badge component with predefined variants
 * @param {string} status - Status value
 * @param {string} type - Type of status (order, payment, user, stock)
 * @param {string} className - Additional classes
 */
export function StatusBadge({ status, type = 'order', className }) {
  const config = STATUS_VARIANTS[type]?.[status] || { variant: 'outline', className: '' };
  
  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {status}
    </Badge>
  );
}
