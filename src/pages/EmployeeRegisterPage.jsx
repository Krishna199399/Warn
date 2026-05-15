import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, UserPlus } from 'lucide-react';
import PublicNavbar from '@/components/PublicNavbar';
import { registerEmployee } from '@/api/auth.api';

const EMPLOYEE_ROLES = [
  { value: 'STATE_HEAD',    label: 'Executive Manager (EM)', description: 'Manages state-wide executive operations' },
  { value: 'ZONAL_MANAGER', label: 'Zonal Manager (ZM)',     description: 'Manages multiple regions in a zone' },
  { value: 'AREA_MANAGER',  label: 'Regional Manager (RM)',  description: 'Manages regional operations' },
  { value: 'DO_MANAGER',    label: 'Development Officer (DO)', description: 'Manages development operations' },
  { value: 'ADVISOR',       label: 'Promotion Representative (PR)', description: 'Field representative for farmers' },
];

const STEPS = [
  { id: 1, title: 'Role Selection', description: 'Choose your role' },
  { id: 2, title: 'Personal Information', description: 'Basic details' },
  { id: 3, title: 'Contact & Address', description: 'Contact information' },
  { id: 4, title: 'Password Setup', description: 'Secure your account' },
];

export default function EmployeeRegisterPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [applicationId, setApplicationId] = useState(null);

  const [formData, setFormData] = useState({
    // Step 1
    appliedRole: '',
    // Step 2
    name: '',
    email: '',
    // Step 3
    phone: '',
    state: '',
    district: '',
    address: '',
    // Step 4
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.appliedRole) newErrors.appliedRole = 'Please select a role';
    }

    if (step === 2) {
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
    }

    if (step === 3) {
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^\d{10}$/.test(formData.phone)) {
        newErrors.phone = 'Phone must be 10 digits';
      }
      if (!formData.state.trim()) newErrors.state = 'State is required';
      if (!formData.district.trim()) newErrors.district = 'District is required';
    }

    if (step === 4) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(4)) return;

    setLoading(true);
    try {
      const response = await registerEmployee({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        appliedRole: formData.appliedRole,
        state: formData.state.trim(),
        district: formData.district.trim(),
        address: formData.address.trim(),
      });

      setApplicationId(response.data.data.applicationId);
      setCurrentStep(5); // Success screen
      toast.success(response.data.message || 'Registration submitted successfully!');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success Screen
  if (currentStep === 5) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <PublicNavbar />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <Card className="border-green-200 shadow-lg">
              <CardHeader className="text-center pb-8">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-green-700">Registration Submitted!</CardTitle>
                <CardDescription className="text-base mt-2">
                  Your application has been received and is pending admin approval
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">Application ID</p>
                  <p className="text-lg font-mono font-bold text-blue-700">{applicationId}</p>
                  <p className="text-xs text-blue-600 mt-1">Save this ID for future reference</p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">What happens next?</h3>
                  <ol className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <span className="font-semibold text-green-600 mr-2">1.</span>
                      <span>Admin will review your application</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold text-green-600 mr-2">2.</span>
                      <span>You will receive your unique employee code once approved</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold text-green-600 mr-2">3.</span>
                      <span>Use your employee code and password to login</span>
                    </li>
                  </ol>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> You cannot login until your registration is approved. 
                    Please wait for admin confirmation.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={() => navigate('/login')} 
                    className="flex-1"
                    variant="outline"
                  >
                    Go to Login
                  </Button>
                  <Button 
                    onClick={() => navigate('/')} 
                    className="flex-1"
                  >
                    Back to Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <PublicNavbar />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <UserPlus className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee Registration</h1>
            <p className="text-gray-600">Join our team - Complete the registration process</p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                      currentStep >= step.id 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {currentStep > step.id ? <CheckCircle2 className="w-6 h-6" /> : step.id}
                    </div>
                    <div className="text-center mt-2">
                      <p className={`text-xs font-medium ${
                        currentStep >= step.id ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </p>
                    </div>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`h-1 flex-1 mx-2 transition-colors ${
                      currentStep > step.id ? 'bg-green-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Card */}
          <Card>
            <CardHeader>
              <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
              <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Step 1: Role Selection */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="role">Select Your Role *</Label>
                      <Select 
                        value={formData.appliedRole} 
                        onValueChange={(value) => handleChange('appliedRole', value)}
                      >
                        <SelectTrigger className={errors.appliedRole ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Choose a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {EMPLOYEE_ROLES.map(role => (
                            <SelectItem key={role.value} value={role.value}>
                              <div>
                                <div className="font-medium">{role.label}</div>
                                <div className="text-xs text-gray-500">{role.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.appliedRole && (
                        <p className="text-sm text-red-500 mt-1">{errors.appliedRole}</p>
                      )}
                    </div>

                    {formData.appliedRole && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-900">
                          <strong>Selected Role:</strong> {EMPLOYEE_ROLES.find(r => r.value === formData.appliedRole)?.label}
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          {EMPLOYEE_ROLES.find(r => r.value === formData.appliedRole)?.description}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Personal Information */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="Enter your full name"
                        className={errors.name ? 'border-red-500' : ''}
                      />
                      {errors.name && (
                        <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="your.email@example.com"
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Contact & Address */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, ''))}
                        placeholder="10-digit mobile number"
                        maxLength={10}
                        className={errors.phone ? 'border-red-500' : ''}
                      />
                      {errors.phone && (
                        <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="state">State *</Label>
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) => handleChange('state', e.target.value)}
                          placeholder="e.g., Karnataka"
                          className={errors.state ? 'border-red-500' : ''}
                        />
                        {errors.state && (
                          <p className="text-sm text-red-500 mt-1">{errors.state}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="district">District *</Label>
                        <Input
                          id="district"
                          value={formData.district}
                          onChange={(e) => handleChange('district', e.target.value)}
                          placeholder="e.g., Bangalore"
                          className={errors.district ? 'border-red-500' : ''}
                        />
                        {errors.district && (
                          <p className="text-sm text-red-500 mt-1">{errors.district}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">Address (Optional)</Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        placeholder="Enter your full address"
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {/* Step 4: Password Setup */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        placeholder="At least 6 characters"
                        className={errors.password ? 'border-red-500' : ''}
                      />
                      {errors.password && (
                        <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleChange('confirmPassword', e.target.value)}
                        placeholder="Re-enter your password"
                        className={errors.confirmPassword ? 'border-red-500' : ''}
                      />
                      {errors.confirmPassword && (
                        <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>
                      )}
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-amber-800">
                        <strong>Important:</strong> Remember this password. You will use it along with 
                        your employee code to login after approval.
                      </p>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-3 pt-4">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      disabled={loading}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                  )}

                  {currentStep < 4 ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="ml-auto"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={loading}
                      className="ml-auto"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Registration'
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Footer Links */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Login here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
