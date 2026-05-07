import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Search, Filter, ChevronRight } from 'lucide-react';
import { ordersApi } from '../../api/orders.api';
import PublicNavbar from '../../components/PublicNavbar';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { EmptyState } from '../../components/ui/empty-state';
import { Badge } from '../../components/ui/badge';

export default function CustomerOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await ordersApi.getAll();
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order._id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-amber-100/80 text-amber-700 border-amber-200/60',
      CONFIRMED: 'bg-amber-100/80 text-amber-700 border-amber-200/60',
      SHIPPED: 'bg-amber-100/80 text-amber-700 border-amber-200/60',
      DELIVERED: 'bg-emerald-100/80 text-emerald-700 border-emerald-200/60',
      CANCELLED: 'bg-red-100/80 text-red-700 border-red-200/60'
    };
    return colors[status] || 'bg-stone-100/80 text-stone-700 border-stone-200/60';
  };

  const statusOptions = ['ALL', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/80 via-stone-50/60 to-orange-50/70">
      <PublicNavbar activePage="orders" />
      
      <div className="p-6 max-w-7xl mx-auto space-y-6 py-12">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>My Orders</h1>
          <p className="text-slate-600 mt-1">Track and manage your orders</p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search by order number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-slate-400" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <Card>
          {loading ? (
            <CardContent className="py-20">
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              </div>
            </CardContent>
          ) : filteredOrders.length === 0 ? (
            <CardContent className="py-12">
              <EmptyState
                icon={Package}
                title="No orders found"
                description="Start shopping to see your orders here"
                action={
                  <Button onClick={() => navigate('/products')} className="bg-amber-600/90 hover:bg-amber-700/90 backdrop-blur-sm shadow-md text-white">
                    Browse Products
                  </Button>
                }
              />
            </CardContent>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredOrders.map((order) => (
                <div
                  key={order._id}
                  onClick={() => navigate(`/my-orders/${order._id}`)}
                  className="p-6 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-900">
                          Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                        </h3>
                        <Badge className={`${getStatusColor(order.status)} backdrop-blur-sm`}>
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-slate-400" />
                      <span className="text-sm text-slate-600">
                        {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-slate-900">
                      ₹{order.totalAmount?.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Footer */}
      <footer className="mt-24 border-t border-amber-200/60 bg-gradient-to-br from-amber-100/50 via-stone-100/40 to-orange-100/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <button onClick={() => navigate('/')} className="flex items-center gap-2">
                <img src="/logo-full.png" srcSet="/logo-full@2x.png 2x, /logo-full@3x.png 3x" alt="Warnamayii Krishi Resources" className="h-10" />
              </button>
              <p className="mt-4 text-sm text-slate-600 leading-relaxed max-w-xs">
                Cultivating a greener tomorrow with organic essentials, trusted by farmers and home gardeners.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Shop</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><button onClick={() => navigate('/products')} className="hover:text-amber-700">All Products</button></li>
                <li><button onClick={() => navigate('/categories')} className="hover:text-amber-700">Categories</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Resources</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><button onClick={() => navigate('/about')} className="hover:text-amber-700">About Us</button></li>
                <li><button onClick={() => navigate('/contact')} className="hover:text-amber-700">Contact</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Newsletter</h4>
              <p className="text-sm text-slate-600 mb-4">Get growing tips & 10% off your first order.</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="you@email.com"
                  className="flex-1 rounded-full border border-amber-200/60 bg-white/80 backdrop-blur-sm px-4 py-2 text-sm outline-none focus:border-amber-600"
                />
                <button className="rounded-full bg-amber-600/90 hover:bg-amber-700/90 backdrop-blur-sm shadow-md text-white px-6 py-2 text-sm font-medium">Join</button>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Warnamayii Agri Network System. All rights reserved.</p>
            <div className="flex gap-5">
              <a href="#" className="hover:text-amber-700">Privacy</a>
              <a href="#" className="hover:text-amber-700">Terms</a>
              <a href="#" className="hover:text-amber-700">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
