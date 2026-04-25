import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import CartItem from '../components/cart/CartItem';
import OrderSummary from '../components/cart/OrderSummary';

export default function CartPage() {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, clearCart, getCartCount } = useCart();

  const handleCheckout = () => {
    navigate('/app/payment');
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearCart();
    }
  };

  return (
    <div className="space-y-5 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
              <ShoppingCart size={18} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Shopping Cart</h1>
          </div>
          <p className="text-slate-600 text-sm pl-12">
            {cart.length === 0 ? (
              'Your cart is empty'
            ) : (
              `You have ${getCartCount()} ${getCartCount() === 1 ? 'product' : 'products'} in your cart`
            )}
          </p>
        </div>
        
        {cart.length > 0 && (
          <button
            onClick={handleClearCart}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 hover:border-red-300 transition-all duration-200"
          >
            <Trash2 size={14} />
            Clear Cart
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        /* Empty Cart State */
        <div className="card p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center">
              <ShoppingBag size={40} className="text-slate-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Your cart is empty</h3>
              <p className="text-sm text-slate-500">Add products to your cart to get started</p>
            </div>
            <button
              onClick={() => navigate('/app/products')}
              className="px-6 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors"
            >
              Browse Products
            </button>
          </div>
        </div>
      ) : (
        /* Cart Content */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <CartItem
                key={item._id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
              />
            ))}
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <OrderSummary
              cart={cart}
              onCheckout={handleCheckout}
              showPromo={true}
              showActions={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
