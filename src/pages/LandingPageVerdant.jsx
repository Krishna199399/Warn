import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowRight, Leaf, Sparkles, Truck, ShieldCheck, Award, 
  ChevronRight, Star, ShoppingCart, Search, Menu, X, User, ChevronDown
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { productsApi } from '../api/products.api';
import { categoriesApi } from '../api/categories.api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

export default function LandingPageVerdant() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const { cart } = useCart();
  const { user, logout } = useAuth();

  const heroRef = useRef(null);
  const titleLine1Ref = useRef(null);
  const titleLine2Ref = useRef(null);
  const subtitleRef = useRef(null);
  const ctaRef = useRef(null);
  const statsRef = useRef(null);
  const categoryRef = useRef(null);
  const productsRef = useRef(null);
  const featuresRef = useRef(null);
  const reviewsRef = useRef(null);
  const ctaSectionRef = useRef(null);

  useEffect(() => {
    loadProducts();
    loadCategories();

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      
      tl.fromTo(heroRef.current.querySelector('.hero-badge'),
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, delay: 0.2 }
      )
      .fromTo([titleLine1Ref.current, titleLine2Ref.current],
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.2 },
        "-=0.6"
      )
      .fromTo(subtitleRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        "-=0.6"
      )
      .fromTo(ctaRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        "-=0.6"
      )
      .fromTo(statsRef.current.children,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1 },
        "-=0.4"
      );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  // Scroll-triggered reveals
  useEffect(() => {
    if (productsLoading || categoriesLoading) return;
    const sections = [
      { ref: categoryRef, selector: '.cat-card' },
      { ref: productsRef, selector: '.prod-card' },
      { ref: featuresRef, selector: '.feat-card' },
      { ref: ctaSectionRef, selector: '.cta-inner' },
    ];
    const triggers = [];
    sections.forEach(({ ref, selector }) => {
      if (!ref.current) return;
      const els = ref.current.querySelectorAll(selector);
      if (!els.length) return;
      const t = gsap.fromTo(els,
        { y: 40, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.7, stagger: 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: ref.current, start: 'top 82%', once: true },
        }
      );
      triggers.push(t);
    });
    // Reviews
    if (reviewsRef.current) {
      const t = gsap.fromTo(reviewsRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: reviewsRef.current, start: 'top 85%', once: true } }
      );
      triggers.push(t);
    }
    return () => triggers.forEach(t => t.scrollTrigger?.kill());
  }, [productsLoading, categoriesLoading]);

  const loadProducts = async () => {
    try {
      const response = await productsApi.getAll();
      setProducts(response.data.data || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await categoriesApi.getAll();
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const featured = products.slice(0, 4);

  const features = [
    { icon: Leaf, title: "100% Eco-Friendly", description: "Every product is certified organic and sustainably sourced from regenerative farms." },
    { icon: ShieldCheck, title: "Trusted by Farmers", description: "Over 12,000 farms across the country rely on Warnamayii for their daily essentials." },
    { icon: Truck, title: "Fast Free Delivery", description: "Free shipping on orders over ₹500, with reliable logistics nationwide." },
    { icon: Award, title: "Quality Tested", description: "Every batch is independently tested for purity, potency and quality." },
  ];

  const reviews = [
    { name: "Rajesh Kumar", role: "Organic Farmer", initials: "RK", rating: 5, text: "The organic fertilizer transformed my crop yield this season. My farm has never looked greener — Warnamayii is now my go-to." },
    { name: "Priya Sharma", role: "Home Gardener", initials: "PS", rating: 5, text: "Quality is unmatched. Fast delivery, honest sourcing, and prices that respect both the farmer and the planet." },
    { name: "Amit Patel", role: "Agricultural Advisor", initials: "AP", rating: 5, text: "Love the product range — clean ingredients, reliable quality, and you can see the results in every harvest." },
  ];

  return (
    <div className="min-h-screen bg-stone-50" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-stone-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 shrink-0">
            <img src="/logo-full.png" srcSet="/logo-full@2x.png 2x, /logo-full@3x.png 3x" alt="Warnamayii Krishi Resources" className="h-12" />
          </button>

          <nav className="hidden lg:flex items-center gap-1 ml-6">
            <Link to="/" className="rounded-full px-4 py-2 text-sm font-medium bg-green-600 text-white">Home</Link>
            <Link to="/categories" className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">Categories</Link>
            <Link to="/products" className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">Products</Link>
            <Link to="/about" className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">About</Link>
            <Link to="/contact" className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">Contact</Link>
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
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-slate-100">Home</Link>
              <Link to="/categories" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-slate-100">Categories</Link>
              <Link to="/products" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-slate-100">Products</Link>
              <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-slate-100">About</Link>
              <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-slate-100">Contact</Link>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="home" className="relative overflow-hidden min-h-[700px] lg:min-h-[850px] flex items-center" ref={heroRef}>
        {/* Background Image - Split Overlay */}
        <div className="absolute inset-0">
          <img 
            src="/4b53d9bf-37c3-4a96-8b3b-9f35e530ee24 (1).jpg" 
            alt="Organic farming" 
            className="h-full w-full object-cover object-center"
          />
          {/* Improved Gradient Overlay - Softer and more natural */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A2318]/90 via-[#0A2318]/60 to-[#0A2318]/30" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0A2318]/40" />
          <div className="absolute inset-0 bg-black/15 md:hidden" /> {/* Subtle darkening for mobile */}
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-[#1A4D33]/30 blur-[120px]" />

        {/* Content */}
        <div className="relative mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-2xl pt-10">
            <div className="hero-badge inline-flex items-center gap-2 rounded-full border border-[#A2E2A6]/30 bg-[#1A4D33]/60 backdrop-blur-md px-4 py-2 text-xs font-semibold tracking-wider text-[#A2E2A6] uppercase">
              <Sparkles className="h-3.5 w-3.5" /> 100% Organic · Farm to Door
            </div>
            
            <h1 className="mt-8 text-5xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-[5.5rem]" style={{ fontFamily: "'Syne', sans-serif" }}>
              <div className="overflow-hidden"><div ref={titleLine1Ref}>Cultivating a</div></div>
              <div className="overflow-hidden"><div ref={titleLine2Ref} className="text-[#A2E2A6]">greener tomorrow.</div></div>
            </h1>
            
            <p ref={subtitleRef} className="mt-8 max-w-xl text-lg text-stone-300 leading-relaxed font-light">
              Premium organic fertilizers, heirloom seeds and agricultural essentials — sustainably sourced and trusted by 12,000+ growers nationwide.
            </p>
            
            <div ref={ctaRef} className="mt-10 flex flex-wrap gap-4">
              {user ? (
                <button 
                  onClick={() => navigate('/products')} 
                  className="group rounded-full bg-[#A2E2A6] text-[#0A2318] px-8 py-4 text-base font-semibold hover:bg-white transition-all duration-300 inline-flex items-center gap-2 shadow-xl hover:shadow-2xl hover:-translate-y-1"
                >
                  Shop Now 
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <button 
                  onClick={() => navigate('/register-select')} 
                  className="group rounded-full bg-[#A2E2A6] text-[#0A2318] px-8 py-4 text-base font-semibold hover:bg-white transition-all duration-300 inline-flex items-center gap-2 shadow-xl hover:shadow-2xl hover:-translate-y-1"
                >
                  Shop Now 
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
              <button 
                onClick={() => navigate('/about')} 
                className="rounded-full border border-stone-400 text-white px-8 py-4 text-base font-medium hover:bg-white hover:text-[#0A2318] hover:border-white transition-all duration-300"
              >
                Our Story
              </button>
            </div>
            
            <div ref={statsRef} className="mt-16 flex items-center gap-10 flex-wrap border-t border-white/10 pt-8">
              <div>
                <p className="text-3xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>12K+</p>
                <p className="text-sm text-stone-400 mt-1 uppercase tracking-wider text-[10px] font-semibold">Happy Farmers</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{products.length}+</p>
                <p className="text-sm text-stone-400 mt-1 uppercase tracking-wider text-[10px] font-semibold">Products</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>4.9★</p>
                <p className="text-sm text-stone-400 mt-1 uppercase tracking-wider text-[10px] font-semibold">Rating</p>
              </div>
            </div>
          </div>
        </div>


      </section>

      {/* Shop by Category Section */}
      <section className="mx-auto max-w-7xl px-4 pt-6 pb-16 sm:px-6 lg:px-8 lg:pb-20" ref={categoryRef}>
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">BROWSE</p>
            <h2 className="mt-2 text-4xl font-semibold tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>Shop by Category</h2>
          </div>
          <button onClick={() => navigate('/categories')} className="text-sm font-medium text-green-600 hover:text-green-700 flex items-center gap-1">
            View all <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {categoriesLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500">No categories available yet.</p>
            <p className="text-sm text-slate-400 mt-2">Admin can add categories from the admin panel.</p>
          </div>
        ) : (
          /* ── Editorial Bento Grid ── */
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[180px] lg:auto-rows-[220px]">
            {categories.map((cat, i) => {
              const imgSrc = cat.image
                ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${cat.image}`
                : null;
              // First card spans 2 cols + 2 rows; next 2 span 2 rows; rest are 1×1
              const spanClass =
                i === 0 ? 'col-span-2 row-span-2' :
                i === 1 ? 'col-span-1 row-span-2' :
                i === 2 ? 'col-span-1 row-span-2' :
                'col-span-1 row-span-1';
              return (
                <button
                  key={cat._id}
                  onClick={() => navigate('/products')}
                  className={`cat-card group relative overflow-hidden rounded-3xl bg-slate-100 cursor-pointer ${spanClass}`}
                >
                  {/* Background image */}
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={cat.name}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-green-900 to-emerald-700 flex items-center justify-center">
                      <Leaf size={i === 0 ? 64 : 40} className="text-white/30" />
                    </div>
                  )}

                  {/* Dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A2318]/80 via-[#0A2318]/20 to-transparent" />

                  {/* Hover shimmer */}
                  <div className="absolute inset-0 bg-[#A2E2A6]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Text overlay — frosted glass */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-5">
                    <div className="inline-block backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl px-3 py-2">
                      <h3
                        className="font-semibold text-white text-sm lg:text-base leading-tight"
                        style={{ fontFamily: "'Syne', sans-serif" }}
                      >
                        {cat.name}
                      </h3>
                      <p className="text-[10px] lg:text-xs text-white/70 mt-0.5 font-medium">
                        {cat.productCount || 0} product{cat.productCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Arrow on hover */}
                  <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/0 group-hover:bg-white/20 border border-white/0 group-hover:border-white/30 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100">
                    <ArrowRight className="h-4 w-4 text-white" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Products Section */}
      <section id="products" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20" ref={productsRef}>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-green-600">Hand-picked</p>
            <h2 className="mt-2 text-4xl font-semibold tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>Featured Products</h2>
            <p className="mt-2 text-slate-600">The season's most loved organic essentials.</p>
          </div>
        </div>
        
        {productsLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => (
              <div
                key={product._id}
                onClick={() => navigate(`/products/${product._id}`)}
                className="prod-card group relative flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-green-100 cursor-pointer"
              >
                <div className="relative aspect-square overflow-hidden bg-slate-50">
                  {product.image ? (
                    <img
                      src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${product.image}`}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Leaf size={64} className="text-green-200" />
                    </div>
                  )}
                  <span className="absolute top-3 left-3 rounded-full bg-green-600 px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
                    {product.category}
                  </span>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A2318]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">{product.category}</p>
                  <h3 className="mt-1 line-clamp-2 font-medium text-sm text-slate-900 min-h-10">{product.name}</h3>

                  {/* Rating — hidden until hover */}
                  <div className="mt-2 flex items-center gap-1.5 overflow-hidden max-h-0 group-hover:max-h-10 transition-all duration-300 opacity-0 group-hover:opacity-100">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-medium">4.8</span>
                    <span className="text-xs text-slate-500">(124)</span>
                  </div>

                  <div className="mt-3 flex items-end justify-between gap-2">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-semibold text-slate-900">₹{product.price?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Button — hidden until hover */}
                  <div className="overflow-hidden max-h-0 group-hover:max-h-14 transition-all duration-300 mt-0 group-hover:mt-4">
                    <button className="w-full btn-primary text-sm">
                      <ShoppingCart className="h-4 w-4" /> View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Why Choose Us — Asymmetric Bento */}
      <section className="py-16 lg:py-24" ref={featuresRef}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-green-600">Why Warnamayii</p>
              <h2 className="mt-2 text-4xl lg:text-5xl font-semibold tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>Rooted in trust,<br />grown with care</h2>
            </div>
            <p className="max-w-sm text-slate-500 text-sm leading-relaxed">Every product we carry passes through rigorous quality checks before reaching your doorstep.</p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[180px]">
            {/* Large hero feature card — 2 cols × 2 rows */}
            <div className="feat-card sm:col-span-2 lg:col-span-2 lg:row-span-2 group relative overflow-hidden rounded-3xl bg-[#0A2318] p-8 flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#A2E2A6]/10 rounded-full blur-3xl" />
              <span className="text-6xl font-bold text-[#A2E2A6]/30 select-none" style={{ fontFamily: "'Syne', sans-serif" }}>01</span>
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#A2E2A6]/15 mb-4">
                  <Leaf className="h-7 w-7 text-[#A2E2A6]" />
                </div>
                <h3 className="text-xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{features[0].title}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-xs">{features[0].description}</p>
              </div>
            </div>

            {/* Regular feature cards — card 04 (last) spans 2 cols to fill the gap */}
            {features.slice(1).map((f, i) => (
              <div
                key={i}
                className={`feat-card group relative overflow-hidden rounded-3xl bg-white border border-slate-100 p-6 flex flex-col justify-between hover:border-green-200 hover:shadow-xl transition-all duration-300 ${i === 2 ? 'sm:col-span-2 lg:col-span-2' : ''}`}
              >
                <span className="text-4xl font-bold text-slate-100 group-hover:text-green-100 transition-colors" style={{ fontFamily: "'Syne', sans-serif" }}>0{i + 2}</span>
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 group-hover:bg-green-600 transition-colors duration-300 mb-3">
                    <f.icon className="h-5 w-5 text-green-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm">{f.title}</h3>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-16 lg:py-20 overflow-hidden" ref={reviewsRef}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-green-600">Loved by growers</p>
            <h2 className="mt-2 text-4xl font-semibold tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>What our community says</h2>
          </div>
        </div>
        <div className="relative">
          <div className="flex gap-6 animate-marquee">
            {/* First set of reviews */}
            {reviews.map((r, i) => (
              <div key={`first-${i}`} className="flex-shrink-0 w-[350px] flex flex-col p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(r.rating)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 leading-relaxed mb-6">"{r.text}"</p>
                <div className="flex items-center gap-3 mt-auto">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white font-bold text-sm">
                    {r.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900">{r.name}</p>
                    <p className="text-xs text-slate-500">{r.role}</p>
                  </div>
                </div>
              </div>
            ))}
            {/* Duplicate set for seamless loop */}
            {reviews.map((r, i) => (
              <div key={`second-${i}`} className="flex-shrink-0 w-[350px] flex flex-col p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(r.rating)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 leading-relaxed mb-6">"{r.text}"</p>
                <div className="flex items-center gap-3 mt-auto">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white font-bold text-sm">
                    {r.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900">{r.name}</p>
                    <p className="text-xs text-slate-500">{r.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — Dark Forest Glassmorphism */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16" ref={ctaSectionRef}>
        <div className="cta-inner relative overflow-hidden rounded-[2.5rem] bg-[#0A2318] p-10 sm:p-16 text-center">
          {/* Decorative orbs */}
          <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-[#A2E2A6]/10 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-[#1A4D33]/60 blur-[80px]" />

          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#A2E2A6]/30 bg-[#1A4D33]/60 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-[#A2E2A6] uppercase tracking-wider">
              <Leaf className="h-3.5 w-3.5" /> Join 12,000+ growers
            </span>
            <h2 className="mt-6 text-4xl sm:text-5xl font-bold tracking-tight text-white max-w-2xl mx-auto" style={{ fontFamily: "'Syne', sans-serif" }}>
              Start your sustainable<br />journey today
            </h2>
            <p className="mt-4 max-w-xl mx-auto text-stone-400 leading-relaxed">
              Get exclusive offers, growing guides and early access to new products delivered straight to your inbox.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              {user ? (
                <button onClick={() => navigate('/products')} className="group rounded-full bg-[#A2E2A6] text-[#0A2318] px-10 py-4 text-base font-semibold hover:bg-white transition-all duration-300 inline-flex items-center gap-2 shadow-xl hover:shadow-2xl hover:-translate-y-1">
                  Shop Now <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <>
                  <button onClick={() => navigate('/register-select')} className="group rounded-full bg-[#A2E2A6] text-[#0A2318] px-10 py-4 text-base font-semibold hover:bg-white transition-all duration-300 inline-flex items-center gap-2 shadow-xl hover:shadow-2xl hover:-translate-y-1">
                    Get Started <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button onClick={() => navigate('/login')} className="rounded-full border border-stone-500 text-white px-10 py-4 text-base font-medium hover:bg-white/10 transition-all duration-300">
                    Login
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer — Premium Dark */}
      <footer className="bg-[#050F0A] border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <button onClick={() => navigate('/')} className="flex items-center gap-2">
                <img src="/logo-full.png" srcSet="/logo-full@2x.png 2x, /logo-full@3x.png 3x" alt="Warnamayii Krishi Resources" className="h-10 brightness-0 invert" />
              </button>
              <p className="mt-4 text-sm text-stone-500 leading-relaxed max-w-xs">
                Cultivating a greener tomorrow with organic essentials, trusted by 12,000+ farmers nationwide.
              </p>
              <div className="mt-6 flex gap-3">
                {['FB', 'IG', 'TW'].map(s => (
                  <a key={s} href="#" className="h-9 w-9 rounded-full border border-white/10 flex items-center justify-center text-stone-500 hover:border-[#A2E2A6]/40 hover:text-[#A2E2A6] transition-colors text-xs font-bold">{s}</a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-xs uppercase tracking-widest text-stone-500 mb-5">Shop</h4>
              <ul className="space-y-3 text-sm text-stone-400">
                <li><Link to="/products" className="hover:text-[#A2E2A6] transition-colors">All Products</Link></li>
                <li><Link to="/categories" className="hover:text-[#A2E2A6] transition-colors">Categories</Link></li>
                <li><Link to="/about" className="hover:text-[#A2E2A6] transition-colors">About Us</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-xs uppercase tracking-widest text-stone-500 mb-5">Support</h4>
              <ul className="space-y-3 text-sm text-stone-400">
                <li><a href="#" className="hover:text-[#A2E2A6] transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-[#A2E2A6] transition-colors">Shipping Info</a></li>
                <li><a href="#" className="hover:text-[#A2E2A6] transition-colors">Returns</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-xs uppercase tracking-widest text-stone-500 mb-5">Newsletter</h4>
              <p className="text-sm text-stone-500 mb-4">Growing tips &amp; 10% off your first order.</p>
              <div className="flex gap-2">
                <input type="email" placeholder="you@email.com"
                  className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none placeholder:text-stone-600 focus:border-[#A2E2A6]/40" />
                <button className="rounded-full bg-[#A2E2A6] text-[#0A2318] px-4 py-2 text-sm font-semibold hover:bg-white transition-colors">Join</button>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/5 pt-6">
            <p className="text-xs text-stone-600">© {new Date().getFullYear()} Warnamayii Agri Network System. All rights reserved.</p>
            <div className="flex gap-5 text-xs text-stone-600">
              <a href="#" className="hover:text-[#A2E2A6] transition-colors">Privacy</a>
              <a href="#" className="hover:text-[#A2E2A6] transition-colors">Terms</a>
              <a href="#" className="hover:text-[#A2E2A6] transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
