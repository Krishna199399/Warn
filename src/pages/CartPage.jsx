import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import CartItem from '../components/cart/CartItem';
import OrderSummary from '../components/cart/OrderSummary';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shopping Cart</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {cart.length === 0 ? (
              'Your cart is currently empty'
            ) : (
              `You have ${getCartCount()} ${getCartCount() === 1 ? 'product' : 'products'} in your cart`
            )}
          </p>
        </div>
        
        {cart.length > 0 && (
          <Button
            onClick={handleClearCart}
            variant="outline"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
          >
            <Trash2 size={16} className="mr-2" />
            Clear Cart
          </Button>
        )}
      </div>

      {cart.length === 0 ? (
        /* Empty Cart State */
        <Card className="border-dashed shadow-none bg-muted/20 mt-4">
          <CardContent className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <ShoppingBag size={28} className="text-muted-foreground/60" />
            </div>
            <div>
              <p className="font-semibold text-lg text-foreground">Your cart is empty</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Add products to your cart to get started with your wholesale or mini stock orders.
              </p>
            </div>
            <Button
              onClick={() => navigate('/app/products')}
              className="mt-2"
            >
              Browse Products
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Cart Content */
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: Cart Items */}
          <div className="xl:col-span-2 space-y-4">
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
          <div className="xl:col-span-1">
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
