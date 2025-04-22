const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { auth } = require('../middleware/authMiddleware');

// Validation rules
const subscriptionValidation = [
  body('plan').isIn(['free', 'basic', 'premium', 'vip']).withMessage('Invalid subscription plan'),
  body('paymentMethod').optional().isIn(['credit_card', 'debit_card', 'paypal', 'bank_transfer']).withMessage('Invalid payment method'),
  body('autoRenew').optional().isBoolean().withMessage('autoRenew must be a boolean')
];

const featuredListingValidation = [
  body('duration').isIn(['7days', '14days', '30days']).withMessage('Invalid duration'),
  body('paymentMethod').isIn(['credit_card', 'debit_card', 'paypal', 'bank_transfer']).withMessage('Invalid payment method')
];

// All routes are protected with auth middleware
// Create subscription
router.post('/subscriptions', 
  auth, 
  subscriptionValidation, 
  paymentController.createSubscription
);

// Get current subscription
router.get('/subscriptions/current', 
  auth, 
  paymentController.getCurrentSubscription
);

// Cancel subscription
router.put('/subscriptions/cancel', 
  auth, 
  paymentController.cancelSubscription
);

// Create featured listing
router.post('/featured-listings', 
  auth, 
  featuredListingValidation, 
  paymentController.createFeaturedListing
);

// Get payment history
router.get('/history', 
  auth, 
  paymentController.getPaymentHistory
);

// Get subscription plans (public route)
router.get('/subscription-plans', 
  paymentController.getSubscriptionPlans
);

module.exports = router;
