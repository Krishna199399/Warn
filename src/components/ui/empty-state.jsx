import { Card, CardContent } from './card';

/**
 * Reusable empty state component
 * @param {React.Component} icon - Icon component to display
 * @param {string} title - Main title text
 * @param {string} description - Description text
 * @param {React.ReactNode} action - Optional action button or element
 * @param {string} className - Additional classes
 */
export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className = '' 
}) {
  return (
    <Card className={`border-dashed shadow-none bg-muted/20 ${className}`}>
      <CardContent className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        {Icon && (
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <Icon size={28} className="text-muted-foreground/60" />
          </div>
        )}
        <div>
          <p className="font-semibold text-lg text-foreground">{title}</p>
          {description && (
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {description}
            </p>
          )}
        </div>
        {action && <div className="mt-2">{action}</div>}
      </CardContent>
    </Card>
  );
}
