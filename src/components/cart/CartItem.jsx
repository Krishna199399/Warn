import React from 'react';
import { Minus, Plus, Trash2, Package } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

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
    <div className="card p-4 flex items-center gap-4 group hover:shadow-md transition-all duration-200">
      {/* Product Image */}
      <div className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {item.image ? (
          <img 
            src={item.image} 
            alt={item.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <Package size={32} className="text-slate-400" />
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-slate-900 truncate">{item.name}</h3>
        <p className="text-sm text-slate-500 mt-0.5">{item.category || 'Product'}</p>
        <p className="text-sm font-semibold text-green-600 mt-1">
          {formatCurrency(item.price)} <span className="text-slate-400 font-normal">per unit</span>
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleDecrease}
          disabled={item.quantity <= 1}
          className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Minus size={14} className="text-slate-600" />
        </button>
        
        <div className="w-12 text-center">
          <span className="font-semibold text-slate-900">{item.quantity}</span>
        </div>
        
        <button
          onClick={handleIncrease}
          className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-colors"
        >
          <Plus size={14} className="text-slate-600" />
        </button>
      </div>

      {/* Item Total */}
      <div className="text-right min-w-[100px]">
        <p className="font-bold text-slate-900">{formatCurrency(itemTotal)}</p>
      </div>

      {/* Remove Button */}
      <button
        onClick={() => onRemove(item._id)}
        className="w-9 h-9 rounded-lg border border-red-200 bg-red-50 flex items-center justify-center hover:bg-red-100 hover:border-red-300 transition-colors opacity-0 group-hover:opacity-100"
      >
        <Trash2 size={16} className="text-red-600" />
      </button>
    </div>
  );
}
