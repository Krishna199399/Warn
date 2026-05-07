import { Button } from './button';
import { RefreshCw } from 'lucide-react';

/**
 * Reusable page header component
 * @param {string} title - Page title
 * @param {string} description - Page description
 * @param {React.ReactNode} actions - Action buttons or elements
 * @param {Function} onRefresh - Optional refresh handler
 * @param {boolean} refreshing - Refresh loading state
 */
export function PageHeader({ 
  title, 
  description, 
  actions, 
  onRefresh,
  refreshing = false 
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground text-sm mt-1">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {onRefresh && (
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onRefresh} 
            disabled={refreshing}
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          </Button>
        )}
        {actions}
      </div>
    </div>
  );
}
