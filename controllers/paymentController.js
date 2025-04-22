const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const CompanionProfile = require('../models/CompanionProfile');
const { validationResult } = require('express-validator');

// Mock payment processor functions (in a real app, these would integrate with Stripe, PayPal, etc.)
const processPayment = async (paymentDetails) => {
  // Simulate payment processing
  const success = Math.random() > 0.1; // 90% success rate
  
  if (success) {
    return {
      success: true,
      transactionId: 'txn_' + Math.random().toString(36).substring(2, 15),
      receiptUrl: `https://receipts.angelclass.com/receipt-${Date.now()}.pdf`
    };
  } else {
    throw new Error('Payment processing failed');
  }
};

// Create subscription
exports.createSubscription = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { plan, paymentMethod, autoRenew } = req.body;
    
    // Check if user already has an active subscription
    const existingSubscription = await Subscription.findOne({
      user: userId,
      status: 'active'
    });
    
    if (existingSubscription) {
      return res.status(400).json({ message: 'User already has an active subscription' });
    }
    
    // Get plan details
    const planDetails = getPlanDetails(plan);
    if (!planDetails) {
      return res.status(400).json({ message: 'Invalid subscription plan' });
    }
    
    // Calculate end date (30 days from now)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    
    // Calculate next billing date if auto-renew is enabled
    const nextBillingDate = autoRenew ? new Date(endDate) : null;
    
    // Process payment (except for free plan)
    let paymentResult = null;
    let payment = null;
    
    if (plan !== 'free') {
      try {
        // Process payment
        paymentResult = await processPayment({
          amount: planDetails.price,
          currency: 'AUD',
          paymentMethod,
          description: `Subscription to ${plan} plan`
        });
        
        // Create payment record
        payment = new Payment({
          user: userId,
          amount: planDetails.price,
          currency: 'AUD',
          paymentMethod,
          paymentType: 'subscription',
          status: 'completed',
          transactionId: paymentResult.transactionId,
          receiptUrl: paymentResult.receiptUrl,
          metadata: new Map([
            ['plan', plan],
            ['duration', '30 days']
          ])
        });
        
        await payment.save();
      } catch (error) {
        return res.status(400).json({ message: 'Payment processing failed', error: error.message });
      }
    }
    
    // Create subscription
    const subscription = new Subscription({
      user: userId,
      plan,
      status: 'active',
      features: planDetails.features,
      startDate: Date.now(),
      endDate,
      autoRenew,
      paymentMethod: plan !== 'free' ? paymentMethod : undefined,
      lastPayment: payment ? payment._id : undefined,
      nextBillingDate
    });
    
    await subscription.save();
    
    // Update user's subscription status
    await User.findByIdAndUpdate(userId, {
      subscriptionStatus: {
        plan,
        isActive: true,
        expiresAt: endDate
      }
    });
    
    // If user is a companion, update their profile subscription
    const companionProfile = await CompanionProfile.findOne({ user: userId });
    if (companionProfile) {
      companionProfile.subscription = {
        level: plan,
        expiresAt: endDate
      };
      
      // If premium or VIP plan, set featured status
      if (plan === 'premium' || plan === 'vip') {
        companionProfile.featured = {
          isFeatured: true,
          featuredUntil: endDate
        };
      }
      
      await companionProfile.save();
    }
    
    res.status(201).json({
      message: 'Subscription created successfully',
      subscription,
      payment: payment ? {
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        transactionId: payment.transactionId,
        receiptUrl: payment.receiptUrl
      } : null
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ message: 'Server error during subscription creation' });
  }
};

// Get current subscription
exports.getCurrentSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find active subscription
    const subscription = await Subscription.findOne({
      user: userId,
      status: 'active'
    }).populate('lastPayment', 'amount currency transactionId receiptUrl');
    
    if (!subscription) {
      return res.json({
        message: 'No active subscription found',
        subscription: null
      });
    }
    
    res.json(subscription);
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ message: 'Server error while fetching subscription' });
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find active subscription
    const subscription = await Subscription.findOne({
      user: userId,
      status: 'active'
    });
    
    if (!subscription) {
      return res.status(404).json({ message: 'No active subscription found' });
    }
    
    // Update subscription
    subscription.status = 'canceled';
    subscription.autoRenew = false;
    subscription.canceledAt = Date.now();
    
    await subscription.save();
    
    res.json({
      message: 'Subscription canceled successfully',
      subscription
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ message: 'Server error during subscription cancellation' });
  }
};

