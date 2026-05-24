const express = require('express');
const { protect } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const {
  searchUsers,
  getUserProfile,
  updateProfile,
  updateAvatar,
  addContact,
  removeContact,
  getContacts,
  blockUser,
  unblockUser,
} = require('../controllers/userController');

const router = express.Router();

router.use(protect);

router.get('/search', searchUsers);
router.get('/contacts', getContacts);
router.get('/:userId', getUserProfile);
router.put('/profile', updateProfile);
router.put('/avatar', upload.single('avatar'), updateAvatar);
router.post('/contacts', addContact);
router.delete('/contacts/:contactId', removeContact);
router.post('/block/:userId', blockUser);
router.post('/unblock/:userId', unblockUser);

module.exports = router;
