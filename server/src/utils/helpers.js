const sanitizeHtml = require('sanitize-html');

const sanitizeMessage = (text) => {
  return sanitizeHtml(text, {
    allowedTags: [],
    allowedAttributes: {},
  });
};

const getFileType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype.startsWith('video/')) return 'video';
  return 'file';
};

const formatLastSeen = (date) => {
  if (!date) return 'Offline';
  const now = new Date();
  const diff = now - new Date(date);

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

const generateUsername = (email) => {
  return email.split('@')[0] + Math.random().toString(36).substring(2, 6);
};

module.exports = { sanitizeMessage, getFileType, formatLastSeen, generateUsername };
