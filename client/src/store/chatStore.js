import { create } from 'zustand';
import { conversationService } from '@/services/conversationService';
import { messageService } from '@/services/messageService';
import toast from 'react-hot-toast';

export const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  onlineUsers: [],
  typingUsers: [],
  unreadCount: 0,
  isLoading: false,
  isLoadingMessages: false,
  hasMoreMessages: false,
  currentPage: 1,
  searchQuery: '',
  showSearch: false,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setShowSearch: (show) => set({ showSearch: show }),

  fetchConversations: async () => {
    try {
      const { data } = await conversationService.getConversations();
      set({ conversations: data.data });
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  },

  setActiveConversation: (conversation) => {
    set({ activeConversation: conversation, messages: [], currentPage: 1, hasMoreMessages: true });
    if (conversation) {
      get().fetchMessages(conversation._id, true);
    }
  },

  fetchMessages: async (conversationId, reset = false) => {
    const { isLoadingMessages, hasMoreMessages, currentPage } = get();

    if (isLoadingMessages || (!hasMoreMessages && !reset)) return;

    set({ isLoadingMessages: true });

    try {
      const page = reset ? 1 : currentPage + 1;
      const { data } = await messageService.getMessages(conversationId, page);
      const { messages, pagination } = data.data;

      set((state) => ({
        messages: reset ? messages : [...messages, ...state.messages],
        isLoadingMessages: false,
        hasMoreMessages: pagination.hasMore,
        currentPage: page,
      }));
    } catch (error) {
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async (conversationId, content, messageType = 'text', replyTo = null) => {
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('messageType', messageType);
      if (replyTo) formData.append('replyTo', replyTo);

      const { data } = await messageService.sendMessage(conversationId, formData);
      set((state) => ({
        messages: [...state.messages, data.data],
      }));
      get().fetchConversations();
      return data.data;
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  },

  sendFileMessage: async (conversationId, file, messageType = 'file') => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('messageType', messageType);

      const { data } = await messageService.sendMessage(conversationId, formData);
      set((state) => ({
        messages: [...state.messages, data.data],
      }));
      get().fetchConversations();
      return data.data;
    } catch (error) {
      console.error('Failed to send file:', error);
    }
  },

  deleteMessage: async (messageId, deleteForEveryone = false) => {
    try {
      await messageService.deleteMessage(messageId, deleteForEveryone);
      if (deleteForEveryone) {
        set((state) => ({
          messages: state.messages.filter((m) => m._id !== messageId),
        }));
      } else {
        set((state) => ({
          messages: state.messages.map((m) =>
            m._id === messageId ? { ...m, isDeleted: true, content: 'You deleted this message' } : m
          ),
        }));
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  },

  editMessage: async (messageId, content) => {
    try {
      const { data } = await messageService.editMessage(messageId, content);
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === messageId ? { ...m, content: data.data.content, isEdited: true, editedAt: new Date() } : m
        ),
      }));
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  },

  createConversation: async (participantId, isGroup = false, data = {}) => {
    try {
      const payload = isGroup
        ? { participantId, isGroup, ...data }
        : { participantId, isGroup };
      const response = await conversationService.createConversation(payload);
      const conversation = response.data.data;

      set((state) => ({
        conversations: [conversation, ...state.conversations.filter((c) => c._id !== conversation._id)],
        activeConversation: conversation,
      }));
      return conversation;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  },

  pinConversation: async (conversationId) => {
    try {
      await conversationService.pinConversation(conversationId);
      get().fetchConversations();
    } catch (error) {
      console.error('Failed to pin conversation:', error);
    }
  },

  addMessage: (message, conversationId) => {
    const { activeConversation, messages } = get();
    if (activeConversation?._id === conversationId) {
      set({ messages: [...messages, message] });
    }
    set((state) => ({
      unreadCount: state.unreadCount + 1,
    }));
    get().fetchConversations();
  },

  updateMessageStatus: (data) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        data.messageIds?.includes(m._id)
          ? { ...m, readBy: [...(m.readBy || []), { user: data.userId, readAt: new Date() }] }
          : m
      ),
    }));
  },

  setOnlineUsers: (users) => set({ onlineUsers: users }),

  addTypingUser: (userId, conversationId) => {
    set((state) => ({
      typingUsers: state.typingUsers.some((t) => t.userId === userId && t.conversationId === conversationId)
        ? state.typingUsers
        : [...state.typingUsers, { userId, conversationId }],
    }));
  },

  removeTypingUser: (userId, conversationId) => {
    set((state) => ({
      typingUsers: state.typingUsers.filter(
        (t) => !(t.userId === userId && t.conversationId === conversationId)
      ),
    }));
  },

  updateConversationLastMessage: (conversationId, lastMessage) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c._id === conversationId ? { ...c, lastMessage, lastMessageAt: new Date() } : c
      ),
    }));
  },

  updateUserStatus: (userId, status) => {
    set((state) => ({
      conversations: state.conversations.map((c) => ({
        ...c,
        participants: c.participants.map((p) =>
          p._id === userId || p === userId ? { ...p, isOnline: status === 'online', status } : p
        ),
      })),
      onlineUsers: status === 'online'
        ? [...state.onlineUsers.filter((id) => id !== userId), userId]
        : state.onlineUsers.filter((id) => id !== userId),
    }));
  },

  reset: () => set({
    conversations: [],
    activeConversation: null,
    messages: [],
    onlineUsers: [],
    typingUsers: [],
    unreadCount: 0,
    isLoading: false,
    isLoadingMessages: false,
    hasMoreMessages: false,
    currentPage: 1,
  }),
}));
