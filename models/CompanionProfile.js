const mongoose = require('mongoose');

const companionProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    min: 18,
    max: 99
  },
  height: {
    type: Number, // in cm
    min: 140,
    max: 220
  },
  bodyType: {
    type: String,
    enum: ['slim', 'athletic', 'average', 'curvy', 'plus-size']
  },
  ethnicity: {
    type: String
  },
  languages: [{
    type: String
  }],
  aboutMe: {
    type: String,
    maxlength: 2000
  },
  services: [{
    type: String
  }],
  rates: {
    hourly: Number,
    twoHours: Number,
    threeHours: Number,
    dinner: Number,
    overnight: Number,
    additionalInfo: String
  },
  availability: {
    monday: {
      available: Boolean,
      startTime: String,
      endTime: String
    },
    tuesday: {
      available: Boolean,
      startTime: String,
      endTime: String
    },
    wednesday: {
      available: Boolean,
      startTime: String,
      endTime: String
    },
    thursday: {
      available: Boolean,
      startTime: String,
      endTime: String
    },
    friday: {
      available: Boolean,
      startTime: String,
      endTime: String
    },
    saturday: {
      available: Boolean,
      startTime: String,
      endTime: String
    },
    sunday: {
      available: Boolean,
      startTime: String,
      endTime: String
    }
  },
  location: {
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    country: {
      type: String,
      default: 'Australia'
    },
    travelAvailability: {
      type: Boolean,
      default: false
    },
    travelLocations: [{
      type: String
    }]
  },
  photos: [{
    url: String,
    isMain: Boolean,
    isVerified: Boolean,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  videos: [{
    url: String,
    thumbnail: String,
    isVerified: Boolean,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  audioIntroduction: {
    url: String,
    duration: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  },
  socialMedia: {
    instagram: String,
    twitter: String,
    website: String
  },
  preferences: {
    minClientAge: {
      type: Number,
      default: 18
    },
    maxClientAge: Number,
    genderPreference: {
      type: String,
      enum: ['male', 'female', 'all']
    },
    otherPreferences: [String]
  },
  stats: {
    profileViews: {
      type: Number,
      default: 0
    },
    favoriteCount: {
      type: Number,
      default: 0
    },
    lastActive: {
      type: Date,
      default: Date.now
    }
  },
  featured: {
    isFeatured: {
      type: Boolean,
      default: false
    },
    featuredUntil: Date
  },
  subscription: {
    level: {
      type: String,
      enum: ['free', 'basic', 'premium', 'vip'],
      default: 'free'
    },
    expiresAt: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
companionProfileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const CompanionProfile = mongoose.model('CompanionProfile', companionProfileSchema);

module.exports = CompanionProfile;
