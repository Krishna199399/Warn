import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsApi } from '../api/products.api';
import { useAuth, ROLES } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { formatCurrency } from '../utils/helpers';
import {
  ArrowLeft, Package, Edit2, ShoppingCart, Lock, Tag, Box, Hash, Layers,
  ChevronDown, ChevronUp, Leaf, Droplets, Award, Pill, AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PriceDisplay } from '@/components/ui/price-display';

const CATEGORY_STYLE = {
  Seeds:      'bg-green-50 text-green-700 border-green-200',
  Fertilizer: 'bg-blue-50 text-blue-700 border-blue-200',
  Pesticide:  'bg-red-50 text-red-700 border-red-200',
  Equipment:  'bg-amber-50 text-amber-700 border-amber-200',
  Supplement: 'bg-purple-50 text-purple-700 border-purple-200',
};

// ─── Expandable Info Section Component ───────────────────────────────────────
function ExpandableSection({ title, content, icon: Icon, isOpen, onToggle }) {
  if (!content || content.trim() === '') return null;
  
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon size={18} className="text-slate-600" />}
          <span className="font-semibold text-slate-800">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp size={20} className="text-slate-400" />
        ) : (
          <ChevronDown size={20} className="text-slate-400" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-100">
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {content}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pricing Breakdown Table (Admin Only) ────────────────────────────────────
function PricingBreakdownTable({ product }) {
  // Tax rate from product (default 18% if not set)
  const taxRate = product.taxRate || 18;

  // actualPrice = MRP (package-printed price, tax-inclusive)
  // mrp in schema = sell price (what customers actually pay)
  const actualPriceValue = product.actualPrice || 0;
  const sellPriceValue   = product.mrp || 0;

  // Tax amount derived from MRP
  const mrpBase = actualPriceValue > 0 ? actualPriceValue / (1 + taxRate / 100) : 0;
  const mrpTax  = actualPriceValue > 0 ? actualPriceValue - mrpBase : 0;

  const pricingItems = [
    { key: 'taxAmount',           label: `Tax (${taxRate}%)`,         value: mrpTax,                   secondary: true },
    { key: 'actualPrice',         label: 'MRP (incl. tax)',           value: product.actualPrice,      highlight: true },
    { key: 'sellPrice',           label: 'Sell Price',                value: sellPriceValue },
    { key: 'wholesaleCommission', label: 'Wholesale Commission',      value: product.wholesaleCommission },
    { key: 'miniStockCommission', label: 'Mini Stock Commission',     value: product.miniStockCommission },
    { key: 'rp',                  label: 'RP (Retail Point)',         value: product.rp },
    { key: 'sv',                  label: 'SV (Salary Value)',         value: product.sv },
    { key: 'rv',                  label: 'RV (Rewards Value)',        value: product.rv },
    { key: 'iv',                  label: 'IV (Incentive Value)',      value: product.iv },
  ];

  return (
    <div className="space-y-2">
      {pricingItems.map(({ key, label, value, highlight, secondary }) => (
        <div 
          key={key} 
          className={`flex items-center justify-between py-2.5 px-3 rounded-lg border ${
            highlight 
              ? 'bg-green-50 border-green-200' 
              : secondary
              ? 'bg-slate-50 border-slate-200'
              : 'bg-white border-amber-100'
          }`}
        >
          <span className={`text-sm ${
            highlight 
              ? 'text-green-800 font-medium' 
              : secondary 
              ? 'text-slate-600' 
              : 'text-slate-700'
          }`}>
            {label}
          </span>
          <span className={`text-base font-bold ${
            highlight 
              ? 'text-green-700' 
              : secondary 
              ? 'text-slate-700' 
              : 'text-slate-900'
          }`}>
            {value ? formatCurrency(value) : <span className="text-slate-400 text-sm font-normal">Not set</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const isAdmin = user?.role === ROLES.ADMIN;
  const canOrder = user?.role === ROLES.WHOLESALE || user?.role === ROLES.MINI_STOCK;
  const isLoggedIn = !!user;
  const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openSection, setOpenSection] = useState(null); // Track which section is open

  useEffect(() => {
    productsApi.getOne(id)
      .then(res => setProduct(res.data.data))
      .catch(err => {
        console.error(err);
        setError(err.response?.data?.error || 'Failed to load product');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, 1);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate(isLoggedIn ? '/app/products' : '/')} className="gap-2">
          <ArrowLeft size={16} /> Back to {isLoggedIn ? 'Products' : 'Home'}
        </Button>
        <Card>
          <CardContent className="p-12 text-center">
            <Package size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="text-lg font-semibold mb-2">Product Not Found</h3>
            <p className="text-sm text-muted-foreground mb-4">{error || 'The product you are looking for does not exist.'}</p>
            <Button onClick={() => navigate(isLoggedIn ? '/app/products' : '/')}>
              Back to {isLoggedIn ? 'Products' : 'Home'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const imgSrc = product.image
    ? (product.image.startsWith('http') ? product.image : `${apiBase}${product.image}`)
    : null;

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(isLoggedIn ? '/app/products' : '/')} className="gap-2">
          <ArrowLeft size={16} /> Back to {isLoggedIn ? 'Products' : 'Home'}
        </Button>
        {isAdmin && (
          <Button onClick={() => navigate(`/app/products/${id}/edit`)} className="gap-2">
            <Edit2 size={14} /> Edit Product
          </Button>
        )}
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Image */}
        <Card className="overflow-hidden">
          <div className="aspect-square bg-muted flex items-center justify-center relative">
            {imgSrc ? (
              <img
                src={imgSrc}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <Package size={80} strokeWidth={1.5} />
                <span className="text-sm mt-3">No image available</span>
              </div>
            )}
          </div>
        </Card>

        {/* Right: Product Info */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h1 className="text-3xl font-bold tracking-tight mb-2">{product.name}</h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`${CATEGORY_STYLE[product.category] || 'bg-muted text-muted-foreground border-border'}`}>
                    {product.category}
                  </Badge>
                  {product.brand && (
                    <Badge variant="outline" className="gap-1">
                      <Tag size={11} />
                      {product.brand}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 mb-4">
              <p className="text-sm text-green-700 mb-2">Price</p>
              <PriceDisplay 
                mrp={product.actualPrice}
                sellingPrice={product.mrp}
                size="xlarge"
                showSavings={true}
                unit={`per ${product.unit}`}
              />
            </div>

            {/* Meta Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Hash size={16} className="text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">SKU</p>
                  <p className="text-sm font-mono font-semibold">{product.sku}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Box size={16} className="text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Unit</p>
                  <p className="text-sm font-semibold">{product.unit}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Only - Pricing Breakdown */}
          {isAdmin && (
            <Card className="border-2 border-amber-200 bg-amber-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-amber-900">
                  <Lock size={16} className="text-amber-600" />
                  Admin Only - Pricing Breakdown
                </CardTitle>
                <CardDescription className="text-amber-700">
                  These values are hidden from other users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PricingBreakdownTable product={product} />
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {product.description && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers size={16} className="text-muted-foreground" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {product.tags?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <Tag size={14} className="text-muted-foreground" />
                Tags
              </p>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Product Information Sections */}
          <div className="space-y-3">
            <ExpandableSection 
              title="Ingredients" 
              content={product.ingredients}
              icon={Leaf}
              isOpen={openSection === 'ingredients'}
              onToggle={() => setOpenSection(openSection === 'ingredients' ? null : 'ingredients')}
            />
            <ExpandableSection 
              title="How to Use" 
              content={product.howToUse}
              icon={Droplets}
              isOpen={openSection === 'howToUse'}
              onToggle={() => setOpenSection(openSection === 'howToUse' ? null : 'howToUse')}
            />
            <ExpandableSection 
              title="Benefits" 
              content={product.benefits}
              icon={Award}
              isOpen={openSection === 'benefits'}
              onToggle={() => setOpenSection(openSection === 'benefits' ? null : 'benefits')}
            />
            <ExpandableSection 
              title="Dosage" 
              content={product.dosage}
              icon={Pill}
              isOpen={openSection === 'dosage'}
              onToggle={() => setOpenSection(openSection === 'dosage' ? null : 'dosage')}
            />
            <ExpandableSection 
              title="Disclaimer" 
              content={product.disclaimer}
              icon={AlertTriangle}
              isOpen={openSection === 'disclaimer'}
              onToggle={() => setOpenSection(openSection === 'disclaimer' ? null : 'disclaimer')}
            />
          </div>

          {/* Actions */}
          {canOrder && (
            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={handleAddToCart} className="flex-1 gap-2" size="lg">
                <ShoppingCart size={16} />
                Add to Cart
              </Button>
            </div>
          )}
          
          {/* Non-logged-in users */}
          {!isLoggedIn && (
            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={() => navigate('/register-select')} className="flex-1 gap-2 bg-green-600 hover:bg-green-700" size="lg">
                <ArrowLeft size={16} className="rotate-180" />
                Register to Order
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
