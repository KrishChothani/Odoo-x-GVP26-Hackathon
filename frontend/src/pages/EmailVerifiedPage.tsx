import { Button } from '@/components/ui/button';
import { Truck, CheckCircle, XCircle, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function EmailVerifiedPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  
  const success = searchParams.get('success') === 'true';
  const email = searchParams.get('email');
  const error = searchParams.get('error');

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'missing_token':
        return 'Verification link is missing or invalid.';
      case 'user_not_found':
        return 'User account not found.';
      case 'invalid_token':
        return 'The verification link is invalid.';
      case 'token_expired':
        return 'The verification link has expired. Please request a new one.';
      default:
        return 'An unexpected error occurred during verification.';
    }
  };

  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (success && countdown === 0) {
      navigate('/login');
    }
  }, [countdown, success, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md">
        <div
          onClick={() => navigate('/')}
          className="mb-6 flex items-center justify-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <Truck className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-primary">FleetFlow</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          {success ? (
            // Success State
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              
              <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
                Email Verified! 🎉
              </h1>
              
              <p className="mb-4 text-slate-600 dark:text-slate-400">
                Your email address has been successfully verified.
              </p>
              
              {email && (
                <div className="mb-6 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    <Mail className="inline h-4 w-4 mr-1" />
                    {email}
                  </p>
                </div>
              )}

              <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                You can now log in to your FleetFlow account.
              </p>

              <div className="space-y-3">
                <Button 
                  onClick={() => navigate('/login')} 
                  className="w-full"
                >
                  Go to Login
                </Button>
                
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Redirecting automatically in {countdown} seconds...
                </p>
              </div>
            </div>
          ) : (
            // Error State
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
              </div>
              
              <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
                Verification Failed
              </h1>
              
              <p className="mb-6 text-slate-600 dark:text-slate-400">
                {getErrorMessage(error)}
              </p>

              {error === 'token_expired' && (
                <div className="mb-6 rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Tip:</strong> Verification links expire after 30 minutes for security.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <Button 
                  onClick={() => navigate('/login')} 
                  className="w-full"
                >
                  Go to Login
                </Button>
                
                <Button 
                  onClick={() => navigate('/signup')} 
                  variant="outline"
                  className="w-full"
                >
                  Create New Account
                </Button>
              </div>

              <p className="mt-6 text-xs text-slate-500 dark:text-slate-400">
                Need help?{' '}
                <a href="mailto:support@fleetflow.com" className="text-primary hover:underline">
                  Contact Support
                </a>
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmailVerifiedPage;
