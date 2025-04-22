const mongoose = require('mongoose');

const termsOfServiceSchema = new mongoose.Schema({
  version: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const privacyPolicySchema = new mongoose.Schema({
  version: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const userAgreementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  termsOfService: {
    version: {
      type: String,
      required: true
    },
    agreedAt: {
      type: Date,
      default: Date.now
    },
    ipAddress: String
  },
  privacyPolicy: {
    version: {
      type: String,
      required: true
    },
    agreedAt: {
      type: Date,
      default: Date.now
    },
    ipAddress: String
  },
  ageVerification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date,
    method: {
      type: String,
      enum: ['self_declaration', 'id_verification', 'other']
    }
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
userAgreementSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const TermsOfService = mongoose.model('TermsOfService', termsOfServiceSchema);
const PrivacyPolicy = mongoose.model('PrivacyPolicy', privacyPolicySchema);
const UserAgreement = mongoose.model('UserAgreement', userAgreementSchema);

module.exports = {
  TermsOfService,
  PrivacyPolicy,
  UserAgreement
};
