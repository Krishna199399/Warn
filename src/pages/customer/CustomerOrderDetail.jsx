import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, MapPin, CreditCard, Truck, CheckCircle, Clock } from 'lucide-react';
import { ordersApi } from '../../api/orders.api';
import PublicNavbar from '../../components/PublicNavbar';

export default function CustomerOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const response = await ordersApi.getById(id);
      setOrder(response.data.data);
    } catch (error) {
      console.error('Failed to load order:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-amber-100/80 text-amber-700 border-amber-200/60',
      CONFIRMED: 'bg-amber-100/80 text-amber-700 border-amber-200/60',
      SHIPPED: 'bg-amber-100/80 text-amber-700 border-amber-200/60',
      DELIVERED: 'bg-emerald-100/80 text-emerald-700 border-emerald-200/60',
      CANCELLED: 'bg-red-100/80 text-red-700 border-red-200/60'
    };
    return colors[status] || 'bg-stone-100/80 text-stone-700 border-stone-200/60';
  };

  const orderTimeline = [
    { status: 'PENDING', label: 'Order Placed', icon: Package },
    { status: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle },
    { status: 'SHIPPED', label: 'Shipped', icon: Truck },
    { status: 'DELIVERED', label: 'Delivered', icon: CheckCircle },
  ];

  const getStatusIndex = (status) => {
    const index = orderTimeline.findIndex(t => t.status === status);
    return index >= 0 ? index : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50/80 via-stone-50/60 to-orange-50/70">
        <PublicNavbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50/80 via-stone-50/60 to-orange-50/70">
        <PublicNavbar />
        <div className="p-6 max-w-7xl mx-auto text-center py-20">
          <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-lg text-slate-600">Order not found</p>
          <button onClick={() => navigate('/my-orders')} className="rounded-full bg-amber-600/90 hover:bg-amber-700/90 backdrop-blur-sm shadow-md text-white px-6 py-3 font-medium mt-4">
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const currentStatusIndex = getStatusIndex(order.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/80 via-stone-50/60 to-orange-50/70">
      <PublicNavbar />
      
      <div className="p-6 max-w-7xl mx-auto space-y-6 py-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/my-orders')}
          className="h-10 w-10 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-sm text-slate-600">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        <span className={`ml-auto px-4 py-2 rounded-full text-sm font-medium border backdrop-blur-sm ${getStatusColor(order.status)}`}>
          {order.status}
        </span>
      </div>

      {/* Order Timeline */}
      {order.status !== 'CANCELLED' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold mb-6">Order Status</h2>
          <div className="relative">
            <div className="flex justify-between">
              {orderTimeline.map((step, index) => {
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                return (
                  <div key={step.status} className="flex flex-col items-center flex-1">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center backdrop-blur-sm ${
                      isCompleted ? 'bg-amber-600/90 text-white shadow-md' : 'bg-stone-100/80 text-stone-400'
                    }`}>
                      <step.icon className="h-6 w-6" />
                    </div>
                    <p className={`text-sm mt-2 font-medium ${isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                      {step.label}
                    </p>
                    {isCurrent && (
                      <Clock className="h-4 w-4 text-amber-600 mt-1 animate-pulse" />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="absolute top-6 left-0 right-0 h-0.5 bg-stone-200/60 -z-10">
              <div 
                className="h-full bg-amber-600/90 backdrop-blur-sm transition-all duration-500"
                style={{ width: `${(currentStatusIndex / (orderTimeline.length - 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items?.map((item, index) => (
                <div key={index} className="flex gap-4 pb-4 border-b border-slate-100 last:border-0">
                  <div className="h-20 w-20 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    {item.product?.image ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${item.product.image}`}
                        alt={item.product.name}
                        className="h-full w-full object-cover rounded-lg"
                      />
                    ) : (
                      <Package className="h-8 w-8 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900">{item.product?.name || 'Product'}</h3>
                    <p className="text-sm text-slate-600 mt-1">Quantity: {item.quantity}</p>
                    <p className="text-sm text-slate-600">₹{item.price?.toLocaleString('en-IN')} each</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      ₹{(item.price * item.quantity)?.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary & Details */}
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium">₹{order.subtotal?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Shipping</span>
                <span className="font-medium">₹{order.shippingCost?.toLocaleString('en-IN') || 0}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Discount</span>
                  <span className="font-medium">-₹{order.discount?.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-3 flex justify-between">
                <span className="font-semibold text-slate-900">Total</span>
                <span className="font-bold text-lg text-slate-900">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-slate-600" />
              <h2 className="text-lg font-semibold">Delivery Address</h2>
            </div>
            <div className="text-sm text-slate-600 space-y-1">
              <p className="font-medium text-slate-900">{order.shippingAddress?.name}</p>
              <p>{order.shippingAddress?.street}</p>
              <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}</p>
              <p className="pt-2">{order.shippingAddress?.phone}</p>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-slate-600" />
              <h2 className="text-lg font-semibold">Payment Method</h2>
            </div>
            <p className="text-sm text-slate-600">{order.paymentMethod || 'Cash on Delivery'}</p>
            <p className="text-sm text-slate-600 mt-1">
              Status: <span className="font-medium text-slate-900">{order.paymentStatus || 'Pending'}</span>
            </p>
          </div>
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

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500">
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
