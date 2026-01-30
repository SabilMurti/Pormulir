import api from './api';

const mediaService = {
  // Get all media (with optional filter by type)
  list: (type) => api.get('/media', { params: { type } }),
  
  // Upload image file
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/media/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  // Upload document file
  uploadDocument: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/media/upload/document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  // Upload image from URL
  uploadImageUrl: (url) => api.post('/media/upload/image-url', { url }),
  
  // Add video embed link
  addVideoEmbed: (url) => api.post('/media/video-embed', { url }),
  
  // Delete media
  delete: (id) => api.delete(`/media/${id}`),
};

export default mediaService;
