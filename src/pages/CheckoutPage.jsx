import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package, ArrowLeft, CheckCircle } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useRazorpay } from '../hooks/useRazorpay';
import CheckoutForm from '../components/cart/CheckoutForm';
import OrderSummary from '../components/cart/OrderSummary';
import { ordersApi } from '../api/orders.api';
import { calculateTotal } from '../utils/cart';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, clearCart, getCartTotal } = useCart();
  const { user } = useAuth();
  const { initiatePayment, loading: paymentLoading, razorpayLoaded } = useRazorpay();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false); // Track if order was created
  const paymentMethod = location.state?.paymentMethod || 'cod';

  // Tax is now calculated per-product on the backend
  // Each product has its own taxRate field
  // For display purposes, use a default rate
  const taxRate = 18; // Default display rate (actual tax calculated per product on backend)

  // Calculate totals using the same logic as OrderSummary
  const totals = calculateTotal(cart, {
    taxRate: taxRate / 100, // Convert percentage to decimal
    deliveryCharge: 0, // Free delivery for B2B orders
    discountPercent: 0,
    taxInclusive: true, // Prices already include tax
  });

  // Redirect if cart is empty (but not if order was just created)
  useEffect(() => {
    if (cart.length === 0 && !success && !orderCreated) {
      navigate('/app/cart');
    }
  }, [cart, navigate, success, orderCreated]);

  const getRoleBasedOrderData = () => {
    if (user.role === 'WHOLESALE') {
      return { buyerType: 'WHOLESALE', sellerType: 'COMPANY' };
    } else if (user.role === 'MINI_STOCK') {
      return { buyerType: 'MINI_STOCK', sellerType: 'WHOLESALE' };
    }
    return { buyerType: 'WHOLESALE', sellerType: 'COMPANY' };
  };

  const handlePlaceOrder = async (shippingDetails) => {
    setLoading(true);
    
    try {
      const roleData = getRoleBasedOrderData();
      
      // Prepare delivery address
      const deliveryAddress = {
        shopName: shippingDetails.shopName,
        name: shippingDetails.name,
        phone: shippingDetails.phone,
        street: shippingDetails.address,
        city: shippingDetails.city,
        state: shippingDetails.state,
        pinCode: shippingDetails.zipCode,
        landmark: shippingDetails.landmark || null,
      };
      
      // For Mini Stock with manual payment (UPI/Cash)
      if (user.role === 'MINI_STOCK' && location.state?.isManualPayment) {
        console.log('Creating manual payment order for Mini Stock');
        console.log('Payment method:', paymentMethod);
        console.log('Seller profile:', location.state?.sellerProfile);
        console.log('Seller ID:', location.state?.sellerId);
        
        const createdOrders = [];
        for (const item of cart) {
          console.log('Creating order for item:', item.name);
          const result = await ordersApi.create({
            ...roleData,
            productId: item._id,
            quantity:  item.quantity,
            source:    'WEBSITE',
            region:    `${shippingDetails.city}, ${shippingDetails.state}`,
            deliveryAddress,
            sellerId:  location.state?.sellerId, // Pass the selected seller ID
          });
          console.log('Order created:', result.data.data);
          createdOrders.push(result.data.data);
        }
        
        console.log('All orders created:', createdOrders.length);
        
        // Mark order as created to prevent cart empty redirect
        setOrderCreated(true);
        
        // Redirect to payment proof submission for the first order
        const firstOrder = createdOrders[0];
        console.log('Redirecting to payment proof page with order:', firstOrder._id);
        console.log('Navigation state:', {
          orderId: firstOrder._id,
          amount: firstOrder.total,
          paymentMethod: paymentMethod,
          sellerProfile: location.state?.sellerProfile,
        });
        
        // Clear cart and navigate
        clearCart();
        navigate('/app/payment-proof', {
          replace: true,
          state: {
            orderId: firstOrder._id,
            amount: firstOrder.total,
            paymentMethod: paymentMethod,
            sellerProfile: location.state?.sellerProfile,
          }
        });
        return;
      }
      
      // For COD or Cash, create orders directly (no Razorpay)
      if (paymentMethod === 'cod' || paymentMethod === 'cash') {
        const createdOrders = [];
        for (const item of cart) {
          const result = await ordersApi.create({
            ...roleData,
            productId: item._id,
            quantity:  item.quantity,
            source:    'WEBSITE',
            region:    `${shippingDetails.city}, ${shippingDetails.state}`,
            deliveryAddress,
          });
          createdOrders.push(result.data.data);
        }
        
        clearCart();
        setSuccess(true);
        
        setTimeout(() => {
          navigate('/app/orders');
        }, 2000);
      } 
      // For Online payment methods (Card/NetBanking), use Razorpay
      else if (paymentMethod === 'online' || paymentMethod === 'card' || paymentMethod === 'netbanking') {
        // First create all orders
        const createdOrders = [];
        for (const item of cart) {
          const result = await ordersApi.create({
            ...roleData,
            productId: item._id,
            quantity:  item.quantity,
            source:    'WEBSITE',
            region:    `${shippingDetails.city}, ${shippingDetails.state}`,
            deliveryAddress,
          });
          createdOrders.push(result.data.data);
        }
        
        // Then initiate Razorpay payment
        initiatePayment({
          amount: totals.total, // Use the correctly calculated total
          orderId: createdOrders[0]._id, // Use first order ID for reference
          customerDetails: {
            name: shippingDetails.name,
            phone: shippingDetails.phone,
            email: user?.email
          },
          onSuccess: () => {
            clearCart();
            setSuccess(true);
            setTimeout(() => {
              navigate('/app/orders');
            }, 2000);
          },
          onFailure: (error) => {
            console.error('Payment failed:', error);
            toast.error('Payment failed. Please try again.');
          }
        });
      }
      // For UPI payment method, show error (should not reach here for manual UPI)
      else {
        toast.error(`Unsupported payment method: ${paymentMethod}. Please select a valid payment option.`);
        setLoading(false);
        return;
      }
      
    } catch (error) {
      console.error('Order creation failed:', error);
      toast.error(error.response?.data?.error || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center page-enter">
        <Card className="max-w-md w-full border-none shadow-none bg-transparent">
          <CardContent className="text-center space-y-4 pt-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle size={32} className="text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Order Placed Successfully!</h2>
              <p className="text-muted-foreground">
                Your order has been placed and is being processed. You will be redirected to the orders page shortly.
              </p>
            </div>
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/app/payment')}
          className="rounded-xl h-9 w-9 shrink-0"
        >
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Complete Order</h1>
          <p className="text-sm text-muted-foreground mt-1">Enter shipping details to place your order</p>
        </div>
      </div>

      {/* Checkout Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Checkout Form */}
        <div className="lg:col-span-2">
          <CheckoutForm 
            onSubmit={handlePlaceOrder} 
            loading={loading || paymentLoading || (paymentMethod !== 'cod' && !razorpayLoaded)} 
          />
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-1 space-y-6">
          <OrderSummary
            cart={cart}
            showPromo={false}
            showActions={false}
          />
          
          <div className="space-y-4">
            {/* Payment Method */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Payment Method</h3>
                <p className="text-sm text-muted-foreground capitalize">{paymentMethod.replace('_', ' ')}</p>
                {paymentMethod !== 'cod' && !razorpayLoaded && (
                  <p className="text-xs text-amber-600">Loading payment system...</p>
                )}
              </CardContent>
            </Card>
            
            {/* Order Info */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Order Information</h3>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
                    <span>Payment will be verified before approval</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
                    <span>Orders are processed within 24-48 hours</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
                    <span>Track your order status in Orders page</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
                    <span>Stock will be updated upon delivery confirmation</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
