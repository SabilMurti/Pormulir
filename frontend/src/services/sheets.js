import api from './api';

const sheetsService = {
  /**
   * Check if user has Google Sheets authorization
   */
  checkAuth: async () => {
    const response = await api.get('/sheets/check-auth');
    return response.data;
  },

  /**
   * Get spreadsheet status for a form
   */
  getStatus: async (formId) => {
    const response = await api.get(`/sheets/forms/${formId}/status`);
    return response.data;
  },

  /**
   * Create new spreadsheet and link to form
   */
  create: async (formId) => {
    const response = await api.post(`/sheets/forms/${formId}/create`);
    return response.data;
  },

  /**
   * Sync all responses to linked spreadsheet
   */
  sync: async (formId) => {
    const response = await api.post(`/sheets/forms/${formId}/sync`);
    return response.data;
  },

  /**
   * Unlink spreadsheet from form
   */
  unlink: async (formId) => {
    const response = await api.delete(`/sheets/forms/${formId}/unlink`);
    return response.data;
  },
};

export default sheetsService;
