import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Store, Users, ArrowRight, ShoppingBag, Briefcase, 
  ShieldCheck, MapPin, Sparkles, CheckCircle2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RegistrationSelectionPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-stone-50" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-green-200/35 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-200/30 rounded-full blur-[120px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-amber-100/20 rounded-full blur-[100px]" />

      <div className="relative w-full max-w-6xl py-6 z-10">
        
        {/* Navigation & Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-full flex justify-between items-center max-w-5xl mb-8">
            <Link 
              to="/" 
              className="group inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-green-700 transition-colors duration-300"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="group-hover:-translate-x-1 transition-transform"
              >
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to Home
            </Link>
          </div>

          {/* Brand Logo & Portal Title */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center bg-white/70 backdrop-blur-md border border-stone-200/60 p-4 rounded-3xl shadow-md mb-6 hover:scale-[1.02] transition-transform duration-300">
              <img 
                src="/logo-full-tagline.png" 
                srcSet="/logo-full-tagline@2x.png 2x"
                alt="Warnamayii Krishi Resources" 
                className="h-20 w-auto object-contain"
              />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-stone-800 sm:text-5xl">
              Registration Portal
            </h1>
            <p className="text-stone-600 mt-3 text-base sm:text-lg max-w-lg mx-auto font-medium">
              Select the account structure that aligns with your role in our growing network.
            </p>
          </div>
        </div>

        {/* Dual Portal Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          
          {/* Card: Grower & Partner Network */}
          <div className="flex flex-col justify-between rounded-3xl border border-white/50 backdrop-blur-xl bg-white/75 p-6 lg:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(22,163,74,0.08)] hover:border-green-200/50 hover:-translate-y-1 transition-all duration-300">
            <div>
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20 text-white shrink-0">
                  <Store className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-green-600">Grower & Partner</span>
                  <h2 className="text-2xl font-bold text-stone-800">User & Shop</h2>
                </div>
              </div>

              <p className="text-sm text-stone-500 mb-6 font-medium">
                For retail customers, farming consultants, local store owners, and bulk distributors.
              </p>

              {/* Sub-profiles list */}
              <div className="space-y-3 mb-6">
                <div className="group/item flex items-start gap-4 p-4 bg-white/40 hover:bg-green-50/50 border border-stone-200/40 hover:border-green-300/40 rounded-2xl transition-all duration-300">
                  <div className="mt-1 p-2 bg-green-50 rounded-xl text-green-600 group-hover/item:bg-green-600 group-hover/item:text-white transition-all duration-300">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-stone-800">Customer / Farmer</h3>
                    <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">Browse organic essentials, buy products, and track personal orders.</p>
                  </div>
                </div>

                <div className="group/item flex items-start gap-4 p-4 bg-white/40 hover:bg-green-50/50 border border-stone-200/40 hover:border-green-300/40 rounded-2xl transition-all duration-300">
                  <div className="mt-1 p-2 bg-green-50 rounded-xl text-green-600 group-hover/item:bg-green-600 group-hover/item:text-white transition-all duration-300">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-stone-800">Wholesale Shop</h3>
                    <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">Get special B2B pricing, make bulk purchases, and manage inventory.</p>
                  </div>
                </div>

                <div className="group/item flex items-start gap-4 p-4 bg-white/40 hover:bg-green-50/50 border border-stone-200/40 hover:border-green-300/40 rounded-2xl transition-all duration-300">
                  <div className="mt-1 p-2 bg-green-50 rounded-xl text-green-600 group-hover/item:bg-green-600 group-hover/item:text-white transition-all duration-300">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-stone-800">Mini Stock Shop</h3>
                    <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">Handle POS transactions, fast product releases, and retail operations.</p>
                  </div>
                </div>
              </div>

              {/* What you get */}
              <div className="border-t border-stone-200/40 pt-4 mb-6">
                <h4 className="text-xs font-bold text-stone-600 uppercase tracking-wider mb-3">Core Portal Benefits:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-stone-600 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    Premium crop catalog
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    Digital invoice system
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    Advanced tracking
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    Retail inventory tools
                  </div>
                </div>
              </div>
            </div>

            <div>
              {/* Approval Info */}
              <div className="mb-5 p-3.5 bg-green-50/60 border border-green-100 rounded-2xl flex items-center gap-2.5 text-xs text-green-800 font-medium">
                <Sparkles className="w-4 h-4 text-green-600 shrink-0" />
                <span>Shop registrations require admin credentials validation.</span>
              </div>

              {/* Primary button */}
              <Button
                onClick={() => navigate('/register')}
                className="w-full h-12 text-sm font-bold bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-lg hover:shadow-green-600/20 border-none transition-all duration-300 flex items-center justify-center gap-2"
              >
                Register as User/Shop
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Card: Corporate & Field Operations */}
          <div className="flex flex-col justify-between rounded-3xl border border-white/50 backdrop-blur-xl bg-white/75 p-6 lg:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(37,99,235,0.08)] hover:border-blue-200/50 hover:-translate-y-1 transition-all duration-300">
            <div>
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 text-white shrink-0">
                  <Briefcase className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Company Operations</span>
                  <h2 className="text-2xl font-bold text-stone-800">Employee</h2>
                </div>
              </div>

              <p className="text-sm text-stone-500 mb-6 font-medium">
                For administrative staff, zonal directors, regional coordinators, and marketing experts.
              </p>

              {/* Sub-profiles list */}
              <div className="space-y-3 mb-6">
                <div className="group/item flex items-start gap-4 p-4 bg-white/40 hover:bg-blue-50/50 border border-stone-200/40 hover:border-blue-300/40 rounded-2xl transition-all duration-300">
                  <div className="mt-1 p-2 bg-blue-50 rounded-xl text-blue-600 group-hover/item:bg-blue-600 group-hover/item:text-white transition-all duration-300">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-stone-800">Executive Manager</h3>
                    <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">Oversee operations, approve user requests, and manage full state statistics.</p>
                  </div>
                </div>

                <div className="group/item flex items-start gap-4 p-4 bg-white/40 hover:bg-blue-50/50 border border-stone-200/40 hover:border-blue-300/40 rounded-2xl transition-all duration-300">
                  <div className="mt-1 p-2 bg-blue-50 rounded-xl text-blue-600 group-hover/item:bg-blue-600 group-hover/item:text-white transition-all duration-300">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-stone-800">Regional Managers</h3>
                    <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">Direct regional hubs, support local offices, and manage performance data.</p>
                  </div>
                </div>

                <div className="group/item flex items-start gap-4 p-4 bg-white/40 hover:bg-blue-50/50 border border-stone-200/40 hover:border-blue-300/40 rounded-2xl transition-all duration-300">
                  <div className="mt-1 p-2 bg-blue-50 rounded-xl text-blue-600 group-hover/item:bg-blue-600 group-hover/item:text-white transition-all duration-300">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-stone-800">Promotion Representative</h3>
                    <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">Conduct field trials, onboarding activities, and direct crop counseling.</p>
                  </div>
                </div>
              </div>

              {/* What you get */}
              <div className="border-t border-stone-200/40 pt-4 mb-6">
                <h4 className="text-xs font-bold text-stone-600 uppercase tracking-wider mb-3">Core Portal Benefits:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-stone-600 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                    Official employee code
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                    Commission ledger
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                    Team visit tracker
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                    STAR performance bonuses
                  </div>
                </div>
              </div>
            </div>

            <div>
              {/* Approval Info */}
              <div className="mb-5 p-3.5 bg-blue-50/60 border border-blue-100 rounded-2xl flex items-center gap-2.5 text-xs text-blue-800 font-medium">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Requires state head activation and reporting manager mapping.</span>
              </div>

              {/* Primary button */}
              <Button
                onClick={() => navigate('/employee-register')}
                className="w-full h-12 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg hover:shadow-blue-600/20 border-none transition-all duration-300 flex items-center justify-center gap-2"
              >
                Register as Employee
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

        </div>

        {/* Login redirect wrapper */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/60 border border-stone-200/50 shadow-sm text-sm text-stone-600 backdrop-blur-md">
            Already have a registered account?{' '}
            <Link to="/login" className="text-green-700 hover:text-green-800 font-bold underline transition-colors duration-300 ml-1">
              Login here
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
