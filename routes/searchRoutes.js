const express = require('express');
const { query } = require('express-validator');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { auth } = require('../middleware/authMiddleware');

// Validation rules
const searchValidation = [
  query('location').optional(),
  query('services').optional(),
  query('minAge').optional().isInt({ min: 18 }).withMessage('Minimum age must be at least 18'),
  query('maxAge').optional().isInt({ min: 18 }).withMessage('Maximum age must be at least 18'),
  query('bodyType').optional(),
  query('minRate').optional().isInt({ min: 0 }).withMessage('Minimum rate must be non-negative'),
  query('maxRate').optional().isInt({ min: 0 }).withMessage('Maximum rate must be non-negative'),
  query('ethnicity').optional(),
  query('languages').optional(),
  query('sortBy').optional().isIn(['newest', 'oldest', 'price_low', 'price_high', 'rating', 'popularity']).withMessage('Invalid sort option'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be at least 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

// Routes
// Search companions - public route
router.get('/companions', searchValidation, searchController.searchCompanions);

// Get featured companions - public route
router.get('/featured', searchController.getFeaturedCompanions);

// Get popular companions - public route
router.get('/popular', searchController.getPopularCompanions);

// Get new companions - public route
router.get('/new', searchController.getNewCompanions);

// Get companions by location - public route
router.get('/location/:location', searchController.getCompanionsByLocation);

// Get available locations - public route
router.get('/locations', searchController.getAvailableLocations);

// Get available services - public route
router.get('/services', searchController.getAvailableServices);

module.exports = router;
