import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventoryApi } from '../api/inventory.api';
import { ordersApi } from '../api/orders.api';
import { usersApi } from '../api/users.api';
import { farmersApi } from '../api/farmers.api';
import { useAuth } from '../contexts/AuthContext';
import {
  Search, Plus, Minus, Trash2, ShoppingCart, User, Phone,
  MapPin, Award, Check, X, CreditCard,
  Smartphone, Banknote, Package, Loader2
} from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import InvoiceModal from '../components/pos/InvoiceModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export default function POSSalePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const barcodeInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Products & Inventory
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Cart
  const [cart, setCart] = useState([]);

  // Farmer Details
  const [farmerName, setFarmerName] = useState('');
  const [farmerPhone, setFarmerPhone] = useState('');
  const [farmerLocation, setFarmerLocation] = useState('');

  // Advisor
  const [advisorCode, setAdvisorCode] = useState('');
  const [advisorValidated, setAdvisorValidated] = useState(false);
  const [advisorName, setAdvisorName] = useState('');
  const [advisorError, setAdvisorError] = useState('');
  const [advisorAutoAssigned, setAdvisorAutoAssigned] = useState(false);

  // Farmer lookup
  const [farmerLookupStatus, setFarmerLookupStatus] = useState('idle'); // idle | loading | found | new
  const [existingFarmer, setExistingFarmer] = useState(null);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [discount, setDiscount] = useState(0);
  // Tax is included in product prices (each product has its own taxRate)
  // Display default rate for reference only
  const taxRate = 18; // Default display rate

  // Invoice
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const inventoryRes = await inventoryApi.getMy();
        const inv = inventoryRes.data.data;
        const inventoryItems = inv?.items || [];
        
        const productsFromInventory = inventoryItems
          .filter(item => item.productId && item.current > 0)
          .map(item => ({
            ...item.productId,
            availableStock: item.current,
          }));
        
        setProducts(productsFromInventory);
        setInventory(inventoryItems);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        handleNewSale();
      } else if (e.key === 'F2') {
        e.preventDefault();
        handleCompleteSale();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClearCart();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [cart, farmerName, farmerPhone]);

  // Debounced farmer phone lookup
  useEffect(() => {
    const phone = farmerPhone.trim();
    if (phone.length < 10) {
      setFarmerLookupStatus('idle');
      setExistingFarmer(null);
      if (advisorAutoAssigned) {
        setAdvisorCode('');
        setAdvisorValidated(false);
        setAdvisorName('');
        setAdvisorAutoAssigned(false);
      }
      return;
    }

    const timer = setTimeout(async () => {
      setFarmerLookupStatus('loading');
      try {
        const res = await farmersApi.lookupByPhone(phone);
        const farmer = res.data.data;

        if (farmer) {
          setExistingFarmer(farmer);
          setFarmerLookupStatus('found');
          if (farmer.name && !farmerName) setFarmerName(farmer.name);
          if (farmer.village && !farmerLocation) setFarmerLocation(farmer.village);

          if (farmer.advisorId && farmer.advisorActive) {
            setAdvisorCode(farmer.advisorId.advisorCode || '');
            setAdvisorName(farmer.advisorId.name || '');
            setAdvisorValidated(true);
            setAdvisorAutoAssigned(true);
            setAdvisorError('');
          } else {
            setAdvisorAutoAssigned(false);
          }
        } else {
          setExistingFarmer(null);
          setFarmerLookupStatus('new');
          setAdvisorAutoAssigned(false);
        }
      } catch {
        setFarmerLookupStatus('idle');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [farmerPhone]);

  const validateAdvisor = async () => {
    if (!advisorCode.trim()) {
      setAdvisorError('');
      setAdvisorValidated(false);
      setAdvisorName('');
      return;
    }
    try {
      const res = await usersApi.validateAdvisorCode(advisorCode);
      if (res.data.success) {
        setAdvisorValidated(true);
        setAdvisorName(res.data.data.name);
        setAdvisorError('');
      }
    } catch (err) {
      setAdvisorValidated(false);
      setAdvisorName('');
      setAdvisorError(err.response?.data?.error || 'Invalid advisor code');
    }
  };

  const getAvailableStock = (productId) => {
    const product = products.find(p => p._id === productId);
    return product?.availableStock || 0;
  };

  const addToCart = (product) => {
    const availableStock = getAvailableStock(product._id);
    if (availableStock === 0) {
      alert(`${product.name} is out of stock`);
      return;
    }

    const existingItem = cart.find(item => item.productId === product._id);
    if (existingItem) {
      if (existingItem.quantity >= availableStock) {
        alert(`Maximum available stock: ${availableStock}`);
        return;
      }
      updateQuantity(product._id, existingItem.quantity + 1);
    } else {
      setCart([...cart, {
        productId: product._id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        quantity: 1,
        image: product.image,
      }]);
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    const availableStock = getAvailableStock(productId);
    if (newQuantity > availableStock) {
      alert(`Maximum available stock: ${availableStock}`);
      return;
    }
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCart(cart.map(item =>
      item.productId === productId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  // Prices are tax-inclusive, so we don't add tax again
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = (subtotal * discount) / 100;
  const taxAmount = 0; // Tax is already included in product prices
  const total = subtotal - discountAmount;

  const handleCompleteSale = async () => {
    if (!farmerName.trim() || !farmerPhone.trim()) {
      alert('Please enter farmer name and phone number');
      return;
    }
    if (cart.length === 0) {
      alert('Please add at least one product to cart');
      return;
    }

    setSubmitting(true);
    try {
      const res = await ordersApi.createPOSSale({
        farmerName,
        farmerPhone,
        farmerLocation,
        advisorCode: advisorValidated ? advisorCode : null,
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        paymentMethod,
        discount,
        // Tax is already included in product prices
      });

      setInvoiceData(res.data.data.invoice);
      setShowInvoice(true);

      const inventoryRes = await inventoryApi.getMy();
      const inv = inventoryRes.data.data;
      const inventoryItems = inv?.items || [];
      const productsFromInventory = inventoryItems
        .filter(item => item.productId && item.current > 0)
        .map(item => ({
          ...item.productId,
          availableStock: item.current,
        }));
      setProducts(productsFromInventory);
      setInventory(inventoryItems);

    } catch (err) {
      alert(err.response?.data?.error || 'Failed to complete sale');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewSale = async () => {
    setCart([]);
    setFarmerName('');
    setFarmerPhone('');
    setFarmerLocation('');
    setAdvisorCode('');
    setAdvisorValidated(false);
    setAdvisorName('');
    setAdvisorError('');
    setAdvisorAutoAssigned(false);
    setFarmerLookupStatus('idle');
    setExistingFarmer(null);
    setPaymentMethod('CASH');
    setDiscount(0);
    setShowInvoice(false);
    setInvoiceData(null);
  };

  const handleClearCart = () => {
    if (cart.length > 0 && confirm('Clear all items from cart?')) {
      setCart([]);
    }
  };

  const filteredProducts = products.filter(p => {
    const query = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(query) ||
           p.sku.toLowerCase().includes(query) ||
           (p.brand || '').toLowerCase().includes(query);
  });
  const productsWithStock = filteredProducts.filter(p => p.availableStock > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground page-enter">
      {/* Top Bar */}
      <div className="bg-card border-b px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
            <ShoppingCart size={20} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">POS System</h1>
            <p className="text-sm text-muted-foreground">{user?.name} · {user?.region}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/app/pos')}>History</Button>
          <Button onClick={handleNewSale}>New Sale (F1)</Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Section - Products & Details */}
        <div className="flex-1 flex flex-col overflow-hidden p-6 gap-4 bg-muted/20">
          
          <div className="grid grid-cols-2 gap-4 shrink-0">
            {/* Farmer Details */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <User size={16} className="text-primary" />
                  Customer Details
                </CardTitle>
                {farmerLookupStatus === 'loading' && <Badge variant="outline" className="text-muted-foreground"><Loader2 size={10} className="animate-spin mr-1"/>Looking up...</Badge>}
                {farmerLookupStatus === 'found' && <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/20">Returning</Badge>}
                {farmerLookupStatus === 'new' && <Badge variant="secondary" className="text-blue-600 bg-blue-50 hover:bg-blue-50 border-blue-200">New Customer</Badge>}
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="Phone Number * (enter to lookup)"
                    value={farmerPhone}
                    onChange={(e) => setFarmerPhone(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Full Name *"
                    value={farmerName}
                    onChange={(e) => setFarmerName(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Location (Optional)"
                    value={farmerLocation}
                    onChange={(e) => setFarmerLocation(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Advisor Code */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3 pt-4 px-4 flex flex-row items-center space-y-0">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Award size={16} className="text-amber-600" />
                  Advisor Attribution
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                {advisorAutoAssigned ? (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                        <Check size={14} />
                        {advisorName}
                      </div>
                      <Badge className="bg-primary/20 text-primary hover:bg-primary/20 border-none text-[10px] h-5">LINKED</Badge>
                    </div>
                    <p className="text-xs text-primary/70">Code: {advisorCode} · Auto-assigned</p>
                    <p className="text-[10px] text-muted-foreground">This customer is permanently linked. Commissions will route automatically.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Enter Advisor Code"
                        value={advisorCode}
                        onChange={(e) => {
                          setAdvisorCode(e.target.value.toUpperCase());
                          setAdvisorValidated(false);
                          setAdvisorError('');
                        }}
                        className="h-9"
                      />
                      <Button
                        onClick={validateAdvisor}
                        disabled={!advisorCode.trim()}
                        className="h-9 px-4 shrink-0"
                      >
                        Validate
                      </Button>
                    </div>
                    {advisorValidated && (
                      <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 px-3 py-2 rounded-lg">
                        <Check size={14} />
                        <span>Advisor: {advisorName}</span>
                      </div>
                    )}
                    {advisorError && (
                      <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                        <X size={14} />
                        <span>{advisorError}</span>
                      </div>
                    )}
                    {farmerLookupStatus === 'new' && !advisorValidated && (
                      <p className="text-xs text-amber-600/80">
                        💡 First purchase — advisor code will be permanently linked to this customer.
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Search Bar */}
          <div className="relative shrink-0">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={barcodeInputRef}
              type="text"
              placeholder="Search products by name, SKU, or scan barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 h-11 bg-card shadow-sm"
            />
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {productsWithStock.length === 0 ? (
              <Card className="h-full border-dashed flex flex-col items-center justify-center text-center shadow-none bg-transparent">
                <CardContent className="pt-6 pb-6">
                  <Package size={48} className="text-muted-foreground/50 mx-auto mb-4" />
                  <p className="font-semibold text-foreground mb-1">No products in stock</p>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                    Your inventory is empty. Please ask your Wholesale supplier to transfer stock to your account.
                  </p>
                  <Button onClick={() => navigate('/app/inventory')} variant="outline">
                    View Inventory
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                {productsWithStock.map(product => (
                  <Card
                    key={product._id}
                    className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all group overflow-hidden"
                    onClick={() => addToCart(product)}
                  >
                    <CardContent className="p-3">
                      <div className="aspect-square bg-muted/30 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <Package size={32} className="text-muted-foreground/30" />
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-foreground line-clamp-2 mb-1">{product.name}</h4>
                      <p className="text-xs text-muted-foreground mb-2">SKU: {product.sku}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-primary">{formatCurrency(product.price)}</span>
                        <Badge variant="secondary" className="font-normal text-[10px] px-1.5 py-0 h-5">Stock: {product.availableStock}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Section - Cart & Checkout */}
        <div className="w-[400px] bg-card border-l flex flex-col shadow-xl z-10 shrink-0">
          {/* Cart Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-foreground">Current Cart</h2>
              <Badge variant="secondary">{cart.length} items</Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono">TXN #{Date.now().toString().slice(-6)}</p>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingCart size={40} className="text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">Cart is empty</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Click products to add them</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.productId} className="bg-muted/30 rounded-xl p-3 border border-border/50 group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 pr-2">
                      <h4 className="text-sm font-semibold text-foreground leading-tight line-clamp-2">{item.name}</h4>
                      <p className="text-[10px] text-muted-foreground mt-1">{formatCurrency(item.price)} / unit</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromCart(item.productId)}
                      className="h-6 w-6 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 bg-background border rounded-lg p-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="h-6 w-6 rounded-md"
                      >
                        <Minus size={12} />
                      </Button>
                      <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="h-6 w-6 rounded-md"
                      >
                        <Plus size={12} />
                      </Button>
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals */}
          <div className="border-t bg-muted/10 p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <div className="flex items-center gap-2">
                  <div className="relative w-16">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={discount}
                      onChange={(e) => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                      className="h-7 px-2 pr-6 text-right text-xs"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                  </div>
                  <span className="font-medium text-destructive">-{formatCurrency(discountAmount)}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="text-sm text-green-600 font-medium">
                  Included in price
                </span>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-foreground">Total</span>
              <span className="text-2xl font-bold text-primary">{formatCurrency(total)}</span>
            </div>

            {/* Payment Method */}
            <div className="pt-1">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2 tracking-wider">Payment Method</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'CASH', icon: Banknote, label: 'Cash' },
                  { value: 'UPI', icon: Smartphone, label: 'UPI' },
                  { value: 'CARD', icon: CreditCard, label: 'Card' },
                ].map(method => (
                  <Button
                    key={method.value}
                    variant={paymentMethod === method.value ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod(method.value)}
                    className={`flex flex-col items-center gap-1 h-auto py-2.5 ${paymentMethod !== method.value && 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <method.icon size={16} />
                    <span className="text-[10px] font-medium">{method.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Complete Sale Button */}
            <Button
              onClick={handleCompleteSale}
              disabled={submitting || cart.length === 0 || !farmerName || !farmerPhone}
              className="w-full h-12 text-base shadow-lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check size={18} className="mr-2" />
                  Complete Sale (F2)
                </>
              )}
            </Button>

            {/* Keyboard Shortcuts */}
            <div className="text-[10px] text-muted-foreground/80 font-medium text-center uppercase tracking-wide">
              F1: New Sale <span className="mx-2 opacity-50">|</span> F2: Complete <span className="mx-2 opacity-50">|</span> Esc: Clear Cart
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoice && invoiceData && (
        <InvoiceModal
          invoice={invoiceData}
          onClose={() => {
            setShowInvoice(false);
            handleNewSale();
          }}
        />
      )}
    </div>
  );
}
