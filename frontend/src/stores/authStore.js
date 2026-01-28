import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/auth';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Set user and token
      setAuth: (token, user = null) => {
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true, error: null });
      },

      // Set user only (after fetching)
      setUser: (user) => {
        set({ user });
      },

      // Clear auth
      clearAuth: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      // Fetch current user
      fetchUser: async () => {
        set({ isLoading: true, error: null });
        try {
          const user = await authService.getCurrentUser();
          set({ user, isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
          if (error.response?.status === 401) {
            get().clearAuth();
          }
        }
      },

      // Logout
      logout: async () => {
        try {
          await authService.logout();
        } catch {
          // Ignore logout errors
        }
        get().clearAuth();
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
