import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Leaf, Star, ShoppingCart, Search, Menu, X } from 'lucide-react';
import { productsApi } from '../api/products.api';
import { PriceDisplay } from '../components/ui/price-display';

export default function PublicProductsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter || 'All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await productsApi.getAll();
      setProducts(response.data.data || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique categories
  const categories = ['All', ...new Set(products.map(p => p.category))];

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/80 via-stone-50/60 to-orange-50/70 backdrop-blur-sm">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-amber-100/60 bg-amber-50/80 backdrop-blur-lg">
        <div className="mx-auto flex h-18 max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 shrink-0">
            <img src="/logo-full.png" srcSet="/logo-full@2x.png 2x, /logo-full@3x.png 3x" alt="Warnamayii Krishi Resources" className="h-12" />
          </button>

          <nav className="hidden lg:flex items-center gap-1 ml-6">
            <Link to="/" className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">Home</Link>
            <Link to="/categories" className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">Categories</Link>
            <Link to="/products" className="rounded-full px-4 py-2 text-sm font-medium bg-green-50 text-green-700">Products</Link>
            <Link to="/about" className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">About</Link>
            <Link to="/contact" className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">Contact</Link>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => navigate('/login')} className="hidden sm:inline-flex btn-primary text-sm">
              Login
            </button>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden h-10 w-10 inline-flex items-center justify-center rounded-full hover:bg-slate-100">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white">
            <nav className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-1">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-slate-100">Home</Link>
              <Link to="/categories" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-slate-100">Categories</Link>
              <Link to="/products" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium bg-green-50 text-green-700">Products</Link>
              <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-slate-100">About</Link>
              <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-slate-100">Contact</Link>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-amber-100/40 via-stone-100/30 to-orange-100/40 backdrop-blur-sm border-b border-amber-100/60">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-green-600">Explore</p>
          <h1 className="mt-2 font-display text-5xl font-semibold tracking-tight">All Products</h1>
          <p className="mt-3 max-w-xl text-slate-600">Browse our complete collection of organic farming essentials.</p>
        </div>
      </section>

      {/* Filters & Products */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 max-w-md">
            <Search className="h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none text-sm w-full placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-green-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-green-200 hover:bg-green-50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <Leaf size={64} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-slate-600">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-600 mb-6">
              Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filteredProducts.map((product) => (
                <div
                  key={product._id}
                  onClick={() => navigate(`/products/${product._id}`)}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
                >
                  <div className="relative aspect-square overflow-hidden bg-slate-50">
                    {product.image ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${product.image}`}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Leaf size={64} className="text-green-200" />
                      </div>
                    )}
                    <span className="absolute top-3 left-3 rounded-full bg-green-600 px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
                      {product.category}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <p className="text-[11px] uppercase tracking-wider text-slate-500">{product.category}</p>
                    <h3 className="mt-1 line-clamp-2 font-medium text-sm text-slate-900 min-h-10">{product.name}</h3>

                    <div className="mt-2 flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-medium">4.8</span>
                      <span className="text-xs text-slate-500">(124)</span>
                    </div>

                    <div className="mt-3 flex items-end justify-between gap-2">
                      <PriceDisplay 
                        mrp={product.actualPrice}
                        sellingPrice={product.mrp}
                        size="medium"
                        showSavings={false}
                      />
                    </div>

                    <button className="mt-4 w-full btn-primary text-sm">
                      <ShoppingCart className="h-4 w-4" /> View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
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
                <li><Link to="/products" className="hover:text-green-600">All Products</Link></li>
                <li><Link to="/categories" className="hover:text-green-600">Categories</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Resources</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><Link to="/about" className="hover:text-green-600">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-green-600">Contact</Link></li>
                <li><a href="#" className="hover:text-green-600">Help Center</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Newsletter</h4>
              <p className="text-sm text-slate-600 mb-4">Get growing tips & 10% off your first order.</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="you@email.com"
                  className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-green-600"
                />
                <button className="btn-primary text-sm">Join</button>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Warnamayii Agri Network System. All rights reserved.</p>
            <div className="flex gap-5">
              <a href="#" className="hover:text-green-600">Privacy</a>
              <a href="#" className="hover:text-green-600">Terms</a>
              <a href="#" className="hover:text-green-600">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
