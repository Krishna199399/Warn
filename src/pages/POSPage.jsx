import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersApi } from '../api/orders.api';
import { useAuth } from '../contexts/AuthContext';
import {
  ShoppingCart, Calendar, User, Phone, MapPin, Package,
  Award, CreditCard, Search, Filter, FileText,
  ChevronDown, ChevronUp, CheckCircle, Clock
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';
import InvoiceModal from '../components/pos/InvoiceModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

export default function POSPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
  const [expandedSale, setExpandedSale] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Load POS sales
  useEffect(() => {
    const load = async () => {
      try {
        const res = await ordersApi.getMiniOrders();
        const allOrders = res.data.data || [];
        
        // Filter for POS sales (customer orders)
        const posSales = allOrders.filter(order => 
          order.buyerType === 'CUSTOMER' && order.source === 'POS'
        );
        
        setSales(posSales);
        setFilteredSales(posSales);
      } catch (err) {
        console.error('Failed to load sales:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...sales];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(sale => 
        sale.productId?.name?.toLowerCase().includes(query) ||
        sale.productId?.sku?.toLowerCase().includes(query) ||
        sale.orderNumber?.toLowerCase().includes(query) ||
        sale.customerName?.toLowerCase().includes(query)
      );
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (dateFilter === 'today') {
      filtered = filtered.filter(sale => new Date(sale.createdAt) >= today);
    } else if (dateFilter === 'week') {
      filtered = filtered.filter(sale => new Date(sale.createdAt) >= weekAgo);
    } else if (dateFilter === 'month') {
      filtered = filtered.filter(sale => new Date(sale.createdAt) >= monthAgo);
    }

    setFilteredSales(filtered);
  }, [searchQuery, dateFilter, sales]);

  // Calculate stats
  const stats = {
    totalSales: filteredSales.length,
    totalRevenue: filteredSales.reduce((sum, sale) => sum + sale.total, 0),
    todaySales: filteredSales.filter(sale => {
      const today = new Date();
      const saleDate = new Date(sale.createdAt);
      return saleDate.toDateString() === today.toDateString();
    }).length,
    todayRevenue: filteredSales.filter(sale => {
      const today = new Date();
      const saleDate = new Date(sale.createdAt);
      return saleDate.toDateString() === today.toDateString();
    }).reduce((sum, sale) => sum + sale.total, 0),
  };

  // Group sales by transaction
  const groupedSales = filteredSales.reduce((groups, sale) => {
    const timestamp = new Date(sale.createdAt).getTime();
    if (!groups[timestamp]) groups[timestamp] = [];
    groups[timestamp].push(sale);
    return groups;
  }, {});

  const transactions = Object.entries(groupedSales).map(([timestamp, items]) => ({
    timestamp: parseInt(timestamp),
    items,
    total: items.reduce((sum, item) => sum + item.total, 0),
    date: new Date(parseInt(timestamp)),
  })).sort((a, b) => b.timestamp - a.timestamp);

  const generateInvoice = (transaction) => {
    const firstItem = transaction.items[0];
    return {
      invoiceNumber: `INV-${transaction.timestamp.toString().slice(-8)}`,
      date: transaction.date,
      farmerName: firstItem.customerName || 'Customer',
      farmerPhone: firstItem.customerPhone || '',
      farmerLocation: firstItem.customerLocation || '',
      advisorCode: firstItem.advisorId?.advisorCode || '',
      items: transaction.items.map(item => ({
        productName: item.productId?.name || 'Unknown Product',
        sku: item.productId?.sku || 'N/A',
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      })),
      subtotal: transaction.total,
      discount: 0,
      tax: 0,
      totalAmount: transaction.total,
      paymentMethod: 'CASH',
      seller: {
        name: user?.name,
        role: user?.role,
        region: user?.region,
      }
    };
  };

  const handleViewInvoice = (transaction) => {
    setSelectedInvoice(generateInvoice(transaction));
    setShowInvoice(true);
  };

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">POS Sales History</h1>
          <p className="text-sm text-muted-foreground mt-1">View all customer purchases and transactions</p>
        </div>
        <Button onClick={() => navigate('/app/pos-sale')} className="flex items-center gap-2">
          <ShoppingCart size={16} />
          New Sale
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Sales</p>
                <p className="text-2xl font-bold tracking-tight">{stats.totalSales}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <ShoppingCart size={18} className="text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">All time</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Revenue</p>
                <p className="text-2xl font-bold tracking-tight text-primary">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <CreditCard size={18} className="text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">All time</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Today's Sales</p>
                <p className="text-2xl font-bold tracking-tight">{stats.todaySales}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <Calendar size={18} className="text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Today's Revenue</p>
                <p className="text-2xl font-bold tracking-tight text-purple-600">{formatCurrency(stats.todayRevenue)}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                <CreditCard size={18} className="text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by product, customer, or order number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-muted/30"
            />
          </div>
          <div className="w-full md:w-48 shrink-0">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="h-10 bg-muted/30">
                <div className="flex items-center gap-2">
                  <Filter size={14} className="text-muted-foreground" />
                  <SelectValue placeholder="Filter by Date" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sales List */}
      <Card>
        {loading ? (
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-4 flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
              ))}
            </div>
          </CardContent>
        ) : transactions.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <ShoppingCart size={28} className="text-muted-foreground/60" />
            </div>
            <p className="text-lg font-semibold text-foreground">No sales found</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {searchQuery ? 'Try adjusting your search filters' : 'Start making POS sales to see your transaction history here.'}
            </p>
            {!searchQuery && (
              <Button onClick={() => navigate('/app/pos-sale')} className="mt-6" variant="outline">
                Make First Sale
              </Button>
            )}
          </CardContent>
        ) : (
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {transactions.map((transaction) => {
                const isExpanded = expandedSale === transaction.timestamp;
                const firstItem = transaction.items[0];
                const isPaid = firstItem.paymentStatus === 'PAID';
                
                return (
                  <div key={transaction.timestamp} className="hover:bg-muted/30 transition-colors">
                    {/* Transaction Header */}
                    <div 
                      className="p-4 flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedSale(isExpanded ? null : transaction.timestamp)}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <ShoppingCart size={20} className="text-primary" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground truncate">
                              {firstItem.customerName || 'Customer'}
                            </h3>
                            <Badge variant="secondary" className="px-1.5 py-0 h-5 text-[10px]">
                              {transaction.items.length} item{transaction.items.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground truncate">
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {formatDate(transaction.date)}
                            </span>
                            {firstItem.customerPhone && (
                              <span className="hidden sm:flex items-center gap-1">
                                <Phone size={12} />
                                {firstItem.customerPhone}
                              </span>
                            )}
                            {firstItem.advisorId && (
                              <span className="hidden md:flex items-center gap-1">
                                <Award size={12} className="text-amber-600" />
                                Code: {firstItem.advisorId.advisorCode}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right hidden sm:block px-4">
                          <p className="font-bold text-foreground">{formatCurrency(transaction.total)}</p>
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                            {isPaid ? <CheckCircle size={10} className="text-primary"/> : <Clock size={10} className="text-amber-600"/>}
                            <span className={`text-[10px] font-medium ${isPaid ? 'text-primary' : 'text-amber-600'}`}>
                              {isPaid ? 'PAID' : 'PENDING'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewInvoice(transaction);
                            }}
                            className="text-primary hover:text-primary hover:bg-primary/10"
                            title="View Invoice"
                          >
                            <FileText size={18} />
                          </Button>
                          
                          <Button variant="ghost" size="icon" className="text-muted-foreground">
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 bg-muted/10 border-t border-border">
                        {/* Mobile Total (only shows on small screens) */}
                        <div className="sm:hidden py-3 border-b border-border flex justify-between items-center mb-3">
                          <span className="text-sm font-medium">Total Amount</span>
                          <div className="text-right">
                            <p className="font-bold text-foreground">{formatCurrency(transaction.total)}</p>
                            <span className={`text-[10px] font-medium ${isPaid ? 'text-primary' : 'text-amber-600'}`}>
                              {isPaid ? 'PAID' : 'PENDING'}
                            </span>
                          </div>
                        </div>

                        {/* Items */}
                        <div className="space-y-2 mb-4 mt-4">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Order Items</h4>
                          {transaction.items.map((item) => (
                            <div key={item._id} className="flex items-center gap-3 bg-background rounded-xl p-3 border shadow-sm">
                              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                                {item.productId?.image ? (
                                  <img src={item.productId.image} alt={item.productId.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Package size={20} className="text-muted-foreground/50" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm text-foreground truncate">{item.productId?.name || 'Unknown Product'}</h4>
                                <p className="text-xs text-muted-foreground">SKU: {item.productId?.sku || 'N/A'}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs font-medium text-muted-foreground mb-0.5">
                                  {item.quantity} × {formatCurrency(item.price)}
                                </p>
                                <p className="text-sm font-bold text-foreground">{formatCurrency(item.total)}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Additional Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* Customer Details */}
                          <div className="bg-background rounded-xl p-3 border shadow-sm flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                              <User size={14} className="text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Customer</p>
                              <p className="font-medium text-sm text-foreground">{firstItem.customerName || 'N/A'}</p>
                              {firstItem.customerPhone && (
                                <p className="text-xs text-muted-foreground mt-0.5">{firstItem.customerPhone}</p>
                              )}
                              {firstItem.customerLocation && (
                                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[150px]">{firstItem.customerLocation}</p>
                              )}
                            </div>
                          </div>

                          {/* Advisor Info */}
                          <div className="bg-background rounded-xl p-3 border shadow-sm flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                              <Award size={14} className="text-amber-600" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Advisor</p>
                              {firstItem.advisorId ? (
                                <>
                                  <p className="font-medium text-sm text-foreground">{firstItem.advisorId.name}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">Code: {firstItem.advisorId.advisorCode}</p>
                                </>
                              ) : (
                                <p className="text-sm text-muted-foreground italic mt-1">No advisor assigned</p>
                              )}
                            </div>
                          </div>

                          {/* Order Meta */}
                          <div className="bg-background rounded-xl p-3 border shadow-sm flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <FileText size={14} className="text-primary" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Order Details</p>
                              <p className="font-mono text-xs text-foreground mb-1">{firstItem.orderNumber}</p>
                              <Badge variant={firstItem.status === 'DELIVERED' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0 h-5">
                                {firstItem.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Invoice Modal */}
      {showInvoice && selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          onClose={() => {
            setShowInvoice(false);
            setSelectedInvoice(null);
          }}
        />
      )}
    </div>
  );
}
