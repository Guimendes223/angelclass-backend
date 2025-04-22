const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  idVerification: {
    frontImage: String,
    backImage: String,
    documentType: {
      type: String,
      enum: ['passport', 'driverLicense', 'nationalId', 'other'],
      required: true
    },
    documentNumber: String,
    expiryDate: Date,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    rejectionReason: String,
    submittedAt: {
      type: Date,
      default: Date.now
    },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  selfieVerification: {
    image: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    rejectionReason: String,
    submittedAt: {
      type: Date,
      default: Date.now
    },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  comparisonMedia: {
    images: [String],
    videos: [String],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    rejectionReason: String,
    submittedAt: {
      type: Date,
      default: Date.now
    },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  overallStatus: {
    type: String,
    enum: ['unverified', 'partially_verified', 'fully_verified', 'rejected'],
    default: 'unverified'
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
verificationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Calculate overall status
  let statuses = [
    this.idVerification?.status,
    this.selfieVerification?.status,
    this.comparisonMedia?.status
  ].filter(Boolean);
  
  if (statuses.includes('rejected')) {
    this.overallStatus = 'rejected';
  } else if (statuses.every(status => status === 'approved')) {
    this.overallStatus = 'fully_verified';
  } else if (statuses.some(status => status === 'approved')) {
    this.overallStatus = 'partially_verified';
  } else {
    this.overallStatus = 'unverified';
  }
  
  next();
});

const Verification = mongoose.model('Verification', verificationSchema);

module.exports = Verification;
