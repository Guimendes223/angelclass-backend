const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const messagingController = require('../controllers/messagingController');
const { auth } = require('../middleware/authMiddleware');

// Validation rules
const createConversationValidation = [
  body('recipientId').notEmpty().withMessage('Recipient ID is required'),
  body('initialMessage').notEmpty().withMessage('Initial message is required')
];

const sendMessageValidation = [
  body('content').notEmpty().withMessage('Message content is required')
];

// All routes are protected with auth middleware
// Get all conversations for current user
router.get('/conversations', 
  auth, 
  messagingController.getConversations
);

// Get single conversation by ID
router.get('/conversations/:id', 
  auth, 
  messagingController.getConversationById
);

// Create new conversation
router.post('/conversations', 
  auth, 
  createConversationValidation, 
  messagingController.createConversation
);

// Send message in conversation
router.post('/conversations/:id/messages', 
  auth, 
  sendMessageValidation, 
  messagingController.sendMessage
);

// Get messages in conversation
router.get('/conversations/:id/messages', 
  auth, 
  messagingController.getMessages
);

// Mark conversation as read
router.put('/conversations/:id/read', 
  auth, 
  messagingController.markAsRead
);

// Delete conversation
router.delete('/conversations/:id', 
  auth, 
  messagingController.deleteConversation
);

// Block conversation
router.put('/conversations/:id/block', 
  auth, 
  messagingController.blockConversation
);

// Unblock conversation
router.put('/conversations/:id/unblock', 
  auth, 
  messagingController.unblockConversation
);

// Get unread message count
router.get('/unread-count', 
  auth, 
  messagingController.getUnreadCount
);

module.exports = router;
