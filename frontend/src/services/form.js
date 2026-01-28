import api from './api';

export const formService = {
  // Get all forms for current user
  async getAll() {
    const response = await api.get('/forms');
    return response.data;
  },

  // List forms in workspace
  async list(workspaceId) {
    const response = await api.get(`/workspaces/${workspaceId}/forms`);
    return response.data;
  },

  // Get single form
  async getById(id) {
    const response = await api.get(`/forms/${id}`);
    return response.data;
  },

  // Create form (without workspace)
  async create(data) {
    const response = await api.post('/forms', data);
    return response.data;
  },

  // Create form in workspace
  async createInWorkspace(workspaceId, data) {
    const response = await api.post(`/workspaces/${workspaceId}/forms`, data);
    return response.data;
  },

  // Update form
  async update(id, data) {
    const response = await api.put(`/forms/${id}`, data);
    return response.data;
  },

  // Delete form
  async delete(id) {
    const response = await api.delete(`/forms/${id}`);
    return response.data;
  },

  // Duplicate form
  async duplicate(id) {
    const response = await api.post(`/forms/${id}/duplicate`);
    return response.data;
  },

  // Publish form
  async publish(id) {
    const response = await api.put(`/forms/${id}/publish`);
    return response.data;
  },

  // Close form
  async close(id) {
    const response = await api.put(`/forms/${id}/close`);
    return response.data;
  },

  // Add question to form
  async addQuestion(formId, question) {
    const response = await api.post(`/forms/${formId}/questions`, question);
    return response.data;
  },
};

export default formService;
