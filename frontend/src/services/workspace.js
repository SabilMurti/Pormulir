import api from './api';

export const workspaceService = {
  // List all workspaces
  async getAll() {
    const response = await api.get('/workspaces');
    return response.data;
  },

  // Get single workspace
  async getById(id) {
    const response = await api.get(`/workspaces/${id}`);
    return response.data;
  },

  // Create workspace
  async create(data) {
    const response = await api.post('/workspaces', data);
    return response.data;
  },

  // Update workspace
  async update(id, data) {
    const response = await api.put(`/workspaces/${id}`, data);
    return response.data;
  },

  // Delete workspace
  async delete(id) {
    const response = await api.delete(`/workspaces/${id}`);
    return response.data;
  },

  // Invite member
  async invite(id, data) {
    const response = await api.post(`/workspaces/${id}/invite`, data);
    return response.data;
  },
};

export default workspaceService;
