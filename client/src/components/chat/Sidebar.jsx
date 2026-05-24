'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import Avatar from '@/components/common/Avatar';
import { HiSearch, HiDotsVertical, HiPlus, HiFilter, HiMenu, HiX } from 'react-icons/hi';
import { format } from 'date-fns';

export default function Sidebar({ onToggleSidebar, isMobileOpen }) {
  const { user, toggleTheme, logout } = useAuthStore();
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    searchQuery,
    setSearchQuery,
    showSearch,
    setShowSearch,
    onlineUsers,
    fetchConversations,
  } = useChatStore();

  const [localSearch, setLocalSearch] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch]);

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;

    const name = conv.isGroup
      ? conv.groupName
      : conv.participants?.find((p) => p._id !== user?._id)?.username || '';

    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const pinnedConversations = filteredConversations.filter((c) =>
    user?.pinnedConversations?.includes(c._id)
  );
  const unpinnedConversations = filteredConversations.filter(
    (c) => !user?.pinnedConversations?.includes(c._id)
  );
  const sortedConversations = [...pinnedConversations, ...unpinnedConversations];

  const getConversationName = (conv) => {
    if (conv.isGroup) return conv.groupName;
    return conv.participants?.find((p) => p._id !== user?._id)?.username || 'Unknown';
  };

  const getConversationAvatar = (conv) => {
    if (conv.isGroup) return conv.groupAvatar;
    return conv.participants?.find((p) => p._id !== user?._id)?.avatar || '';
  };

  const getLastMessageTime = (date) => {
    if (!date) return '';
    const msgDate = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now - msgDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return format(msgDate, 'HH:mm');
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return format(msgDate, 'EEEE');
    return format(msgDate, 'dd/MM/yyyy');
  };

  return (
    <div className={`h-full flex flex-col bg-white dark:bg-dark-sidebar border-r border-gray-200 dark:border-dark-border ${isMobileOpen ? 'block' : 'hidden'} md:flex`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-dark-header">
        <div className="flex items-center gap-3">
          <button className="md:hidden p-1" onClick={onToggleSidebar}>
            <HiX className="w-6 h-6 text-gray-600 dark:text-dark-text" />
          </button>
          <Avatar src={user?.avatar} name={user?.username} size="sm" isOnline={user?.isOnline} />
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-dark-text text-sm">{user?.username}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user?.status || 'Online'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-dark-hover transition-colors"
          >
            <HiSearch className="w-5 h-5 text-gray-600 dark:text-dark-text" />
          </button>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-dark-hover transition-colors relative"
          >
            <HiDotsVertical className="w-5 h-5 text-gray-600 dark:text-dark-text" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute top-14 right-2 w-48 bg-white dark:bg-dark-header rounded-xl shadow-xl border border-gray-200 dark:border-dark-border z-50 py-1"
              >
                <button
                  onClick={() => { toggleTheme(); setShowMenu(false); }}
                  className="w-full px-4 py-2.5 text-sm text-left hover:bg-gray-100 dark:hover:bg-dark-hover text-gray-700 dark:text-dark-text"
                >
                  {user?.theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
                </button>
                <button
                  onClick={() => { setShowMenu(false); }}
                  className="w-full px-4 py-2.5 text-sm text-left hover:bg-gray-100 dark:hover:bg-dark-hover text-gray-700 dark:text-dark-text"
                >
                  ⚙️ Settings
                </button>
                <hr className="border-gray-200 dark:border-dark-border my-1" />
                <button
                  onClick={() => { logout(); setShowMenu(false); }}
                  className="w-full px-4 py-2.5 text-sm text-left hover:bg-gray-100 dark:hover:bg-dark-hover text-red-500"
                >
                  🚪 Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 border-b border-gray-200 dark:border-dark-border"
          >
            <div className="relative">
              <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-dark-input rounded-xl text-sm text-gray-900 dark:text-dark-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Chat Button */}
      <div className="px-4 py-2">
        <button className="w-full flex items-center gap-2 px-4 py-2.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-xl hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors text-sm font-medium">
          <HiPlus className="w-5 h-5" />
          New Chat
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {sortedConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 bg-gray-100 dark:bg-dark-hover rounded-full flex items-center justify-center mb-3">
              <HiFilter className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
              {searchQuery ? 'Try a different search' : 'Start a new chat'}
            </p>
          </div>
        ) : (
          sortedConversations.map((conv) => {
            const isActive = activeConversation?._id === conv._id;
            const isPinned = user?.pinnedConversations?.includes(conv._id);

            return (
              <motion.div
                key={conv._id}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setActiveConversation(conv);
                  if (window.innerWidth < 768) onToggleSidebar();
                }}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-dark-hover'
                }`}
              >
                <div className="relative">
                  <Avatar
                    src={getConversationAvatar(conv)}
                    name={getConversationName(conv)}
                    size="md"
                    isOnline={
                      !conv.isGroup &&
                      conv.participants?.some(
                        (p) => p._id !== user?._id && onlineUsers.includes(p._id)
                      )
                    }
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 dark:text-dark-text text-sm truncate">
                      {isPinned && '📌 '}{getConversationName(conv)}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0 ml-2">
                      {getLastMessageTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {conv.lastMessage?.content || (conv.isGroup ? conv.groupDescription : 'No messages yet')}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="ml-2 bg-primary-600 text-white text-xs font-medium rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
