import React from 'react';
import { Minus, Plus, Trash2, Package } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PriceDisplay } from '@/components/ui/price-display';

export default function CartItem({ item, onUpdateQuantity, onRemove }) {
  const handleDecrease = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item._id, item.quantity - 1);
    }
  };

  const handleIncrease = () => {
    onUpdateQuantity(item._id, item.quantity + 1);
  };

  const itemTotal = item.price * item.quantity;

  return (
    <Card className="group hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Product Image */}
        <div className="w-20 h-20 rounded-xl bg-muted border flex items-center justify-center flex-shrink-0 overflow-hidden">
          {item.image ? (
            <img 
              src={item.image} 
              alt={item.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <Package size={28} className="text-muted-foreground/50" />
          )}
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground line-clamp-1">{item.name}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{item.category || 'Product'}</p>
          <div className="mt-1">
            <PriceDisplay 
              mrp={item.actualPrice}
              sellingPrice={item.mrp || item.price}
              size="small"
            />
            <p className="text-[10px] text-muted-foreground mt-0.5">per unit</p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0">
          {/* Quantity Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={handleDecrease}
              disabled={item.quantity <= 1}
            >
              <Minus size={14} />
            </Button>
            
            <div className="w-8 text-center">
              <span className="font-medium text-sm">{item.quantity}</span>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={handleIncrease}
            >
              <Plus size={14} />
            </Button>
          </div>

          {/* Item Total */}
          <div className="text-right min-w-[80px]">
            <p className="font-bold text-foreground">{formatCurrency(itemTotal)}</p>
          </div>

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(item._id)}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
