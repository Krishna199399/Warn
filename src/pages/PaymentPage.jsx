import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ArrowLeft, Wallet, Building2, Banknote, CheckCircle2, User, Phone, Copy, Check, ChevronDown } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import OrderSummary from '../components/cart/OrderSummary';
import { manualPaymentsApi } from '../api/payments.api';
import { usersApi } from '../api/users.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const PAYMENT_METHODS = [
  {
    id: 'upi',
    name: 'UPI',
    icon: Wallet,
    description: 'Pay manually via UPI',
    color: 'green',
  },
  {
    id: 'cash',
    name: 'Cash',
    icon: Banknote,
    description: 'Pay in cash',
    color: 'amber',
  },
];

export default function PaymentPage() {
  const navigate = useNavigate();
  const { cart } = useCart();
  const { user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [wholesaleSellers, setWholesaleSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [loadingSellers, setLoadingSellers] = useState(true);
  const [copiedUPI, setCopiedUPI] = useState(false);

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/app/cart');
    }
  }, [cart, navigate]);

  // Fetch Wholesale sellers
  useEffect(() => {
    const fetchWholesaleSellers = async () => {
      if (user?.role !== 'MINI_STOCK') {
        setLoadingSellers(false);
        return;
      }

      try {
        // For Mini Stock, get all approved Wholesale sellers for selection
        const wholesaleRes = await usersApi.getWholesaleSellers();
        const sellers = wholesaleRes.data.data || [];
        
        setWholesaleSellers(sellers);
        
        // Auto-select first seller if only one available
        if (sellers.length === 1) {
          setSelectedSeller(sellers[0]);
        }
      } catch (error) {
        console.error('Failed to fetch wholesale sellers:', error);
        toast.error('Failed to load wholesale sellers');
      } finally {
        setLoadingSellers(false);
      }
    };

    fetchWholesaleSellers();
  }, [user]);

  const handleCopyUPI = () => {
    if (selectedSeller?.upiId) {
      navigator.clipboard.writeText(selectedSeller.upiId);
      setCopiedUPI(true);
      toast.success('UPI ID copied to clipboard');
      setTimeout(() => setCopiedUPI(false), 2000);
    }
  };

  const handleProceedToPay = () => {
    if (!selectedMethod) {
      toast.error('Please select a payment method');
      return;
    }

    // For Mini Stock, ensure a seller is selected
    if (user?.role === 'MINI_STOCK') {
      if (!selectedSeller) {
        toast.error('Please select a wholesale seller');
        return;
      }
      
      navigate('/app/checkout', { 
        state: { 
          paymentMethod: selectedMethod,
          sellerId: selectedSeller._id,
          sellerProfile: {
            _id: selectedSeller._id,
            name: selectedSeller.name,
            shopName: selectedSeller.shopName,
            phone: selectedSeller.phone,
            upiId: selectedSeller.upiId
          },
          isManualPayment: true
        } 
      });
    } else {
      navigate('/app/checkout', { state: { paymentMethod: selectedMethod } });
    }
  };

  const getColorClasses = (color, isSelected) => {
    const colors = {
      green: isSelected 
        ? 'border-emerald-500 bg-emerald-50' 
        : 'border-border hover:border-emerald-300',
      blue: isSelected 
        ? 'border-blue-500 bg-blue-50' 
        : 'border-border hover:border-blue-300',
      violet: isSelected 
        ? 'border-violet-500 bg-violet-50' 
        : 'border-border hover:border-violet-300',
      amber: isSelected 
        ? 'border-amber-500 bg-amber-50' 
        : 'border-border hover:border-amber-300',
    };
    return colors[color];
  };

  const getIconColor = (color) => {
    const colors = {
      green: 'text-emerald-600',
      blue: 'text-blue-600',
      violet: 'text-violet-600',
      amber: 'text-amber-600',
    };
    return colors[color];
  };

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/app/cart')}
          className="rounded-xl h-9 w-9 shrink-0"
        >
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment Method</h1>
          <p className="text-sm text-muted-foreground mt-1">Choose your preferred payment method</p>
        </div>
      </div>

      {/* Payment Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Payment Methods & Seller Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Seller Selection (Only for Mini Stock) */}
          {user?.role === 'MINI_STOCK' && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 size={20} className="text-primary" />
                  Select Wholesale Seller
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingSellers ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : wholesaleSellers.length > 0 ? (
                  <div className="space-y-4">
                    {/* Seller Selection Dropdown */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Choose Wholesale Seller
                      </label>
                      <Select 
                        value={selectedSeller?._id || ''} 
                        onValueChange={(sellerId) => {
                          const seller = wholesaleSellers.find(s => s._id === sellerId);
                          setSelectedSeller(seller);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a wholesale seller..." />
                        </SelectTrigger>
                        <SelectContent>
                          {wholesaleSellers.map((seller) => (
                            <SelectItem key={seller._id} value={seller._id}>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                  <Building2 size={14} className="text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {seller.shopName || seller.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {seller.phone} {seller.upiId ? '• UPI Available' : '• No UPI'}
                                  </p>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Selected Seller Details */}
                    {selectedSeller && (
                      <div className="space-y-3 p-4 bg-background rounded-lg border">
                        <h4 className="text-sm font-semibold text-foreground mb-3">Payment Details</h4>
                        
                        {/* Seller Name */}
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <User size={18} className="text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground mb-1">Seller Name</p>
                            <p className="font-semibold text-foreground">{selectedSeller.shopName || selectedSeller.name}</p>
                            {selectedSeller.shopName && (
                              <p className="text-sm text-muted-foreground">{selectedSeller.name}</p>
                            )}
                          </div>
                        </div>

                        {/* UPI ID */}
                        {selectedSeller.upiId ? (
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                              <Wallet size={18} className="text-emerald-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground mb-1">UPI ID</p>
                              <div className="flex items-center gap-2">
                                <p className="font-mono font-semibold text-foreground">{selectedSeller.upiId}</p>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={handleCopyUPI}
                                  className="h-7 w-7"
                                >
                                  {copiedUPI ? (
                                    <Check size={14} className="text-emerald-600" />
                                  ) : (
                                    <Copy size={14} />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm text-amber-800">
                              ⚠️ This seller has not configured UPI ID. Please contact them for payment details.
                            </p>
                          </div>
                        )}

                        {/* Phone */}
                        {selectedSeller.phone && (
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                              <Phone size={18} className="text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground mb-1">Contact Number</p>
                              <p className="font-semibold text-foreground">{selectedSeller.phone}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive mb-2">
                      <strong>No approved Wholesale sellers found.</strong>
                    </p>
                    <p className="text-xs text-destructive/80">
                      There are no approved Wholesale sellers in the system. Please contact your administrator to:
                    </p>
                    <ul className="text-xs text-destructive/80 mt-2 ml-4 space-y-1">
                      <li>• Ensure at least one Wholesale user is registered</li>
                      <li>• Approve the Wholesale user's account</li>
                      <li>• Configure their UPI ID in their profile</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Select Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  const isSelected = selectedMethod === method.id;
                  
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`p-4 border-2 rounded-xl text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${getColorClasses(method.color, isSelected)}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-10 h-10 rounded-xl bg-background border flex items-center justify-center shadow-sm ${getIconColor(method.color)}`}>
                          <Icon size={20} />
                        </div>
                        {isSelected && (
                          <CheckCircle2 size={22} className={getIconColor(method.color)} />
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">{method.name}</h3>
                      <p className="text-xs text-muted-foreground">{method.description}</p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Payment Information</h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 mt-1 shrink-0" />
                  <span>Pay manually to the seller using UPI or cash</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 mt-1 shrink-0" />
                  <span>Submit payment proof after completing payment</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 mt-1 shrink-0" />
                  <span>Seller will verify your payment before order approval</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 mt-1 shrink-0" />
                  <span>Order will be processed only after payment verification</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-1">
          <OrderSummary
            cart={cart}
            showPromo={false}
            showActions={false}
          />
          
          {/* Proceed Button */}
          <Button
            onClick={handleProceedToPay}
            disabled={!selectedMethod || (user?.role === 'MINI_STOCK' && !selectedSeller)}
            className="w-full h-11 mt-4 text-base shadow-md"
          >
            Proceed to Pay
          </Button>
        </div>
      </div>
    </div>
  );
}
