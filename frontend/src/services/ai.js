import api from './api';

export const aiService = {
  // Generate questions from topic
  async generate(data) {
    const response = await api.post('/ai/generate', data);
    return response.data;
  },

  // Generate from file
  async generateFromFile(file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);
    Object.keys(options).forEach(key => {
      formData.append(key, options[key]);
    });
    
    const response = await api.post('/ai/generate-from-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Improve question
  async improve(data) {
    const response = await api.post('/ai/improve', data);
    return response.data;
  },

  // Add AI questions to form
  async addToForm(formId, questions) {
    const response = await api.post(`/ai/forms/${formId}/add-questions`, { questions });
    return response.data;
  },

  // Get AI usage stats
  async getUsage() {
    const response = await api.get('/ai/usage');
    return response.data;
  },
};

export default aiService;
