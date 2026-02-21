import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck, Eye, EyeOff, Mail } from 'lucide-react';
import { useState, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '@/services/api';

type UserRole = 'manager' | 'dispatcher';

function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('manager');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const formId = useId();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowResendVerification(false);
    setIsLoading(true);

    try {
      const loginData = {
        email,
        passwordHash: password,
      };

      const response = await authAPI.login(loginData);
      
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('accessToken', response.data.accessToken);
      
      // Show success message
      alert(`Welcome back, ${response.data.user.name}!`);
      
      // Redirect to dashboard (you'll need to create this route)
      navigate('/dashboard');
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      
      // Check if error is about email verification
      if (errorMessage.toLowerCase().includes('verify') || errorMessage.toLowerCase().includes('verification')) {
        setShowResendVerification(true);
      }
      
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }

    setIsLoading(true);
    try {
      await authAPI.resendVerification(email);
      alert('✅ Verification email sent! Please check your inbox.');
      setShowResendVerification(false);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await authAPI.sendResetPasswordEmail(resetEmail);
      alert(`Password reset link sent to ${resetEmail}`);
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email.');
      console.error('Password reset error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <div className="w-full max-w-md">
          <button
            onClick={() => navigate('/')}
            className="mb-6 flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            <Truck className="h-6 w-6" />
            <span className="text-xl font-bold">FleetFlow</span>
          </button>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Reset Password
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Enter your email to receive a password reset link
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-5">
              {/* Error Message */}
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor={`${formId}-reset-email`}>Email address</Label>
                <Input
                  id={`${formId}-reset-email`}
                  type="email"
                  placeholder="you@company.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setShowForgotPassword(false)}
              >
                Back to Login
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

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
            <h2 className="text-4xl font-bold mb-4">
              Streamline Your Fleet Management Operations
            </h2>
            <p className="text-lg text-white/90">
              Centralized digital hub for optimizing delivery fleet lifecycle, monitoring driver
              safety, and tracking financial performance.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                ✓
              </div>
              <div>
                <h3 className="font-semibold">Real-time Fleet Tracking</h3>
                <p className="text-sm text-white/80">Monitor all vehicles in real-time</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                ✓
              </div>
              <div>
                <h3 className="font-semibold">Driver Safety Monitoring</h3>
                <p className="text-sm text-white/80">Ensure compliance and safety standards</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                ✓
              </div>
              <div>
                <h3 className="font-semibold">Financial Analytics</h3>
                <p className="text-sm text-white/80">Comprehensive performance tracking</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md">
          <div
            onClick={() => navigate('/')}
            className="mb-8 flex items-center gap-2 lg:hidden cursor-pointer hover:opacity-80 transition-opacity"
          >
            <Truck className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">FleetFlow</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Welcome Back
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Sign in to your FleetFlow account
              </p>
            </div>

            {/* Role Selection */}
            <div className="mb-6">
              <Label className="mb-3 block">Select Your Role</Label>
              <div className="grid grid-cols-2 gap-3">
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
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Error Message */}
              {error && (
                <div className="space-y-3">
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    {error}
                  </div>
                  
                  {/* Resend Verification Button */}
                  {showResendVerification && (
                    <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                      <div className="flex items-start gap-2">
                        <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                            Haven't received the verification email?
                          </p>
                          <button
                            type="button"
                            onClick={handleResendVerification}
                            disabled={isLoading}
                            className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline disabled:opacity-50"
                          >
                            Resend Verification Email
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor={`${formId}-email`}>Email address</Label>
                <Input
                  id={`${formId}-email`}
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`${formId}-password`}>Password</Label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id={`${formId}-password`}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
              </div>

              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-2 focus:ring-primary"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-slate-600 dark:text-slate-400">
                  Remember me for 30 days
                </label>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading 
                  ? 'Signing In...' 
                  : `Sign In as ${selectedRole === 'manager' ? 'Manager' : 'Dispatcher'}`
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
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/signup')}
                className="font-semibold text-primary hover:underline"
              >
                Sign up for free
              </button>
            </p>
          </div>

          <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-500">
            Protected by enterprise-grade security. By signing in, you agree to our{' '}
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

export default LoginPage;
