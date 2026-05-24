const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
      isActive: true,
    })
      .populate('participants', 'username email avatar isOnline lastSeen')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'username avatar' },
      })
      .sort({ lastMessageAt: -1 })
      .lean();

    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: req.user._id },
          'readBy.user': { $ne: req.user._id },
          isDeleted: false,
          deletedFor: { $nin: [req.user._id] },
        });
        return { ...conv, unreadCount };
      })
    );

    res.json({ success: true, data: conversationsWithUnread });
  } catch (error) {
    next(error);
  }
};

const createConversation = async (req, res, next) => {
  try {
    const { participantId, isGroup, groupName, groupDescription } = req.body;

    if (!isGroup) {
      const existingConversation = await Conversation.findOne({
        isGroup: false,
        participants: { $all: [req.user._id, participantId], $size: 2 },
      }).populate('participants', 'username email avatar isOnline lastSeen');

      if (existingConversation) {
        return res.json({ success: true, data: existingConversation });
      }

      const conversation = await Conversation.create({
        participants: [req.user._id, participantId],
        isGroup: false,
        createdBy: req.user._id,
      });

      const populated = await Conversation.findById(conversation._id)
        .populate('participants', 'username email avatar isOnline lastSeen');

      return res.status(201).json({ success: true, data: populated });
    }

    const { participants } = req.body;
    const allParticipants = [...new Set([...participants, req.user._id.toString()])];

    const conversation = await Conversation.create({
      participants: allParticipants,
      isGroup: true,
      groupName: groupName || 'New Group',
      groupDescription: groupDescription || '',
      createdBy: req.user._id,
      groupAdmin: req.user._id,
    });

    const populated = await Conversation.findById(conversation._id)
      .populate('participants', 'username email avatar isOnline lastSeen');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

const getConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId)
      .populate('participants', 'username email avatar isOnline lastSeen bio')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'username avatar' },
      });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some((p) => p._id.toString() === req.user._id.toString());
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, data: conversation });
  } catch (error) {
    next(error);
  }
};

const updateGroup = async (req, res, next) => {
  try {
    const { groupName, groupDescription, groupAvatar } = req.body;
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (conversation.groupAdmin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only group admin can update group' });
    }

    if (groupName) conversation.groupName = groupName;
    if (groupDescription !== undefined) conversation.groupDescription = groupDescription;
    if (groupAvatar) conversation.groupAvatar = groupAvatar;
    await conversation.save();

    res.json({ success: true, data: conversation });
  } catch (error) {
    next(error);
  }
};

const addParticipants = async (req, res, next) => {
  try {
    const { userIds } = req.body;
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const newParticipants = userIds.filter((uid) => !conversation.participants.includes(uid));
    conversation.participants.push(...newParticipants);
    await conversation.save();

    const populated = await Conversation.findById(conversation._id)
      .populate('participants', 'username email avatar isOnline lastSeen');

    res.json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

const removeParticipant = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    conversation.participants = conversation.participants.filter((p) => p.toString() !== userId);
    await conversation.save();

    res.json({ success: true, message: 'Participant removed' });
  } catch (error) {
    next(error);
  }
};

const leaveGroup = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    conversation.participants = conversation.participants.filter((p) => p.toString() !== req.user._id.toString());

    if (conversation.groupAdmin?.toString() === req.user._id.toString() && conversation.participants.length > 0) {
      conversation.groupAdmin = conversation.participants[0];
    }

    await conversation.save();
    res.json({ success: true, message: 'Left group' });
  } catch (error) {
    next(error);
  }
};

const pinConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const user = await User.findById(req.user._id);

    const index = user.pinnedConversations.indexOf(conversationId);
    if (index > -1) {
      user.pinnedConversations.splice(index, 1);
    } else {
      user.pinnedConversations.unshift(conversationId);
    }
    await user.save();

    res.json({ success: true, data: user.pinnedConversations });
  } catch (error) {
    next(error);
  }
};

module.exports = { getConversations, createConversation, getConversation, updateGroup, addParticipants, removeParticipant, leaveGroup, pinConversation };
