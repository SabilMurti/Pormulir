import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { PageLoader } from '../components/ui/Loading';
import authService from '../services/auth';

export function LoginCallback() {
  const navigate = useNavigate();
  const { setAuth, fetchUser } = useAuthStore();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      // Get token from URL hash
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.substring(1)); // Remove the # symbol
      const token = params.get('token');
      const errorMsg = params.get('error');

      if (errorMsg) {
        setError(decodeURIComponent(errorMsg));
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (token) {
        try {
          // Save token to store (also saves to localStorage)
          setAuth(token, null);
          
          // Fetch user data using the token
          const user = await authService.getCurrentUser();
          
          if (user) {
            // Update store with user data
            setAuth(token, user);
            
            // Check for pending redirect (e.g. from public form)
            const redirectUrl = localStorage.getItem('redirect_url');
            if (redirectUrl) {
              localStorage.removeItem('redirect_url');
              window.location.href = redirectUrl; // Use window location for full reload/external
            } else {
              // Redirect to dashboard
              navigate('/dashboard', { replace: true });
            }
          } else {
            throw new Error('Failed to get user data');
          }
        } catch (err) {
          console.error('Failed to authenticate:', err);
          setError('Failed to authenticate. Please try again.');
          localStorage.removeItem('token');
          setTimeout(() => navigate('/login'), 3000);
        }
      } else {
        setError('No authentication token received');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [navigate, setAuth, fetchUser]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Authentication Failed</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <p className="text-sm text-slate-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <PageLoader />
        <p className="mt-4 text-slate-600">Completing authentication...</p>
      </div>
    </div>
  );
}

export default LoginCallback;
