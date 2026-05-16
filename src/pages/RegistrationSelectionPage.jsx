import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Store, Users, ArrowRight, ShoppingBag, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function RegistrationSelectionPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden page-enter bg-gradient-to-br from-amber-50 via-stone-100 to-orange-50">
      {/* Blur circles */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-amber-200/40 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-200/40 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-stone-200/30 rounded-full blur-3xl" />

      <div className="relative w-full max-w-5xl py-8">
        {/* Back to Home Link */}
        <div className="absolute -top-4 left-0">
          <Link 
            to="/" 
            className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-amber-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-3">
            <img 
              src="/logo-full-tagline.png" 
              srcSet="/logo-full-tagline@2x.png 2x"
              alt="Warnamayii Krishi Resources" 
              className="h-24 w-auto object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-stone-800 mb-2">Create Your Account</h1>
          <p className="text-stone-600">Choose the type of account you want to create</p>
        </div>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* LEFT: User & Shop Registration */}
          <Card className="shadow-xl shadow-amber-900/10 border-amber-200/50 backdrop-blur-sm bg-white/90 hover:shadow-2xl hover:shadow-amber-900/20 transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Store className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">User & Shop</CardTitle>
              <CardDescription className="text-base">
                For customers and shop owners
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Account Types */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <ShoppingBag className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-sm text-stone-800">Customer</h3>
                    <p className="text-xs text-stone-600">Browse and purchase products</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <Store className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-sm text-stone-800">Wholesale Shop</h3>
                    <p className="text-xs text-stone-600">Bulk ordering and inventory management</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <Store className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-sm text-stone-800">Mini Stock Shop</h3>
                    <p className="text-xs text-stone-600">POS sales and retail operations</p>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="pt-2 space-y-2">
                <p className="text-xs text-stone-600 font-semibold">What you get:</p>
                <ul className="space-y-1.5 text-xs text-stone-600">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                    Browse product catalog
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                    Place orders online
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                    Track order history
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                    Manage inventory (shops)
                  </li>
                </ul>
              </div>

              {/* Info Box */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800">
                  ℹ️ Shop registrations require admin approval
                </p>
              </div>

              {/* Button */}
              <Button
                onClick={() => navigate('/register')}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              >
                Register as User/Shop
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </CardContent>
          </Card>

          {/* RIGHT: Employee Registration */}
          <Card className="shadow-xl shadow-blue-900/10 border-blue-200/50 backdrop-blur-sm bg-white/90 hover:shadow-2xl hover:shadow-blue-900/20 transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Employee</CardTitle>
              <CardDescription className="text-base">
                For company employees and field staff
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Employee Roles */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <Users className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-sm text-stone-800">Executive Manager</h3>
                    <p className="text-xs text-stone-600">Manages entire state operations</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <Users className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-sm text-stone-800">Managers</h3>
                    <p className="text-xs text-stone-600">Zonal, Regional, and Development Officers</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <Users className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-sm text-stone-800">Promotion Representative</h3>
                    <p className="text-xs text-stone-600">Direct customer engagement</p>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="pt-2 space-y-2">
                <p className="text-xs text-stone-600 font-semibold">What you get:</p>
                <ul className="space-y-1.5 text-xs text-stone-600">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    Unique employee code
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    Commission & salary tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    Performance rewards (STAR)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    Team management dashboard
                  </li>
                </ul>
              </div>

              {/* Info Box */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  ℹ️ Employee registrations require admin approval and parent assignment
                </p>
              </div>

              {/* Button */}
              <Button
                onClick={() => navigate('/employee-register')}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              >
                Register as Employee
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </CardContent>
          </Card>

        </div>

        {/* Login Link */}
        <p className="text-center text-sm text-stone-600 mt-8">
          Already have an account?{' '}
          <Link to="/login" className="text-amber-700 hover:underline font-semibold transition-colors">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
