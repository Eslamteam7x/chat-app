import api from './axios';

export const messageService = {
  getMessages: (conversationId, page = 1, limit = 50) =>
    api.get(`/messages/${conversationId}?page=${page}&limit=${limit}`),
  sendMessage: (conversationId, data) => api.post(`/messages/${conversationId}`, data),
  editMessage: (messageId, content) => api.put(`/messages/${messageId}/edit`, { content }),
  deleteMessage: (messageId, deleteForEveryone = false) => api.delete(`/messages/${messageId}`, { data: { deleteForEveryone } }),
  markAsRead: (messageIds) => api.post('/messages/read', { messageIds }),
};
