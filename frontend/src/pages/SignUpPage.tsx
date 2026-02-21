import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck, Eye, EyeOff, Upload } from 'lucide-react';
import { useState, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '@/services/api';

type UserRole = 'manager' | 'dispatcher';

function SignUpPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('dispatcher');
  const [showPassword, setShowPassword] = useState(false);
  const [licenceImage, setLicenceImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formId = useId();
  const navigate = useNavigate();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLicenceImage(e.target.files[0]);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      
      const signUpData = {
        role: selectedRole.toUpperCase() as 'MANAGER' | 'DISPATCHER',
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        passwordHash: formData.get('password') as string,
        ...(selectedRole === 'dispatcher' && {
          licenceNumber: formData.get('licenceNumber') as string,
          licenceExpiry: formData.get('licenceExpiry') as string,
          licenceImage: licenceImage!,
        }),
      };

      await authAPI.register(signUpData);
      
      // Show success message with email verification instructions
      alert(
        '✅ Registration Successful!\n\n' +
        'Please check your email inbox to verify your account.\n\n' +
        'Note: You must verify your email before you can log in.'
      );
      
      // Redirect to login
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
      console.error('Sign up error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=1200&h=1200&fit=crop"
            alt="Logistics operations"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-slate-900/90" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <Truck className="h-8 w-8" />
            <span className="text-2xl font-bold">FleetFlow</span>
          </div>
          <div>
            <h2 className="text-4xl font-bold mb-4">Join FleetFlow Today</h2>
            <p className="text-lg text-white/90">
              Create your account and start optimizing your fleet management operations with our 
              centralized digital platform.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                ✓
              </div>
              <div>
                <h3 className="font-semibold">Role-Based Access</h3>
                <p className="text-sm text-white/80">Choose between Manager or Dispatcher roles</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                ✓
              </div>
              <div>
                <h3 className="font-semibold">Secure Platform</h3>
                <p className="text-sm text-white/80">Enterprise-grade security and compliance</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                ✓
              </div>
              <div>
                <h3 className="font-semibold">Quick Setup</h3>
                <p className="text-sm text-white/80">Get started in minutes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Sign Up Form */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md">
          <div
            onClick={() => navigate('/')}
            className="mb-8 flex items-center gap-2 lg:hidden cursor-pointer hover:opacity-80 transition-opacity"
          >
            <Truck className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">FleetFlow</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-800 dark:bg-slate-900 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Create Your Account
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Sign up to get started with FleetFlow
              </p>
            </div>

            {/* Role Selection */}
            <div className="mb-6">
              <Label className="mb-3 block">Select Your Role</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole('dispatcher')}
                  className={`rounded-lg border-2 p-4 text-center transition-all ${
                    selectedRole === 'dispatcher'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400'
                  }`}
                >
                  <div className="text-lg font-semibold">Dispatcher</div>
                  <div className="text-xs">Operations</div>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('manager')}
                  className={`rounded-lg border-2 p-4 text-center transition-all ${
                    selectedRole === 'manager'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400'
                  }`}
                >
                  <div className="text-lg font-semibold">Manager</div>
                  <div className="text-xs">Full access</div>
                </button>
              </div>
            </div>

            <form onSubmit={handleSignUp} className="space-y-5">
              {/* Error Message */}
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
              )}

              {/* Common Fields */}
              <div className="space-y-2">
                <Label htmlFor={`${formId}-name`}>Full Name</Label>
                <Input
                  id={`${formId}-name`}
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-email`}>Email Address</Label>
                <Input
                  id={`${formId}-email`}
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-phone`}>Phone Number</Label>
                <Input
                  id={`${formId}-phone`}
                  name="phone"
                  type="tel"
                  placeholder="+1234567890"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-password`}>Password</Label>
                <div className="relative">
                  <Input
                    id={`${formId}-password`}
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Must be at least 8 characters long
                </p>
              </div>

              {/* Dispatcher-specific Fields */}
              {selectedRole === 'dispatcher' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor={`${formId}-licenceNumber`}>Licence Number</Label>
                    <Input
                      id={`${formId}-licenceNumber`}
                      name="licenceNumber"
                      type="text"
                      placeholder="DL123456789"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`${formId}-licenceExpiry`}>Licence Expiry Date</Label>
                    <Input
                      id={`${formId}-licenceExpiry`}
                      name="licenceExpiry"
                      type="date"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`${formId}-licenceImage`}>Licence Image</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id={`${formId}-licenceImage`}
                        name="licenceImage"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        required
                      />
                      <label
                        htmlFor={`${formId}-licenceImage`}
                        className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                      >
                        <Upload className="h-4 w-4" />
                        {licenceImage ? licenceImage.name : 'Upload Licence Image'}
                      </label>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Upload a clear photo of your driver's licence
                    </p>
                  </div>
                </>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading 
                  ? 'Signing Up...' 
                  : `Sign Up as ${selectedRole === 'dispatcher' ? 'Dispatcher' : 'Manager'}`
                }
              </Button>
            </form>

            <div className="mt-6 flex items-center gap-3 before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
              <span className="text-xs text-muted-foreground">Or continue with</span>
            </div>

            <Button variant="outline" className="mt-4 w-full">
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="font-semibold text-primary hover:underline"
              >
                Sign in
              </button>
            </p>
          </div>

          <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-500">
            By signing up, you agree to our{' '}
            <a href="#" className="underline hover:no-underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="underline hover:no-underline">
              Privacy Policy
            </a>
            .
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;
