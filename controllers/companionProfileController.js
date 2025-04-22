const CompanionProfile = require('../models/CompanionProfile');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Create or update companion profile
exports.createOrUpdateCompanionProfile = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    
    // Check if user exists and is a companion
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.role !== 'companion') {
      return res.status(403).json({ message: 'Only companions can create this type of profile' });
    }

    // Extract profile data from request body
    const {
      displayName,
      age,
      height,
      bodyType,
      ethnicity,
      languages,
      aboutMe,
      services,
      rates,
      availability,
      location,
      socialMedia,
      preferences
    } = req.body;

    // Find existing profile or create new one
    let profile = await CompanionProfile.findOne({ user: userId });
    
    if (profile) {
      // Update existing profile
      if (displayName) profile.displayName = displayName;
      if (age) profile.age = age;
      if (height) profile.height = height;
      if (bodyType) profile.bodyType = bodyType;
      if (ethnicity) profile.ethnicity = ethnicity;
      if (languages) profile.languages = languages;
      if (aboutMe) profile.aboutMe = aboutMe;
      if (services) profile.services = services;
      if (rates) profile.rates = rates;
      if (availability) profile.availability = availability;
      if (location) profile.location = location;
      if (socialMedia) profile.socialMedia = socialMedia;
      if (preferences) profile.preferences = preferences;
    } else {
      // Create new profile
      profile = new CompanionProfile({
        user: userId,
        displayName: displayName || user.firstName,
        age,
        height,
        bodyType,
        ethnicity,
        languages,
        aboutMe,
        services,
        rates,
        availability,
        location,
        socialMedia,
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

// Get companion profile by ID
exports.getCompanionProfileById = async (req, res) => {
  try {
    const profileId = req.params.id;
    
    // Find profile and populate user data (excluding password)
    const profile = await CompanionProfile.findById(profileId)
      .populate('user', '-password');
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Increment profile views
    profile.stats.profileViews += 1;
    profile.stats.lastActive = Date.now();
    await profile.save();

    res.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
};

// Get current companion's profile
exports.getCurrentCompanionProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find profile
    const profile = await CompanionProfile.findOne({ user: userId });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Get current profile error:', error);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
};

// Add photo to companion profile
exports.addPhoto = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if profile exists
    const profile = await CompanionProfile.findOne({ user: userId });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // In a real implementation, this would handle file uploads
    // For now, we'll just add the URL from the request
    const { url, isMain } = req.body;
    
    if (!url) {
      return res.status(400).json({ message: 'Photo URL is required' });
    }

    // Create new photo object
    const newPhoto = {
      url,
      isMain: isMain || false,
      isVerified: false,
      uploadDate: Date.now()
    };

    // If this is the main photo, set all others to not main
    if (newPhoto.isMain) {
      profile.photos.forEach(photo => {
        photo.isMain = false;
      });
    }

    // Add photo to profile
    profile.photos.push(newPhoto);
    await profile.save();

    res.json({
      message: 'Photo added successfully',
      photo: newPhoto
    });
  } catch (error) {
    console.error('Add photo error:', error);
    res.status(500).json({ message: 'Server error while adding photo' });
  }
};

// Delete photo from companion profile
exports.deletePhoto = async (req, res) => {
  try {
    const userId = req.user.id;
    const photoId = req.params.photoId;
    
    // Check if profile exists
    const profile = await CompanionProfile.findOne({ user: userId });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Find photo index
    const photoIndex = profile.photos.findIndex(photo => photo._id.toString() === photoId);
    
    if (photoIndex === -1) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    // Remove photo
    profile.photos.splice(photoIndex, 1);
    await profile.save();

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ message: 'Server error while deleting photo' });
  }
};

// Set photo as main
exports.setMainPhoto = async (req, res) => {
  try {
    const userId = req.user.id;
    const photoId = req.params.photoId;
    
    // Check if profile exists
    const profile = await CompanionProfile.findOne({ user: userId });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Find photo
    const photoIndex = profile.photos.findIndex(photo => photo._id.toString() === photoId);
    
    if (photoIndex === -1) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    // Set all photos to not main
    profile.photos.forEach(photo => {
      photo.isMain = false;
    });

    // Set selected photo as main
    profile.photos[photoIndex].isMain = true;
    await profile.save();

    res.json({ 
      message: 'Main photo updated successfully',
      photo: profile.photos[photoIndex]
    });
  } catch (error) {
    console.error('Set main photo error:', error);
    res.status(500).json({ message: 'Server error while updating main photo' });
  }
};

// Add video to companion profile
exports.addVideo = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if profile exists
    const profile = await CompanionProfile.findOne({ user: userId });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // In a real implementation, this would handle file uploads
    // For now, we'll just add the URL from the request
    const { url, thumbnail } = req.body;
    
    if (!url) {
      return res.status(400).json({ message: 'Video URL is required' });
    }

    // Create new video object
    const newVideo = {
      url,
      thumbnail: thumbnail || '',
      isVerified: false,
      uploadDate: Date.now()
    };

    // Add video to profile
    profile.videos.push(newVideo);
    await profile.save();

    res.json({
      message: 'Video added successfully',
      video: newVideo
    });
  } catch (error) {
    console.error('Add video error:', error);
    res.status(500).json({ message: 'Server error while adding video' });
  }
};

// Delete video from companion profile
exports.deleteVideo = async (req, res) => {
  try {
    const userId = req.user.id;
    const videoId = req.params.videoId;
    
    // Check if profile exists
    const profile = await CompanionProfile.findOne({ user: userId });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Find video index
    const videoIndex = profile.videos.findIndex(video => video._id.toString() === videoId);
    
    if (videoIndex === -1) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Remove video
    profile.videos.splice(videoIndex, 1);
    await profile.save();

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ message: 'Server error while deleting video' });
  }
};

// Add audio introduction to companion profile
exports.addAudioIntroduction = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if profile exists
    const profile = await CompanionProfile.findOne({ user: userId });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // In a real implementation, this would handle file uploads
    // For now, we'll just add the URL from the request
    const { url, duration } = req.body;
    
    if (!url) {
      return res.status(400).json({ message: 'Audio URL is required' });
    }

    // Create new audio object
    profile.audioIntroduction = {
      url,
      duration: duration || 0,
      uploadDate: Date.now()
    };

    await profile.save();

    res.json({
      message: 'Audio introduction added successfully',
      audio: profile.audioIntroduction
    });
  } catch (error) {
    console.error('Add audio error:', error);
    res.status(500).json({ message: 'Server error while adding audio' });
  }
};

// Delete audio introduction from companion profile
exports.deleteAudioIntroduction = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if profile exists
    const profile = await CompanionProfile.findOne({ user: userId });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Remove audio introduction
    profile.audioIntroduction = undefined;
    await profile.save();

    res.json({ message: 'Audio introduction deleted successfully' });
  } catch (error) {
    console.error('Delete audio error:', error);
    res.status(500).json({ message: 'Server error while deleting audio' });
  }
};
