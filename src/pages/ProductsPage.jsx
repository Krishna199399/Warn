import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsApi } from '../api/products.api';
import { useAuth, ROLES } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { formatCurrency } from '../utils/helpers';
import { Package, Plus, Edit2, Trash2, Search, Filter, RefreshCw, Tag, LayoutGrid, List, X, Store } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { LoadingGrid } from '@/components/ui/loading-grid';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { PriceDisplay } from '@/components/ui/price-display';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

const CATEGORIES = ['All', 'Seeds', 'Fertilizer', 'Pesticide', 'Equipment', 'Supplement'];
const STATUSES   = ['All', 'Active', 'Low Stock', 'Out of Stock'];

const CATEGORY_STYLE = {
  Seeds:      'bg-green-50 text-green-700 border-green-200',
  Fertilizer: 'bg-blue-50 text-blue-700 border-blue-200',
  Pesticide:  'bg-red-50 text-red-700 border-red-200',
  Equipment:  'bg-amber-50 text-amber-700 border-amber-200',
  Supplement: 'bg-purple-50 text-purple-700 border-purple-200',
};

// ─── Product Card (grid view) ─────────────────────────────────────────────────
function ProductCard({ product, isAdmin, onEdit, onDelete, onAddToCart, onViewDetails, apiBase }) {
  const imgSrc = product.image
    ? (product.image.startsWith('http') ? product.image : `${apiBase}${product.image}`)
    : null;

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/60 cursor-pointer" onClick={() => onViewDetails(product._id)}>
      {/* Image */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {imgSrc ? (
          <img src={imgSrc} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <Package size={36} strokeWidth={1.5} />
            <span className="text-xs mt-1">No image</span>
          </div>
        )}
        {/* Category chip */}
        <span className={`absolute top-2 left-2 text-[11px] font-semibold px-2.5 py-1 rounded-full border backdrop-blur-md ${CATEGORY_STYLE[product.category] || 'bg-background text-foreground border-border'}`}>
          {product.category}
        </span>
        {/* Admin actions overlay */}
        {isAdmin && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="icon" variant="secondary" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onEdit(product._id); }}>
              <Edit2 size={12} />
            </Button>
            <Button size="icon" variant="destructive" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onDelete(product); }}>
              <Trash2 size={12} />
            </Button>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-bold text-sm leading-tight mb-0.5 line-clamp-2">{product.name}</h3>
        {product.brand && <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1"><Tag size={11} />{product.brand}</p>}

        <div className="flex items-end justify-between pt-3 border-t border-border/60 mb-3">
          <div>
            <p className="text-[10px] text-muted-foreground mb-0.5">Price</p>
            <PriceDisplay 
              mrp={product.actualPrice}
              sellingPrice={product.mrp}
              size="medium"
            />
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">SKU</p>
            <p className="text-xs font-mono">{product.sku}</p>
          </div>
        </div>

        {product.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.tags.slice(0, 3).map((t, i) => (
              <span key={i} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-medium">{t}</span>
            ))}
            {product.tags.length > 3 && <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-medium">+{product.tags.length - 3}</span>}
          </div>
        )}

        <Button variant="outline" className="w-full" onClick={(e) => { e.stopPropagation(); onViewDetails(product._id); }}>
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const isAdmin = user?.role === ROLES.ADMIN;
  const isMiniStock = user?.role === ROLES.MINI_STOCK;
  const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

  const [products,     setProducts]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [search,       setSearch]       = useState('');
  const [category,     setCategory]     = useState('All');
  const [status,       setStatus]       = useState('All');
  const [viewMode,     setViewMode]     = useState('grid');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading,setDeleteLoading]= useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await productsApi.getAll();
      setProducts(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = products.filter(p => {
    const q  = search.toLowerCase();
    const mQ = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q);
    const mC = category === 'All' || p.category === category;
    const mS = isAdmin || status === 'All' || p.status === status;
    return mQ && mC && mS;
  });

  const handleAddToCart = (product) => { addToCart(product, 1); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await productsApi.remove(deleteTarget._id);
      setProducts(prev => prev.filter(p => p._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) { console.error(err); }
    finally { setDeleteLoading(false); }
  };

  const clearFilters = () => { setSearch(''); setCategory('All'); setStatus('All'); };
  const hasFilters = search || category !== 'All' || status !== 'All';

  return (
    <div className="space-y-5">
      {/* Mini Stock Info Banner */}
      {isMiniStock && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Store className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-1">
                  Purchase from Wholesale
                </h3>
                <p className="text-sm text-green-700 mb-3">
                  As a Mini Stock, you can browse products here but need to purchase from a Wholesale supplier. 
                  Go to the Purchase page to select a supplier and place your order.
                </p>
                <Button 
                  onClick={() => navigate('/app/purchase')}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <Store className="h-4 w-4 mr-2" />
                  Go to Purchase from Wholesale
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <PageHeader
        title="Products"
        description={`${products.length} products in catalog`}
        onRefresh={() => load(true)}
        refreshing={refreshing}
        actions={
          isAdmin && (
            <Button onClick={() => navigate('/app/products/create')}>
              <Plus size={14} className="mr-1.5" /> Add Product
            </Button>
          )
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, SKU or brand…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="sm:w-44">
                <Filter size={13} className="mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            {!isAdmin && (
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <div className="flex border border-border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                className="rounded-none h-9 w-9"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid size={14} />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="icon"
                className="rounded-none h-9 w-9"
                onClick={() => setViewMode('table')}
              >
                <List size={14} />
              </Button>
            </div>
          </div>
          {/* Active filter chips */}
          {hasFilters && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs text-muted-foreground">Filters:</span>
              {search && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  "{search}"
                  <button onClick={() => setSearch('')}><X size={10} /></button>
                </Badge>
              )}
              {category !== 'All' && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  {category}
                  <button onClick={() => setCategory('All')}><X size={10} /></button>
                </Badge>
              )}
              {status !== 'All' && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  {status}
                  <button onClick={() => setStatus('All')}><X size={10} /></button>
                </Badge>
              )}
              <button onClick={clearFilters} className="text-xs text-destructive hover:underline">Clear all</button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <LoadingGrid count={8} columns="xl:grid-cols-4" type="card" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products found"
          description={hasFilters ? 'Try adjusting your filters' : 'Start by adding your first product'}
          action={
            isAdmin && (
              <Button onClick={() => navigate('/app/products/create')}>
                <Plus size={14} className="mr-1.5" /> Add Product
              </Button>
            )
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(p => (
            <ProductCard
              key={p._id} product={p} isAdmin={isAdmin} apiBase={apiBase}
              onEdit={(id) => navigate(`/app/products/${id}/edit`)}
              onDelete={setDeleteTarget}
              onViewDetails={(id) => navigate(`/app/products/${id}`)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Unit</TableHead>
                {isAdmin && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => {
                const imgSrc = p.image ? (p.image.startsWith('http') ? p.image : `${apiBase}${p.image}`) : null;
                return (
                  <TableRow key={p._id} className="cursor-pointer" onClick={() => navigate(`/app/products/${p._id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {imgSrc
                            ? <img src={imgSrc} alt={p.name} className="w-full h-full object-cover" />
                            : <Package size={16} className="text-muted-foreground" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{p.name}</p>
                          {p.brand && <p className="text-xs text-muted-foreground">{p.brand}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{p.sku}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${CATEGORY_STYLE[p.category] || 'bg-muted text-muted-foreground border-border'}`}>
                        {p.category}
                      </span>
                    </TableCell>
                    <TableCell>
                      <PriceDisplay 
                        mrp={p.actualPrice}
                        sellingPrice={p.mrp}
                        size="small"
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{p.unit}</TableCell>
                    {isAdmin && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); navigate(`/app/products/${p._id}/edit`); }}>
                            <Edit2 size={13} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(p); }}>
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
            Showing {filtered.length} of {products.length} products
          </div>
        </Card>
      )}

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>"{deleteTarget?.name}"</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}