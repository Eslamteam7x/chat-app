'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useSocket } from '@/hooks/useSocket';
import Sidebar from '@/components/chat/Sidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import Loading from '@/components/common/Loading';

export default function ChatPage() {
  const router = useRouter();
  const { isAuthenticated, checkAuth, isLoading } = useAuthStore();
  const { onlineUsers, fetchConversations } = useChatStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  useSocket();

  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [mounted, isLoading, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    }
  }, [isAuthenticated]);

  if (!mounted || isLoading || !isAuthenticated) {
    return <Loading fullScreen text="Loading ChatApp..." />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-100 dark:bg-dark-bg">
      <div className="h-full w-full max-w-[1600px] mx-auto flex">
        {/* Sidebar */}
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '100%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="md:w-[380px] w-full md:relative absolute z-20 md:z-auto h-full shrink-0"
            >
              <Sidebar
                isMobileOpen={sidebarOpen}
                onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Window */}
        <div className="flex-1 h-full relative">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden absolute top-3 left-3 z-10 p-2 bg-white dark:bg-dark-header rounded-full shadow-lg"
            >
              <svg className="w-6 h-6 text-gray-600 dark:text-dark-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <ChatWindow onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        </div>
      </div>
    </div>
  );
}
