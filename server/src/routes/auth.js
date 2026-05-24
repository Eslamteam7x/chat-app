const express = require('express');
const { body } = require('express-validator');
const { register, login, refreshTokenHandler, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.post(
  '/register',
  [
    body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

router.post('/refresh-token', refreshTokenHandler);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
