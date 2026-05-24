'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Avatar from '@/components/common/Avatar';
import {
  HiCheck, HiCheckCircle, HiClock,
  HiOutlineTrash, HiOutlinePencil, HiOutlineReply, HiArrowRight,
  HiDownload, HiPlay, HiPause,
} from 'react-icons/hi';
import { format } from 'date-fns';

export default function MessageBubble({ message, isOwn, showAvatar, onReply }) {
  const [showActions, setShowActions] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);

  const isDeleted = message.isDeleted;
  const isEdited = message.isEdited;
  const readCount = message.readBy?.length || 0;
  const deliveredCount = message.deliveredTo?.length || 0;
  const hasReplies = readCount > 0;

  const messageTime = format(new Date(message.createdAt), 'HH:mm');

  const getStatusIcon = () => {
    if (message.messageType === 'system') return null;
    if (hasReplies) return <HiCheckCircle className="w-4 h-4 text-blue-500" />;
    if (deliveredCount > 0) return <HiCheckCircle className="w-4 h-4 text-gray-400" />;
    return <HiCheck className="w-4 h-4 text-gray-400" />;
  };

  const getFileIcon = (type) => {
    if (type?.startsWith('image/')) return '🖼️';
    if (type?.startsWith('audio/')) return '🎵';
    if (type?.startsWith('video/')) return '🎬';
    if (type?.includes('pdf')) return '📄';
    if (type?.includes('word') || type?.includes('document')) return '📝';
    if (type?.includes('excel') || type?.includes('sheet')) return '📊';
    if (type?.includes('zip') || type?.includes('rar')) return '📦';
    return '📎';
  };

  if (isDeleted && message.content === 'This message was deleted') {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
        <div className={`px-3 py-2 rounded-lg bg-gray-100 dark:bg-dark-header italic text-gray-400 dark:text-gray-500 text-xs max-w-[65%]`}>
          <p className="line-through">{message.content}</p>
          <span className="text-[10px] mt-1 block">{messageTime}</span>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (message.messageType === 'text') {
      return <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>;
    }

    if (message.messageType === 'image') {
      return (
        <div className="rounded-lg overflow-hidden mb-1">
          <img
            src={message.fileUrl}
            alt={message.fileName || 'Image'}
            className="max-w-full max-h-80 object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
            loading="lazy"
          />
        </div>
      );
    }

    if (message.messageType === 'audio') {
      return (
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-dark-hover rounded-lg p-2 min-w-[200px]">
          <button
            onClick={() => setAudioPlaying(!audioPlaying)}
            className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white shrink-0"
          >
            {audioPlaying ? <HiPause className="w-4 h-4" /> : <HiPlay className="w-4 h-4 ml-0.5" />}
          </button>
          <div className="flex-1">
            <div className="h-1 bg-gray-300 dark:bg-gray-600 rounded-full">
              <div className="h-full w-0 bg-primary-600 rounded-full" />
            </div>
          </div>
          <span className="text-xs text-gray-500">{message.duration ? `${Math.floor(message.duration / 60)}:${message.duration % 60}` : '0:30'}</span>
        </div>
      );
    }

    if (message.fileUrl) {
      return (
        <a
          href={message.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-gray-50 dark:bg-dark-hover rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
        >
          <span className="text-2xl">{getFileIcon(message.fileType)}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{message.fileName || 'File'}</p>
            <p className="text-xs text-gray-500">
              {message.fileSize ? `${(message.fileSize / 1024 / 1024).toFixed(1)} MB` : ''}
            </p>
          </div>
          <HiDownload className="w-5 h-5 text-gray-400 shrink-0" />
        </a>
      );
    }

    return <p className="text-sm">{message.content}</p>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1 message-enter`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`flex gap-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'} max-w-[85%] sm:max-w-[65%]`}>
        {showAvatar && !isOwn && (
          <div className="self-end mb-1">
            <Avatar
              src={message.sender?.avatar}
              name={message.sender?.username}
              size="xs"
            />
          </div>
        )}

        <div>
          {/* Reply Preview */}
          {message.replyTo && (
            <div className={`mb-1 px-3 py-1.5 rounded-lg text-xs ${isOwn ? 'bg-primary-700/30' : 'bg-gray-100 dark:bg-dark-border'}`}>
              <p className="font-medium text-primary-600 dark:text-primary-400 mb-0.5">
                {message.replyTo.sender?.username || 'Reply'}
              </p>
              <p className="text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                {message.replyTo.content || '📎 File'}
              </p>
            </div>
          )}

          {/* Message Bubble */}
          <div
            className={`relative group rounded-2xl px-3 py-2 shadow-sm ${
              isOwn
                ? 'bg-whatsapp-100 dark:bg-dark-bubble rounded-tr-sm'
                : 'bg-white dark:bg-dark-header rounded-tl-sm'
            }`}
          >
            {/* Sender name in groups */}
            {message.sender?.username && !isOwn && showAvatar && (
              <p className="text-xs font-medium text-primary-600 dark:text-primary-400 mb-1">
                {message.sender.username}
              </p>
            )}

            {renderContent()}

            {/* Message meta */}
            <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              {isEdited && (
                <span className="text-[10px] text-gray-400 italic">edited</span>
              )}
              <span className="text-[10px] text-gray-400">{messageTime}</span>
              {isOwn && (
                <span className="flex items-center">
                  {getStatusIcon()}
                </span>
              )}
            </div>
          </div>

          {/* Forwarded label */}
          {message.forwardedFrom && (
            <p className={`text-[10px] text-gray-400 mt-0.5 ${isOwn ? 'text-right' : 'text-left'}`}>
              Forwarded
            </p>
          )}
        </div>

        {/* Actions Overlay */}
        {showActions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`flex items-center gap-0.5 ${isOwn ? 'flex-row' : 'flex-row-reverse'}`}
          >
            <button
              onClick={() => onReply?.(message)}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-dark-hover rounded-full transition-colors"
              title="Reply"
            >
              <HiOutlineReply className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
            {isOwn && (
              <>
                <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-dark-hover rounded-full transition-colors" title="Edit">
                  <HiOutlinePencil className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
                <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-dark-hover rounded-full transition-colors" title="Delete">
                  <HiOutlineTrash className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              </>
            )}
            <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-dark-hover rounded-full transition-colors" title="Forward">
              <HiArrowRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
