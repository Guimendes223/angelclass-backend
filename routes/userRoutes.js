const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/authMiddleware');

// Validation rules
const registerValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').optional().isIn(['client', 'companion']).withMessage('Role must be either client or companion'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required')
];

const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

const passwordResetRequestValidation = [
  body('email').isEmail().withMessage('Please enter a valid email')
];

const passwordResetValidation = [
  body('token').notEmpty().withMessage('Token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
];

// Routes
// Register new user
router.post('/register', registerValidation, authController.register);

// Login user
router.post('/login', loginValidation, authController.login);

// Get current user profile (protected route)
router.get('/me', auth, authController.getCurrentUser);

// Update user profile (protected route)
router.put('/profile', auth, authController.updateProfile);

// Request password reset
router.post('/password-reset-request', passwordResetRequestValidation, authController.requestPasswordReset);

// Reset password
router.post('/password-reset', passwordResetValidation, authController.resetPassword);

module.exports = router;
