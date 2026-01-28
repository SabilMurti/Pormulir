import api from './api';

export const questionService = {
  // Add question to form
  async create(formId, data) {
    const response = await api.post(`/forms/${formId}/questions`, data);
    return response.data;
  },

  // Update question
  async update(id, data) {
    const response = await api.put(`/questions/${id}`, data);
    return response.data;
  },

  // Delete question
  async delete(id) {
    const response = await api.delete(`/questions/${id}`);
    return response.data;
  },

  // Reorder questions
  async reorder(formId, order) {
    const response = await api.post(`/forms/${formId}/questions/reorder`, { order });
    return response.data;
  },
};

export default questionService;
