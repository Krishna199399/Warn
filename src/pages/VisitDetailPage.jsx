import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '@/hooks';
import { visitsApi } from '../api/visits.api';
import { formatCurrency } from '../utils/helpers';
import {
  Calendar, MapPin, Package, Clock, CheckCircle, AlertCircle,
  XCircle, User, Phone, ArrowLeft, Save, X, Upload, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

// Status configuration
const STATUS_CONFIG = {
  PENDING: { label: 'Pending', icon: Clock, variant: 'outline', color: 'text-amber-600' },
  COMPLETED: { label: 'Completed', icon: CheckCircle, variant: 'default', color: 'text-primary' },
  MISSED: { label: 'Missed', icon: XCircle, variant: 'destructive', color: 'text-destructive' },
  RESCHEDULED: { label: 'Rescheduled', icon: AlertCircle, variant: 'secondary', color: 'text-blue-600' }
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const Icon = config.icon;
  return (
    <Badge variant={config.variant}>
      <Icon size={12} className="mr-1" />
      {config.label}
    </Badge>
  );
}

export default function VisitDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    productUsageStatus: '',
    remainingQuantity: '',
    cropCondition: '',
    issuesReported: '',
    farmerFeedback: '',
    nextPurchaseNeed: '',
    nextPurchaseDate: '',
    notes: ''
  });

  const [rescheduleDate, setRescheduleDate] = useState('');

  // Fetch visit details
  const { data: visit, loading, refetch } = useApi(
    () => visitsApi.getById(id),
    { defaultValue: null }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="space-y-6 page-enter">
        <PageHeader title="Visit Not Found" />
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">The visit you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/app/my-visits')} className="mt-4">
              Back to Visits
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOverdue = visit.status === 'PENDING' && new Date(visit.scheduledDate) < new Date();
  const scheduledDate = new Date(visit.scheduledDate);
  const canComplete = visit.status === 'PENDING';
  const canReschedule = visit.status === 'PENDING';

  const handleCompleteVisit = async () => {
    if (!formData.productUsageStatus) {
      toast.error('Please select product usage status');
      return;
    }

    setSubmitting(true);
    try {
      await visitsApi.complete(id, formData);
      toast.success('Visit completed successfully');
      setShowCompleteDialog(false);
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to complete visit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleDate) {
      toast.error('Please select a new date');
      return;
    }

    setSubmitting(true);
    try {
      await visitsApi.reschedule(id, { newDate: rescheduleDate });
      toast.success('Visit rescheduled successfully');
      setShowRescheduleDialog(false);
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reschedule visit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this visit?')) return;

    try {
      await visitsApi.cancel(id);
      toast.success('Visit cancelled successfully');
      navigate('/app/my-visits');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to cancel visit');
    }
  };

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/app/my-visits')}
        >
          <ArrowLeft size={20} />
        </Button>
        <PageHeader
          title="Visit Details"
          description={`Scheduled for ${scheduledDate.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          })}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Farmer Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Farmer Information</CardTitle>
                <StatusBadge status={visit.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isOverdue ? 'bg-destructive/10' : 'bg-primary/10'
                }`}>
                  <User size={24} className={isOverdue ? 'text-destructive' : 'text-primary'} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-lg">{visit.farmerId?.name || 'Unknown Farmer'}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Phone size={14} />
                    <span>{visit.farmerId?.phone || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <MapPin size={14} />
                    <span>{visit.farmerId?.village || 'Location not specified'}</span>
                  </div>
                </div>
              </div>

              {isOverdue && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle size={16} className="text-destructive" />
                  <span className="text-sm text-destructive font-medium">This visit is overdue</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product & Order Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Product & Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Product</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Package size={16} className="text-muted-foreground" />
                    <span className="font-medium">{visit.productId?.name || '—'}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Category</Label>
                  <p className="font-medium mt-1">{visit.productId?.category || '—'}</p>
                </div>
              </div>

              {visit.orderId && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs">Order Number</Label>
                      <p className="font-medium mt-1">{visit.orderId.orderNumber}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Quantity</Label>
                      <p className="font-medium mt-1">{visit.orderId.quantity}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Order Total</Label>
                      <p className="font-medium mt-1">{formatCurrency(visit.orderId.total)}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Order Date</Label>
                      <p className="font-medium mt-1">
                        {new Date(visit.orderId.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Visit Data (if completed) */}
          {visit.status === 'COMPLETED' && visit.completedDate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Visit Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">Completed On</Label>
                    <p className="font-medium mt-1">
                      {new Date(visit.completedDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Product Usage Status</Label>
                    <p className="font-medium mt-1">{visit.productUsageStatus || '—'}</p>
                  </div>
                  {visit.remainingQuantity !== undefined && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Remaining Quantity</Label>
                      <p className="font-medium mt-1">{visit.remainingQuantity}</p>
                    </div>
                  )}
                  {visit.nextPurchaseDate && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Next Purchase Date</Label>
                      <p className="font-medium mt-1">
                        {new Date(visit.nextPurchaseDate).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  )}
                </div>

                {visit.cropCondition && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-muted-foreground text-xs">Crop Condition</Label>
                      <p className="mt-1 text-sm">{visit.cropCondition}</p>
                    </div>
                  </>
                )}

                {visit.issuesReported && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Issues Reported</Label>
                    <p className="mt-1 text-sm">{visit.issuesReported}</p>
                  </div>
                )}

                {visit.farmerFeedback && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Farmer Feedback</Label>
                    <p className="mt-1 text-sm">{visit.farmerFeedback}</p>
                  </div>
                )}

                {visit.nextPurchaseNeed && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Next Purchase Need</Label>
                    <p className="mt-1 text-sm">{visit.nextPurchaseNeed}</p>
                  </div>
                )}

                {visit.notes && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-muted-foreground text-xs">Notes</Label>
                      <p className="mt-1 text-sm">{visit.notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canComplete && (
                <Button
                  className="w-full"
                  onClick={() => setShowCompleteDialog(true)}
                >
                  <CheckCircle size={16} className="mr-2" />
                  Complete Visit
                </Button>
              )}

              {canReschedule && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowRescheduleDialog(true)}
                >
                  <Calendar size={16} className="mr-2" />
                  Reschedule
                </Button>
              )}

              {visit.status === 'PENDING' && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleCancel}
                >
                  <X size={16} className="mr-2" />
                  Cancel Visit
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Visit Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Visit Created</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(visit.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  visit.status === 'COMPLETED' ? 'bg-primary' : 'bg-muted'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">Scheduled Date</p>
                  <p className="text-xs text-muted-foreground">
                    {scheduledDate.toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {visit.completedDate && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Completed</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(visit.completedDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Complete Visit Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Visit</DialogTitle>
            <DialogDescription>
              Fill in the visit details and farmer feedback
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Product Usage Status */}
            <div className="space-y-2">
              <Label htmlFor="productUsageStatus">
                Product Usage Status <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.productUsageStatus}
                onValueChange={(value) => setFormData({ ...formData, productUsageStatus: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                  <SelectItem value="IN_USE">In Use</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="ISSUES">Issues/Problems</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Remaining Quantity */}
            <div className="space-y-2">
              <Label htmlFor="remainingQuantity">Remaining Quantity</Label>
              <Input
                id="remainingQuantity"
                type="number"
                placeholder="Enter remaining quantity"
                value={formData.remainingQuantity}
                onChange={(e) => setFormData({ ...formData, remainingQuantity: e.target.value })}
              />
            </div>

            {/* Crop Condition */}
            <div className="space-y-2">
              <Label htmlFor="cropCondition">Crop Condition</Label>
              <Textarea
                id="cropCondition"
                placeholder="Describe the current crop condition..."
                rows={3}
                value={formData.cropCondition}
                onChange={(e) => setFormData({ ...formData, cropCondition: e.target.value })}
              />
            </div>

            {/* Issues Reported */}
            <div className="space-y-2">
              <Label htmlFor="issuesReported">Issues Reported</Label>
              <Textarea
                id="issuesReported"
                placeholder="Any issues or problems reported by farmer..."
                rows={3}
                value={formData.issuesReported}
                onChange={(e) => setFormData({ ...formData, issuesReported: e.target.value })}
              />
            </div>

            {/* Farmer Feedback */}
            <div className="space-y-2">
              <Label htmlFor="farmerFeedback">Farmer Feedback</Label>
              <Textarea
                id="farmerFeedback"
                placeholder="Farmer's feedback about the product..."
                rows={3}
                value={formData.farmerFeedback}
                onChange={(e) => setFormData({ ...formData, farmerFeedback: e.target.value })}
              />
            </div>

            {/* Next Purchase Need */}
            <div className="space-y-2">
              <Label htmlFor="nextPurchaseNeed">Next Purchase Need</Label>
              <Input
                id="nextPurchaseNeed"
                placeholder="What product does farmer need next?"
                value={formData.nextPurchaseNeed}
                onChange={(e) => setFormData({ ...formData, nextPurchaseNeed: e.target.value })}
              />
            </div>

            {/* Next Purchase Date */}
            <div className="space-y-2">
              <Label htmlFor="nextPurchaseDate">Expected Next Purchase Date</Label>
              <Input
                id="nextPurchaseDate"
                type="date"
                value={formData.nextPurchaseDate}
                onChange={(e) => setFormData({ ...formData, nextPurchaseDate: e.target.value })}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes or observations..."
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCompleteDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleCompleteVisit} disabled={submitting}>
              {submitting ? (
                <>
                  <LoadingSpinner className="mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Complete Visit
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Visit</DialogTitle>
            <DialogDescription>
              Select a new date for this visit
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rescheduleDate">New Visit Date</Label>
              <Input
                id="rescheduleDate"
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRescheduleDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleReschedule} disabled={submitting}>
              {submitting ? (
                <>
                  <LoadingSpinner className="mr-2" />
                  Rescheduling...
                </>
              ) : (
                <>
                  <Calendar size={16} className="mr-2" />
                  Reschedule
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
