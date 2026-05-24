const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some((p) => p.toString() === req.user._id.toString());
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const messages = await Message.find({
      conversation: conversationId,
      isDeleted: false,
      deletedFor: { $nin: [req.user._id] },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'username avatar')
      .populate('replyTo')
      .lean();

    const total = await Message.countDocuments({
      conversation: conversationId,
      isDeleted: false,
      deletedFor: { $nin: [req.user._id] },
    });

    res.json({
      success: true,
      data: {
        messages: messages.reverse(),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { content, messageType, replyTo } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some((p) => p.toString() === req.user._id.toString());
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const messageData = {
      conversation: conversationId,
      sender: req.user._id,
      content: content || '',
      messageType: messageType || 'text',
      replyTo: replyTo || null,
    };

    if (req.file) {
      messageData.fileUrl = req.file.path;
      messageData.fileName = req.file.originalname;
      messageData.fileSize = req.file.size;
      messageData.fileType = req.file.mimetype;
      messageData.messageType = messageType || 'file';
    }

    const message = await Message.create(messageData);
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username email avatar')
      .populate('replyTo')
      .lean();

    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const recipientIds = conversation.participants.filter((p) => p.toString() !== req.user._id.toString());

    const io = req.app.get('io');
    recipientIds.forEach((recipientId) => {
      io.to(recipientId.toString()).emit('new_message', {
        message: populatedMessage,
        conversationId: conversation._id,
      });
    });

    io.to(req.user._id.toString()).emit('message_sent', {
      message: populatedMessage,
      conversationId: conversation._id,
    });

    res.status(201).json({ success: true, data: populatedMessage });
  } catch (error) {
    next(error);
  }
};

const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { deleteForEveryone } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (deleteForEveryone) {
      message.isDeleted = true;
    } else {
      message.deletedFor.push(req.user._id);
    }
    await message.save();

    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    next(error);
  }
};

const editMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (message.messageType !== 'text') {
      return res.status(400).json({ success: false, message: 'Can only edit text messages' });
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    const conversation = await Conversation.findById(message.conversation);
    const io = req.app.get('io');
    conversation.participants.forEach((participantId) => {
      io.to(participantId.toString()).emit('message_edited', {
        messageId: message._id,
        content,
        editedAt: message.editedAt,
        conversationId: message.conversation,
      });
    });

    res.json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { messageIds } = req.body;

    await Message.updateMany(
      { _id: { $in: messageIds }, 'readBy.user': { $ne: req.user._id } },
      { $push: { readBy: { user: req.user._id, readAt: new Date() } } }
    );

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMessages, sendMessage, deleteMessage, editMessage, markAsRead };
