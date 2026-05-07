import React from 'react';
import { IndianRupee } from 'lucide-react';

/**
 * PriceDisplay Component
 * 
 * Displays product pricing with MRP, selling price, and discount badge
 * 
 * @param {number} mrp - Maximum Retail Price (actualPrice)
 * @param {number} sellingPrice - Actual selling price (mrp field)
 * @param {string} size - Display size: 'small' | 'medium' | 'large' | 'xlarge'
 * @param {boolean} showSavings - Show "You Save" text
 * @param {string} unit - Unit text (e.g., "per kg")
 * @param {string} className - Additional CSS classes
 */
export function PriceDisplay({ 
  mrp, 
  sellingPrice, 
  size = 'medium', 
  showSavings = false,
  unit = null,
  className = '' 
}) {
  const mrpValue = parseFloat(mrp) || 0;
  const sellingValue = parseFloat(sellingPrice) || 0;
  
  // Calculate discount
  const hasDiscount = mrpValue > 0 && sellingValue > 0 && mrpValue > sellingValue;
  const discountPercent = hasDiscount 
    ? Math.round(((mrpValue - sellingValue) / mrpValue) * 100)
    : 0;
  const savings = hasDiscount ? mrpValue - sellingValue : 0;

  // Size configurations
  const sizeConfig = {
    small: {
      sellingPrice: 'text-base',
      mrpPrice: 'text-xs',
      badge: 'text-[9px] px-1.5 py-0.5',
      savings: 'text-[10px]',
      rupeeIcon: 12,
      unit: 'text-[10px]',
    },
    medium: {
      sellingPrice: 'text-lg',
      mrpPrice: 'text-sm',
      badge: 'text-[10px] px-1.5 py-0.5',
      savings: 'text-xs',
      rupeeIcon: 14,
      unit: 'text-xs',
    },
    large: {
      sellingPrice: 'text-2xl',
      mrpPrice: 'text-base',
      badge: 'text-xs px-2 py-1',
      savings: 'text-sm',
      rupeeIcon: 18,
      unit: 'text-sm',
    },
    xlarge: {
      sellingPrice: 'text-4xl',
      mrpPrice: 'text-lg',
      badge: 'text-sm px-2.5 py-1',
      savings: 'text-base',
      rupeeIcon: 24,
      unit: 'text-base',
    },
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Main Price Row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Selling Price */}
        <div className="flex items-baseline gap-0.5">
          <IndianRupee size={config.rupeeIcon} className="text-green-600 mb-0.5" />
          <span className={`${config.sellingPrice} font-bold text-green-600`}>
            {sellingValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* MRP (strikethrough if discount) */}
        {hasDiscount && (
          <span className={`${config.mrpPrice} line-through text-slate-400 font-medium`}>
            ₹{mrpValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        )}

        {/* Discount Badge */}
        {hasDiscount && (
          <span className={`${config.badge} font-semibold bg-red-100 text-red-600 rounded-full`}>
            {discountPercent}% OFF
          </span>
        )}
      </div>

      {/* Unit Text */}
      {unit && (
        <p className={`${config.unit} text-slate-500`}>
          {unit}
        </p>
      )}

      {/* Savings Text */}
      {showSavings && hasDiscount && (
        <p className={`${config.savings} text-green-600 font-medium`}>
          You Save: ₹{savings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      )}

      {/* No Discount - Show MRP only if no discount */}
      {!hasDiscount && mrpValue > 0 && sellingValue === 0 && (
        <div className="flex items-baseline gap-0.5">
          <IndianRupee size={config.rupeeIcon} className="text-green-600 mb-0.5" />
          <span className={`${config.sellingPrice} font-bold text-green-600`}>
            {mrpValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      )}
    </div>
  );
}
