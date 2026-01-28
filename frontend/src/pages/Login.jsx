import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Sparkles, Shield, BarChart3 } from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuthStore } from '../stores/authStore';
import authService from '../services/auth';

const features = [
  { icon: Sparkles, text: 'AI-powered question generation' },
  { icon: Shield, text: 'Secure exam mode with anti-cheat' },
  { icon: BarChart3, text: 'Real-time analytics dashboard' },
];

export function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, setAuth, fetchUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Listen for postMessage from OAuth popup
  useEffect(() => {
    const handleMessage = async (event) => {
      // Validate origin if needed
      if (event.data?.type === 'oauth-success') {
        const { token, user } = event.data;
        setAuth(token, user);
        await fetchUser();
        navigate('/dashboard', { replace: true });
      } else if (event.data?.type === 'oauth-error') {
        setError(event.data.error || 'Authentication failed');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setAuth, fetchUser, navigate]);

  // Check for error in URL hash (from redirect fallback)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('error=')) {
      const params = new URLSearchParams(hash.substring(1));
      const errorMsg = params.get('error');
      if (errorMsg) {
        setError(decodeURIComponent(errorMsg));
        // Clear the hash
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const url = await authService.getGoogleAuthUrl();
      
      // Try popup first
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        url,
        'google-oauth',
        `width=${width},height=${height},left=${left},top=${top},popup=yes`
      );
      
      // If popup was blocked, fall back to redirect
      if (!popup || popup.closed) {
        window.location.href = url;
        return;
      }
      
      // Poll to check if popup is closed
      const pollTimer = setInterval(() => {
        if (popup.closed) {
          clearInterval(pollTimer);
          setIsLoading(false);
        }
      }, 500);
      
    } catch (error) {
      console.error('Failed to initiate Google login:', error);
      setError('Failed to start authentication. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary-400/30 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-60 h-60 bg-accent-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl text-white">Pormulir</span>
          </div>

          {/* Tagline */}
          <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
            Build forms that
            <span className="block text-accent-300">people love to fill</span>
          </h1>

          <p className="text-lg text-white/70 mb-10 max-w-md">
            Create beautiful surveys, quizzes, and exams with AI-powered assistance. 
            Collect responses and analyze results effortlessly.
          </p>

          {/* Features */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 text-white/80">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <feature.icon className="w-4 h-4" />
                </div>
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl text-slate-900">Pormulir</span>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Welcome back
              </h2>
              <p className="text-slate-600">
                Sign in to continue to Pormulir
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Google Login Button */}
            <Button
              variant="secondary"
              size="lg"
              className="w-full mb-4 gap-3 py-3"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-primary-600 rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-500">or</span>
              </div>
            </div>

            {/* Email Form (disabled for now) */}
            <div className="space-y-4 opacity-50 pointer-events-none">
              <input
                type="email"
                placeholder="Email address"
                className="input"
                disabled
              />
              <input
                type="password"
                placeholder="Password"
                className="input"
                disabled
              />
              <Button className="w-full" disabled>
                Sign in with Email
              </Button>
            </div>

            <p className="text-center text-xs text-slate-500 mt-6">
              Email login coming soon. Use Google to sign in now.
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-slate-500 mt-8">
            By signing in, you agree to our{' '}
            <a href="#" className="text-primary-600 hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-primary-600 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
