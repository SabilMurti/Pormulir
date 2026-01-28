import api from './api';

export const authService = {
  // Get Google OAuth URL
  async getGoogleAuthUrl() {
    const response = await api.get('/auth/google');
    return response.data.url;
  },

  // Handle OAuth callback
  async handleCallback(code) {
    const response = await api.get(`/auth/google/callback?code=${code}`);
    return response.data;
  },

  // Get current user
  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Logout
  async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

export default authService;
