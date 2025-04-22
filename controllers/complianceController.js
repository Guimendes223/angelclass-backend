const { TermsOfService, PrivacyPolicy, UserAgreement } = require('../models/ComplianceModels');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Get current terms of service
exports.getCurrentTermsOfService = async (req, res) => {
  try {
    // Find active terms of service
    const terms = await TermsOfService.findOne({ isActive: true })
      .sort({ publishedAt: -1 });
    
    if (!terms) {
      return res.status(404).json({ message: 'Terms of service not found' });
    }
    
    res.json(terms);
  } catch (error) {
    console.error('Get terms of service error:', error);
    res.status(500).json({ message: 'Server error while fetching terms of service' });
  }
};

// Get current privacy policy
exports.getCurrentPrivacyPolicy = async (req, res) => {
  try {
    // Find active privacy policy
    const policy = await PrivacyPolicy.findOne({ isActive: true })
      .sort({ publishedAt: -1 });
    
    if (!policy) {
      return res.status(404).json({ message: 'Privacy policy not found' });
    }
    
    res.json(policy);
  } catch (error) {
    console.error('Get privacy policy error:', error);
    res.status(500).json({ message: 'Server error while fetching privacy policy' });
  }
};

// Accept terms and privacy policy
exports.acceptTermsAndPolicy = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { termsVersion, policyVersion, ipAddress } = req.body;
    
    // Verify terms version exists
    const terms = await TermsOfService.findOne({ 
      version: termsVersion,
      isActive: true
    });
    
    if (!terms) {
      return res.status(400).json({ message: 'Invalid terms of service version' });
    }
    
    // Verify policy version exists
    const policy = await PrivacyPolicy.findOne({ 
      version: policyVersion,
      isActive: true
    });
    
    if (!policy) {
      return res.status(400).json({ message: 'Invalid privacy policy version' });
    }
    
    // Find existing user agreement or create new one
    let agreement = await UserAgreement.findOne({ user: userId });
    
    if (agreement) {
      // Update existing agreement
      agreement.termsOfService = {
        version: termsVersion,
        agreedAt: Date.now(),
        ipAddress
      };
      
      agreement.privacyPolicy = {
        version: policyVersion,
        agreedAt: Date.now(),
        ipAddress
      };
    } else {
      // Create new agreement
      agreement = new UserAgreement({
        user: userId,
        termsOfService: {
          version: termsVersion,
          agreedAt: Date.now(),
          ipAddress
        },
        privacyPolicy: {
          version: policyVersion,
          agreedAt: Date.now(),
          ipAddress
        }
      });
    }
    
    // Save agreement
    await agreement.save();
    
    // Update user's agreement status
    await User.findByIdAndUpdate(userId, {
      'agreementStatus.termsAccepted': true,
      'agreementStatus.privacyAccepted': true,
      'agreementStatus.lastAcceptedAt': Date.now()
    });
    
    res.json({
      message: 'Terms of service and privacy policy accepted successfully',
      agreement
    });
  } catch (error) {
    console.error('Accept terms and policy error:', error);
    res.status(500).json({ message: 'Server error during terms acceptance' });
  }
};

// Verify age
exports.verifyAge = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { method, ipAddress } = req.body;
    
    // Find existing user agreement or create new one
    let agreement = await UserAgreement.findOne({ user: userId });
    
    if (!agreement) {
      return res.status(400).json({ 
        message: 'User must accept terms of service and privacy policy first' 
      });
    }
    
    // Update age verification
    agreement.ageVerification = {
      isVerified: true,
      verifiedAt: Date.now(),
      method
    };
    
    // Save agreement
    await agreement.save();
    
    // Update user's age verification status
    await User.findByIdAndUpdate(userId, {
      'ageVerification.isVerified': true,
      'ageVerification.verifiedAt': Date.now(),
      'ageVerification.method': method
    });
    
    res.json({
      message: 'Age verification completed successfully',
      ageVerification: agreement.ageVerification
    });
  } catch (error) {
    console.error('Age verification error:', error);
    res.status(500).json({ message: 'Server error during age verification' });
  }
};

