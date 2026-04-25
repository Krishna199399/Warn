import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsApi } from '../api/products.api';
import { useAuth, ROLES } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { PageHeader, Badge } from '../components/ui';
import {
  Package, Plus, Edit2, Trash2, Search, Filter,
  RefreshCw, ImageIcon, Tag, IndianRupee, LayoutGrid, List
} from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

const CATEGORIES = ['All', 'Seeds', 'Fertilizer', 'Pesticide', 'Equipment', 'Supplement'];
const STATUSES   = ['All', 'Active', 'Low Stock', 'Out of Stock'];

const STATUS_COLORS = {
  'Active':       'green',
  'Low Stock':    'amber',
  'Out of Stock': 'red',
};

const CATEGORY_COLORS = {
  Seeds:      'bg-green-50 text-green-700 border-green-200',
  Fertilizer: 'bg-blue-50 text-blue-700 border-blue-200',
  Pesticide:  'bg-red-50 text-red-700 border-red-200',
  Equipment:  'bg-amber-50 text-amber-700 border-amber-200',
  Supplement: 'bg-purple-50 text-purple-700 border-purple-200',
};

// ─── Product Card (Grid view) ─────────────────────────────────────────────────
function ProductCard({ product, isAdmin, onEdit, onDelete, onAddToCart, apiBase }) {
  const imgSrc = product.image
    ? (product.image.startsWith('http') ? product.image : `${apiBase}${product.image}`)
    : null;

  // Premium design for Stock users
  if (!isAdmin) {
    return (
      <div className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-green-300 hover:shadow-xl transition-all duration-300">
        {/* Image Section */}
        <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-50 via-white to-slate-50 overflow-hidden">
          {imgSrc ? (
            <img 
              src={imgSrc} 
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
              <Package size={40} strokeWidth={1.5} />
              <span className="text-xs mt-2">No image</span>
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg ${CATEGORY_COLORS[product.category] || 'bg-white/90 text-slate-700'}`}>
              {product.category}
            </span>
          </div>
          
          {/* Available Badge - Always show as available for wholesale */}
          <div className="absolute top-3 right-3">
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-green-500 text-white shadow-lg backdrop-blur-md flex items-center gap-1">
              <Package size={12} />
              Available
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5">
          {/* Product Name */}
          <h3 className="text-base font-bold text-slate-900 mb-1 line-clamp-2 min-h-[3rem]">
            {product.name}
          </h3>
          
          {/* Brand */}
          {product.brand && (
            <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
              <Tag size={12} />
              {product.brand}
            </p>
          )}

          {/* Price Section */}
          <div className="flex items-end justify-between mb-4 pt-3 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-500 mb-1">Price</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(product.price)}
                </span>
                <span className="text-sm text-slate-400">/{product.unit}</span>
              </div>
            </div>
            
            {/* SKU */}
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">SKU</p>
              <p className="text-xs font-mono text-slate-600">{product.sku}</p>
            </div>
          </div>

          {/* Tags */}
          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {product.tags.slice(0, 3).map((t, i) => (
                <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-medium">
                  {t}
                </span>
              ))}
              {product.tags.length > 3 && (
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-medium">
                  +{product.tags.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Add to Cart Button */}
          {onAddToCart && (
            <button
              onClick={() => onAddToCart(product)}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-600/20 hover:shadow-xl hover:shadow-green-600/30 hover:-translate-y-0.5"
            >
              <Plus size={16} />
              Add to Cart
            </button>
          )}
        </div>
      </div>
    );
  }

  // Admin design (original)
  return (
    <div className="card card-hover flex flex-col overflow-hidden group">
      {/* Image */}
      <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 aspect-video flex items-center justify-center overflow-hidden">
        {imgSrc ? (
          <img src={imgSrc} alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-300">
            <ImageIcon size={28} />
            <span className="text-xs">No image</span>
          </div>
        )}
        <span className={`absolute top-2 left-2 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[product.category] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
          {product.category}
        </span>
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(product._id)}
            className="w-7 h-7 rounded-lg bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center
                       text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors">
            <Edit2 size={12} />
          </button>
          <button onClick={() => onDelete(product)}
            className="w-7 h-7 rounded-lg bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center
                       text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex-1">
          <h3 className="text-sm font-bold text-slate-900 mb-0.5 truncate">{product.name}</h3>
          {product.brand && <p className="text-xs text-slate-400 mb-1">{product.brand}</p>}
          <p className="text-[11px] font-mono text-slate-400">SKU: {product.sku}</p>
        </div>

        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Price</p>
            <p className="text-base font-bold text-green-600">{formatCurrency(product.price)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 mt-0.5">/{product.unit}</p>
          </div>
        </div>

        {product.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {product.tags.slice(0, 3).map((t, i) => (
              <span key={i} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Tag size={8} />{t}
              </span>
            ))}
            {product.tags.length > 3 && (
              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                +{product.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Product Row (Table view) ─────────────────────────────────────────────────
function ProductRow({ product, isAdmin, onEdit, onDelete, apiBase }) {
  const imgSrc = product.image
    ? (product.image.startsWith('http') ? product.image : `${apiBase}${product.image}`)
    : null;

  return (
    <tr className="table-row">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
            {imgSrc
              ? <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
              : <Package size={16} className="text-slate-400" />
            }
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{product.name}</p>
            {product.brand && <p className="text-xs text-slate-400">{product.brand}</p>}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-xs font-mono text-slate-500">{product.sku}</td>
      <td className="px-4 py-3">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[product.category] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
          {product.category}
        </span>
      </td>
      <td className="px-4 py-3 text-sm font-bold text-green-600">{formatCurrency(product.price)}</td>
      <td className="px-4 py-3 text-xs text-slate-500">{product.unit}</td>
      {isAdmin && (
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            <button onClick={() => onEdit(product._id)}
              className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
              <Edit2 size={13} />
            </button>
            <button onClick={() => onDelete(product)}
              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        </td>
      )}
    </tr>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({ product, onConfirm, onCancel, loading }) {
  if (!product) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={20} className="text-red-600" />
        </div>
        <h3 className="text-base font-bold text-slate-900 text-center mb-2">Delete Product</h3>
        <p className="text-sm text-slate-500 text-center mb-6">
          Are you sure you want to delete <strong>"{product.name}"</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1" disabled={loading}>Cancel</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2
                       bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold
                       transition-all disabled:opacity-50"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const isAdmin  = user?.role === ROLES.ADMIN;

  const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

  const [products, setProducts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [search, setSearch]           = useState('');
  const [category, setCategory]       = useState('All');
  const [status, setStatus]           = useState('All');
  const [viewMode, setViewMode]       = useState('grid'); // 'grid' | 'table'
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await productsApi.getAll();
      setProducts(res.data.data || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = products.filter(p => {
    const q  = search.toLowerCase();
    const mQ = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
                  || (p.brand || '').toLowerCase().includes(q);
    const mC = category === 'All' || p.category === category;
    // Only apply status filter for admin users
    const mS = isAdmin || status === 'All' || p.status === status;
    return mQ && mC && mS;
  });

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    // Show success notification (you can add a toast library later)
    alert(`${product.name} added to cart!`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await productsApi.remove(deleteTarget._id);
      setProducts(prev => prev.filter(p => p._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete product');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-5 page-enter">
      {/* Header */}
      <PageHeader
        title="Products"
        subtitle={`${products.length} product${products.length !== 1 ? 's' : ''} in catalog`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => load(true)}
              className="btn-secondary p-2"
              title="Refresh"
              disabled={refreshing}
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            </button>
            {isAdmin && (
              <button
                id="btn-add-product"
                onClick={() => navigate('/app/products/create')}
                className="btn-primary"
              >
                <Plus size={15} /> Add Product
              </button>
            )}
          </div>
        }
      />

      {/* Filters Bar */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, SKU or brand…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>

          {/* Category filter */}
          <div className="relative">
            <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="input-field pl-8 sm:w-44"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Status filter - hide for admin */}
          {!isAdmin && (
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="input-field sm:w-40"
            >
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}

          {/* View toggle */}
          <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 transition-colors ${viewMode === 'grid' ? 'bg-green-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
              title="Grid view"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 transition-colors ${viewMode === 'table' ? 'bg-green-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
              title="Table view"
            >
              <List size={15} />
            </button>
          </div>
        </div>

        {/* Active filter chips */}
        {(search || category !== 'All' || status !== 'All') && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs text-slate-500">Filters:</span>
            {search     && <Chip label={`"${search}"`}     onRemove={() => setSearch('')} />}
            {category !== 'All' && <Chip label={category}  onRemove={() => setCategory('All')} />}
            {status   !== 'All' && <Chip label={status}    onRemove={() => setStatus('All')} />}
            <button
              onClick={() => { setSearch(''); setCategory('All'); setStatus('All'); }}
              className="text-xs text-red-500 hover:underline ml-1"
            >
              Clear all
            </button>
          </div>
        )}
      </div>



      {/* Content */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card p-0 overflow-hidden animate-pulse">
              <div className="bg-slate-200 aspect-video" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="h-5 bg-slate-200 rounded w-1/3 mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Package size={28} className="text-slate-300" />
          </div>
          <h3 className="text-sm font-semibold text-slate-700 mb-1">No products found</h3>
          <p className="text-xs text-slate-400 mb-4">
            {search || category !== 'All' || status !== 'All'
              ? 'Try adjusting your filters'
              : 'Start by adding your first product'}
          </p>
          {isAdmin && (
            <button onClick={() => navigate('/app/products/create')} className="btn-primary mx-auto">
              <Plus size={14} /> Add Product
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(p => (
            <ProductCard
              key={p._id} product={p} isAdmin={isAdmin} apiBase={apiBase}
              onEdit={(id) => navigate(`/app/products/${id}/edit`)}
              onDelete={setDeleteTarget}
              onAddToCart={!isAdmin ? handleAddToCart : null}
            />
          ))}
        </div>
      ) : (
        <div className="table-container">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit</th>
                {isAdmin && <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <ProductRow
                  key={p._id} product={p} isAdmin={isAdmin} apiBase={apiBase}
                  onEdit={(id) => navigate(`/app/products/${id}/edit`)}
                  onDelete={setDeleteTarget}
                />
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
            Showing {filtered.length} of {products.length} products
          </div>
        </div>
      )}

      {/* Delete modal */}
      <DeleteModal
        product={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </div>
  );
}

function Chip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700
                     border border-green-200 px-2.5 py-0.5 rounded-full font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-green-900 transition-colors">
        ✕
      </button>
    </span>
  );
}