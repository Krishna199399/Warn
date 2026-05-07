import { Skeleton } from './skeleton';
import { Card, CardContent } from './card';

/**
 * Reusable loading grid component with skeleton cards
 * @param {number} count - Number of skeleton items
 * @param {string} columns - Grid columns class (e.g., 'lg:grid-cols-3')
 * @param {string} height - Height class for skeleton items
 * @param {string} type - Type of skeleton: 'card' or 'simple'
 */
export function LoadingGrid({ 
  count = 8, 
  columns = 'lg:grid-cols-3', 
  height = 'h-[280px]',
  type = 'simple'
}) {
  if (type === 'card') {
    return (
      <div className={`grid sm:grid-cols-2 ${columns} gap-4`}>
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="aspect-[4/3] w-full rounded-none" />
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 w-9" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid sm:grid-cols-2 ${columns} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={`${height} rounded-xl`} />
      ))}
    </div>
  );
}
