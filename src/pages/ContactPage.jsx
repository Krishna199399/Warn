import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Clock, Send, Menu, X, Leaf } from 'lucide-react';

export default function ContactPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    }, 3000);
  };

  const contactInfo = [
    {
      icon: Phone,
      title: "Phone",
      details: ["+91 98765 43210", "+91 98765 43211"],
      description: "Mon-Sat, 9AM-6PM"
    },
    {
      icon: Mail,
      title: "Email",
      details: ["support@warnamayii.com", "sales@warnamayii.com"],
      description: "We'll respond within 24 hours"
    },
    {
      icon: MapPin,
      title: "Office",
      details: ["123 Agricultural Hub", "Bangalore, Karnataka 560001"],
      description: "Visit us during business hours"
    },
    {
      icon: Clock,
      title: "Business Hours",
      details: ["Monday - Saturday", "9:00 AM - 6:00 PM"],
      description: "Closed on Sundays"
    }
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
            <Link to="/about" className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">About</Link>
            <Link to="/contact" className="rounded-full px-4 py-2 text-sm font-medium bg-green-50 text-green-700">Contact</Link>
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
              <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-slate-100">About</Link>
              <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium bg-green-50 text-green-700">Contact</Link>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-amber-100/40 via-stone-100/30 to-orange-100/40 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-green-600">Get in Touch</p>
          <h1 className="mt-3 font-display text-5xl sm:text-6xl font-semibold leading-[1.05] tracking-tight">
            We'd love to<br/><span className="text-green-600 italic">hear from you.</span>
          </h1>
          <p className="mt-6 text-slate-600 text-lg leading-relaxed max-w-2xl mx-auto">
            Have questions about our products? Need help with an order? Our team is here to assist you with all your agricultural needs.
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {contactInfo.map((info, index) => (
            <div key={index} className="rounded-3xl border border-slate-100 bg-white p-6 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-600 mb-4">
                <info.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">{info.title}</h3>
              {info.details.map((detail, i) => (
                <p key={i} className="text-sm text-slate-900 font-medium">{detail}</p>
              ))}
              <p className="text-xs text-slate-500 mt-2">{info.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Form */}
          <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-soft">
            <h2 className="font-display text-3xl font-semibold mb-2">Send us a message</h2>
            <p className="text-slate-600 mb-8">Fill out the form below and we'll get back to you as soon as possible.</p>

            {submitted && (
              <div className="mb-6 rounded-2xl bg-green-50 border border-green-200 p-4 text-green-700 text-sm">
                ✓ Thank you! Your message has been sent successfully. We'll get back to you soon.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  placeholder="How can we help you?"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="6"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 resize-none"
                  placeholder="Tell us more about your inquiry..."
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-green-700 text-white px-8 py-4 text-base font-semibold hover:bg-green-800 transition-colors inline-flex items-center justify-center gap-2"
              >
                Send Message <Send className="h-5 w-5" />
              </button>
            </form>
          </div>

          {/* Right Column - Map & Additional Info */}
          <div className="space-y-6">
            {/* Map Placeholder */}
            <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-soft">
              <div className="aspect-[4/3] bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                <div className="text-center p-8">
                  <MapPin className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <p className="font-display text-xl font-semibold text-slate-900">Visit Our Office</p>
                  <p className="text-sm text-slate-600 mt-2">123 Agricultural Hub<br/>Bangalore, Karnataka 560001</p>
                </div>
              </div>
            </div>

            {/* FAQ Quick Links */}
            <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-soft">
              <h3 className="font-display text-xl font-semibold mb-4">Quick Help</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#" className="text-slate-600 hover:text-green-600 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-600"></span>
                    How to place an order?
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-600 hover:text-green-600 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-600"></span>
                    Shipping & delivery information
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-600 hover:text-green-600 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-600"></span>
                    Return & refund policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-600 hover:text-green-600 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-600"></span>
                    Product quality guarantee
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-600 hover:text-green-600 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-600"></span>
                    Bulk order inquiries
                  </a>
                </li>
              </ul>
            </div>
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
                <li><a href="#" className="hover:text-green-600">Shipping Info</a></li>
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
