import React from 'react';
import { Package, Tag, IndianRupee, Star } from 'lucide-react';

const CATEGORY_COLORS = {
  Seeds:      'bg-green-100 text-green-700',
  Fertilizer: 'bg-blue-100 text-blue-700',
  Pesticide:  'bg-red-100 text-red-700',
  Equipment:  'bg-amber-100 text-amber-700',
  Supplement: 'bg-purple-100 text-purple-700',
};

/**
 * ProductPreviewCard — live product preview panel
 * Props: name, category, mrp, price, unit, unitQuantity, brand, tags (array), image (File|null), previewUrl (string|null), description, taxRate
 */
export default function ProductPreviewCard({ name, category, mrp, price, unit, unitQuantity, brand, tags = [], image, previewUrl, description, taxRate = 18 }) {
  const imgSrc = image
    ? URL.createObjectURL(image)
    : previewUrl || null;

  const displayName        = name     || 'Product Name';
  const displayCategory    = category || 'Category';
  const displayMrp         = mrp ? parseFloat(mrp) : 0;
  const displayPrice       = price ? parseFloat(price) : 0;
  const displayUnit        = unitQuantity ? `${unitQuantity} ${unit || 'unit'}` : (unit || 'unit');
  const catColor           = CATEGORY_COLORS[category] || 'bg-slate-100 text-slate-600';
  
  // Tax calculation breakdown
  // Base Price (price) is the price WITHOUT tax
  // Final Price = Base Price + Tax
  const taxRateNum = parseFloat(taxRate) || 0;
  const basePrice = displayPrice > 0 ? displayPrice : 0;
  const taxAmount = basePrice > 0 ? basePrice * (taxRateNum / 100) : 0;
  const finalPrice = basePrice + taxAmount;

  return (
    <div className="card p-0 overflow-hidden sticky top-6">
      {/* Header gradient */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-4 flex items-center gap-2">
        <Package size={16} className="text-white/80" />
        <span className="text-sm font-semibold text-white/90">Product Preview</span>
        <span className="ml-auto text-[10px] bg-white/20 px-2 py-0.5 rounded-full text-white/80 font-medium">
          Live
        </span>
      </div>

      {/* Product Image */}
      <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 aspect-square flex items-center justify-center overflow-hidden">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt="Product"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-slate-300">
            <div className="w-20 h-20 rounded-2xl bg-slate-200 flex items-center justify-center">
              <Package size={36} className="text-slate-300" />
            </div>
            <p className="text-xs text-slate-400 font-medium">No image uploaded</p>
          </div>
        )}

        {/* Category pill overlay */}
        {category && (
          <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm ${catColor}`}>
            {displayCategory}
          </span>
        )}
      </div>

      {/* Info section */}
      <div className="p-5 space-y-4">
        {/* Name + Brand */}
        <div>
          <h3 className={`text-lg font-bold leading-tight transition-colors ${name ? 'text-slate-900' : 'text-slate-300'}`}>
            {displayName}
          </h3>
          {brand && (
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <Star size={10} className="text-amber-400 fill-amber-400" />
              {brand}
            </p>
          )}
        </div>

        {/* Price Section */}
        <div className="space-y-3">
          {/* Final Price (Tax-Inclusive) */}
          <div className="flex items-end gap-1">
            <IndianRupee size={16} className="text-green-600 mb-0.5" />
            <span className={`text-2xl font-bold leading-none transition-colors ${finalPrice ? 'text-green-600' : 'text-slate-300'}`}>
              {finalPrice > 0 ? finalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </span>
            <span className="text-sm text-slate-400 mb-0.5">/ {displayUnit}</span>
          </div>
          
          {/* Tax Breakdown */}
          {finalPrice > 0 && taxRateNum > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">MRP Price</span>
                <span className="font-semibold text-slate-700">
                  ₹{displayMrp > 0 ? displayMrp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Sell Price (excl. tax)</span>
                <span className="font-semibold text-slate-700">
                  ₹{basePrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Tax ({taxRateNum}%)</span>
                <span className="font-semibold text-green-600">
                  +₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="border-t border-green-200 pt-1.5 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Final Price (incl. tax)</span>
                <span className="font-bold text-green-600">
                  ₹{finalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {description ? (
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
              {description}
            </p>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <p className="text-xs text-slate-300 italic">No description added yet</p>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-slate-100" />

        {/* Tags */}
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100
                           text-slate-600 px-2.5 py-0.5 rounded-full"
              >
                <Tag size={9} />
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-300 italic">No tags added yet</p>
        )}

        {/* Status indicator */}
        <div className="flex items-center gap-2 pt-1">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-slate-500 font-medium">Ready to publish</span>
        </div>
      </div>
    </div>
  );
}
