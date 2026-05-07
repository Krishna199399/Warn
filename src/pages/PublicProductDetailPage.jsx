import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productsApi } from '../api/products.api';
import { useCart } from '../contexts/CartContext';
import { ArrowLeft, Package, ShoppingCart, Star, Leaf, Menu, X, Plus, Minus, ChevronDown, ChevronUp, Droplets, Award, Pill, AlertTriangle } from 'lucide-react';

// ─── Expandable Info Section Component ───────────────────────────────────────
function ExpandableSection({ title, content, icon: Icon, isOpen, onToggle }) {
  if (!content || content.trim() === '') return null;
  
  return (
    <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon size={18} className="text-slate-600" />}
          <span className="font-semibold text-slate-800">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp size={20} className="text-slate-400" />
        ) : (
          <ChevronDown size={20} className="text-slate-400" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-100">
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {content}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PublicProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [openSection, setOpenSection] = useState(null); // Track which section is open

  useEffect(() => {
    productsApi.getOne(id)
      .then(res => {
        setProduct(res.data.data);
        // Load related products from the same category
        return productsApi.getAll();
      })
      .then(res => {
        const allProducts = res.data.data || [];
        const related = allProducts
          .filter(p => p._id !== id && p.category === product?.category)
          .slice(0, 4);
        setRelatedProducts(related);
      })
      .catch(err => {
        console.error(err);
        setError(err.response?.data?.error || 'Failed to load product');
      })
      .finally(() => setLoading(false));
  }, [id, product?.category]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      navigate('/cart');
    }
  };

  const imgSrc = product?.image
    ? (product.image.startsWith('http') ? product.image : `${apiBase}${product.image}`)
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-18 max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 shrink-0">
            <img src="/logo-full.png" srcSet="/logo-full@2x.png 2x, /logo-full@3x.png 3x" alt="Warnamayii Krishi Resources" className="h-12" />
          </button>

          <nav className="hidden lg:flex items-center gap-1 ml-6">
            <Link to="/" className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">Home</Link>
            <Link to="/categories" className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">Categories</Link>
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
              <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-slate-100">About</Link>
              <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-slate-100">Contact</Link>
            </nav>
          </div>
        )}
      </header>

      {/* Content */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error || !product ? (
          <div className="text-center py-20">
            <Package size={64} className="mx-auto mb-4 text-slate-300" />
            <h2 className="text-2xl font-semibold mb-2">Product Not Found</h2>
            <p className="text-slate-600 mb-6">{error || 'The product you are looking for does not exist.'}</p>
            <button onClick={() => navigate('/')} className="btn-primary px-8 py-3">
              <ArrowLeft size={16} className="mr-2" /> Back to Home
            </button>
          </div>
        ) : (
          <>
            {/* Back Button */}
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
              <ArrowLeft size={18} />
              <span className="text-sm font-medium">Back to Home</span>
            </button>

            {/* Product Detail */}
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              {/* Left: Image */}
              <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-soft sticky top-24">
                <div className="aspect-square bg-slate-50 flex items-center justify-center p-6">
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-300">
                      <Leaf size={80} />
                      <span className="text-sm mt-3">No image available</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Product Info */}
              <div className="space-y-4">
                {/* Category Badge */}
                <div>
                  <span className="inline-block rounded-full bg-green-100 text-green-700 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider">
                    {product.category}
                  </span>
                </div>

                {/* Product Name */}
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>{product.name}</h1>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-sm font-medium">4.8</span>
                  <span className="text-sm text-slate-500">(124 reviews)</span>
                </div>

                {/* Price */}
                <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-5">
                  <p className="text-xs text-green-700 mb-1">Price</p>
                  <p className="text-4xl font-bold text-green-700">₹{product.price?.toLocaleString('en-IN')}</p>
                  <p className="text-sm text-green-600 mt-1">per {product.unit}</p>
                </div>

                {/* Description */}
                {product.description && (
                  <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <h3 className="font-semibold text-base mb-2">Description</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{product.description}</p>
                  </div>
                )}

                {/* Quantity Selector */}
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <h3 className="font-semibold text-base mb-3">Quantity</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 rounded-full border-2 border-slate-200 p-1">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                        className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="text-base font-semibold w-10 text-center">{quantity}</span>
                      <button 
                        onClick={() => setQuantity(quantity + 1)} 
                        className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-sm text-slate-600">
                      <span className="font-semibold">Total:</span> ₹{(product.price * quantity).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={handleAddToCart} className="flex-1 btn-primary px-6 py-3 text-sm gap-2">
                    <ShoppingCart size={16} />
                    Add to Cart
                  </button>
                  <button onClick={() => navigate('/register-select')} className="flex-1 btn-secondary px-6 py-3 text-sm">
                    Register to Order
                  </button>
                </div>

                {/* Additional Info */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">SKU:</span>
                    <span className="font-mono font-semibold text-xs">{product.sku}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Unit:</span>
                    <span className="font-semibold">{product.unit}</span>
                  </div>
                  {product.brand && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Brand:</span>
                      <span className="font-semibold">{product.brand}</span>
                    </div>
                  )}
                </div>

                {/* Product Information Sections */}
                <div className="space-y-3">
                  <ExpandableSection 
                    title="Ingredients" 
                    content={product.ingredients}
                    icon={Leaf}
                    isOpen={openSection === 'ingredients'}
                    onToggle={() => setOpenSection(openSection === 'ingredients' ? null : 'ingredients')}
                  />
                  <ExpandableSection 
                    title="How to Use" 
                    content={product.howToUse}
                    icon={Droplets}
                    isOpen={openSection === 'howToUse'}
                    onToggle={() => setOpenSection(openSection === 'howToUse' ? null : 'howToUse')}
                  />
                  <ExpandableSection 
                    title="Benefits" 
                    content={product.benefits}
                    icon={Award}
                    isOpen={openSection === 'benefits'}
                    onToggle={() => setOpenSection(openSection === 'benefits' ? null : 'benefits')}
                  />
                  <ExpandableSection 
                    title="Dosage" 
                    content={product.dosage}
                    icon={Pill}
                    isOpen={openSection === 'dosage'}
                    onToggle={() => setOpenSection(openSection === 'dosage' ? null : 'dosage')}
                  />
                  <ExpandableSection 
                    title="Disclaimer" 
                    content={product.disclaimer}
                    icon={AlertTriangle}
                    isOpen={openSection === 'disclaimer'}
                    onToggle={() => setOpenSection(openSection === 'disclaimer' ? null : 'disclaimer')}
                  />
                </div>
              </div>
            </div>

            {/* Related Products Section */}
            {relatedProducts.length > 0 && (
              <div className="mt-16">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>Related Products</h2>
                  <p className="text-slate-600 mt-1 text-sm">More products from the same category</p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {relatedProducts.map((relatedProduct) => (
                    <div
                      key={relatedProduct._id}
                      onClick={() => navigate(`/products/${relatedProduct._id}`)}
                      className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
                    >
                      <div className="relative aspect-square overflow-hidden bg-slate-50">
                        {relatedProduct.image ? (
                          <img
                            src={`${apiBase}${relatedProduct.image}`}
                            alt={relatedProduct.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Leaf size={64} className="text-green-200" />
                          </div>
                        )}
                        <span className="absolute top-3 left-3 rounded-full bg-green-600 px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
                          {relatedProduct.category}
                        </span>
                      </div>

                      <div className="flex flex-1 flex-col p-4">
                        <p className="text-[11px] uppercase tracking-wider text-slate-500">{relatedProduct.category}</p>
                        <h3 className="mt-1 line-clamp-2 font-medium text-sm text-slate-900 min-h-10">{relatedProduct.name}</h3>

                        <div className="mt-2 flex items-center gap-1.5">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-medium">4.8</span>
                          <span className="text-xs text-slate-500">(124)</span>
                        </div>

                        <div className="mt-3 flex items-end justify-between gap-2">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-lg font-semibold text-slate-900">₹{relatedProduct.price?.toLocaleString('en-IN')}</span>
                          </div>
                        </div>

                        <button className="mt-4 w-full btn-primary text-sm">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-24 border-t border-slate-200 bg-slate-50">
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
                <li><Link to="/app/products" className="hover:text-green-600">All Products</Link></li>
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
