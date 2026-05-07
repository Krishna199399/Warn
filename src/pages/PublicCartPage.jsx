import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, Leaf } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import PublicNavbar from '../components/PublicNavbar';

export default function PublicCartPage() {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, clearCart, getCartTotal } = useCart();
  const { user } = useAuth();

  const total = getCartTotal();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/80 via-stone-50/60 to-orange-50/70">
      <PublicNavbar />

      {/* Cart Content */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-semibold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>Your Cart</h1>
        <p className="mt-2 text-slate-600">{cart.length} {cart.length === 1 ? "item" : "items"} · sustainable shipping included</p>

        {cart.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-amber-200/60 bg-white/80 backdrop-blur-sm p-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100/80 text-amber-700 mb-4">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>Your cart is empty</h2>
            <p className="text-slate-600 mt-2">Time to fill it with something organic.</p>
            <button onClick={() => navigate('/products')} className="rounded-full bg-amber-600/90 hover:bg-amber-700/90 backdrop-blur-sm shadow-md text-white px-8 py-3 font-medium mt-6">
              Browse products
            </button>
          </div>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <div key={item.productId} className="flex gap-4 rounded-3xl border border-amber-200/60 bg-white/80 backdrop-blur-sm p-4">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-stone-50/80">
                    {item.image ? (
                      <img 
                        src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${item.image}`}
                        alt={item.name} 
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Leaf size={32} className="text-amber-200" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col">
                    <p className="text-xs uppercase tracking-wider text-slate-500">{item.category}</p>
                    <h3 className="font-medium text-slate-900">{item.name}</h3>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-full border border-amber-200/60 p-1 bg-white/50 backdrop-blur-sm">
                        <button 
                          onClick={() => updateQuantity(item._id, item.quantity - 1)} 
                          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-amber-50/80"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item._id, item.quantity + 1)} 
                          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-amber-50/80"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="font-semibold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item._id)} 
                    className="self-start text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button onClick={clearCart} className="text-sm text-slate-500 hover:text-red-600">Clear cart</button>
            </div>

            <aside className="rounded-3xl border border-amber-200/60 bg-white/80 backdrop-blur-sm p-6 h-fit lg:sticky lg:top-24 shadow-md">
              <h2 className="text-xl font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>Order Summary</h2>
              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-600">Subtotal</dt>
                  <dd>₹{total.toLocaleString('en-IN')}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600">Shipping</dt>
                  <dd className="text-emerald-600 font-medium">Free</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600">Tax</dt>
                  <dd className="text-emerald-600 font-medium">Included in price</dd>
                </div>
                <div className="border-t border-amber-200/60 pt-3 mt-3 flex justify-between text-base font-semibold">
                  <dt>Total</dt>
                  <dd>₹{total.toLocaleString('en-IN')}</dd>
                </div>
              </dl>
              {user ? (
                <button onClick={() => navigate('/checkout')} className="rounded-full bg-amber-600/90 hover:bg-amber-700/90 backdrop-blur-sm shadow-md text-white w-full px-8 py-3 font-medium mt-6">
                  Proceed to Checkout
                </button>
              ) : (
                <button onClick={() => navigate('/login')} className="rounded-full bg-amber-600/90 hover:bg-amber-700/90 backdrop-blur-sm shadow-md text-white w-full px-8 py-3 font-medium mt-6">
                  Login to Checkout
                </button>
              )}
              <Link to="/products" className="mt-3 block text-center text-sm text-slate-600 hover:text-amber-700">
                Continue shopping
              </Link>
            </aside>
          </div>
        )}
      </section>

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
                <li><Link to="/products" className="hover:text-amber-700">All Products</Link></li>
                <li><Link to="/categories" className="hover:text-amber-700">Categories</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Resources</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><Link to="/about" className="hover:text-amber-700">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-amber-700">Contact</Link></li>
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
