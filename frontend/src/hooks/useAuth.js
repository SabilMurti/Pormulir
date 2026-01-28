import { useAuthStore } from '../stores/authStore';
import authService from '../services/auth';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

export function useAuth() {
  const { user, token, isAuthenticated, isLoading, error, setAuth, clearAuth, fetchUser, logout } = useAuthStore();
  const navigate = useNavigate();

  const loginWithGoogle = useCallback(async () => {
    try {
      const url = await authService.getGoogleAuthUrl();
      window.location.href = url;
    } catch (err) {
      console.error('Failed to get Google auth URL:', err);
    }
  }, []);

  const handleCallback = useCallback(async (code) => {
    try {
      const { user, token } = await authService.handleCallback(code);
      setAuth(user, token);
      navigate('/dashboard');
      return true;
    } catch (err) {
      console.error('OAuth callback failed:', err);
      return false;
    }
  }, [setAuth, navigate]);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/');
  }, [logout, navigate]);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    loginWithGoogle,
    handleCallback,
    logout: handleLogout,
    fetchUser,
  };
}

export default useAuth;
