const express = require('express');
const { protect } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const {
  getMessages,
  sendMessage,
  deleteMessage,
  editMessage,
  markAsRead,
} = require('../controllers/messageController');

const router = express.Router();

router.use(protect);

router.get('/:conversationId', getMessages);
router.post('/:conversationId', upload.single('file'), sendMessage);
router.put('/:messageId/edit', editMessage);
router.delete('/:messageId', deleteMessage);
router.post('/read', markAsRead);

module.exports = router;
