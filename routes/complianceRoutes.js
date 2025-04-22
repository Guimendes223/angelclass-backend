const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const complianceController = require('../controllers/complianceController');
const { auth, checkRole } = require('../middleware/authMiddleware');

// Validation rules
const termsAndPolicyValidation = [
  body('termsVersion').notEmpty().withMessage('Terms of service version is required'),
  body('policyVersion').notEmpty().withMessage('Privacy policy version is required'),
  body('ipAddress').optional()
];

const ageVerificationValidation = [
  body('method').isIn(['self_declaration', 'id_verification', 'other']).withMessage('Invalid verification method'),
  body('ipAddress').optional()
];

const termsOfServiceValidation = [
  body('version').notEmpty().withMessage('Version is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('isActive').isBoolean().withMessage('isActive must be a boolean')
];

const privacyPolicyValidation = [
  body('version').notEmpty().withMessage('Version is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('isActive').isBoolean().withMessage('isActive must be a boolean')
];

// Public routes
// Get current terms of service
router.get('/terms', 
  complianceController.getCurrentTermsOfService
);

// Get current privacy policy
router.get('/privacy', 
  complianceController.getCurrentPrivacyPolicy
);

// Protected routes - require authentication
// Accept terms and privacy policy
router.post('/accept', 
  auth, 
  termsAndPolicyValidation, 
  complianceController.acceptTermsAndPolicy
);

// Verify age
router.post('/verify-age', 
  auth, 
  ageVerificationValidation, 
  complianceController.verifyAge
);

// Get user agreement status
router.get('/status', 
  auth, 
  complianceController.getUserAgreementStatus
);

// Admin routes - require admin role
// Create new terms of service
router.post('/terms', 
  auth, 
  checkRole(['admin']), 
  termsOfServiceValidation, 
  complianceController.createTermsOfService
);

// Create new privacy policy
router.post('/privacy', 
  auth, 
  checkRole(['admin']), 
  privacyPolicyValidation, 
  complianceController.createPrivacyPolicy
);

// Get all terms of service versions
router.get('/terms/all', 
  auth, 
  checkRole(['admin']), 
  complianceController.getAllTermsOfService
);

// Get all privacy policy versions
router.get('/privacy/all', 
  auth, 
  checkRole(['admin']), 
  complianceController.getAllPrivacyPolicies
);

// Get user agreements
router.get('/agreements', 
  auth, 
  checkRole(['admin']), 
  complianceController.getUserAgreements
);

module.exports = router;
