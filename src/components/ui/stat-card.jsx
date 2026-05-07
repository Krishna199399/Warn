import { Card, CardContent, CardHeader, CardTitle } from './card';
import { formatCurrency, formatNumber } from '@/utils/helpers';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * Reusable stat card component for displaying metrics
 * @param {string} label - Card label/title
 * @param {number|string} value - Main value to display
 * @param {React.Component} icon - Icon component
 * @param {Object} trend - Trend information { value, direction }
 * @param {string} format - Format type: 'number', 'currency', 'percentage', 'none'
 * @param {string} className - Additional classes
 */
export function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  trend, 
  format = 'number',
  className = '' 
}) {
  const formatValue = (val) => {
    if (format === 'currency') return formatCurrency(val);
    if (format === 'number') return formatNumber(val);
    if (format === 'percentage') return `${val}%`;
    return val;
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(value)}</div>
        {trend && (
          <p className={`text-xs font-medium mt-1 flex items-center gap-1 ${
            trend.direction === 'up' ? 'text-green-600' : 
            trend.direction === 'down' ? 'text-red-600' : 
            'text-muted-foreground'
          }`}>
            {trend.direction === 'up' && <TrendingUp size={12} />}
            {trend.direction === 'down' && <TrendingDown size={12} />}
            {trend.value}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
