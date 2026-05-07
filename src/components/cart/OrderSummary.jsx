import React, { useState } from 'react';
import { Tag, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { calculateTotal, validatePromoCode } from '../../utils/cart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '../../contexts/AuthContext';

export default function OrderSummary({ cart, onCheckout, showPromo = true, showActions = true }) {
  const { user } = useAuth();
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');

  // Tax is now calculated per-product in the cart
  // Each product has its own taxRate field
  const taxRate = 18; // Default display rate (actual tax calculated per product)

  const handleApplyPromo = () => {
    setPromoError('');
    const promo = validatePromoCode(promoCode);
    
    if (promo) {
      setAppliedPromo(promo);
      setPromoCode('');
    } else {
      setPromoError('Invalid promo code');
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoError('');
  };

  const totals = calculateTotal(cart, {
    taxRate: taxRate / 100, // Convert percentage to decimal
    discountPercent: appliedPromo?.discount || 0,
    deliveryCharge: appliedPromo?.freeShipping ? 0 : 100,
    taxInclusive: true, // Prices already include tax
  });

  return (
    <Card className="sticky top-24">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Promo Code Section */}
        {showPromo && (
          <div className="space-y-2">
            {!appliedPromo ? (
              <>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="Promo code"
                      className="pl-9 h-10 bg-muted/30"
                    />
                  </div>
                  <Button
                    onClick={handleApplyPromo}
                    disabled={!promoCode.trim()}
                    className="h-10"
                  >
                    Apply
                  </Button>
                </div>
                {promoError && (
                  <div className="flex items-center gap-1.5 text-xs text-destructive mt-1.5">
                    <AlertCircle size={12} />
                    {promoError}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-xl">
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-primary" />
                  <span className="text-sm font-medium text-primary">{appliedPromo.description}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemovePromo}
                  className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
                >
                  Remove
                </Button>
              </div>
            )}
          </div>
        )}

        <Separator />

        <div className="space-y-3 pt-1">
          {/* Subtotal */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium text-foreground">{formatCurrency(totals.subtotal)}</span>
          </div>

          {/* Discount */}
          {totals.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span className="font-medium text-primary">-{formatCurrency(totals.discount)}</span>
            </div>
          )}

          {/* Delivery */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Delivery Charge</span>
            <span className="font-medium text-foreground">
              {totals.delivery === 0 ? (
                <span className="text-primary">FREE</span>
              ) : (
                formatCurrency(totals.delivery)
              )}
            </span>
          </div>

          {/* Tax - Show "Tax Included" message for tax-inclusive pricing */}
          {(user?.role === 'WHOLESALE' || user?.role === 'MINI_STOCK') && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span className="text-sm text-green-600 font-medium">
                Included in price
              </span>
            </div>
          )}
        </div>

        <Separator />

        {/* Total */}
        <div className="pt-1">
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-foreground">Total</span>
            <span className="text-2xl font-bold text-primary">{formatCurrency(totals.total)}</span>
          </div>
        </div>

        {/* Action Button */}
        {showActions && onCheckout && (
          <Button
            onClick={onCheckout}
            disabled={cart.length === 0}
            className="w-full h-11 mt-4 text-base"
          >
            Proceed to Checkout
          </Button>
        )}

        {/* Free Shipping Notice */}
        {totals.delivery > 0 && totals.subtotal < 5000 && (
          <p className="text-xs text-center text-muted-foreground mt-4">
            Add <span className="font-medium">{formatCurrency(5000 - totals.subtotal)}</span> more for free shipping
          </p>
        )}
      </CardContent>
    </Card>
  );
}
