import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package, ArrowLeft, CheckCircle } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import CheckoutForm from '../components/cart/CheckoutForm';
import OrderSummary from '../components/cart/OrderSummary';
import { ordersApi } from '../api/orders.api';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const paymentMethod = location.state?.paymentMethod || 'cod';

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.length === 0 && !success) {
      navigate('/app/cart');
    }
  }, [cart, navigate, success]);

  const getRoleBasedOrderData = () => {
    // Determine buyer and seller types based on user role
    if (user.role === 'WHOLESALE') {
      return {
        buyerType: 'WHOLESALE',
        sellerType: 'COMPANY',
      };
    } else if (user.role === 'MINI_STOCK') {
      return {
        buyerType: 'MINI_STOCK',
        sellerType: 'WHOLESALE',
      };
    }
    
    // Default fallback (should not reach here)
    return {
      buyerType: 'WHOLESALE',
      sellerType: 'COMPANY',
    };
  };

  const handlePlaceOrder = async (shippingDetails) => {
    setLoading(true);
    
    try {
      const roleData = getRoleBasedOrderData();
      
      // ✅ Create orders SEQUENTIALLY — parallel requests (Promise.all) cause
      //    duplicate orderNumber errors because all hooks read DB at the same time.
      const createdOrders = [];
      for (const item of cart) {
        const result = await ordersApi.create({
          ...roleData,
          productId: item._id,
          quantity:  item.quantity,
          source:    'WEBSITE',
          region:    `${shippingDetails.city}, ${shippingDetails.state}`,
        });
        createdOrders.push(result.data.data);
      }
      
      // Clear cart and show success
      clearCart();
      setSuccess(true);
      
      // Redirect to orders page after 2 seconds
      setTimeout(() => {
        navigate('/app/orders');
      }, 2000);
      
    } catch (error) {
      console.error('Order creation failed:', error);
      alert(error.response?.data?.error || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center page-enter">
        <div className="card p-12 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Order Placed Successfully!</h2>
            <p className="text-slate-600">
              Your order has been placed and is being processed. You will be redirected to the orders page.
            </p>
          </div>
          <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 page-enter">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/app/payment')}
          className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft size={18} className="text-slate-600" />
        </button>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
              <Package size={18} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Complete Order</h1>
          </div>
          <p className="text-slate-600 text-sm pl-12">Enter shipping details to place your order</p>
        </div>
      </div>

      {/* Checkout Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Checkout Form */}
        <div className="lg:col-span-2">
          <CheckoutForm onSubmit={handlePlaceOrder} loading={loading} />
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-1">
          <OrderSummary
            cart={cart}
            showPromo={false}
            showActions={false}
          />
          
          {/* Payment Method */}
          <div className="card p-4 mt-4 space-y-2">
            <h3 className="text-sm font-semibold text-slate-900">Payment Method</h3>
            <p className="text-sm text-slate-600 capitalize">{paymentMethod.replace('_', ' ')}</p>
          </div>
          
          {/* Order Info */}
          <div className="card p-4 mt-4 space-y-2">
            <h3 className="text-sm font-semibold text-slate-900">Order Information</h3>
            <div className="space-y-1.5 text-xs text-slate-600">
              <p>• Payment will be verified before approval</p>
              <p>• Orders are processed within 24-48 hours</p>
              <p>• Track your order status in Orders page</p>
              <p>• Stock will be updated upon delivery confirmation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
