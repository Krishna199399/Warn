import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsApi } from '../api/products.api';
import { inventoryApi } from '../api/inventory.api';
import { ordersApi } from '../api/orders.api';
import { usersApi } from '../api/users.api';
import { useAuth } from '../contexts/AuthContext';
import {
  Search, Plus, Minus, Trash2, ShoppingCart, User, Phone,
  MapPin, Award, Check, X, Printer, Download, CreditCard,
  Smartphone, Banknote, Package, AlertCircle, Barcode
} from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import InvoiceModal from '../components/pos/InvoiceModal';

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

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [discount, setDiscount] = useState(0);

  // Invoice
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);

  // Load inventory (which includes product details)
  useEffect(() => {
    const load = async () => {
      try {
        const inventoryRes = await inventoryApi.getMy();
        const inv = inventoryRes.data.data;
        const inventoryItems = inv?.items || [];
        
        console.log('📦 Inventory loaded:', {
          totalItems: inventoryItems.length,
          itemsWithStock: inventoryItems.filter(item => item.current > 0).length,
          items: inventoryItems.map(item => ({
            name: item.productId?.name,
            current: item.current,
            received: item.received,
            dispatched: item.dispatched
          }))
        });
        
        // Extract products from inventory items
        const productsFromInventory = inventoryItems
          .filter(item => item.productId && item.current > 0)
          .map(item => ({
            ...item.productId,
            availableStock: item.current, // Use 'current' instead of 'quantity'
          }));
        
        console.log('✅ Products available for POS:', productsFromInventory.length);
        
        setProducts(productsFromInventory);
        setInventory(inventoryItems);
      } catch (err) {
        console.error('❌ Failed to load data:', err);
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

  // Validate advisor code
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

  // Get available stock for product (products already have availableStock from inventory)
  const getAvailableStock = (productId) => {
    const product = products.find(p => p._id === productId);
    return product?.availableStock || 0;
  };

  // Add to cart
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

  // Update quantity
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

  // Remove from cart
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = (subtotal * discount) / 100;
  const tax = 0; // Add tax calculation if needed
  const total = subtotal - discountAmount + tax;

  // Handle complete sale
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
      });

      setInvoiceData(res.data.data.invoice);
      setShowInvoice(true);

      // Reload inventory and update products
      const inventoryRes = await inventoryApi.getMy();
      const inv = inventoryRes.data.data;
      const inventoryItems = inv?.items || [];
      
      // Update products with new stock levels
      const productsFromInventory = inventoryItems
        .filter(item => item.productId && item.current > 0)
        .map(item => ({
          ...item.productId,
          availableStock: item.current, // Use 'current' instead of 'quantity'
        }));
      
      setProducts(productsFromInventory);
      setInventory(inventoryItems);

    } catch (err) {
      alert(err.response?.data?.error || 'Failed to complete sale');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle new sale
  const handleNewSale = () => {
    setCart([]);
    setFarmerName('');
    setFarmerPhone('');
    setFarmerLocation('');
    setAdvisorCode('');
    setAdvisorValidated(false);
    setAdvisorName('');
    setPaymentMethod('CASH');
    setDiscount(0);
    setShowInvoice(false);
    setInvoiceData(null);
  };

  // Handle clear cart
  const handleClearCart = () => {
    if (cart.length > 0 && confirm('Clear all items from cart?')) {
      setCart([]);
    }
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const query = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(query) ||
           p.sku.toLowerCase().includes(query) ||
           (p.brand || '').toLowerCase().includes(query);
  });

  // Products already have stock info from inventory
  const productsWithStock = filteredProducts.filter(p => p.availableStock > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center">
              <ShoppingCart size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">POS - Point of Sale</h1>
              <p className="text-sm text-slate-500">{user?.name} · {user?.region}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewSale}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              New Sale (F1)
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Section - Products */}
        <div className="flex-1 flex flex-col overflow-hidden p-6">
          {/* Farmer & Advisor Details */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Farmer Details */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <User size={16} className="text-green-600" />
                Farmer Details
              </h3>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Farmer Name *"
                  value={farmerName}
                  onChange={(e) => setFarmerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
                <input
                  type="tel"
                  placeholder="Phone Number *"
                  value={farmerPhone}
                  onChange={(e) => setFarmerPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
                <input
                  type="text"
                  placeholder="Location (optional)"
                  value={farmerLocation}
                  onChange={(e) => setFarmerLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
              </div>
            </div>

            {/* Advisor Code */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Award size={16} className="text-amber-600" />
                Advisor Attribution
              </h3>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Advisor Code"
                    value={advisorCode}
                    onChange={(e) => {
                      setAdvisorCode(e.target.value.toUpperCase());
                      setAdvisorValidated(false);
                      setAdvisorError('');
                    }}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  />
                  <button
                    onClick={validateAdvisor}
                    disabled={!advisorCode.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Validate
                  </button>
                </div>
                {advisorValidated && (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                    <Check size={14} />
                    <span>Advisor: {advisorName}</span>
                  </div>
                )}
                {advisorError && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    <X size={14} />
                    <span>{advisorError}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Search products by name, SKU, or scan barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
              />
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto">
            {productsWithStock.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <Package size={48} className="text-slate-300 mb-3" />
                <p className="text-slate-600 font-semibold mb-2">No products in stock</p>
                <p className="text-sm text-slate-500 mb-4">
                  Your inventory is empty. Please ask your Wholesale supplier to transfer stock to your Mini Stock account.
                </p>
                <button
                  onClick={() => navigate('/inventory')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  View Inventory
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {productsWithStock.map(product => (
                  <div
                    key={product._id}
                    className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => addToCart(product)}
                  >
                    <div className="aspect-square bg-slate-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={32} className="text-slate-300" />
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-1 line-clamp-2">{product.name}</h4>
                    <p className="text-xs text-slate-500 mb-2">SKU: {product.sku}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-green-600">{formatCurrency(product.price)}</span>
                      <span className="text-xs text-slate-500">Stock: {product.availableStock}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Section - Cart & Checkout */}
        <div className="w-96 bg-white border-l border-slate-200 flex flex-col">
          {/* Cart Header */}
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-slate-900">Current Cart</h2>
              <span className="text-sm text-slate-500">{cart.length} items</span>
            </div>
            <p className="text-xs text-slate-500">Transaction #{Date.now().toString().slice(-6)}</p>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingCart size={48} className="text-slate-300 mb-3" />
                <p className="text-slate-500 text-sm">Cart is empty</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.productId} className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-slate-900">{item.name}</h4>
                      <p className="text-xs text-slate-500">{formatCurrency(item.price)} per unit</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-semibold w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals */}
          <div className="border-t border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            
            {/* Discount */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Discount</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                  className="w-16 px-2 py-1 border border-slate-200 rounded text-right text-sm"
                />
                <span>%</span>
                <span className="font-semibold text-red-600">-{formatCurrency(discountAmount)}</span>
              </div>
            </div>

            {tax > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Tax</span>
                <span className="font-semibold">{formatCurrency(tax)}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-lg pt-3 border-t border-slate-200">
              <span className="font-bold text-slate-900">Total</span>
              <span className="font-bold text-green-600">{formatCurrency(total)}</span>
            </div>

            {/* Payment Method */}
            <div>
              <p className="text-xs text-slate-600 mb-2">Payment Method</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'CASH', icon: Banknote, label: 'Cash' },
                  { value: 'UPI', icon: Smartphone, label: 'UPI' },
                  { value: 'CARD', icon: CreditCard, label: 'Card' },
                ].map(method => (
                  <button
                    key={method.value}
                    onClick={() => setPaymentMethod(method.value)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors ${
                      paymentMethod === method.value
                        ? 'border-green-600 bg-green-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <method.icon size={18} className={paymentMethod === method.value ? 'text-green-600' : 'text-slate-400'} />
                    <span className={`text-xs font-medium ${paymentMethod === method.value ? 'text-green-600' : 'text-slate-600'}`}>
                      {method.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Complete Sale Button */}
            <button
              onClick={handleCompleteSale}
              disabled={submitting || cart.length === 0 || !farmerName || !farmerPhone}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check size={18} />
                  Complete Sale (F2)
                </>
              )}
            </button>

            {/* Keyboard Shortcuts */}
            <div className="text-xs text-slate-400 text-center pt-2 border-t border-slate-100">
              F1: New Sale | F2: Complete | Esc: Clear Cart
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
