import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CreditCard, Package, ArrowLeft, Check } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { ordersApi } from '../../api/orders.api';
import { useRazorpay } from '../../hooks/useRazorpay';
import { toast } from 'sonner';
import PublicNavbar from '../../components/PublicNavbar';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';

export default function CustomerCheckout() {
  const navigate = useNavigate();
  const { cart, clearCart, getCartTotal } = useCart();
  const { user } = useAuth();
  const { initiatePayment, loading: paymentLoading, razorpayLoaded } = useRazorpay();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Address, 2: Payment, 3: Review

  const [shippingAddress, setShippingAddress] = useState({
    name: user?.name || '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    phone: user?.phone || ''
  });

  const [paymentMethod, setPaymentMethod] = useState('COD');

  const subtotal = getCartTotal();
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + tax;

  const handleAddressChange = (e) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async () => {
    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.pincode) {
      toast.error('Please fill in all address fields');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        items: cart.map(item => ({
          product: item._id,
          quantity: item.quantity,
          price: item.price
        })),
        shippingAddress,
        paymentMethod,
        subtotal,
        tax,
        totalAmount: total
      };

      // For COD, create order directly
      if (paymentMethod === 'COD') {
        await ordersApi.createCustomerOrder(orderData);
        clearCart();
        toast.success('Order placed successfully!');
        navigate('/my-orders');
      } 
      // For Online/UPI, initiate Razorpay payment
      else {
        // First create the order to get order ID
        const response = await ordersApi.createCustomerOrder(orderData);
        const orders = response.data.data; // Extract orders array from response
        
        // Use the total that includes tax (calculated in frontend)
        // This ensures Razorpay shows the correct amount including tax
        
        // Then initiate payment
        initiatePayment({
          amount: total, // Use total with tax included
          orderId: Array.isArray(orders) && orders.length > 0 ? orders[0]._id : 'temp', // Use first order ID for reference
          customerDetails: {
            name: shippingAddress.name,
            phone: shippingAddress.phone,
            email: user?.email
          },
          onSuccess: () => {
            clearCart();
            navigate('/my-orders');
          },
          onFailure: (error) => {
            console.error('Payment failed:', error);
            toast.error('Payment failed. Please try again.');
          }
        });
      }
    } catch (error) {
      toast.error('Failed to place order');
      console.error('Order failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50/80 via-stone-50/60 to-orange-50/70">
        <PublicNavbar />
        <div className="p-6 max-w-7xl mx-auto text-center py-20">
          <Package className="h-16 w-16 text-amber-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Your cart is empty</h1>
          <p className="text-slate-600 mb-6">Add some products before checking out</p>
          <Button onClick={() => navigate('/products')} className="bg-amber-600/90 hover:bg-amber-700/90 backdrop-blur-sm shadow-md text-white">
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/80 via-stone-50/60 to-orange-50/70">
      <PublicNavbar />
      
      <div className="p-6 max-w-7xl mx-auto space-y-6 py-12">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/cart')}
            className="h-10 w-10 rounded-lg border border-amber-200/60 bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-amber-50/80"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>Checkout</h1>
            <p className="text-slate-600 mt-1">Complete your order</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
              step >= 1 ? 'bg-amber-600/90 text-white backdrop-blur-sm shadow-md' : 'bg-stone-100/80 text-stone-400'
            }`}>
              {step > 1 ? <Check className="h-5 w-5" /> : '1'}
            </div>
            <span className={`text-sm font-medium ${step >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>Address</span>
          </div>
          <div className="h-0.5 w-16 bg-stone-200/60">
            <div className={`h-full ${step >= 2 ? 'bg-amber-600/90' : 'bg-transparent'}`} />
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
              step >= 2 ? 'bg-amber-600/90 text-white backdrop-blur-sm shadow-md' : 'bg-stone-100/80 text-stone-400'
            }`}>
              {step > 2 ? <Check className="h-5 w-5" /> : '2'}
            </div>
            <span className={`text-sm font-medium ${step >= 2 ? 'text-slate-900' : 'text-slate-400'}`}>Payment</span>
          </div>
          <div className="h-0.5 w-16 bg-stone-200/60">
            <div className={`h-full ${step >= 3 ? 'bg-amber-600/90' : 'bg-transparent'}`} />
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
              step >= 3 ? 'bg-amber-600/90 text-white backdrop-blur-sm shadow-md' : 'bg-stone-100/80 text-stone-400'
            }`}>
              3
            </div>
            <span className={`text-sm font-medium ${step >= 3 ? 'text-slate-900' : 'text-slate-400'}`}>Review</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Shipping Address */}
            {step === 1 && (
              <Card className="border-amber-200/60 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-amber-600" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={shippingAddress.name}
                        onChange={handleAddressChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        name="phone"
                        value={shippingAddress.phone}
                        onChange={handleAddressChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Textarea
                      id="street"
                      name="street"
                      value={shippingAddress.street}
                      onChange={handleAddressChange}
                      placeholder="House no., Building name, Street"
                      rows={2}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        value={shippingAddress.city}
                        onChange={handleAddressChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        name="state"
                        value={shippingAddress.state}
                        onChange={handleAddressChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pincode">Pincode</Label>
                      <Input
                        id="pincode"
                        name="pincode"
                        value={shippingAddress.pincode}
                        onChange={handleAddressChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button onClick={() => setStep(2)} className="bg-amber-600/90 hover:bg-amber-700/90 backdrop-blur-sm shadow-md text-white">
                      Continue to Payment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Payment Method */}
            {step === 2 && (
              <Card className="border-amber-200/60 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-amber-600" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COD">Cash on Delivery</SelectItem>
                      <SelectItem value="ONLINE">Online Payment</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="p-4 rounded-lg bg-amber-50/80 backdrop-blur-sm border border-amber-200/60">
                    <p className="text-sm text-slate-600">
                      {paymentMethod === 'COD' && 'Pay with cash when your order is delivered'}
                      {paymentMethod === 'ONLINE' && 'Pay securely using your credit/debit card via Razorpay'}
                      {paymentMethod === 'UPI' && 'Pay using UPI apps like Google Pay, PhonePe, Paytm via Razorpay'}
                    </p>
                    {(paymentMethod === 'ONLINE' || paymentMethod === 'UPI') && !razorpayLoaded && (
                      <p className="text-xs text-amber-600 mt-2">Loading payment system...</p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={() => setStep(1)} className="border-amber-200/60 hover:bg-amber-50/80 backdrop-blur-sm">
                      Back
                    </Button>
                    <Button onClick={() => setStep(3)} className="bg-amber-600/90 hover:bg-amber-700/90 backdrop-blur-sm shadow-md text-white">
                      Review Order
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Review Order */}
            {step === 3 && (
              <>
                <Card className="border-amber-200/60 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Review Your Order</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Address Summary */}
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-amber-600" />
                        Shipping Address
                      </h3>
                      <div className="text-sm text-slate-600 space-y-1 p-4 rounded-lg bg-stone-50/80 backdrop-blur-sm">
                        <p className="font-medium text-slate-900">{shippingAddress.name}</p>
                        <p>{shippingAddress.street}</p>
                        <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.pincode}</p>
                        <p className="pt-2">{shippingAddress.phone}</p>
                      </div>
                    </div>

                    {/* Payment Summary */}
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-amber-600" />
                        Payment Method
                      </h3>
                      <div className="text-sm text-slate-600 p-4 rounded-lg bg-stone-50/80 backdrop-blur-sm">
                        <p className="font-medium text-slate-900">{paymentMethod}</p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                        <Package className="h-4 w-4 text-amber-600" />
                        Order Items ({cart.length})
                      </h3>
                      <div className="space-y-3">
                        {cart.map((item) => (
                          <div key={item._id} className="flex gap-3 p-3 rounded-lg bg-stone-50/80 backdrop-blur-sm">
                            <div className="h-16 w-16 rounded-lg bg-white overflow-hidden flex-shrink-0">
                              {item.image ? (
                                <img
                                  src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${item.image}`}
                                  alt={item.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <Package className="h-6 w-6 text-amber-300" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-900 text-sm">{item.name}</h4>
                              <p className="text-xs text-slate-600">Qty: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-slate-900">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button variant="outline" onClick={() => setStep(2)} className="border-amber-200/60 hover:bg-amber-50/80 backdrop-blur-sm">
                        Back
                      </Button>
                      <Button 
                        onClick={handlePlaceOrder} 
                        disabled={loading || paymentLoading || ((paymentMethod === 'ONLINE' || paymentMethod === 'UPI') && !razorpayLoaded)}
                        className="bg-amber-600/90 hover:bg-amber-700/90 backdrop-blur-sm shadow-md text-white"
                      >
                        {(loading || paymentLoading) ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          paymentMethod === 'COD' ? 'Place Order' : 'Proceed to Payment'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="space-y-6">
            <Card className="border-amber-200/60 bg-white/80 backdrop-blur-sm sticky top-24">
              <CardHeader>
                <CardTitle style={{ fontFamily: "'Playfair Display', serif" }}>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Subtotal ({cart.length} items)</span>
                    <span className="font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Shipping</span>
                    <span className="font-medium text-emerald-600">Free</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tax (8%)</span>
                    <span className="font-medium">₹{tax.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="border-t border-amber-200/60 pt-3 flex justify-between text-base">
                    <span className="font-semibold text-slate-900">Total</span>
                    <span className="font-bold text-lg text-slate-900">₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-24 border-t border-amber-200/60 bg-gradient-to-br from-amber-100/50 via-stone-100/40 to-orange-100/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <button onClick={() => navigate('/')} className="flex items-center gap-2">
                <img src="/logo-full.png" srcSet="/logo-full@2x.png 2x, /logo-full@3x.png 3x" alt="Warnamayii Krishi Resources" className="h-10" />
              </button>
              <p className="mt-4 text-sm text-slate-600 leading-relaxed max-w-xs">
                Cultivating a greener tomorrow with organic essentials, trusted by farmers and home gardeners.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Shop</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><button onClick={() => navigate('/products')} className="hover:text-amber-700">All Products</button></li>
                <li><button onClick={() => navigate('/categories')} className="hover:text-amber-700">Categories</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Resources</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><button onClick={() => navigate('/about')} className="hover:text-amber-700">About Us</button></li>
                <li><button onClick={() => navigate('/contact')} className="hover:text-amber-700">Contact</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Newsletter</h4>
              <p className="text-sm text-slate-600 mb-4">Get growing tips & 10% off your first order.</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="you@email.com"
                  className="flex-1 rounded-full border border-amber-200/60 bg-white/80 backdrop-blur-sm px-4 py-2 text-sm outline-none focus:border-amber-600"
                />
                <button className="rounded-full bg-amber-600/90 hover:bg-amber-700/90 backdrop-blur-sm shadow-md text-white px-6 py-2 text-sm font-medium">Join</button>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-amber-200/60 pt-6 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Warnamayii Agri Network System. All rights reserved.</p>
            <div className="flex gap-5">
              <a href="#" className="hover:text-amber-700">Privacy</a>
              <a href="#" className="hover:text-amber-700">Terms</a>
              <a href="#" className="hover:text-amber-700">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
