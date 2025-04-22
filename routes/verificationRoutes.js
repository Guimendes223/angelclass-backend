const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const { auth, checkRole } = require('../middleware/authMiddleware');

// Validation rules
const idVerificationValidation = [
  body('frontImage').notEmpty().withMessage('Front image of ID is required'),
  body('documentType').isIn(['passport', 'driverLicense', 'nationalId', 'other']).withMessage('Valid document type is required'),
  body('documentNumber').notEmpty().withMessage('Document number is required')
];

const selfieVerificationValidation = [
  body('image').notEmpty().withMessage('Selfie image is required')
];

const comparisonMediaValidation = [
  body('images').isArray().withMessage('Images must be an array'),
  body('videos').optional().isArray().withMessage('Videos must be an array')
];

const rejectionValidation = [
  body('rejectionReason').notEmpty().withMessage('Rejection reason is required')
];

// User routes - protected with auth middleware
// Submit ID verification
router.post('/id', 
  auth, 
  idVerificationValidation, 
  verificationController.submitIdVerification
);

// Submit selfie verification
router.post('/selfie', 
  auth, 
  selfieVerificationValidation, 
  verificationController.submitSelfieVerification
);

// Submit comparison media
router.post('/comparison-media', 
  auth, 
  comparisonMediaValidation, 
  verificationController.submitComparisonMedia
);

// Get verification status
router.get('/status', 
  auth, 
  verificationController.getVerificationStatus
);

// Admin routes - protected with auth middleware and admin role check
// Get pending verifications
router.get('/pending', 
  auth, 
  checkRole(['admin']), 
  verificationController.getPendingVerifications
);

// Approve ID verification
router.put('/id/:userId/approve', 
  auth, 
  checkRole(['admin']), 
  verificationController.approveIdVerification
);

// Reject ID verification
router.put('/id/:userId/reject', 
  auth, 
  checkRole(['admin']), 
  rejectionValidation,
  verificationController.rejectIdVerification
);

// Approve selfie verification
router.put('/selfie/:userId/approve', 
  auth, 
  checkRole(['admin']), 
  verificationController.approveSelfieVerification
);

// Reject selfie verification
router.put('/selfie/:userId/reject', 
  auth, 
  checkRole(['admin']), 
  rejectionValidation,
  verificationController.rejectSelfieVerification
);

// Approve comparison media
router.put('/comparison-media/:userId/approve', 
  auth, 
  checkRole(['admin']), 
  verificationController.approveComparisonMedia
);

// Reject comparison media
router.put('/comparison-media/:userId/reject', 
  auth, 
  checkRole(['admin']), 
  rejectionValidation,
  verificationController.rejectComparisonMedia
);

module.exports = router;
