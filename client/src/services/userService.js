import api from './axios';

export const userService = {
  searchUsers: (query) => api.get(`/users/search?query=${query}`),
  getUserProfile: (userId) => api.get(`/users/${userId}`),
  updateProfile: (data) => api.put('/users/profile', data),
  updateAvatar: (formData) => api.put('/users/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getContacts: () => api.get('/users/contacts'),
  addContact: (contactId) => api.post('/users/contacts', { contactId }),
  removeContact: (contactId) => api.delete(`/users/contacts/${contactId}`),
  blockUser: (userId) => api.post(`/users/block/${userId}`),
  unblockUser: (userId) => api.post(`/users/unblock/${userId}`),
};