// Get user agreement status
exports.getUserAgreementStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find user agreement
    const agreement = await UserAgreement.findOne({ user: userId });
    
    if (!agreement) {
      return res.json({
        termsAccepted: false,
        privacyAccepted: false,
        ageVerified: false
      });
    }
    
    res.json({
      termsAccepted: true,
      termsVersion: agreement.termsOfService.version,
      termsAgreedAt: agreement.termsOfService.agreedAt,
      privacyAccepted: true,
      privacyVersion: agreement.privacyPolicy.version,
      privacyAgreedAt: agreement.privacyPolicy.agreedAt,
      ageVerified: agreement.ageVerification.isVerified,
      ageVerificationMethod: agreement.ageVerification.method,
      ageVerifiedAt: agreement.ageVerification.verifiedAt
    });
  } catch (error) {
    console.error('Get user agreement status error:', error);
    res.status(500).json({ message: 'Server error while fetching agreement status' });
  }
};

// Admin: Create new terms of service
exports.createTermsOfService = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { version, content, isActive } = req.body;
    
    // Check if version already exists
    const existingTerms = await TermsOfService.findOne({ version });
    
    if (existingTerms) {
      return res.status(400).json({ message: 'Terms of service version already exists' });
    }
    
    // If setting as active, deactivate all other versions
    if (isActive) {
      await TermsOfService.updateMany({}, { isActive: false });
    }
    
    // Create new terms of service
    const terms = new TermsOfService({
      version,
      content,
      publishedAt: Date.now(),
      isActive: isActive || false
    });
    
    // Save terms
    await terms.save();
    
    res.status(201).json({
      message: 'Terms of service created successfully',
      terms
    });
  } catch (error) {
    console.error('Create terms of service error:', error);
    res.status(500).json({ message: 'Server error during terms creation' });
  }
};

// Admin: Create new privacy policy
exports.createPrivacyPolicy = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { version, content, isActive } = req.body;
    
    // Check if version already exists
    const existingPolicy = await PrivacyPolicy.findOne({ version });
    
    if (existingPolicy) {
      return res.status(400).json({ message: 'Privacy policy version already exists' });
    }
    
    // If setting as active, deactivate all other versions
    if (isActive) {
      await PrivacyPolicy.updateMany({}, { isActive: false });
    }
    
    // Create new privacy policy
    const policy = new PrivacyPolicy({
      version,
      content,
      publishedAt: Date.now(),
      isActive: isActive || false
    });
    
    // Save policy
    await policy.save();
    
    res.status(201).json({
      message: 'Privacy policy created successfully',
      policy
    });
  } catch (error) {
    console.error('Create privacy policy error:', error);
    res.status(500).json({ message: 'Server error during policy creation' });
  }
};

// Admin: Get all terms of service versions
exports.getAllTermsOfService = async (req, res) => {
  try {
    // Find all terms of service
    const terms = await TermsOfService.find()
      .sort({ publishedAt: -1 });
    
    res.json(terms);
  } catch (error) {
    console.error('Get all terms of service error:', error);
    res.status(500).json({ message: 'Server error while fetching terms of service' });
  }
};

// Admin: Get all privacy policy versions
exports.getAllPrivacyPolicies = async (req, res) => {
  try {
    // Find all privacy policies
    const policies = await PrivacyPolicy.find()
      .sort({ publishedAt: -1 });
    
    res.json(policies);
  } catch (error) {
    console.error('Get all privacy policies error:', error);
    res.status(500).json({ message: 'Server error while fetching privacy policies' });
  }
};

// Admin: Get user agreements
exports.getUserAgreements = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Find user agreements
    const agreements = await UserAgreement.find()
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'email firstName lastName');
    
    // Get total count for pagination
    const totalCount = await UserAgreement.countDocuments();
    
    // Calculate total pages
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    
    res.json({
      agreements,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get user agreements error:', error);
    res.status(500).json({ message: 'Server error while fetching user agreements' });
  }
};
