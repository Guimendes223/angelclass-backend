const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const companionProfileController = require('../controllers/companionProfileController');
const { auth, checkRole } = require('../middleware/authMiddleware');

// Validation rules
const profileValidation = [
  body('displayName').optional().notEmpty().withMessage('Display name cannot be empty'),
  body('age').optional().isInt({ min: 18, max: 99 }).withMessage('Age must be between 18 and 99'),
  body('height').optional().isInt({ min: 140, max: 220 }).withMessage('Height must be between 140 and 220 cm'),
  body('bodyType').optional().isIn(['slim', 'athletic', 'average', 'curvy', 'plus-size']).withMessage('Invalid body type'),
  body('aboutMe').optional().isLength({ max: 2000 }).withMessage('About me section cannot exceed 2000 characters'),
  body('rates.hourly').optional().isNumeric().withMessage('Hourly rate must be a number'),
  body('location.city').optional().notEmpty().withMessage('City is required'),
  body('location.state').optional().notEmpty().withMessage('State is required')
];

const photoValidation = [
  body('url').notEmpty().withMessage('Photo URL is required'),
  body('isMain').optional().isBoolean().withMessage('isMain must be a boolean')
];

const videoValidation = [
  body('url').notEmpty().withMessage('Video URL is required'),
  body('thumbnail').optional()
];

const audioValidation = [
  body('url').notEmpty().withMessage('Audio URL is required'),
  body('duration').optional().isNumeric().withMessage('Duration must be a number')
];

// Routes - all protected with auth middleware and companion role check
// Create or update companion profile
router.post('/profile', 
  auth, 
  checkRole(['companion']), 
  profileValidation, 
  companionProfileController.createOrUpdateCompanionProfile
);

// Get current companion's profile
router.get('/profile', 
  auth, 
  checkRole(['companion']), 
  companionProfileController.getCurrentCompanionProfile
);

// Get companion profile by ID (accessible to all authenticated users)
router.get('/profile/:id', 
  auth, 
  companionProfileController.getCompanionProfileById
);

// Photo management
router.post('/photos', 
  auth, 
  checkRole(['companion']), 
  photoValidation, 
  companionProfileController.addPhoto
);

router.delete('/photos/:photoId', 
  auth, 
  checkRole(['companion']), 
  companionProfileController.deletePhoto
);

router.put('/photos/:photoId/main', 
  auth, 
  checkRole(['companion']), 
  companionProfileController.setMainPhoto
);

// Video management
router.post('/videos', 
  auth, 
  checkRole(['companion']), 
  videoValidation, 
  companionProfileController.addVideo
);

router.delete('/videos/:videoId', 
  auth, 
  checkRole(['companion']), 
  companionProfileController.deleteVideo
);

// Audio introduction management
router.post('/audio', 
  auth, 
  checkRole(['companion']), 
  audioValidation, 
  companionProfileController.addAudioIntroduction
);

router.delete('/audio', 
  auth, 
  checkRole(['companion']), 
  companionProfileController.deleteAudioIntroduction
);

module.exports = router;
