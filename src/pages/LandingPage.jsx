import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sprout, Users, Package, TrendingUp, Shield, Zap, 
  ArrowRight, CheckCircle, Menu, X, ChevronRight, Loader2 
} from 'lucide-react';
import { productsApi } from '../api/products.api';

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

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
      setProductsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Sprout size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">WANS</h1>
                <p className="text-xs text-slate-500 leading-none">Warnamayii Agri Network</p>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#home" className="text-sm font-medium text-slate-700 hover:text-green-600 transition-colors">Home</a>
              <a href="#features" className="text-sm font-medium text-slate-700 hover:text-green-600 transition-colors">Features</a>
              <a href="#products" className="text-sm font-medium text-slate-700 hover:text-green-600 transition-colors">Products</a>
              <a href="#how-it-works" className="text-sm font-medium text-slate-700 hover:text-green-600 transition-colors">How It Works</a>
              <a href="#benefits" className="text-sm font-medium text-slate-700 hover:text-green-600 transition-colors">Benefits</a>
              <button onClick={() => navigate('/login')} className="text-sm font-medium text-slate-700 hover:text-green-600 transition-colors">
                Login
              </button>
              <button onClick={() => navigate('/register')} className="btn-primary text-sm">
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-800"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white">
            <div className="px-4 py-4 space-y-3">
              <a href="#home" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-700 hover:text-green-600 py-2">Home</a>
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-700 hover:text-green-600 py-2">Features</a>
              <a href="#products" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-700 hover:text-green-600 py-2">Products</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-700 hover:text-green-600 py-2">How It Works</a>
              <a href="#benefits" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-700 hover:text-green-600 py-2">Benefits</a>
              <button onClick={() => navigate('/login')} className="block w-full text-left text-sm font-medium text-slate-700 hover:text-green-600 py-2">
                Login
              </button>
              <button onClick={() => navigate('/register')} className="btn-primary w-full text-sm">
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-green-50 via-white to-green-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                <Sprout size={16} />
                Agriculture Distribution Network
              </div>
              
              <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 leading-tight">
                Empowering Agriculture
                <span className="block text-green-600">Distribution Network</span>
              </h1>
              
              <p className="text-lg text-slate-600 leading-relaxed">
                Connect farmers, distributors, and employees in a seamless network. 
                Manage inventory, track sales, and earn commissions—all in one platform.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <button onClick={() => navigate('/register')} className="btn-primary px-8 py-3 text-base">
                  Get Started <ArrowRight size={18} />
                </button>
                <button onClick={() => navigate('/login')} className="btn-secondary px-8 py-3 text-base">
                  Login
                </button>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div>
                  <p className="text-3xl font-bold text-slate-900">500+</p>
                  <p className="text-sm text-slate-500">Active Users</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900">1000+</p>
                  <p className="text-sm text-slate-500">Orders Processed</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900">50+</p>
                  <p className="text-sm text-slate-500">Products</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
                <img 
                  src="/src/assets/hero.png" 
                  alt="WANS Platform" 
                  className="w-full h-auto rounded-2xl"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div class="w-full h-96 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center"><div class="text-center"><div class="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"><svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg></div><p class="text-slate-600 font-medium">Agriculture Network Platform</p></div></div>';
                  }}
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-72 h-72 bg-green-200 rounded-full blur-3xl opacity-30 -z-10"></div>
              <div className="absolute -top-6 -left-6 w-72 h-72 bg-green-300 rounded-full blur-3xl opacity-20 -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Our Products</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Quality agricultural products for your farming needs
            </p>
          </div>

          {productsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={40} className="text-green-600 animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <Package size={48} className="text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">No products available at the moment</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div 
                  key={product._id || product.id} 
                  className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                >
                  {/* Product Image */}
                  <div className="relative h-48 bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center overflow-hidden">
                    {product.image ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${product.image}`}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ display: product.image ? 'none' : 'flex' }}
                    >
                      <Package size={64} className="text-green-300 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div className="absolute top-3 right-3 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      {product.category}
                    </div>
                  </div>


                  {/* Product Info */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-1">
                      {product.name}
                    </h3>
                    
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2 min-h-[40px]">
                      {product.description || `Premium quality ${product.category.toLowerCase()} product for agricultural use`}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          ₹{product.price?.toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-slate-500">per {product.unit}</p>
                      </div>
                      {product.sku && (
                        <div className="text-right">
                          <p className="text-xs text-slate-400">SKU</p>
                          <p className="text-xs font-mono text-slate-600">{product.sku}</p>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => navigate('/register')}
                      className="w-full bg-green-600 text-white py-2.5 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      Contact Us <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!productsLoading && products.length > 0 && (
            <div className="text-center mt-12">
              <p className="text-slate-600 mb-4">Want to order these products?</p>
              <button 
                onClick={() => navigate('/register')} 
                className="btn-primary px-8 py-3"
              >
                Register Now <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              A seamless flow from company to farmer, ensuring transparency and efficiency at every step
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Package, title: 'Company', desc: 'Products sourced from company', color: 'blue' },
              { icon: TrendingUp, title: 'Wholesale', desc: 'Bulk distribution to mini stocks', color: 'purple' },
              { icon: Users, title: 'Mini Stock', desc: 'Local distribution points', color: 'green' },
              { icon: Sprout, title: 'Farmer', desc: 'End customers receive products', color: 'amber' },
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="bg-white rounded-2xl p-6 border-2 border-slate-100 hover:border-green-200 transition-all hover:shadow-lg">
                  <div className={`w-14 h-14 bg-${step.color}-100 rounded-xl flex items-center justify-center mb-4`}>
                    <step.icon size={28} className={`text-${step.color}-600`} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-600">{step.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ChevronRight size={24} className="text-green-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Powerful Features</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Everything you need to manage your agriculture distribution network
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: 'Employee Network',
                desc: 'Manage hierarchical employee structure with roles and permissions',
                features: ['Hierarchy management', 'Commission tracking', 'Performance analytics', 'Team collaboration']
              },
              {
                icon: Package,
                title: 'Stock Management',
                desc: 'Complete inventory control for wholesale and mini stock users',
                features: ['Real-time inventory', 'Stock transfers', 'Order tracking', 'Low stock alerts']
              },
              {
                icon: Sprout,
                title: 'Farmer Access',
                desc: 'Easy product access and order placement for farmers',
                features: ['Product catalog', 'Quick ordering', 'Order history', 'Advisor support']
              },
            ].map((feature, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-slate-100 hover:shadow-xl transition-all">
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon size={28} className="text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">{feature.title}</h3>
                <p className="text-slate-600 mb-6">{feature.desc}</p>
                <ul className="space-y-2">
                  {feature.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">Why Choose WANS?</h2>
              <p className="text-lg text-slate-600 mb-8">
                Built for the modern agriculture distribution network with transparency and efficiency at its core
              </p>

              <div className="space-y-6">
                {[
                  { icon: Zap, title: 'Real-Time Tracking', desc: 'Monitor inventory, orders, and commissions in real-time' },
                  { icon: Shield, title: 'Transparent System', desc: 'Complete visibility into the distribution chain' },
                  { icon: TrendingUp, title: 'Scalable Network', desc: 'Grow your network without limits' },
                  { icon: Users, title: 'Easy Collaboration', desc: 'Seamless communication between all stakeholders' },
                ].map((benefit, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <benefit.icon size={24} className="text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 mb-1">{benefit.title}</h3>
                      <p className="text-slate-600">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl p-12 text-white">
              <h3 className="text-3xl font-bold mb-6">Ready to Transform Your Network?</h3>
              <p className="text-green-100 mb-8 text-lg">
                Join hundreds of users already benefiting from our platform
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle size={24} className="text-green-200" />
                  <span className="text-lg">No setup fees</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={24} className="text-green-200" />
                  <span className="text-lg">24/7 support</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={24} className="text-green-200" />
                  <span className="text-lg">Easy onboarding</span>
                </div>
              </div>
              <button onClick={() => navigate('/register')} className="mt-8 w-full bg-white text-green-600 px-8 py-4 rounded-xl font-semibold hover:bg-green-50 transition-colors flex items-center justify-center gap-2">
                Get Started Now <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">
            Join the Network Today
          </h2>
          <p className="text-xl text-slate-600 mb-10">
            Start managing your agriculture distribution network with ease
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button onClick={() => navigate('/register')} className="btn-primary px-10 py-4 text-lg">
              Register Now <ArrowRight size={20} />
            </button>
            <button onClick={() => navigate('/login')} className="btn-secondary px-10 py-4 text-lg">
              Login
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                  <Sprout size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">WANS</h3>
                  <p className="text-xs text-slate-400">Warnamayii Agri Network</p>
                </div>
              </div>
              <p className="text-sm text-slate-400">
                Empowering agriculture distribution networks across the region
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#products" className="hover:text-white transition-colors">Products</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#benefits" className="hover:text-white transition-colors">Benefits</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Account</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><button onClick={() => navigate('/register')} className="hover:text-white transition-colors">Register</button></li>
                <li><button onClick={() => navigate('/login')} className="hover:text-white transition-colors">Login</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>Email: info@wans.com</li>
                <li>Phone: +91 1234567890</li>
                <li>Address: Agriculture Hub, India</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-400">
            <p>&copy; 2026 Warnamayii Agri Network System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
