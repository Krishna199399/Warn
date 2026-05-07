import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, Heart, Globe, Users, Menu, X } from 'lucide-react';

// Hero image from public folder
const heroFarmImg = '/hero-farm.jpg';

export default function AboutPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const values = [
    { icon: Leaf, title: "Regenerative", desc: "We partner only with farms practicing regenerative, soil-positive agriculture." },
    { icon: Heart, title: "People First", desc: "Fair prices for farmers, transparent sourcing, honest products for our customers." },
    { icon: Globe, title: "Climate Positive", desc: "Carbon-neutral shipping and 1% of revenue goes to reforestation efforts." },
    { icon: Users, title: "Community", desc: "12,000+ growers exchanging knowledge, tips and stories on our platform." },
  ];

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
            <Link to="/products" className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">Products</Link>
            <Link to="/about" className="rounded-full px-4 py-2 text-sm font-medium bg-emerald-100 text-emerald-800">About</Link>
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
              <Link to="/products" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-slate-100">Products</Link>
              <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium bg-emerald-100 text-emerald-800">About</Link>
              <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-slate-100">Contact</Link>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-amber-100/40 via-stone-100/30 to-orange-100/40 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Our Story</p>
            <h1 className="mt-3 font-display text-5xl sm:text-6xl font-semibold leading-[1.05] tracking-tight">
              Growing a kinder<br/><span className="text-emerald-700 italic">food system.</span>
            </h1>
            <p className="mt-6 text-slate-600 text-lg leading-relaxed max-w-lg">
              Warnamayii began in January 2025 with a single idea: that the way we grow food should heal the planet, not harm it. Today we connect 50+ regenerative farms with growers in every corner of the country.
            </p>
            <div className="mt-8 flex gap-3">
              <button onClick={() => navigate('/app/products')} className="btn-primary px-8 py-3 text-base">
                Shop Our Mission
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-[2.5rem] shadow-glow">
              <img src={heroFarmImg} alt="Organic farm" loading="lazy" className="aspect-[4/5] w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">What we believe</p>
          <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight">Values that root us</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => (
            <div key={v.title} className="rounded-3xl border border-slate-100 bg-white p-6 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 mb-4">
                <v.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-semibold">{v.title}</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
        <div className="rounded-[2.5rem] bg-gradient-to-br from-emerald-700 to-teal-700 p-10 sm:p-16 text-white text-center shadow-glow">
          <div className="grid gap-8 sm:grid-cols-3 max-w-3xl mx-auto">
            {[
              { v: "200+", l: "Partner farms" },
              { v: "12K+", l: "Growers served" },
              { v: "1M+", l: "Trees planted" },
            ].map((s) => (
              <div key={s.l}>
                <p className="font-display text-5xl font-semibold">{s.v}</p>
                <p className="text-sm text-white/80 mt-2">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
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
                <li><Link to="/products" className="hover:text-emerald-700">All Products</Link></li>
                <li><Link to="/categories" className="hover:text-emerald-700">Categories</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Resources</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><Link to="/about" className="hover:text-emerald-700">About Us</Link></li>
                <li><a href="#" className="hover:text-emerald-700">Help Center</a></li>
                <li><a href="#" className="hover:text-emerald-700">Shipping Info</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Newsletter</h4>
              <p className="text-sm text-slate-600 mb-4">Get growing tips & 10% off your first order.</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="you@email.com"
                  className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-emerald-600"
                />
                <button className="btn-primary text-sm">Join</button>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Warnamayii Agri Network System. All rights reserved.</p>
            <div className="flex gap-5">
              <a href="#" className="hover:text-emerald-700">Privacy</a>
              <a href="#" className="hover:text-emerald-700">Terms</a>
              <a href="#" className="hover:text-emerald-700">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
