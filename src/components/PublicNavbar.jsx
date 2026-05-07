import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Search, Menu, X, User, ChevronDown, Leaf } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

export default function PublicNavbar({ activePage = 'home' }) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const { cart } = useCart();
  const { user, logout } = useAuth();

  const navLinks = [
    { path: '/', label: 'Home', key: 'home' },
    { path: '/categories', label: 'Categories', key: 'categories' },
    { path: '/products', label: 'Products', key: 'products' },
    { path: '/about', label: 'About', key: 'about' },
    { path: '/contact', label: 'Contact', key: 'contact' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-amber-100/60 bg-amber-50/80 backdrop-blur-lg">
      <div className="mx-auto flex h-18 max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 shrink-0">
          <img src="/logo-full.png" srcSet="/logo-full@2x.png 2x, /logo-full@3x.png 3x" alt="Warnamayii Krishi Resources" className="h-12" />
        </button>

        <nav className="hidden lg:flex items-center gap-1 ml-6">
          {navLinks.map(link => (
            <Link
              key={link.key}
              to={link.path}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                activePage === link.key
                  ? 'bg-green-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 w-64">
            <Search className="h-4 w-4 text-slate-400" />
            <input placeholder="Search organic..." className="bg-transparent outline-none text-sm w-full placeholder:text-slate-400" />
          </div>

          {/* Account Dropdown - Show if customer is logged in */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                className="hidden sm:flex items-center gap-2 h-10 px-4 rounded-full hover:bg-slate-100"
              >
                <User className="h-5 w-5" />
                <span className="text-sm font-medium">{user.name?.split(' ')[0]}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {accountDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setAccountDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-lg z-20 py-2">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="font-medium text-slate-900">{user.name}</p>
                      <p className="text-sm text-slate-600">{user.email}</p>
                    </div>
                    <button
                      onClick={() => { navigate('/my-orders'); setAccountDropdownOpen(false); }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      My Orders
                    </button>
                    <button
                      onClick={() => { navigate('/my-profile'); setAccountDropdownOpen(false); }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      My Profile
                    </button>
                    <button
                      onClick={() => { navigate('/my-addresses'); setAccountDropdownOpen(false); }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Leaf className="h-4 w-4" />
                      My Addresses
                    </button>
                    <div className="border-t border-slate-100 mt-2 pt-2">
                      <button
                        onClick={() => { logout(); setAccountDropdownOpen(false); navigate('/'); }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button onClick={() => navigate('/login')} className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100">
              <User className="h-5 w-5" />
            </button>
          )}

          <button onClick={() => navigate('/cart')} className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100 relative">
            <ShoppingCart className="h-5 w-5" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-semibold">
                {cart.length}
              </span>
            )}
          </button>

          {!user && (
            <button onClick={() => navigate('/login')} className="hidden sm:inline-flex rounded-full bg-green-100 text-green-700 px-5 py-2 text-sm font-medium hover:bg-green-200">
              Login
            </button>
          )}

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden h-10 w-10 inline-flex items-center justify-center rounded-full hover:bg-slate-100">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white">
          <nav className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-1">
            {navLinks.map(link => (
              <Link
                key={link.key}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-slate-100"
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <>
                <div className="border-t border-slate-100 my-2" />
                <Link to="/my-orders" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-slate-100">
                  My Orders
                </Link>
                <Link to="/my-profile" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-slate-100">
                  My Profile
                </Link>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); navigate('/'); }}
                  className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-red-50 text-red-600 text-left"
                >
                  Logout
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
