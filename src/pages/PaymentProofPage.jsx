import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, Wallet, Banknote, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { manualPaymentsApi } from '../api/payments.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function PaymentProofPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const { orderId, amount, paymentMethod, sellerProfile } = location.state || {};
  
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    referenceId: '',
    note: '',
    screenshot: null,
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    console.log('PaymentProofPage mounted');
    console.log('User:', user);
    console.log('Location state:', location.state);
    console.log('Order ID:', orderId);
    console.log('Amount:', amount);
    console.log('Payment Method:', paymentMethod);
    console.log('Seller Profile:', sellerProfile);
    
    if (!orderId || !amount) {
      console.error('Missing orderId or amount, redirecting to orders');
      toast.error('Invalid payment session');
      navigate('/app/orders');
    }
  }, [orderId, amount, navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are allowed');
        return;
      }
      setFormData({ ...formData, screenshot: file });
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (paymentMethod === 'upi') {
      if (!formData.referenceId.trim()) {
        newErrors.referenceId = 'UPI Reference ID is required';
      } else if (formData.referenceId.length < 8) {
        newErrors.referenceId = 'Invalid reference ID format';
      }
    } else if (paymentMethod === 'cash') {
      if (!formData.note.trim()) {
        newErrors.note = 'Please provide payment details';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    setSubmitting(true);
    try {
      const submitData = new FormData();
      submitData.append('orderId', orderId);
      submitData.append('method', paymentMethod.toUpperCase());
      
      if (paymentMethod === 'upi') {
        submitData.append('referenceId', formData.referenceId.trim());
      } else {
        submitData.append('note', formData.note.trim());
      }
      
      if (formData.screenshot) {
        submitData.append('screenshot', formData.screenshot);
      }

      await manualPaymentsApi.submitProof(submitData);
      
      toast.success('Payment proof submitted successfully!');
      navigate('/app/orders', { 
        state: { 
          message: 'Payment proof submitted. Waiting for seller verification.' 
        } 
      });
    } catch (error) {
      console.error('Failed to submit proof:', error);
      toast.error(error.response?.data?.error || 'Failed to submit payment proof');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/app/orders')}
          className="rounded-xl h-9 w-9 shrink-0"
        >
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Submit Payment Proof</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Provide payment details for verification
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Payment Method Info */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  {paymentMethod === 'upi' ? (
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <Wallet size={24} className="text-emerald-600" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Banknote size={24} className="text-amber-600" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {paymentMethod === 'upi' ? 'UPI Payment' : 'Cash Payment'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Amount: ₹{amount?.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {sellerProfile && (
                  <div className="space-y-2 pt-3 border-t">
                    <p className="text-xs text-muted-foreground">Paid to:</p>
                    <p className="font-semibold text-foreground">{sellerProfile.name}</p>
                    {paymentMethod === 'upi' && sellerProfile.upiId && (
                      <p className="text-sm font-mono text-muted-foreground">{sellerProfile.upiId}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* UPI Payment Form */}
            {paymentMethod === 'upi' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">UPI Payment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="referenceId">
                      UPI Transaction ID / Reference Number *
                    </Label>
                    <Input
                      id="referenceId"
                      type="text"
                      placeholder="e.g., 123456789012"
                      value={formData.referenceId}
                      onChange={(e) => {
                        setFormData({ ...formData, referenceId: e.target.value });
                        setErrors({ ...errors, referenceId: '' });
                      }}
                      className={errors.referenceId ? 'border-destructive' : ''}
                    />
                    {errors.referenceId && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle size={12} />
                        {errors.referenceId}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Find this in your UPI app's transaction history (usually 12 digits)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="screenshot">
                      Payment Screenshot (Optional)
                    </Label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                      <input
                        id="screenshot"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label htmlFor="screenshot" className="cursor-pointer">
                        {previewUrl ? (
                          <div className="space-y-3">
                            <img
                              src={previewUrl}
                              alt="Preview"
                              className="max-h-48 mx-auto rounded-lg border"
                            />
                            <Button type="button" variant="outline" size="sm">
                              Change Image
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto">
                              <Upload size={24} className="text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                Click to upload screenshot
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                PNG, JPG up to 5MB
                              </p>
                            </div>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cash Payment Form */}
            {paymentMethod === 'cash' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cash Payment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="note">
                      Payment Note / Details *
                    </Label>
                    <Textarea
                      id="note"
                      placeholder="e.g., Paid in cash at shop on [date]. Received by [person name]."
                      value={formData.note}
                      onChange={(e) => {
                        setFormData({ ...formData, note: e.target.value });
                        setErrors({ ...errors, note: '' });
                      }}
                      rows={4}
                      className={errors.note ? 'border-destructive' : ''}
                    />
                    {errors.note && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle size={12} />
                        {errors.note}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Provide details about when and where you made the payment
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 text-base"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle size={18} className="mr-2" />
                  Submit Payment Proof
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Right: Instructions */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText size={18} />
                Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">
                  {paymentMethod === 'upi' ? 'For UPI Payments:' : 'For Cash Payments:'}
                </h4>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  {paymentMethod === 'upi' ? (
                    <>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span>Complete the UPI payment to the seller's UPI ID</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span>Copy the transaction ID from your UPI app</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span>Optionally take a screenshot of the payment confirmation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span>Submit the reference ID and screenshot here</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span>Pay the amount in cash to the seller</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span>Get a receipt or acknowledgment if possible</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span>Note down the date, time, and person who received payment</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span>Provide these details in the payment note</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              <div className="pt-3 border-t space-y-2">
                <h4 className="text-sm font-semibold text-foreground">What happens next?</h4>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 mt-1.5 shrink-0" />
                    <span>Seller will review your payment proof</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 mt-1.5 shrink-0" />
                    <span>Once verified, your order will be approved</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 mt-1.5 shrink-0" />
                    <span>You'll receive a notification when verified</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 mt-1.5 shrink-0" />
                    <span>Track status in your Orders page</span>
                  </li>
                </ul>
              </div>

              <div className="pt-3 border-t">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-800">
                    ⚠️ <strong>Important:</strong> Do not submit false payment information. 
                    All proofs are verified and stored for audit purposes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
