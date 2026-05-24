const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const onlineUsers = new Map();

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  const authenticateSocket = async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('User not found'));

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  };

  io.use(authenticateSocket);

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`User connected: ${socket.user.username} (${userId})`);

    socket.join(userId);
    onlineUsers.set(userId, socket.id);

    await User.findByIdAndUpdate(userId, { isOnline: true, status: 'online', lastSeen: new Date() });

    io.emit('user_status', { userId, status: 'online' });

    // --- Handle joining conversations ---
    socket.on('join_conversations', async (callback) => {
      try {
        const conversations = await Conversation.find({ participants: userId }).select('_id');
        conversations.forEach((conv) => {
          socket.join(conv._id.toString());
        });
        if (callback) callback({ success: true });
      } catch (error) {
        if (callback) callback({ success: false, error: error.message });
      }
    });

    socket.on('join_conversation', (conversationId) => {
      socket.join(conversationId);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(conversationId);
    });

    // --- Typing Indicator ---
    socket.on('typing_start', async (data) => {
      const { conversationId } = data;
      socket.to(conversationId).emit('user_typing', {
        userId,
        username: socket.user.username,
        conversationId,
      });
    });

    socket.on('typing_stop', async (data) => {
      const { conversationId } = data;
      socket.to(conversationId).emit('user_stop_typing', {
        userId,
        conversationId,
      });
    });

    // --- Send message via socket ---
    socket.on('send_message', async (data, callback) => {
      try {
        const { conversationId, content, messageType, replyTo, file } = data;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.some((p) => p.toString() === userId)) {
          if (callback) callback({ success: false, error: 'Not authorized' });
          return;
        }

        const messageData = {
          conversation: conversationId,
          sender: userId,
          content: content || '',
          messageType: messageType || 'text',
          replyTo: replyTo || null,
        };

        const message = await Message.create(messageData);
        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'username email avatar')
          .populate('replyTo')
          .lean();

        conversation.lastMessage = message._id;
        conversation.lastMessageAt = new Date();
        await conversation.save();

        const senderSocketId = onlineUsers.get(userId);
        if (senderSocketId) {
          io.to(senderSocketId).emit('message_sent', {
            message: populatedMessage,
            conversationId,
          });
        }

        conversation.participants.forEach((participantId) => {
          if (participantId.toString() !== userId) {
            io.to(participantId.toString()).emit('new_message', {
              message: populatedMessage,
              conversationId,
            });
          }
        });

        conversation.participants.forEach((participantId) => {
          io.to(participantId.toString()).emit('conversation_updated', {
            conversationId,
            lastMessage: populatedMessage,
            lastMessageAt: conversation.lastMessageAt,
          });
        });

        if (callback) callback({ success: true, data: populatedMessage });
      } catch (error) {
        if (callback) callback({ success: false, error: error.message });
      }
    });

    // --- Message Read ---
    socket.on('mark_read', async (data) => {
      try {
        const { conversationId, messageIds } = data;

        await Message.updateMany(
          { _id: { $in: messageIds }, 'readBy.user': { $ne: userId } },
          { $push: { readBy: { user: userId, readAt: new Date() } } }
        );

        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          conversation.participants.forEach((participantId) => {
            if (participantId.toString() !== userId) {
              io.to(participantId.toString()).emit('messages_read', {
                userId,
                conversationId,
                messageIds,
              });
            }
          });
        }
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    // --- Delete Message ---
    socket.on('delete_message', async (data, callback) => {
      try {
        const { messageId, deleteForEveryone } = data;
        const message = await Message.findById(messageId);

        if (!message || message.sender.toString() !== userId) {
          if (callback) callback({ success: false, error: 'Not authorized' });
          return;
        }

        if (deleteForEveryone) {
          message.isDeleted = true;
        } else {
          message.deletedFor.push(userId);
        }
        await message.save();

        const conversation = await Conversation.findById(message.conversation);
        if (conversation) {
          conversation.participants.forEach((participantId) => {
            io.to(participantId.toString()).emit('message_deleted', {
              messageId,
              conversationId: message.conversation,
              deleteForEveryone,
              userId,
            });
          });
        }

        if (callback) callback({ success: true });
      } catch (error) {
        if (callback) callback({ success: false, error: error.message });
      }
    });

    // --- Edit Message ---
    socket.on('edit_message', async (data, callback) => {
      try {
        const { messageId, content } = data;
        const message = await Message.findById(messageId);

        if (!message || message.sender.toString() !== userId) {
          if (callback) callback({ success: false, error: 'Not authorized' });
          return;
        }

        message.content = content;
        message.isEdited = true;
        message.editedAt = new Date();
        await message.save();

        const conversation = await Conversation.findById(message.conversation);
        if (conversation) {
          conversation.participants.forEach((participantId) => {
            io.to(participantId.toString()).emit('message_edited', {
              messageId,
              content,
              editedAt: message.editedAt,
              conversationId: message.conversation,
            });
          });
        }

        if (callback) callback({ success: true, data: message });
      } catch (error) {
        if (callback) callback({ success: false, error: error.message });
      }
    });

    // --- Call user --- (placeholder for future voice/video)
    socket.on('call_user', (data) => {
      const { recipientId, signalData, callType } = data;
      const recipientSocketId = onlineUsers.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('incoming_call', {
          from: userId,
          user: { username: socket.user.username, avatar: socket.user.avatar },
          signalData,
          callType,
        });
      }
    });

    socket.on('accept_call', (data) => {
      const { callerId, signalData } = data;
      const callerSocketId = onlineUsers.get(callerId);
      if (callerSocketId) {
        io.to(callerSocketId).emit('call_accepted', { signalData });
      }
    });

    socket.on('end_call', (data) => {
      const { recipientId } = data;
      const recipientSocketId = onlineUsers.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('call_ended', { from: userId });
      }
    });

    // --- Disconnect ---
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user?.username} (${userId})`);
      onlineUsers.delete(userId);

      const user = await User.findById(userId);
      if (user) {
        user.isOnline = false;
        user.status = 'offline';
        user.lastSeen = new Date();
        await user.save();
      }

      io.emit('user_status', {
        userId,
        status: 'offline',
        lastSeen: new Date(),
      });
    });
  });

  return io;
};

module.exports = { setupSocket, onlineUsers };
