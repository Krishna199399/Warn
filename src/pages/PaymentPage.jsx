import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ArrowLeft, Wallet, Building2, Banknote, CheckCircle2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import OrderSummary from '../components/cart/OrderSummary';

const PAYMENT_METHODS = [
  {
    id: 'upi',
    name: 'UPI',
    icon: Wallet,
    description: 'Pay using UPI apps',
    color: 'green',
  },
  {
    id: 'card',
    name: 'Credit/Debit Card',
    icon: CreditCard,
    description: 'Visa, Mastercard, RuPay',
    color: 'blue',
  },
  {
    id: 'netbanking',
    name: 'Net Banking',
    icon: Building2,
    description: 'All major banks',
    color: 'violet',
  },
  {
    id: 'cod',
    name: 'Cash on Delivery',
    icon: Banknote,
    description: 'Pay when you receive',
    color: 'amber',
  },
];

export default function PaymentPage() {
  const navigate = useNavigate();
  const { cart } = useCart();
  const [selectedMethod, setSelectedMethod] = useState(null);

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/app/cart');
    }
  }, [cart, navigate]);

  const handleProceedToPay = () => {
    if (!selectedMethod) {
      alert('Please select a payment method');
      return;
    }
    navigate('/app/checkout', { state: { paymentMethod: selectedMethod } });
  };

  const getColorClasses = (color, isSelected) => {
    const colors = {
      green: isSelected 
        ? 'border-green-500 bg-green-50' 
        : 'border-slate-200 hover:border-green-300',
      blue: isSelected 
        ? 'border-blue-500 bg-blue-50' 
        : 'border-slate-200 hover:border-blue-300',
      violet: isSelected 
        ? 'border-violet-500 bg-violet-50' 
        : 'border-slate-200 hover:border-violet-300',
      amber: isSelected 
        ? 'border-amber-500 bg-amber-50' 
        : 'border-slate-200 hover:border-amber-300',
    };
    return colors[color];
  };

  const getIconColor = (color) => {
    const colors = {
      green: 'text-green-600',
      blue: 'text-blue-600',
      violet: 'text-violet-600',
      amber: 'text-amber-600',
    };
    return colors[color];
  };

  return (
    <div className="space-y-5 page-enter">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/app/cart')}
          className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft size={18} className="text-slate-600" />
        </button>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
              <CreditCard size={18} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payment Method</h1>
          </div>
          <p className="text-slate-600 text-sm pl-12">Choose your preferred payment method</p>
        </div>
      </div>

      {/* Payment Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Payment Methods */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Select Payment Method</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                const isSelected = selectedMethod === method.id;
                
                return (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`p-4 border-2 rounded-xl text-left transition-all duration-200 ${getColorClasses(method.color, isSelected)}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center ${getIconColor(method.color)}`}>
                        <Icon size={20} />
                      </div>
                      {isSelected && (
                        <CheckCircle2 size={20} className={getIconColor(method.color)} />
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">{method.name}</h3>
                    <p className="text-xs text-slate-600">{method.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Info */}
          <div className="card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Payment Information</h3>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-slate-400 mt-1.5" />
                <p>All transactions are secure and encrypted</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-slate-400 mt-1.5" />
                <p>Payment will be verified before order approval</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-slate-400 mt-1.5" />
                <p>Refunds will be processed within 5-7 business days</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-slate-400 mt-1.5" />
                <p>For payment issues, contact support</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-1">
          <OrderSummary
            cart={cart}
            showPromo={false}
            showActions={false}
          />
          
          {/* Proceed Button */}
          <button
            onClick={handleProceedToPay}
            disabled={!selectedMethod}
            className="w-full mt-4 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Proceed to Pay
          </button>
        </div>
      </div>
    </div>
  );
}
