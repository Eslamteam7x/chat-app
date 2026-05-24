import api from './axios';

export const conversationService = {
  getConversations: () => api.get('/conversations'),
  createConversation: (data) => api.post('/conversations', data),
  getConversation: (conversationId) => api.get(`/conversations/${conversationId}`),
  updateGroup: (conversationId, data) => api.put(`/conversations/${conversationId}/group`, data),
  addParticipants: (conversationId, userIds) => api.post(`/conversations/${conversationId}/participants`, { userIds }),
  removeParticipant: (conversationId, userId) => api.delete(`/conversations/${conversationId}/participants/${userId}`),
  leaveGroup: (conversationId) => api.post(`/conversations/${conversationId}/leave`),
  pinConversation: (conversationId) => api.post(`/conversations/${conversationId}/pin`),
};
