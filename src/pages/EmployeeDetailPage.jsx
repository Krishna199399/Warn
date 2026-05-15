import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usersApi } from '../api/users.api';
import { ordersApi } from '../api/orders.api';
import { commissionsApi } from '../api/commissions.api';
import { formatCurrency, formatDate } from '../utils/helpers';
import { 
  ArrowLeft, User, Mail, Phone, MapPin, Calendar, Shield, 
  TrendingUp, ShoppingCart, Users, DollarSign, Award, 
  Building2, CreditCard, FileText, CheckCircle2, XCircle,
  Clock, Banknote
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader, StatCard, LoadingGrid, EmptyState } from '@/components/ui';
import { StatusBadge } from '@/components/ui/status-badge';
import { useApi } from '@/hooks';

const ROLE_CONFIG = {
  ADMIN:          { label: 'Admin',                        color: 'bg-purple-100 text-purple-700' },
  STATE_HEAD:     { label: 'Executive Manager (EM)',       color: 'bg-blue-100 text-blue-700'    },
  ZONAL_MANAGER:  { label: 'Zonal Manager (ZM)',           color: 'bg-indigo-100 text-indigo-700'},
  AREA_MANAGER:   { label: 'Regional Manager (RM)',        color: 'bg-cyan-100 text-cyan-700'    },
  DO_MANAGER:     { label: 'Development Officer (DO)',     color: 'bg-teal-100 text-teal-700'    },
  ADVISOR:        { label: 'Promotion Representative (PR)',color: 'bg-green-100 text-green-700'  },
  WHOLESALE:      { label: 'Wholesale',                   color: 'bg-orange-100 text-orange-700'},
  MINI_STOCK:     { label: 'Mini Stock',                  color: 'bg-pink-100 text-pink-700'    },
};

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch employee data
  const { data: employee, loading: employeeLoading } = useApi(
    () => usersApi.getOne(id),
    { defaultValue: null, transform: (res) => res.data.data }
  );

  // Fetch activity data
  const { data: activity, loading: activityLoading } = useApi(
    () => usersApi.getActivity(id),
    { defaultValue: null, transform: (res) => res.data.data }
  );

  // Fetch KYC data (if available)
  const { data: kyc, loading: kycLoading } = useApi(
    () => usersApi.getKYC(id),
    { defaultValue: null, transform: (res) => res.data.data }
  );

  // Fetch orders
  const { data: orders, loading: ordersLoading } = useApi(
    () => ordersApi.getAll({ advisorId: id }),
    { defaultValue: [] }
  );

  // Fetch commissions
  const { data: commissions, loading: commissionsLoading } = useApi(
    () => commissionsApi.getAll({ userId: id }),
    { defaultValue: [] }
  );

  if (employeeLoading) {
    return <LoadingGrid count={6} columns="lg:grid-cols-3" />;
  }

  if (!employee) {
    return (
      <div className="space-y-5">
        <PageHeader title="Employee Not Found" />
        <EmptyState
          icon={User}
          title="Employee not found"
          description="The employee you're looking for doesn't exist"
          action={<Button onClick={() => navigate('/app/network')}>Back to Network</Button>}
        />
      </div>
    );
  }

  const roleConfig = ROLE_CONFIG[employee.role] || { label: employee.role, color: 'bg-gray-100 text-gray-700' };

  return (
    <div className="space-y-5">
      <PageHeader
        title={employee.name}
        description={`${roleConfig.label} · ${employee.region || 'No Region'} · ${employee.zone || ''} · ${employee.area || ''} · ${employee.doOffice || ''} · ${employee.territory || ''}`.replace(/\s·\s·/g, ' · ').replace(/\s·\s$/, '')}
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate('/app/network')}>
            <ArrowLeft size={14} className="mr-1.5" />
            Back to Network
          </Button>
        }
      />

      {/* Employee Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary text-3xl font-bold">
                {employee.avatar || employee.name?.slice(0, 2).toUpperCase()}
              </div>
            </div>

            {/* Basic Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold">{employee.name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge className={roleConfig.color}>{roleConfig.label}</Badge>
                  <StatusBadge status={employee.status} />
                  {employee.employeeCode && (
                    <Badge variant="outline" className="font-mono">
                      Code: {employee.employeeCode}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {employee.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail size={14} />
                    <span>{employee.email}</span>
                  </div>
                )}
                {employee.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone size={14} />
                    <span>{employee.phone}</span>
                  </div>
                )}
                {employee.region && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin size={14} />
                    <span>{employee.region}</span>
                  </div>
                )}
                {employee.createdAt && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar size={14} />
                    <span>Joined {formatDate(employee.createdAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {activity && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Orders"
            value={activity.orders?.total || 0}
            icon={ShoppingCart}
            format="number"
          />
          <StatCard
            label="Total Revenue"
            value={activity.orders?.revenue || 0}
            icon={TrendingUp}
            format="currency"
          />
          <StatCard
            label="Customers"
            value={activity.farmerCount || 0}
            icon={Users}
            format="number"
          />
          <StatCard
            label="Commissions"
            value={activity.commissions?.reduce((sum, c) => sum + c.total, 0) || 0}
            icon={DollarSign}
            format="currency"
          />
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <User size={14} className="mr-1.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="orders">
            <ShoppingCart size={14} className="mr-1.5" />
            Orders ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="commissions">
            <DollarSign size={14} className="mr-1.5" />
            Commissions ({commissions.length})
          </TabsTrigger>
          <TabsTrigger value="kyc">
            <FileText size={14} className="mr-1.5" />
            KYC Details
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User size={16} />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Full Name" value={employee.name} />
                <InfoRow label="Email" value={employee.email} />
                <InfoRow label="Phone" value={employee.phone} />
                <InfoRow label="Region" value={employee.region} />
                <InfoRow label="Role" value={roleConfig.label} />
                <InfoRow label="Status" value={employee.status} />
                {employee.employeeCode && (
                  <InfoRow label="Employee Code" value={employee.employeeCode} />
                )}
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield size={16} />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="User ID" value={employee.employeeCode || employee.employeeId || `WKR${employee._id.slice(-6).toUpperCase()}`} mono />
                <InfoRow label="Joined Date" value={formatDate(employee.createdAt)} />
                <InfoRow 
                  label="Last Login" 
                  value={activity?.lastLoginAt ? formatDate(activity.lastLoginAt) : 'Never'} 
                />
                <InfoRow 
                  label="Email Verified" 
                  value={employee.emailVerified ? 'Yes' : 'No'}
                  badge={employee.emailVerified}
                />
                {employee.parentId && (
                  <InfoRow label="Parent" value={employee.parentId.name} />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          {activity?.recentOrders && activity.recentOrders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {activity.recentOrders.slice(0, 5).map(order => (
                    <div key={order._id} className="flex justify-between items-center p-3 bg-muted/40 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{order.productId?.name || 'Product'}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.customerName || '—'} · {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{formatCurrency(order.total)}</p>
                        <StatusBadge status={order.status} size="sm" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">All Orders</CardTitle>
            </CardHeader>
            {ordersLoading ? (
              <CardContent>
                <LoadingGrid count={3} />
              </CardContent>
            ) : orders.length === 0 ? (
              <CardContent>
                <EmptyState
                  icon={ShoppingCart}
                  title="No orders yet"
                  description="This employee hasn't made any orders"
                />
              </CardContent>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map(order => (
                      <TableRow key={order._id}>
                        <TableCell className="font-mono text-xs">{order._id.slice(-8)}</TableCell>
                        <TableCell>{order.productId?.name || '—'}</TableCell>
                        <TableCell>{order.customerName || order.farmerId?.name || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={order.status} />
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(order.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Commission History</CardTitle>
            </CardHeader>
            {commissionsLoading ? (
              <CardContent>
                <LoadingGrid count={3} />
              </CardContent>
            ) : commissions.length === 0 ? (
              <CardContent>
                <EmptyState
                  icon={DollarSign}
                  title="No commissions yet"
                  description="This employee hasn't earned any commissions"
                />
              </CardContent>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.map(comm => (
                      <TableRow key={comm._id}>
                        <TableCell>
                          <Badge variant="outline">{comm.type}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {comm.orderId?._id?.slice(-8) || '—'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(comm.createdAt)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={comm.status} />
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          {formatCurrency(comm.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* KYC Tab */}
        <TabsContent value="kyc">
          {kycLoading ? (
            <LoadingGrid count={2} />
          ) : !kyc ? (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={FileText}
                  title="KYC not submitted"
                  description="This employee hasn't submitted their KYC details yet"
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Personal Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User size={16} />
                    Personal Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow label="Full Name" value={kyc.fullName} />
                  <InfoRow label="Date of Birth" value={kyc.dateOfBirth ? formatDate(kyc.dateOfBirth) : '—'} />
                  <InfoRow label="Gender" value={kyc.gender} />
                  <InfoRow label="Father's Name" value={kyc.fatherName} />
                  <InfoRow label="PAN Number" value={kyc.panNumber} mono />
                </CardContent>
              </Card>

              {/* Aadhaar Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard size={16} />
                    Aadhaar Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow label="Aadhaar Number" value={kyc.aadhaarNumber} mono masked />
                  <InfoRow 
                    label="Aadhaar Front" 
                    value={kyc.aadhaarFront ? 'Uploaded' : 'Not uploaded'}
                    badge={!!kyc.aadhaarFront}
                  />
                  <InfoRow 
                    label="Aadhaar Back" 
                    value={kyc.aadhaarBack ? 'Uploaded' : 'Not uploaded'}
                    badge={!!kyc.aadhaarBack}
                  />
                </CardContent>
              </Card>

              {/* Bank Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 size={16} />
                    Bank Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow label="Account Holder" value={kyc.accountHolderName} />
                  <InfoRow label="Bank Name" value={kyc.bankName} />
                  <InfoRow label="Account Number" value={kyc.accountNumber} mono masked />
                  <InfoRow label="IFSC Code" value={kyc.ifscCode} mono />
                  <InfoRow label="Branch" value={kyc.branchName} />
                  <InfoRow label="Account Type" value={kyc.accountType} />
                </CardContent>
              </Card>

              {/* Address Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin size={16} />
                    Address Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Current Address</p>
                    <p className="text-sm">
                      {kyc.currentAddress}, {kyc.currentCity}, {kyc.currentState} - {kyc.currentPinCode}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Permanent Address</p>
                    <p className="text-sm">
                      {kyc.permanentAddress}, {kyc.permanentCity}, {kyc.permanentState} - {kyc.permanentPinCode}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper component for info rows
function InfoRow({ label, value, mono = false, badge = false, masked = false }) {
  let displayValue = value || '—';
  
  if (masked && value && value.length > 4) {
    displayValue = '•'.repeat(value.length - 4) + value.slice(-4);
  }

  return (
    <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${mono ? 'font-mono' : ''}`}>
          {displayValue}
        </span>
        {badge && value && (
          value === 'Yes' || value === true ? (
            <CheckCircle2 size={14} className="text-green-600" />
          ) : (
            <XCircle size={14} className="text-red-600" />
          )
        )}
      </div>
    </div>
  );
}
