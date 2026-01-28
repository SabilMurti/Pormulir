import api from './api';

export const publicFormService = {
  // Get public form by slug
  async get(slug, preview = false) {
    const params = preview ? { preview: 'true' } : {};
    const response = await api.get(`/f/${slug}`, { params });
    return response.data;
  },

  // Alias for backward compatibility
  async getBySlug(slug, preview = false) {
    return this.get(slug, preview);
  },

  // Start session
  async startSession(slug, data) {
    const response = await api.post(`/f/${slug}/start`, data);
    return response.data;
  },

  // Submit responses (direct, without session)
  async submit(slug, data) {
    const response = await api.post(`/f/${slug}/submit-direct`, data);
    return response.data;
  },

  // Submit with session (for exam mode)
  async submitWithSession(slug, data) {
    const response = await api.post(`/f/${slug}/submit`, data);
    return response.data;
  },

  // Log violation
  async logViolation(slug, data) {
    const response = await api.post(`/f/${slug}/violation`, data);
    return response.data;
  },

  // Get results
  async getResults(slug, sessionId) {
    const response = await api.get(`/f/${slug}/results`, {
      params: { session_id: sessionId },
    });
    return response.data;
  },
};

export default publicFormService;
