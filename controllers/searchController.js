const CompanionProfile = require('../models/CompanionProfile');
const { validationResult } = require('express-validator');

// Search companions
exports.searchCompanions = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Extract search parameters from query
    const {
      location,
      services,
      minAge,
      maxAge,
      bodyType,
      minRate,
      maxRate,
      ethnicity,
      languages,
      sortBy,
      page = 1,
      limit = 20
    } = req.query;

    // Build search query
    const searchQuery = {
      'isActive': true
    };

    // Location filter
    if (location) {
      if (typeof location === 'string') {
        searchQuery['$or'] = [
          { 'location.city': { $regex: location, $options: 'i' } },
          { 'location.state': { $regex: location, $options: 'i' } }
        ];
      } else if (Array.isArray(location)) {
        const locationQueries = location.map(loc => ({
          '$or': [
            { 'location.city': { $regex: loc, $options: 'i' } },
            { 'location.state': { $regex: loc, $options: 'i' } }
          ]
        }));
        searchQuery['$or'] = locationQueries;
      }
    }

    // Services filter
    if (services) {
      if (typeof services === 'string') {
        searchQuery['services'] = { $regex: services, $options: 'i' };
      } else if (Array.isArray(services)) {
        searchQuery['services'] = { $in: services.map(service => new RegExp(service, 'i')) };
      }
    }

    // Age range filter
    if (minAge || maxAge) {
      searchQuery['age'] = {};
      if (minAge) searchQuery['age']['$gte'] = parseInt(minAge);
      if (maxAge) searchQuery['age']['$lte'] = parseInt(maxAge);
    }

    // Body type filter
    if (bodyType) {
      if (typeof bodyType === 'string') {
        searchQuery['bodyType'] = bodyType;
      } else if (Array.isArray(bodyType)) {
        searchQuery['bodyType'] = { $in: bodyType };
      }
    }

    // Rate range filter
    if (minRate || maxRate) {
      searchQuery['rates.hourly'] = {};
      if (minRate) searchQuery['rates.hourly']['$gte'] = parseInt(minRate);
      if (maxRate) searchQuery['rates.hourly']['$lte'] = parseInt(maxRate);
    }

    // Ethnicity filter
    if (ethnicity) {
      if (typeof ethnicity === 'string') {
        searchQuery['ethnicity'] = { $regex: ethnicity, $options: 'i' };
      } else if (Array.isArray(ethnicity)) {
        searchQuery['ethnicity'] = { $in: ethnicity.map(eth => new RegExp(eth, 'i')) };
      }
    }

    // Languages filter
    if (languages) {
      if (typeof languages === 'string') {
        searchQuery['languages'] = { $regex: languages, $options: 'i' };
      } else if (Array.isArray(languages)) {
        searchQuery['languages'] = { $in: languages.map(lang => new RegExp(lang, 'i')) };
      }
    }

    // Determine sort order
    let sortOptions = { 'stats.profileViews': -1 }; // Default sort by popularity
    
    if (sortBy === 'newest') {
      sortOptions = { 'createdAt': -1 };
    } else if (sortBy === 'oldest') {
      sortOptions = { 'createdAt': 1 };
    } else if (sortBy === 'price_low') {
      sortOptions = { 'rates.hourly': 1 };
    } else if (sortBy === 'price_high') {
      sortOptions = { 'rates.hourly': -1 };
    } else if (sortBy === 'rating') {
      sortOptions = { 'stats.rating': -1 };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute search query with pagination
    const companions = await CompanionProfile.find(searchQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'isVerified');
    
    // Get total count for pagination
    const totalCount = await CompanionProfile.countDocuments(searchQuery);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      companions,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Search companions error:', error);
    res.status(500).json({ message: 'Server error during search' });
  }
};

// Get featured companions
exports.getFeaturedCompanions = async (req, res) => {
  try {
    // Get featured companions
    const featuredCompanions = await CompanionProfile.find({
      'isActive': true,
      'featured.isFeatured': true,
      'featured.featuredUntil': { $gt: new Date() }
    })
    .sort({ 'stats.profileViews': -1 })
    .limit(10)
    .populate('user', 'isVerified');
    
    res.json(featuredCompanions);
  } catch (error) {
    console.error('Get featured companions error:', error);
    res.status(500).json({ message: 'Server error while fetching featured companions' });
  }
};

// Get popular companions
exports.getPopularCompanions = async (req, res) => {
  try {
    // Get popular companions based on profile views
    const popularCompanions = await CompanionProfile.find({
      'isActive': true
    })
    .sort({ 'stats.profileViews': -1 })
    .limit(20)
    .populate('user', 'isVerified');
    
    res.json(popularCompanions);
  } catch (error) {
    console.error('Get popular companions error:', error);
    res.status(500).json({ message: 'Server error while fetching popular companions' });
  }
};

// Get new companions
exports.getNewCompanions = async (req, res) => {
  try {
    // Get newest companions
    const newCompanions = await CompanionProfile.find({
      'isActive': true
    })
    .sort({ 'createdAt': -1 })
    .limit(20)
    .populate('user', 'isVerified');
    
    res.json(newCompanions);
  } catch (error) {
    console.error('Get new companions error:', error);
    res.status(500).json({ message: 'Server error while fetching new companions' });
  }
};

// Get companions by location
exports.getCompanionsByLocation = async (req, res) => {
  try {
    const { location } = req.params;
    
    if (!location) {
      return res.status(400).json({ message: 'Location parameter is required' });
    }
    
    // Get companions by location
    const companions = await CompanionProfile.find({
      'isActive': true,
      '$or': [
        { 'location.city': { $regex: location, $options: 'i' } },
        { 'location.state': { $regex: location, $options: 'i' } }
      ]
    })
    .sort({ 'stats.profileViews': -1 })
    .limit(20)
    .populate('user', 'isVerified');
    
    res.json(companions);
  } catch (error) {
    console.error('Get companions by location error:', error);
    res.status(500).json({ message: 'Server error while fetching companions by location' });
  }
};

// Get available locations
exports.getAvailableLocations = async (req, res) => {
  try {
    // Get distinct cities and states
    const cities = await CompanionProfile.distinct('location.city', { 'isActive': true });
    const states = await CompanionProfile.distinct('location.state', { 'isActive': true });
    
    // Remove duplicates and null/empty values
    const locations = [...new Set([...cities, ...states])]
      .filter(location => location && location.trim() !== '');
    
    res.json(locations);
  } catch (error) {
    console.error('Get available locations error:', error);
    res.status(500).json({ message: 'Server error while fetching available locations' });
  }
};

// Get available services
exports.getAvailableServices = async (req, res) => {
  try {
    // Get distinct services
    const services = await CompanionProfile.distinct('services', { 'isActive': true });
    
    // Remove duplicates and null/empty values
    const uniqueServices = [...new Set(services)]
      .filter(service => service && service.trim() !== '');
    
    res.json(uniqueServices);
  } catch (error) {
    console.error('Get available services error:', error);
    res.status(500).json({ message: 'Server error while fetching available services' });
  }
};
