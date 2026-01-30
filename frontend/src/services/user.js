import api from './api';

const userService = {
  lookup: async (email) => {
    return api.post('/users/lookup', { email });
  },
  
  batchLookup: async (emails) => {
    return api.post('/users/lookup', { emails });
  }
};

export default userService;
