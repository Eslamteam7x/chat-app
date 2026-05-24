'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '@/store/chatStore';
import { useSocket } from '@/hooks/useSocket';
import { HiEmojiHappy, HiPaperClip, HiMicrophone, HiPhotograph, HiX } from 'react-icons/hi';
import { BsSendFill } from 'react-icons/bs';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';

const Picker = dynamic(() => import('emoji-picker-react'), { ssr: false });

export default function MessageInput({ conversationId, replyTo, onCancelReply, onTyping }) {
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [recording, setRecording] = useState(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const inputRef = useRef(null);

  const { sendMessage, sendFileMessage } = useChatStore();

  const handleSend = async () => {
    if (!message.trim() && !replyTo) return;

    try {
      await sendMessage(conversationId, message.trim(), 'text', replyTo?._id);
      setMessage('');
      onCancelReply?.();
      setShowEmoji(false);
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  const handleFileSelect = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 50MB');
      return;
    }

    try {
      await sendFileMessage(conversationId, file, type);
      toast.success('File sent');
    } catch (error) {
      toast.error('Failed to send file');
    }

    e.target.value = '';
    setShowAttach(false);
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
    onTyping?.(e.target.value.length > 0);

    if (e.target.value.length === 0) {
      onTyping?.(false);
    }
  };

  return (
    <div className="relative">
      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 left-4 z-50"
          >
            <div className="relative">
              <Picker
                onEmojiClick={handleEmojiClick}
                pickerStyle={{
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  borderColor: 'transparent',
                  borderRadius: '16px',
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attach Menu */}
      <AnimatePresence>
        {showAttach && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 left-4 bg-white dark:bg-dark-header rounded-2xl shadow-xl border border-gray-200 dark:border-dark-border p-2 z-50"
          >
            <div className="flex gap-2">
              <button
                onClick={() => imageInputRef.current?.click()}
                className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors"
              >
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <HiPhotograph className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-gray-500">Photos</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors"
              >
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <HiPaperClip className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-gray-500">Files</span>
              </button>
              <button
                onClick={() => setRecording(!recording)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors ${recording ? 'bg-red-50 dark:bg-red-900/20' : ''}`}
              >
                <div className={`w-10 h-10 ${recording ? 'bg-red-500 animate-pulse' : 'bg-red-500'} rounded-full flex items-center justify-center`}>
                  <HiMicrophone className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-gray-500">{recording ? 'Recording...' : 'Audio'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-dark-header border-t border-gray-200 dark:border-dark-border">
        <button
          onClick={() => setShowEmoji(!showEmoji)}
          className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-dark-hover transition-colors ${showEmoji ? 'text-primary-600' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <HiEmojiHappy className="w-6 h-6" />
        </button>

        <button
          onClick={() => setShowAttach(!showAttach)}
          className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-dark-hover transition-colors ${showAttach ? 'text-primary-600' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <HiPaperClip className="w-6 h-6 rotate-45" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => handleFileSelect(e, 'file')}
        />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileSelect(e, 'image')}
        />

        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="w-full px-4 py-2.5 bg-white dark:bg-dark-input rounded-xl text-sm text-gray-900 dark:text-dark-text placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
          />
        </div>

        {message.trim() ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            className="p-2 bg-primary-600 hover:bg-primary-700 rounded-full text-white transition-colors"
          >
            <BsSendFill className="w-5 h-5" />
          </motion.button>
        ) : (
          <button
            onClick={() => setRecording(!recording)}
            className={`p-2 rounded-full transition-colors ${recording ? 'bg-red-500 text-white animate-pulse' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-hover'}`}
          >
            <HiMicrophone className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
}