// Create featured listing payment
exports.createFeaturedListing = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { duration, paymentMethod } = req.body;
    
    // Check if user is a companion
    const companionProfile = await CompanionProfile.findOne({ user: userId });
    if (!companionProfile) {
      return res.status(400).json({ message: 'Only companions can purchase featured listings' });
    }
    
    // Get duration details
    const durationDetails = getFeaturedDurationDetails(duration);
    if (!durationDetails) {
      return res.status(400).json({ message: 'Invalid duration' });
    }
    
    // Calculate end date
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDetails.days);
    
    // Process payment
    let paymentResult;
    try {
      paymentResult = await processPayment({
        amount: durationDetails.price,
        currency: 'AUD',
        paymentMethod,
        description: `Featured listing for ${durationDetails.days} days`
      });
    } catch (error) {
      return res.status(400).json({ message: 'Payment processing failed', error: error.message });
    }
    
    // Create payment record
    const payment = new Payment({
      user: userId,
      amount: durationDetails.price,
      currency: 'AUD',
      paymentMethod,
      paymentType: 'featured_listing',
      status: 'completed',
      transactionId: paymentResult.transactionId,
      receiptUrl: paymentResult.receiptUrl,
      metadata: new Map([
        ['duration', duration],
        ['days', durationDetails.days.toString()]
      ])
    });
    
    await payment.save();
    
    // Update companion profile
    companionProfile.featured = {
      isFeatured: true,
      featuredUntil: endDate
    };
    
    await companionProfile.save();
    
    res.status(201).json({
      message: 'Featured listing created successfully',
      featured: companionProfile.featured,
      payment: {
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        transactionId: payment.transactionId,
        receiptUrl: payment.receiptUrl
      }
    });
  } catch (error) {
    console.error('Create featured listing error:', error);
    res.status(500).json({ message: 'Server error during featured listing creation' });
  }
};

// Get payment history
exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Find payments
    const payments = await Payment.find({
      user: userId
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalCount = await Payment.countDocuments({
      user: userId
    });
    
    // Calculate total pages
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    
    res.json({
      payments,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ message: 'Server error while fetching payment history' });
  }
};

// Get subscription plans
exports.getSubscriptionPlans = async (req, res) => {
  try {
    const plans = [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        currency: 'AUD',
        interval: 'month',
        features: [
          'Basic profile',
          'Limited messages',
          'Standard search visibility'
        ]
      },
      {
        id: 'basic',
        name: 'Basic',
        price: 29.99,
        currency: 'AUD',
        interval: 'month',
        features: [
          'Enhanced profile',
          'Unlimited messages',
          'Improved search visibility',
          'Basic analytics'
        ]
      },
      {
        id: 'premium',
        name: 'Premium',
        price: 59.99,
        currency: 'AUD',
        interval: 'month',
        features: [
          'Premium profile',
          'Unlimited messages',
          'Priority search placement',
          'Featured in rotation',
          'Advanced analytics',
          'Verification badge'
        ]
      },
      {
        id: 'vip',
        name: 'VIP',
        price: 99.99,
        currency: 'AUD',
        interval: 'month',
        features: [
          'VIP profile',
          'Unlimited messages',
          'Top search placement',
          'Permanent featured status',
          'Premium verification badge',
          'Comprehensive analytics',
          'Priority support'
        ]
      }
    ];
    
    res.json(plans);
  } catch (error) {
    console.error('Get subscription plans error:', error);
    res.status(500).json({ message: 'Server error while fetching subscription plans' });
  }
};

// Helper function to get plan details
const getPlanDetails = (plan) => {
  const plans = {
    free: {
      price: 0,
      features: {
        featuredProfile: false,
        priorityListing: false,
        enhancedVisibility: false,
        messageLimit: 20,
        mediaLimit: 5,
        verificationIncluded: false,
        customBadge: false
      }
    },
    basic: {
      price: 29.99,
      features: {
        featuredProfile: false,
        priorityListing: false,
        enhancedVisibility: true,
        messageLimit: 100,
        mediaLimit: 20,
        verificationIncluded: false,
        customBadge: false
      }
    },
    premium: {
      price: 59.99,
      features: {
        featuredProfile: true,
        priorityListing: true,
        enhancedVisibility: true,
        messageLimit: 500,
        mediaLimit: 50,
        verificationIncluded: true,
        customBadge: false
      }
    },
    vip: {
      price: 99.99,
      features: {
        featuredProfile: true,
        priorityListing: true,
        enhancedVisibility: true,
        messageLimit: -1, // unlimited
        mediaLimit: -1, // unlimited
        verificationIncluded: true,
        customBadge: true
      }
    }
  };
  
  return plans[plan];
};

// Helper function to get featured duration details
const getFeaturedDurationDetails = (duration) => {
  const durations = {
    '7days': {
      days: 7,
      price: 19.99
    },
    '14days': {
      days: 14,
      price: 34.99
    },
    '30days': {
      days: 30,
      price: 59.99
    }
  };
  
  return durations[duration];
};
