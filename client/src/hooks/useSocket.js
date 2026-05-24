'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { initializeSocket, getSocket, disconnectSocket } from '@/sockets/socket';

export const useSocket = () => {
  const { token, user, isAuthenticated } = useAuthStore();
  const {
    addMessage,
    updateMessageStatus,
    addTypingUser,
    removeTypingUser,
    updateUserStatus,
    updateConversationLastMessage,
    fetchConversations,
    setActiveConversation,
  } = useChatStore();

  const initialized = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !token || initialized.current) return;

    const socket = initializeSocket(token);
    initialized.current = true;

    socket.on('new_message', (data) => {
      const { message, conversationId } = data;
      addMessage(message, conversationId);
    });

    socket.on('message_sent', (data) => {
      const { message, conversationId } = data;
      addMessage(message, conversationId);
    });

    socket.on('message_edited', (data) => {
      const { messageId, content, editedAt, conversationId } = data;
      useChatStore.setState((state) => ({
        messages: state.messages.map((m) =>
          m._id === messageId ? { ...m, content, isEdited: true, editedAt } : m
        ),
      }));
    });

    socket.on('message_deleted', (data) => {
      const { messageId, deleteForEveryone, userId } = data;
      useChatStore.setState((state) => ({
        messages: state.messages.map((m) =>
          m._id === messageId
            ? deleteForEveryone
              ? { ...m, isDeleted: true, content: 'This message was deleted' }
              : m.sender._id === userId || m.sender === userId
                ? { ...m, isDeleted: true, content: 'You deleted this message' }
                : m
            : m
        ),
      }));
    });

    socket.on('messages_read', (data) => {
      updateMessageStatus(data);
    });

    socket.on('user_typing', (data) => {
      const { userId, conversationId } = data;
      addTypingUser(userId, conversationId);
    });

    socket.on('user_stop_typing', (data) => {
      const { userId, conversationId } = data;
      removeTypingUser(userId, conversationId);
    });

    socket.on('user_status', (data) => {
      const { userId, status, lastSeen } = data;
      updateUserStatus(userId, status);
    });

    socket.on('conversation_updated', (data) => {
      const { conversationId, lastMessage } = data;
      updateConversationLastMessage(conversationId, lastMessage);
    });

    return () => {
      socket.off('new_message');
      socket.off('message_sent');
      socket.off('message_edited');
      socket.off('message_deleted');
      socket.off('messages_read');
      socket.off('user_typing');
      socket.off('user_stop_typing');
      socket.off('user_status');
      socket.off('conversation_updated');
    };
  }, [isAuthenticated, token]);

  const emitTyping = (conversationId, isTyping) => {
    const socket = getSocket();
    if (!socket) return;

    if (isTyping) {
      socket.emit('typing_start', { conversationId });
    } else {
      socket.emit('typing_stop', { conversationId });
    }
  };

  const emitMessageRead = (conversationId, messageIds) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('mark_read', { conversationId, messageIds });
    }
  };

  const emitSendMessage = (data) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('send_message', data, (response) => {
        if (!response.success) {
          console.error('Failed to send message via socket:', response.error);
        }
      });
    }
  };

  const emitDeleteMessage = (messageId, deleteForEveryone = false) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('delete_message', { messageId, deleteForEveryone });
    }
  };

  const emitEditMessage = (messageId, content) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('edit_message', { messageId, content });
    }
  };

  return {
    emitTyping,
    emitMessageRead,
    emitSendMessage,
    emitDeleteMessage,
    emitEditMessage,
  };
};
