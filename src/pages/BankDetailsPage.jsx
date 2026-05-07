import React, { useEffect, useState } from 'react';
import { payoutsApi } from '../api/payouts.api';
import { CheckCircle2, AlertTriangle, Shield, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PageHeader, SkeletonPage } from '@/components/ui';
import { useApi } from '../hooks/useApi';

export default function BankDetailsPage() {
  const { data: bank, loading, refetch } = useApi(() => payoutsApi.getMyBankDetails(), {
    transform: (res) => res.data.data
  });
  
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    accountHolderName: '', bankName: '', accountNumber: '',
    ifscCode: '', branchName: '', accountType: 'SAVINGS',
    upiId: '', address: '', city: '', state: '', pincode: '',
  });

  useEffect(() => {
    if (bank) setForm({ ...bank });
  }, [bank]);

  const handleSave = async e => {
    e.preventDefault(); setSaving(true); setSuccess(false);
    try {
      await payoutsApi.saveBankDetails(form);
      await refetch();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  if (loading) return <SkeletonPage />;

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader
        title="Bank Details"
        description="Add your bank account for salary and RP payouts"
      />

      {/* Status banner */}
      {bank && (
        <Card className={`border-2 ${bank.isVerified ? 'bg-primary/5 border-primary/30' : 'bg-amber-50 border-amber-200'}`}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bank.isVerified ? 'bg-primary/15' : 'bg-amber-100'}`}>
              {bank.isVerified
                ? <CheckCircle2 size={18} className="text-primary"/>
                : <AlertTriangle size={18} className="text-amber-600"/>}
            </div>
            <div>
              <p className={`text-sm font-semibold ${bank.isVerified ? 'text-primary' : 'text-amber-800'}`}>
                {bank.isVerified ? 'Bank Details Verified ✅' : 'Verification Pending ⏳'}
              </p>
              <p className="text-xs text-muted-foreground">
                {bank.isVerified ? 'Your bank details are verified by admin' : 'Admin will verify your bank details shortly'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield size={15} className="text-primary" /> Account Information
          </CardTitle>
          <CardDescription>These details will be used for all salary and RP payouts</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { key: 'accountHolderName', label: 'Account Holder Name *', required: true, placeholder: 'As per bank records' },
                { key: 'bankName',          label: 'Bank Name *',           required: true, placeholder: 'e.g. State Bank of India' },
                { key: 'accountNumber',     label: 'Account Number *',      required: true, placeholder: 'Bank account number' },
                { key: 'ifscCode',          label: 'IFSC Code *',           required: true, placeholder: 'e.g. SBIN0001234', upper: true },
                { key: 'branchName',        label: 'Branch Name',           placeholder: 'Branch name' },
                { key: 'upiId',             label: 'UPI ID (optional)',      placeholder: 'name@upi' },
              ].map(f => (
                <div key={f.key} className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{f.label}</Label>
                  <Input
                    required={f.required}
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={e => set(f.key, f.upper ? e.target.value.toUpperCase() : e.target.value)}
                    className={f.upper ? 'uppercase' : ''}
                  />
                </div>
              ))}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Account Type</Label>
                <Select value={form.accountType} onValueChange={v => set('accountType', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAVINGS">Savings</SelectItem>
                    <SelectItem value="CURRENT">Current</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />
            <p className="text-sm font-semibold">Address (for payslip)</p>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Street Address</Label>
              <Input placeholder="House no, street, area" value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { key: 'city',    label: 'City',    placeholder: 'City'  },
                { key: 'state',   label: 'State',   placeholder: 'State' },
                { key: 'pincode', label: 'Pincode', placeholder: 'PIN'   },
              ].map(f => (
                <div key={f.key} className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{f.label}</Label>
                  <Input placeholder={f.placeholder} value={form[f.key]} onChange={e => set(f.key, e.target.value)} />
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : bank ? 'Update Bank Details' : 'Save Bank Details'}
              </Button>
              {success && (
                <span className="flex items-center gap-1.5 text-sm text-primary font-medium">
                  <Check size={14} /> Saved successfully!
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
