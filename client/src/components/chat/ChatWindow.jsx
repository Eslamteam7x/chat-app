'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/hooks/useSocket';
import Avatar from '@/components/common/Avatar';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import {
  HiChevronLeft, HiPhone, HiVideoCamera, HiDotsVertical,
  HiSearch, HiPaperClip, HiEmojiHappy, HiMicrophone,
  HiOutlineTrash, HiOutlinePencil, HiOutlineReply,
  HiCheck, HiCheckCircle, HiClock,
} from 'react-icons/hi';
import { format } from 'date-fns';

export default function ChatWindow({ onToggleSidebar }) {
  const { user } = useAuthStore();
  const {
    activeConversation,
    messages,
    typingUsers,
    isLoadingMessages,
    hasMoreMessages,
    fetchMessages,
  } = useChatStore();
  const { emitTyping, emitMessageRead } = useSocket();

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (activeConversation) {
      setReplyTo(null);
    }
  }, [activeConversation?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (activeConversation && messages.length > 0) {
      const unreadMessages = messages
        .filter((m) => m.sender?._id !== user?._id && !m.readBy?.some((r) => r.user === user?._id))
        .map((m) => m._id);

      if (unreadMessages.length > 0) {
        emitMessageRead(activeConversation._id, unreadMessages);
      }
    }
  }, [activeConversation?._id, messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 200);

    if (scrollTop < 50 && hasMoreMessages && !isLoadingMessages) {
      fetchMessages(activeConversation._id);
    }
  }, [activeConversation, hasMoreMessages, isLoadingMessages]);

  const handleTyping = useCallback((isTyping) => {
    if (!activeConversation) return;
    emitTyping(activeConversation._id, isTyping);

    if (isTyping) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        emitTyping(activeConversation._id, false);
      }, 3000);
    }
  }, [activeConversation, emitTyping]);

  if (!activeConversation) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-light-chat dark:bg-dark-chat p-8">
        <div className="text-center">
          <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <HiPaperClip className="w-12 h-12 text-primary-500" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-dark-text mb-2">ChatApp</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">
            Send and receive messages in real-time. Select a conversation to start chatting.
          </p>
        </div>
      </div>
    );
  }

  const isGroup = activeConversation.isGroup;
  const conversationName = isGroup
    ? activeConversation.groupName
    : activeConversation.participants?.find((p) => p._id !== user?._id)?.username || 'Unknown';

  const conversationAvatar = isGroup
    ? activeConversation.groupAvatar
    : activeConversation.participants?.find((p) => p._id !== user?._id)?.avatar || '';

  const otherParticipant = !isGroup
    ? activeConversation.participants?.find((p) => p._id !== user?._id)
    : null;

  const isTyping = typingUsers.some((t) => t.conversationId === activeConversation._id);

  const groupedMessages = messages.reduce((groups, message) => {
    const date = format(new Date(message.createdAt), 'dd/MM/yyyy');
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div className="h-full flex flex-col bg-light-chat dark:bg-dark-chat">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-dark-header border-b border-gray-200 dark:border-dark-border">
        <div className="flex items-center gap-3">
          <button className="md:hidden p-1" onClick={onToggleSidebar}>
            <HiChevronLeft className="w-6 h-6 text-gray-600 dark:text-dark-text" />
          </button>
          <Avatar
            src={conversationAvatar}
            name={conversationName}
            size="sm"
            isOnline={!isGroup && otherParticipant?.isOnline}
          />
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-dark-text text-sm">{conversationName}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isTyping
                ? 'typing...'
                : isGroup
                  ? `${activeConversation.participants?.length || 0} members`
                  : otherParticipant?.isOnline
                    ? 'Online'
                    : otherParticipant?.lastSeen
                      ? `Last seen ${format(new Date(otherParticipant.lastSeen), 'HH:mm')}`
                      : 'Offline'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-dark-hover transition-colors">
            <HiSearch className="w-5 h-5 text-gray-600 dark:text-dark-text" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-dark-hover transition-colors">
            <HiDotsVertical className="w-5 h-5 text-gray-600 dark:text-dark-text" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-1 bg-[url('/chat-bg-light.png')] dark:bg-[url('/chat-bg-dark.png')] bg-repeat"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        {isLoadingMessages && messages.length === 0 && (
          <div className="flex justify-center py-4">
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date}>
            <div className="flex justify-center my-3">
              <span className="text-xs bg-white dark:bg-dark-header text-gray-500 dark:text-gray-400 px-3 py-1 rounded-lg shadow-sm">
                {date === format(new Date(), 'dd/MM/yyyy')
                  ? 'Today'
                  : date === format(new Date(Date.now() - 86400000), 'dd/MM/yyyy')
                    ? 'Yesterday'
                    : date}
              </span>
            </div>
            {dateMessages.map((message, idx) => {
              const prevMessage = idx > 0 ? dateMessages[idx - 1] : null;
              const showAvatar = !isGroup && message.sender?._id !== user?._id &&
                (!prevMessage || prevMessage.sender?._id !== message.sender?._id);

              return (
                <MessageBubble
                  key={message._id}
                  message={message}
                  isOwn={message.sender?._id === user?._id || message.sender === user?._id}
                  showAvatar={showAvatar}
                  onReply={(msg) => setReplyTo(msg)}
                />
              );
            })}
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 py-1">
            <div className="bg-white dark:bg-dark-header rounded-2xl px-4 py-2.5 shadow-sm">
              <div className="flex gap-1">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={scrollToBottom}
            className="absolute bottom-20 right-6 w-10 h-10 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-700 transition-colors z-10"
          >
            <HiChevronLeft className="w-5 h-5 rotate-90" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Reply Preview */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gray-50 dark:bg-dark-header border-t border-gray-200 dark:border-dark-border px-4 py-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-primary-600 font-medium">Replying to {replyTo.sender?.username || replyTo.sender}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{replyTo.content}</p>
              </div>
              <button
                onClick={() => setReplyTo(null)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-dark-hover rounded-full"
              >
                <HiOutlineTrash className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Input */}
      <MessageInput
        conversationId={activeConversation._id}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onTyping={handleTyping}
      />
    </div>
  );
}
