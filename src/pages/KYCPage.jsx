import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usersApi } from '../api/users.api';
import { 
  User, CreditCard, Building2, MapPin, AlertCircle, CheckCircle, Clock, XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function KYCPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [sameAsCurrentAddress, setSameAsCurrentAddress] = useState(false);
  const [kycData, setKycData] = useState(null);
  const [loadingKyc, setLoadingKyc] = useState(true);

  // Load existing KYC data
  useEffect(() => {
    const loadKycData = async () => {
      try {
        const response = await usersApi.getKYC();
        const kyc = response.data.data;
        setKycData(kyc);
        
        if (kyc && Object.keys(kyc).length > 0) {
          setFormData({
            fullName: kyc.fullName || user?.name || '',
            dateOfBirth: kyc.dateOfBirth ? kyc.dateOfBirth.slice(0, 10) : '',
            gender: kyc.gender || '',
            fatherName: kyc.fatherName || '',
            panNumber: kyc.panNumber || '',
            aadhaarNumber: kyc.aadhaarNumber || '',
            accountHolderName: kyc.accountHolderName || '',
            bankName: kyc.bankName || '',
            accountNumber: kyc.accountNumber || '',
            confirmAccountNumber: kyc.accountNumber || '',
            ifscCode: kyc.ifscCode || '',
            branchName: kyc.branchName || '',
            accountType: kyc.accountType || 'SAVINGS',
            currentAddress: kyc.currentAddress || '',
            currentCity: kyc.currentCity || '',
            currentState: kyc.currentState || '',
            currentPinCode: kyc.currentPinCode || '',
            permanentAddress: kyc.permanentAddress || '',
            permanentCity: kyc.permanentCity || '',
            permanentState: kyc.permanentState || '',
            permanentPinCode: kyc.permanentPinCode || '',
          });
        }
      } catch (error) {
        console.error('Failed to load KYC data:', error);
      } finally {
        setLoadingKyc(false);
      }
    };

    loadKycData();
  }, [user]);

  const [formData, setFormData] = useState({
    // Personal Information
    fullName: user?.name || '',
    dateOfBirth: '',
    gender: '',
    fatherName: '',
    panNumber: '',
    
    // Aadhaar Details
    aadhaarNumber: '',
    
    // Bank Details
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    branchName: '',
    accountType: 'SAVINGS',
    
    // Current Address
    currentAddress: '',
    currentCity: '',
    currentState: '',
    currentPinCode: '',
    
    // Permanent Address
    permanentAddress: '',
    permanentCity: '',
    permanentState: '',
    permanentPinCode: '',
  });

  const [kycStatus, setKycStatus] = useState({
    personal: false,
    aadhaar: false,
    bank: false,
    address: false,
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSameAddress = (checked) => {
    setSameAsCurrentAddress(checked);
    if (checked) {
      setFormData(prev => ({
        ...prev,
        permanentAddress: prev.currentAddress,
        permanentCity: prev.currentCity,
        permanentState: prev.currentState,
        permanentPinCode: prev.currentPinCode,
      }));
    }
  };

  const validateAadhaar = (number) => {
    return /^\d{12}$/.test(number.replace(/\s/g, ''));
  };

  const validatePAN = (number) => {
    return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(number.toUpperCase());
  };

  const validateIFSC = (code) => {
    return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(code.toUpperCase());
  };

  const validatePinCode = (code) => {
    return /^\d{6}$/.test(code);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validations
    if (!validateAadhaar(formData.aadhaarNumber)) {
      toast.error('Invalid Aadhaar number. Must be 12 digits.');
      setActiveTab('aadhaar');
      return;
    }

    if (formData.panNumber && !validatePAN(formData.panNumber)) {
      toast.error('Invalid PAN number format.');
      setActiveTab('personal');
      return;
    }

    if (!validateIFSC(formData.ifscCode)) {
      toast.error('Invalid IFSC code format.');
      setActiveTab('bank');
      return;
    }

    if (formData.accountNumber !== formData.confirmAccountNumber) {
      toast.error('Account numbers do not match.');
      setActiveTab('bank');
      return;
    }

    if (!validatePinCode(formData.currentPinCode)) {
      toast.error('Invalid PIN code. Must be 6 digits.');
      setActiveTab('address');
      return;
    }

    setLoading(true);
    try {
      const response = await usersApi.updateKYC(formData);
      setKycData(response.data.data);
      toast.success('KYC details submitted successfully! Waiting for admin approval.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit KYC details');
    } finally {
      setLoading(false);
    }
  };

  // Get KYC status info
  const getKycStatusInfo = () => {
    if (!kycData || !kycData.status) {
      return {
        status: 'NOT_SUBMITTED',
        icon: AlertCircle,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        title: 'KYC Not Submitted',
        description: 'Complete all sections to submit your KYC for verification'
      };
    }

    switch (kycData.status) {
      case 'PENDING':
        return {
          status: 'PENDING',
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          title: 'KYC Under Review',
          description: 'Your KYC details are submitted and waiting for admin approval'
        };
      case 'VERIFIED':
        return {
          status: 'VERIFIED',
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          title: 'KYC Verified',
          description: 'Your KYC has been approved. You can now receive payments.'
        };
      case 'REJECTED':
        return {
          status: 'REJECTED',
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          title: 'KYC Rejected',
          description: kycData.rejectionReason || 'Your KYC was rejected. Please update and resubmit.'
        };
      default:
        return {
          status: 'NOT_SUBMITTED',
          icon: AlertCircle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          title: 'KYC Not Submitted',
          description: 'Complete all sections to submit your KYC for verification'
        };
    }
  };

  const statusInfo = getKycStatusInfo();
  const isReadOnly = kycData?.status === 'VERIFIED';
  const canEdit = !kycData?.status || kycData?.status === 'REJECTED';

  if (loadingKyc) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="KYC Verification"
          description="Complete your Know Your Customer (KYC) verification"
        />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="KYC Verification"
        description="Complete your Know Your Customer (KYC) verification"
      />

      {/* KYC Status Banner */}
      <Card className={`${statusInfo.borderColor} ${statusInfo.bgColor}`}>
        <CardContent className="flex items-center gap-3 p-4">
          <statusInfo.icon className={statusInfo.color} size={20} />
          <div className="flex-1">
            <p className={`text-sm font-medium ${statusInfo.color.replace('text-', 'text-')}`}>
              {statusInfo.title}
            </p>
            <p className={`text-xs ${statusInfo.color.replace('600', '700')}`}>
              {statusInfo.description}
            </p>
            {kycData?.submittedAt && (
              <p className={`text-xs ${statusInfo.color.replace('600', '500')} mt-1`}>
                Submitted: {new Date(kycData.submittedAt).toLocaleDateString()}
              </p>
            )}
            {kycData?.verifiedAt && (
              <p className={`text-xs ${statusInfo.color.replace('600', '500')} mt-1`}>
                Verified: {new Date(kycData.verifiedAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <Badge variant={statusInfo.status === 'VERIFIED' ? 'default' : 
                         statusInfo.status === 'PENDING' ? 'secondary' : 
                         statusInfo.status === 'REJECTED' ? 'destructive' : 'outline'}>
            {statusInfo.status === 'NOT_SUBMITTED' ? 'Not Submitted' : statusInfo.status}
          </Badge>
        </CardContent>
      </Card>

      {/* Show form only if not verified or if rejected (can resubmit) */}
      {canEdit && (
        <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal" className="text-xs">
              <User size={14} className="mr-1" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="aadhaar" className="text-xs">
              <CreditCard size={14} className="mr-1" />
              Aadhaar
            </TabsTrigger>
            <TabsTrigger value="bank" className="text-xs">
              <Building2 size={14} className="mr-1" />
              Bank
            </TabsTrigger>
            <TabsTrigger value="address" className="text-xs">
              <MapPin size={14} className="mr-1" />
              Address
            </TabsTrigger>
          </TabsList>

          {/* Personal Information */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name (as per Aadhaar) *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="Enter full name"
                      disabled={isReadOnly}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      disabled={isReadOnly}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select 
                      value={formData.gender} 
                      onValueChange={(v) => handleInputChange('gender', v)}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fatherName">Father's/Spouse Name *</Label>
                    <Input
                      id="fatherName"
                      value={formData.fatherName}
                      onChange={(e) => handleInputChange('fatherName', e.target.value)}
                      placeholder="Enter father's or spouse name"
                      disabled={isReadOnly}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="panNumber">PAN Number (Optional)</Label>
                    <Input
                      id="panNumber"
                      value={formData.panNumber}
                      onChange={(e) => handleInputChange('panNumber', e.target.value.toUpperCase())}
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      disabled={isReadOnly}
                    />
                    <p className="text-xs text-muted-foreground">Format: ABCDE1234F</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aadhaar Details */}
          <TabsContent value="aadhaar">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Aadhaar Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="aadhaarNumber">Aadhaar Number *</Label>
                  <Input
                    id="aadhaarNumber"
                    value={formData.aadhaarNumber}
                    onChange={(e) => handleInputChange('aadhaarNumber', e.target.value.replace(/\D/g, ''))}
                    placeholder="1234 5678 9012"
                    maxLength={12}
                    disabled={isReadOnly}
                    required
                  />
                  <p className="text-xs text-muted-foreground">12-digit Aadhaar number</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bank Details */}
          <TabsContent value="bank">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bank Account Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="accountHolderName">Account Holder Name *</Label>
                    <Input
                      id="accountHolderName"
                      value={formData.accountHolderName}
                      onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                      placeholder="As per bank records"
                      disabled={isReadOnly}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name *</Label>
                    <Input
                      id="bankName"
                      value={formData.bankName}
                      onChange={(e) => handleInputChange('bankName', e.target.value)}
                      placeholder="e.g., State Bank of India"
                      disabled={isReadOnly}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number *</Label>
                    <Input
                      id="accountNumber"
                      value={formData.accountNumber}
                      onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                      placeholder="Enter account number"
                      disabled={isReadOnly}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmAccountNumber">Confirm Account Number *</Label>
                    <Input
                      id="confirmAccountNumber"
                      value={formData.confirmAccountNumber}
                      onChange={(e) => handleInputChange('confirmAccountNumber', e.target.value)}
                      placeholder="Re-enter account number"
                      disabled={isReadOnly}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ifscCode">IFSC Code *</Label>
                    <Input
                      id="ifscCode"
                      value={formData.ifscCode}
                      onChange={(e) => handleInputChange('ifscCode', e.target.value.toUpperCase())}
                      placeholder="SBIN0001234"
                      maxLength={11}
                      disabled={isReadOnly}
                      required
                    />
                    <p className="text-xs text-muted-foreground">11-character IFSC code</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="branchName">Branch Name *</Label>
                    <Input
                      id="branchName"
                      value={formData.branchName}
                      onChange={(e) => handleInputChange('branchName', e.target.value)}
                      placeholder="Enter branch name"
                      disabled={isReadOnly}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountType">Account Type *</Label>
                    <Select 
                      value={formData.accountType} 
                      onValueChange={(v) => handleInputChange('accountType', v)}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SAVINGS">Savings Account</SelectItem>
                        <SelectItem value="CURRENT">Current Account</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Address Details */}
          <TabsContent value="address">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Address Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Address */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Current Address</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="currentAddress">Address Line *</Label>
                      <Input
                        id="currentAddress"
                        value={formData.currentAddress}
                        onChange={(e) => handleInputChange('currentAddress', e.target.value)}
                        placeholder="House/Flat No., Street, Area"
                        disabled={isReadOnly}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currentCity">City *</Label>
                      <Input
                        id="currentCity"
                        value={formData.currentCity}
                        onChange={(e) => handleInputChange('currentCity', e.target.value)}
                        placeholder="Enter city"
                        disabled={isReadOnly}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currentState">State *</Label>
                      <Input
                        id="currentState"
                        value={formData.currentState}
                        onChange={(e) => handleInputChange('currentState', e.target.value)}
                        placeholder="Enter state"
                        disabled={isReadOnly}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currentPinCode">PIN Code *</Label>
                      <Input
                        id="currentPinCode"
                        value={formData.currentPinCode}
                        onChange={(e) => handleInputChange('currentPinCode', e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        maxLength={6}
                        disabled={isReadOnly}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Permanent Address */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Permanent Address</h3>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sameAddress"
                        checked={sameAsCurrentAddress}
                        onCheckedChange={handleSameAddress}
                      />
                      <Label htmlFor="sameAddress" className="text-sm cursor-pointer">
                        Same as current address
                      </Label>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="permanentAddress">Address Line *</Label>
                      <Input
                        id="permanentAddress"
                        value={formData.permanentAddress}
                        onChange={(e) => handleInputChange('permanentAddress', e.target.value)}
                        placeholder="House/Flat No., Street, Area"
                        disabled={sameAsCurrentAddress || isReadOnly}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="permanentCity">City *</Label>
                      <Input
                        id="permanentCity"
                        value={formData.permanentCity}
                        onChange={(e) => handleInputChange('permanentCity', e.target.value)}
                        placeholder="Enter city"
                        disabled={sameAsCurrentAddress || isReadOnly}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="permanentState">State *</Label>
                      <Input
                        id="permanentState"
                        value={formData.permanentState}
                        onChange={(e) => handleInputChange('permanentState', e.target.value)}
                        placeholder="Enter state"
                        disabled={sameAsCurrentAddress || isReadOnly}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="permanentPinCode">PIN Code *</Label>
                      <Input
                        id="permanentPinCode"
                        value={formData.permanentPinCode}
                        onChange={(e) => handleInputChange('permanentPinCode', e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        maxLength={6}
                        disabled={sameAsCurrentAddress || isReadOnly}
                        required
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Submit Button */}
        {canEdit && (
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => window.history.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} onClick={handleSubmit}>
              {loading ? 'Submitting...' : kycData?.status === 'REJECTED' ? 'Resubmit KYC Details' : 'Submit KYC Details'}
            </Button>
          </div>
        )}
        </form>
      )}

      {/* Show read-only view for verified KYC */}
      {isReadOnly && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="text-green-600" size={20} />
              KYC Details (Verified)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Full Name</Label>
                <p className="font-medium">{kycData.fullName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Date of Birth</Label>
                <p className="font-medium">{kycData.dateOfBirth ? new Date(kycData.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Gender</Label>
                <p className="font-medium">{kycData.gender || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Father's/Spouse Name</Label>
                <p className="font-medium">{kycData.fatherName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">PAN Number</Label>
                <p className="font-medium">{kycData.panNumber || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Aadhaar Number</Label>
                <p className="font-medium">XXXX XXXX {kycData.aadhaarNumber?.slice(-4) || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Bank Name</Label>
                <p className="font-medium">{kycData.bankName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Account Number</Label>
                <p className="font-medium">XXXXXX{kycData.accountNumber?.slice(-4) || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">IFSC Code</Label>
                <p className="font-medium">{kycData.ifscCode}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Current Address</Label>
                <p className="font-medium">{kycData.currentAddress}, {kycData.currentCity}, {kycData.currentState} - {kycData.currentPinCode}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
