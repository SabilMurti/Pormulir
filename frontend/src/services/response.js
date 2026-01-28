import api from './api';

export const responseService = {
  // List responses for a form
  async list(formId, params = {}) {
    const response = await api.get(`/forms/${formId}/responses`, { params });
    return response.data;
  },

  // Alias for list
  async getByForm(formId, params = {}) {
    return this.list(formId, params);
  },

  // Get single response detail
  async get(formId, sessionId) {
    const response = await api.get(`/forms/${formId}/responses/${sessionId}`);
    return response.data;
  },

  // Delete response
  async delete(formId, sessionId) {
    const response = await api.delete(`/forms/${formId}/responses/${sessionId}`);
    return response.data;
  },

  // Delete all responses
  async deleteAll(formId) {
    const response = await api.delete(`/forms/${formId}/responses`);
    return response.data;
  },

  // Export responses
  async export(formId, format = 'xlsx') {
    const response = await api.get(`/forms/${formId}/responses/export`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },

  // Get summary statistics
  async getSummary(formId) {
    const response = await api.get(`/forms/${formId}/summary`);
    return response.data;
  },
};

export default responseService;
