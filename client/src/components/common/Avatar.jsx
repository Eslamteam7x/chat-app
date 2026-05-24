'use client';

import { motion } from 'framer-motion';
import { HiUser } from 'react-icons/hi';

export default function Avatar({ src, name, size = 'md', isOnline, status, onClick, className = '' }) {
  const sizes = {
    xs: 'w-8 h-8 text-xs',
    sm: 'w-10 h-10 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
  };

  const statusSizes = {
    xs: 'w-2 h-2 bottom-0 right-0',
    sm: 'w-2.5 h-2.5 bottom-0 right-0',
    md: 'w-3 h-3 bottom-0 right-0',
    lg: 'w-3.5 h-3.5 bottom-0.5 right-0.5',
    xl: 'w-4 h-4 bottom-0 right-0',
  };

  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const getColor = (name) => {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <motion.div
      whileHover={onClick ? { scale: 1.05 } : {}}
      whileTap={onClick ? { scale: 0.95 } : {}}
      className={`relative inline-flex items-center justify-center ${sizes[size]} rounded-full overflow-hidden shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {src ? (
        <img src={src} alt={name || 'Avatar'} className="w-full h-full object-cover" />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center text-white font-semibold ${sizes[size]}`}
          style={{ backgroundColor: getColor(name) }}
        >
          {initials || <HiUser className="w-1/2 h-1/2" />}
        </div>
      )}

      {status !== undefined && (
        <span
          className={`absolute ${statusSizes[size]} rounded-full border-2 border-white dark:border-dark-bg ${
            status === 'online' ? 'bg-green-500' :
            status === 'away' ? 'bg-yellow-500' :
            status === 'busy' ? 'bg-red-500' :
            'bg-gray-400'
          }`}
        />
      )}

      {isOnline && status === undefined && (
        <span
          className={`absolute ${statusSizes[size]} rounded-full border-2 border-white dark:border-dark-bg bg-green-500`}
        />
      )}
    </motion.div>
  );
}
