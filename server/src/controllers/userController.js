const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');

const searchUsers = async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.json({ success: true, data: [] });
    }

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
    }).select('username email avatar isOnline lastSeen bio');

    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { username, bio, phone, showLastSeen, readReceipts, typingStatus, theme, notificationSound } = req.body;
    const updateData = {};

    if (username) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (phone !== undefined) updateData.phone = phone;
    if (showLastSeen !== undefined) updateData.showLastSeen = showLastSeen;
    if (readReceipts !== undefined) updateData.readReceipts = readReceipts;
    if (typingStatus !== undefined) updateData.typingStatus = typingStatus;
    if (theme !== undefined) updateData.theme = theme;
    if (notificationSound !== undefined) updateData.notificationSound = notificationSound;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true, runValidators: true });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const user = await User.findById(req.user._id);

    if (user.avatarPublicId) {
      await cloudinary.uploader.destroy(user.avatarPublicId);
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'chat-app/avatars',
      width: 300,
      height: 300,
      crop: 'fill',
    });

    user.avatar = result.secure_url;
    user.avatarPublicId = result.public_id;
    await user.save();

    res.json({ success: true, data: { avatar: user.avatar } });
  } catch (error) {
    next(error);
  }
};

const addContact = async (req, res, next) => {
  try {
    const { contactId } = req.body;
    const contact = await User.findById(contactId);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = await User.findById(req.user._id);
    if (user.contacts.includes(contactId)) {
      return res.status(400).json({ success: false, message: 'Contact already added' });
    }

    user.contacts.push(contactId);
    await user.save();

    res.json({ success: true, data: user.contacts });
  } catch (error) {
    next(error);
  }
};

const removeContact = async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const user = await User.findById(req.user._id);

    user.contacts = user.contacts.filter((c) => c.toString() !== contactId);
    await user.save();

    res.json({ success: true, data: user.contacts });
  } catch (error) {
    next(error);
  }
};

const getContacts = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('contacts', 'username email avatar isOnline lastSeen bio');
    res.json({ success: true, data: user.contacts });
  } catch (error) {
    next(error);
  }
};

const blockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(req.user._id);

    if (user.blockedUsers.includes(userId)) {
      return res.status(400).json({ success: false, message: 'User already blocked' });
    }

    user.blockedUsers.push(userId);
    await user.save();

    res.json({ success: true, message: 'User blocked successfully' });
  } catch (error) {
    next(error);
  }
};

const unblockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(req.user._id);

    user.blockedUsers = user.blockedUsers.filter((id) => id.toString() !== userId);
    await user.save();

    res.json({ success: true, message: 'User unblocked successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { searchUsers, getUserProfile, updateProfile, updateAvatar, addContact, removeContact, getContacts, blockUser, unblockUser };
