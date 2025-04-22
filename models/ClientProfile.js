const mongoose = require('mongoose');

const clientProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  displayName: {
    type: String,
    trim: true
  },
  age: {
    type: Number,
    min: 18
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  preferences: {
    companionGender: {
      type: String,
      enum: ['male', 'female', 'all'],
      default: 'all'
    },
    ageRange: {
      min: {
        type: Number,
        default: 18
      },
      max: Number
    },
    services: [String],
    locations: [String]
  },
  favorites: [{
    companion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompanionProfile'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  recentlyViewed: [{
    companion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompanionProfile'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  verificationLevel: {
    type: String,
    enum: ['none', 'basic', 'verified'],
    default: 'none'
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
clientProfileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Limit recentlyViewed to 20 items
clientProfileSchema.pre('save', function(next) {
  if (this.recentlyViewed && this.recentlyViewed.length > 20) {
    this.recentlyViewed = this.recentlyViewed.slice(0, 20);
  }
  next();
});

const ClientProfile = mongoose.model('ClientProfile', clientProfileSchema);

module.exports = ClientProfile;
