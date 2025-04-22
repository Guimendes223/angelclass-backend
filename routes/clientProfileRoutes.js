const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const clientProfileController = require('../controllers/clientProfileController');
const { auth, checkRole } = require('../middleware/authMiddleware');

// Validation rules
const profileValidation = [
  body('displayName').optional().notEmpty().withMessage('Display name cannot be empty'),
  body('age').optional().isInt({ min: 18 }).withMessage('Age must be at least 18'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('preferences.companionGender').optional().isIn(['male', 'female', 'all']).withMessage('Invalid companion gender preference'),
  body('preferences.ageRange.min').optional().isInt({ min: 18 }).withMessage('Minimum age must be at least 18'),
  body('preferences.ageRange.max').optional().isInt({ min: 18 }).withMessage('Maximum age must be at least 18')
];

// Routes - all protected with auth middleware and client role check
// Create or update client profile
router.post('/profile', 
  auth, 
  checkRole(['client']), 
  profileValidation, 
  clientProfileController.createOrUpdateClientProfile
);

// Get current client's profile
router.get('/profile', 
  auth, 
  checkRole(['client']), 
  clientProfileController.getCurrentClientProfile
);

// Favorites management
router.post('/favorites/:companionId', 
  auth, 
  checkRole(['client']), 
  clientProfileController.addToFavorites
);

router.delete('/favorites/:companionId', 
  auth, 
  checkRole(['client']), 
  clientProfileController.removeFromFavorites
);

router.get('/favorites', 
  auth, 
  checkRole(['client']), 
  clientProfileController.getFavorites
);

// Recently viewed management
router.post('/recently-viewed/:companionId', 
  auth, 
  checkRole(['client']), 
  clientProfileController.addToRecentlyViewed
);

router.get('/recently-viewed', 
  auth, 
  checkRole(['client']), 
  clientProfileController.getRecentlyViewed
);

module.exports = router;
