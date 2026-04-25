import React, { useState } from 'react';
import { Tag, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { calculateTotal, validatePromoCode } from '../../utils/cart';

export default function OrderSummary({ cart, onCheckout, showPromo = true, showActions = true }) {
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');

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
    discountPercent: appliedPromo?.discount || 0,
    deliveryCharge: appliedPromo?.freeShipping ? 0 : 100,
  });

  return (
    <div className="card p-6 space-y-4 sticky top-24">
      <h2 className="text-lg font-bold text-slate-900">Order Summary</h2>

      {/* Promo Code Section */}
      {showPromo && (
        <div className="space-y-2">
          {!appliedPromo ? (
            <>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Promo code"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                </div>
                <button
                  onClick={handleApplyPromo}
                  disabled={!promoCode.trim()}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>
              {promoError && (
                <div className="flex items-center gap-2 text-xs text-red-600">
                  <AlertCircle size={12} />
                  {promoError}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-green-600" />
                <span className="text-sm font-medium text-green-900">{appliedPromo.description}</span>
              </div>
              <button
                onClick={handleRemovePromo}
                className="text-xs text-green-600 hover:text-green-700 font-medium"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      )}

      <div className="border-t border-slate-200 pt-4 space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Subtotal</span>
          <span className="font-medium text-slate-900">{formatCurrency(totals.subtotal)}</span>
        </div>

        {/* Discount */}
        {totals.discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Discount</span>
            <span className="font-medium text-green-600">-{formatCurrency(totals.discount)}</span>
          </div>
        )}

        {/* Delivery */}
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Delivery Charge</span>
          <span className="font-medium text-slate-900">
            {totals.delivery === 0 ? (
              <span className="text-green-600">FREE</span>
            ) : (
              formatCurrency(totals.delivery)
            )}
          </span>
        </div>

        {/* Tax */}
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Tax (18%)</span>
          <span className="font-medium text-slate-900">{formatCurrency(totals.tax)}</span>
        </div>
      </div>

      {/* Total */}
      <div className="border-t border-slate-200 pt-4">
        <div className="flex justify-between items-center">
          <span className="text-base font-semibold text-slate-900">Total</span>
          <span className="text-2xl font-bold text-green-600">{formatCurrency(totals.total)}</span>
        </div>
      </div>

      {/* Action Button */}
      {showActions && onCheckout && (
        <button
          onClick={onCheckout}
          disabled={cart.length === 0}
          className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Proceed to Checkout
        </button>
      )}

      {/* Free Shipping Notice */}
      {totals.delivery > 0 && totals.subtotal < 5000 && (
        <p className="text-xs text-center text-slate-500">
          Add {formatCurrency(5000 - totals.subtotal)} more for free shipping
        </p>
      )}
    </div>
  );
}
