const ClientProfile = require('../models/ClientProfile');
const CompanionProfile = require('../models/CompanionProfile');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Create or update client profile
exports.createOrUpdateClientProfile = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    
    // Check if user exists and is a client
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can create this type of profile' });
    }

    // Extract profile data from request body
    const {
      displayName,
      age,
      gender,
      preferences
    } = req.body;

    // Find existing profile or create new one
    let profile = await ClientProfile.findOne({ user: userId });
    
    if (profile) {
      // Update existing profile
      if (displayName) profile.displayName = displayName;
      if (age) profile.age = age;
      if (gender) profile.gender = gender;
      if (preferences) profile.preferences = preferences;
    } else {
      // Create new profile
      profile = new ClientProfile({
        user: userId,
        displayName: displayName || user.firstName,
        age,
        gender,
        preferences
      });
    }

    // Save profile
    await profile.save();

    res.json({
      message: profile.isNew ? 'Profile created successfully' : 'Profile updated successfully',
      profile
    });
  } catch (error) {
    console.error('Profile creation/update error:', error);
    res.status(500).json({ message: 'Server error during profile operation' });
  }
};

// Get current client's profile
exports.getCurrentClientProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find profile
    const profile = await ClientProfile.findOne({ user: userId });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Get current profile error:', error);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
};

// Add companion to favorites
exports.addToFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const companionProfileId = req.params.companionId;
    
    // Check if client profile exists
    const clientProfile = await ClientProfile.findOne({ user: userId });
    
    if (!clientProfile) {
      return res.status(404).json({ message: 'Client profile not found' });
    }

    // Check if companion profile exists
    const companionProfile = await CompanionProfile.findById(companionProfileId);
    
    if (!companionProfile) {
      return res.status(404).json({ message: 'Companion profile not found' });
    }

    // Check if companion is already in favorites
    const existingFavorite = clientProfile.favorites.find(
      fav => fav.companion.toString() === companionProfileId
    );
    
    if (existingFavorite) {
      return res.status(400).json({ message: 'Companion already in favorites' });
    }

    // Add to favorites
    clientProfile.favorites.push({
      companion: companionProfileId,
      addedAt: Date.now()
    });

    // Increment companion's favorite count
    companionProfile.stats.favoriteCount += 1;
    
    // Save both profiles
    await Promise.all([
      clientProfile.save(),
      companionProfile.save()
    ]);

    res.json({
      message: 'Added to favorites successfully',
      favorite: clientProfile.favorites[clientProfile.favorites.length - 1]
    });
  } catch (error) {
    console.error('Add to favorites error:', error);
    res.status(500).json({ message: 'Server error while adding to favorites' });
  }
};

// Remove companion from favorites
exports.removeFromFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const companionProfileId = req.params.companionId;
    
    // Check if client profile exists
    const clientProfile = await ClientProfile.findOne({ user: userId });
    
    if (!clientProfile) {
      return res.status(404).json({ message: 'Client profile not found' });
    }

    // Find favorite index
    const favoriteIndex = clientProfile.favorites.findIndex(
      fav => fav.companion.toString() === companionProfileId
    );
    
    if (favoriteIndex === -1) {
      return res.status(404).json({ message: 'Companion not found in favorites' });
    }

    // Remove from favorites
    clientProfile.favorites.splice(favoriteIndex, 1);
    
    // Decrement companion's favorite count
    const companionProfile = await CompanionProfile.findById(companionProfileId);
    if (companionProfile) {
      companionProfile.stats.favoriteCount = Math.max(0, companionProfile.stats.favoriteCount - 1);
      await companionProfile.save();
    }
    
    // Save client profile
    await clientProfile.save();

    res.json({ message: 'Removed from favorites successfully' });
  } catch (error) {
    console.error('Remove from favorites error:', error);
    res.status(500).json({ message: 'Server error while removing from favorites' });
  }
};

// Get client's favorites
exports.getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find profile with populated favorites
    const profile = await ClientProfile.findOne({ user: userId })
      .populate({
        path: 'favorites.companion',
        select: 'displayName photos location rates stats'
      });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(profile.favorites);
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ message: 'Server error while fetching favorites' });
  }
};

// Add companion to recently viewed
exports.addToRecentlyViewed = async (req, res) => {
  try {
    const userId = req.user.id;
    const companionProfileId = req.params.companionId;
    
    // Check if client profile exists
    const clientProfile = await ClientProfile.findOne({ user: userId });
    
    if (!clientProfile) {
      return res.status(404).json({ message: 'Client profile not found' });
    }

    // Check if companion profile exists
    const companionProfile = await CompanionProfile.findById(companionProfileId);
    
    if (!companionProfile) {
      return res.status(404).json({ message: 'Companion profile not found' });
    }

    // Remove if already in recently viewed
    const existingIndex = clientProfile.recentlyViewed.findIndex(
      item => item.companion.toString() === companionProfileId
    );
    
    if (existingIndex !== -1) {
      clientProfile.recentlyViewed.splice(existingIndex, 1);
    }

    // Add to beginning of recently viewed
    clientProfile.recentlyViewed.unshift({
      companion: companionProfileId,
      viewedAt: Date.now()
    });

    // Limit to 20 items (handled by pre-save hook)
    await clientProfile.save();

    res.json({
      message: 'Added to recently viewed successfully'
    });
  } catch (error) {
    console.error('Add to recently viewed error:', error);
    res.status(500).json({ message: 'Server error while updating recently viewed' });
  }
};

// Get client's recently viewed companions
exports.getRecentlyViewed = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find profile with populated recently viewed
    const profile = await ClientProfile.findOne({ user: userId })
      .populate({
        path: 'recentlyViewed.companion',
        select: 'displayName photos location rates stats'
      });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(profile.recentlyViewed);
  } catch (error) {
    console.error('Get recently viewed error:', error);
    res.status(500).json({ message: 'Server error while fetching recently viewed' });
  }
};
