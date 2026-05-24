const express = require('express');
const { protect } = require('../middlewares/auth');
const {
  getConversations,
  createConversation,
  getConversation,
  updateGroup,
  addParticipants,
  removeParticipant,
  leaveGroup,
  pinConversation,
} = require('../controllers/conversationController');

const router = express.Router();

router.use(protect);

router.get('/', getConversations);
router.post('/', createConversation);
router.get('/:conversationId', getConversation);
router.put('/:conversationId/group', updateGroup);
router.post('/:conversationId/participants', addParticipants);
router.delete('/:conversationId/participants/:userId', removeParticipant);
router.post('/:conversationId/leave', leaveGroup);
router.post('/:conversationId/pin', pinConversation);

module.exports = router;
