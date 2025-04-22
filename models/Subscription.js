const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: String,
    enum: ['free', 'basic', 'premium', 'vip'],
    default: 'free',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'canceled', 'expired'],
    default: 'active'
  },
  features: {
    featuredProfile: Boolean,
    priorityListing: Boolean,
    enhancedVisibility: Boolean,
    messageLimit: Number,
    mediaLimit: Number,
    verificationIncluded: Boolean,
    customBadge: Boolean
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  autoRenew: {
    type: Boolean,
    default: false
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer']
  },
  lastPayment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  nextBillingDate: {
    type: Date
  },
  canceledAt: {
    type: Date
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
subscriptionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
