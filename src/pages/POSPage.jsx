import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersApi } from '../api/orders.api';
import { useAuth } from '../contexts/AuthContext';
import {
  ShoppingCart, Calendar, User, Phone, MapPin, Package,
  Award, CreditCard, Search, Filter, Download, Eye,
  ChevronDown, ChevronUp, FileText
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';
import InvoiceModal from '../components/pos/InvoiceModal';

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
        // Get all orders where seller is current user and buyerType is CUSTOMER
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

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(sale => 
        sale.productId?.name?.toLowerCase().includes(query) ||
        sale.productId?.sku?.toLowerCase().includes(query) ||
        sale.orderNumber?.toLowerCase().includes(query)
      );
    }

    // Date filter
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

  // Group sales by transaction (same createdAt timestamp)
  const groupedSales = filteredSales.reduce((groups, sale) => {
    const timestamp = new Date(sale.createdAt).getTime();
    if (!groups[timestamp]) {
      groups[timestamp] = [];
    }
    groups[timestamp].push(sale);
    return groups;
  }, {});

  const transactions = Object.entries(groupedSales).map(([timestamp, items]) => ({
    timestamp: parseInt(timestamp),
    items,
    total: items.reduce((sum, item) => sum + item.total, 0),
    date: new Date(parseInt(timestamp)),
  })).sort((a, b) => b.timestamp - a.timestamp);

  // Generate invoice data for a transaction
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
    const invoiceData = generateInvoice(transaction);
    setSelectedInvoice(invoiceData);
    setShowInvoice(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">POS Sales History</h1>
            <p className="text-sm text-slate-500 mt-1">View all customer purchases and transactions</p>
          </div>
          <button
            onClick={() => navigate('/app/pos-sale')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <ShoppingCart size={18} />
            New Sale
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Total Sales</span>
              <ShoppingCart size={16} className="text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.totalSales}</p>
            <p className="text-xs text-slate-500 mt-1">All time</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Total Revenue</span>
              <CreditCard size={16} className="text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-xs text-slate-500 mt-1">All time</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Today's Sales</span>
              <Calendar size={16} className="text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.todaySales}</p>
            <p className="text-xs text-slate-500 mt-1">Last 24 hours</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Today's Revenue</span>
              <CreditCard size={16} className="text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.todayRevenue)}</p>
            <p className="text-xs text-slate-500 mt-1">Last 24 hours</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by product name, SKU, or order number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
            />
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sales List */}
      <div className="bg-white rounded-xl border border-slate-200">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingCart size={48} className="text-slate-300 mb-3" />
            <p className="text-slate-500">No sales found</p>
            <p className="text-sm text-slate-400 mt-1">Start making sales to see them here</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map((transaction) => {
              const isExpanded = expandedSale === transaction.timestamp;
              const firstItem = transaction.items[0];
              
              return (
                <div key={transaction.timestamp} className="p-4 hover:bg-slate-50 transition-colors">
                  {/* Transaction Header */}
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedSale(isExpanded ? null : transaction.timestamp)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                        <ShoppingCart size={20} className="text-green-600" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900">
                            {firstItem.customerName || 'Customer'}
                          </h3>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            {transaction.items.length} item{transaction.items.length > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatDate(transaction.date)}
                          </span>
                          {firstItem.customerPhone && (
                            <span className="flex items-center gap-1">
                              <Phone size={14} />
                              {firstItem.customerPhone}
                            </span>
                          )}
                          {firstItem.advisorId && (
                            <span className="flex items-center gap-1">
                              <Award size={14} className="text-amber-600" />
                              {firstItem.advisorId.advisorCode}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">{formatCurrency(transaction.total)}</p>
                        <p className="text-xs text-slate-500">
                          {firstItem.paymentStatus === 'PAID' ? 'Paid' : 'Pending'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewInvoice(transaction);
                          }}
                          className="p-2 hover:bg-green-50 rounded-lg transition-colors text-green-600"
                          title="View Invoice"
                        >
                          <FileText size={20} />
                        </button>
                        
                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      {/* Items */}
                      <div className="space-y-3 mb-4">
                        {transaction.items.map((item) => (
                          <div key={item._id} className="flex items-center gap-3 bg-slate-50 rounded-lg p-3">
                            <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {item.productId?.image ? (
                                <img src={item.productId.image} alt={item.productId.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package size={20} className="text-slate-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-900">{item.productId?.name || 'Unknown Product'}</h4>
                              <p className="text-xs text-slate-500">SKU: {item.productId?.sku || 'N/A'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-slate-900">
                                {item.quantity} × {formatCurrency(item.price)}
                              </p>
                              <p className="text-sm font-bold text-green-600">{formatCurrency(item.total)}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Additional Info */}
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        {/* Customer Details */}
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                          <p className="text-xs text-blue-600 font-semibold mb-2 flex items-center gap-1">
                            <User size={12} />
                            Customer Details
                          </p>
                          <p className="font-medium text-slate-900">{firstItem.customerName || 'N/A'}</p>
                          {firstItem.customerPhone && (
                            <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                              <Phone size={10} />
                              {firstItem.customerPhone}
                            </p>
                          )}
                          {firstItem.customerLocation && (
                            <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                              <MapPin size={10} />
                              {firstItem.customerLocation}
                            </p>
                          )}
                        </div>

                        {/* Advisor Info */}
                        {firstItem.advisorId ? (
                          <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                            <p className="text-xs text-amber-600 font-semibold mb-2 flex items-center gap-1">
                              <Award size={12} />
                              Advisor
                            </p>
                            <p className="font-medium text-slate-900">{firstItem.advisorId.name}</p>
                            <p className="text-xs text-slate-600 mt-1 font-mono">
                              Code: {firstItem.advisorId.advisorCode}
                            </p>
                          </div>
                        ) : (
                          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                            <p className="text-xs text-slate-500 mb-2">Advisor</p>
                            <p className="text-sm text-slate-400">No advisor assigned</p>
                          </div>
                        )}

                        {/* Order Info */}
                        <div className="bg-slate-50 rounded-lg p-3">
                          <p className="text-xs text-slate-500 mb-2">Order Number</p>
                          <p className="font-mono font-medium text-slate-900 text-xs">{firstItem.orderNumber}</p>
                          <div className="mt-2">
                            <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                              {firstItem.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

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
