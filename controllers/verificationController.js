const Verification = require('../models/Verification');
const User = require('../models/User');
const CompanionProfile = require('../models/CompanionProfile');
const { validationResult } = require('express-validator');

// Submit ID verification
exports.submitIdVerification = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    
    // Extract verification data from request body
    const { 
      frontImage, 
      backImage, 
      documentType, 
      documentNumber, 
      expiryDate 
    } = req.body;

    // Find existing verification or create new one
    let verification = await Verification.findOne({ user: userId });
    
    if (!verification) {
      verification = new Verification({
        user: userId
      });
    }

    // Update ID verification data
    verification.idVerification = {
      frontImage,
      backImage,
      documentType,
      documentNumber,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      status: 'pending',
      submittedAt: Date.now()
    };

    // Save verification
    await verification.save();

    // Update user verification status
    const user = await User.findById(userId);
    if (user) {
      user.verificationStatus.idVerification = {
        status: 'pending',
        submittedAt: Date.now()
      };
      await user.save();
    }

    res.json({
      message: 'ID verification submitted successfully',
      verification: verification.idVerification
    });
  } catch (error) {
    console.error('ID verification submission error:', error);
    res.status(500).json({ message: 'Server error during ID verification submission' });
  }
};

// Submit selfie verification
exports.submitSelfieVerification = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    
    // Extract verification data from request body
    const { image } = req.body;

    // Find existing verification or create new one
    let verification = await Verification.findOne({ user: userId });
    
    if (!verification) {
      verification = new Verification({
        user: userId
      });
    }

    // Update selfie verification data
    verification.selfieVerification = {
      image,
      status: 'pending',
      submittedAt: Date.now()
    };

    // Save verification
    await verification.save();

    // Update user verification status
    const user = await User.findById(userId);
    if (user) {
      user.verificationStatus.selfieVerification = {
        status: 'pending',
        submittedAt: Date.now()
      };
      await user.save();
    }

    res.json({
      message: 'Selfie verification submitted successfully',
      verification: verification.selfieVerification
    });
  } catch (error) {
    console.error('Selfie verification submission error:', error);
    res.status(500).json({ message: 'Server error during selfie verification submission' });
  }
};

// Submit comparison media verification
exports.submitComparisonMedia = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    
    // Extract verification data from request body
    const { images, videos } = req.body;

    // Find existing verification or create new one
    let verification = await Verification.findOne({ user: userId });
    
    if (!verification) {
      verification = new Verification({
        user: userId
      });
    }

    // Update comparison media verification data
    verification.comparisonMedia = {
      images: images || [],
      videos: videos || [],
      status: 'pending',
      submittedAt: Date.now()
    };

    // Save verification
    await verification.save();

    // Update user verification status
    const user = await User.findById(userId);
    if (user) {
      user.verificationStatus.comparisonMedia = {
        status: 'pending',
        submittedAt: Date.now()
      };
      await user.save();
    }

    res.json({
      message: 'Comparison media submitted successfully',
      verification: verification.comparisonMedia
    });
  } catch (error) {
    console.error('Comparison media submission error:', error);
    res.status(500).json({ message: 'Server error during comparison media submission' });
  }
};

// Get verification status
exports.getVerificationStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find verification
    const verification = await Verification.findOne({ user: userId });
    
    if (!verification) {
      return res.json({
        overallStatus: 'unverified',
        idVerification: null,
        selfieVerification: null,
        comparisonMedia: null
      });
    }

    // Return verification status
    res.json({
      overallStatus: verification.overallStatus,
      idVerification: verification.idVerification ? {
        status: verification.idVerification.status,
        submittedAt: verification.idVerification.submittedAt,
        verifiedAt: verification.idVerification.verifiedAt,
        rejectionReason: verification.idVerification.rejectionReason
      } : null,
      selfieVerification: verification.selfieVerification ? {
        status: verification.selfieVerification.status,
        submittedAt: verification.selfieVerification.submittedAt,
        verifiedAt: verification.selfieVerification.verifiedAt,
        rejectionReason: verification.selfieVerification.rejectionReason
      } : null,
      comparisonMedia: verification.comparisonMedia ? {
        status: verification.comparisonMedia.status,
        submittedAt: verification.comparisonMedia.submittedAt,
        verifiedAt: verification.comparisonMedia.verifiedAt,
        rejectionReason: verification.comparisonMedia.rejectionReason
      } : null
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({ message: 'Server error while fetching verification status' });
  }
};

// Admin: Approve ID verification
exports.approveIdVerification = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;
    
    // Find verification
    const verification = await Verification.findOne({ user: userId });
    
    if (!verification || !verification.idVerification) {
      return res.status(404).json({ message: 'ID verification not found' });
    }

    // Update verification status
    verification.idVerification.status = 'approved';
    verification.idVerification.verifiedAt = Date.now();
    verification.idVerification.verifiedBy = adminId;
    
    // Save verification
    await verification.save();

    // Update user verification status
    const user = await User.findById(userId);
    if (user) {
      user.verificationStatus.idVerification = {
        status: 'verified',
        verifiedAt: Date.now()
      };
      await user.save();
    }

    res.json({
      message: 'ID verification approved successfully',
      verification: verification.idVerification
    });
  } catch (error) {
    console.error('Approve ID verification error:', error);
    res.status(500).json({ message: 'Server error during ID verification approval' });
  }
};

// Admin: Reject ID verification
exports.rejectIdVerification = async (req, res) => {
  try {
    const { userId } = req.params;
    const { rejectionReason } = req.body;
    
    // Find verification
    const verification = await Verification.findOne({ user: userId });
    
    if (!verification || !verification.idVerification) {
      return res.status(404).json({ message: 'ID verification not found' });
    }

    // Update verification status
    verification.idVerification.status = 'rejected';
    verification.idVerification.rejectionReason = rejectionReason;
    
    // Save verification
    await verification.save();

    // Update user verification status
    const user = await User.findById(userId);
    if (user) {
      user.verificationStatus.idVerification = {
        status: 'rejected',
        submittedAt: verification.idVerification.submittedAt
      };
      await user.save();
    }

    res.json({
      message: 'ID verification rejected successfully',
      verification: verification.idVerification
    });
  } catch (error) {
    console.error('Reject ID verification error:', error);
    res.status(500).json({ message: 'Server error during ID verification rejection' });
  }
};

// Admin: Approve selfie verification
exports.approveSelfieVerification = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;
    
    // Find verification
    const verification = await Verification.findOne({ user: userId });
    
    if (!verification || !verification.selfieVerification) {
      return res.status(404).json({ message: 'Selfie verification not found' });
    }

    // Update verification status
    verification.selfieVerification.status = 'approved';
    verification.selfieVerification.verifiedAt = Date.now();
    verification.selfieVerification.verifiedBy = adminId;
    
    // Save verification
    await verification.save();

    // Update user verification status
    const user = await User.findById(userId);
    if (user) {
      user.verificationStatus.selfieVerification = {
        status: 'verified',
        verifiedAt: Date.now()
      };
      await user.save();
    }

    res.json({
      message: 'Selfie verification approved successfully',
      verification: verification.selfieVerification
    });
  } catch (error) {
    console.error('Approve selfie verification error:', error);
    res.status(500).json({ message: 'Server error during selfie verification approval' });
  }
};

// Admin: Reject selfie verification
exports.rejectSelfieVerification = async (req, res) => {
  try {
    const { userId } = req.params;
    const { rejectionReason } = req.body;
    
    // Find verification
    const verification = await Verification.findOne({ user: userId });
    
    if (!verification || !verification.selfieVerification) {
      return res.status(404).json({ message: 'Selfie verification not found' });
    }

    // Update verification status
    verification.selfieVerification.status = 'rejected';
    verification.selfieVerification.rejectionReason = rejectionReason;
    
    // Save verification
    await verification.save();

    // Update user verification status
    const user = await User.findById(userId);
    if (user) {
      user.verificationStatus.selfieVerification = {
        status: 'rejected',
        submittedAt: verification.selfieVerification.submittedAt
      };
      await user.save();
    }

    res.json({
      message: 'Selfie verification rejected successfully',
      verification: verification.selfieVerification
    });
  } catch (error) {
    console.error('Reject selfie verification error:', error);
    res.status(500).json({ message: 'Server error during selfie verification rejection' });
  }
};

// Admin: Approve comparison media
exports.approveComparisonMedia = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;
    
    // Find verification
    const verification = await Verification.findOne({ user: userId });
    
    if (!verification || !verification.comparisonMedia) {
      return res.status(404).json({ message: 'Comparison media not found' });
    }

    // Update verification status
    verification.comparisonMedia.status = 'approved';
    verification.comparisonMedia.verifiedAt = Date.now();
    verification.comparisonMedia.verifiedBy = adminId;
    
    // Save verification
    await verification.save();

    // Update user verification status
    const user = await User.findById(userId);
    if (user) {
      user.verificationStatus.comparisonMedia = {
        status: 'verified',
        verifiedAt: Date.now()
      };
      
      // If all verifications are complete, mark user as verified
      if (verification.overallStatus === 'fully_verified') {
        user.isVerified = true;
      }
      
      await user.save();
    }

    // Update companion profile verification badge if applicable
    if (verification.overallStatus === 'fully_verified') {
      const companionProfile = await CompanionProfile.findOne({ user: userId });
      if (companionProfile) {
        // Mark photos as verified
        companionProfile.photos.forEach(photo => {
          if (verification.comparisonMedia.images.includes(photo.url)) {
            photo.isVerified = true;
          }
        });
        
        // Mark videos as verified
        companionProfile.videos.forEach(video => {
          if (verification.comparisonMedia.videos.includes(video.url)) {
            video.isVerified = true;
          }
        });
        
        await companionProfile.save();
      }
    }

    res.json({
      message: 'Comparison media approved successfully',
      verification: verification.comparisonMedia
    });
  } catch (error) {
    console.error('Approve comparison media error:', error);
    res.status(500).json({ message: 'Server error during comparison media approval' });
  }
};

// Admin: Reject comparison media
exports.rejectComparisonMedia = async (req, res) => {
  try {
    const { userId } = req.params;
    const { rejectionReason } = req.body;
    
    // Find verification
    const verification = await Verification.findOne({ user: userId });
    
    if (!verification || !verification.comparisonMedia) {
      return res.status(404).json({ message: 'Comparison media not found' });
    }

    // Update verification status
    verification.comparisonMedia.status = 'rejected';
    verification.comparisonMedia.rejectionReason = rejectionReason;
    
    // Save verification
    await verification.save();

    // Update user verification status
    const user = await User.findById(userId);
    if (user) {
      user.verificationStatus.comparisonMedia = {
        status: 'rejected',
        submittedAt: verification.comparisonMedia.submittedAt
      };
      await user.save();
    }

    res.json({
      message: 'Comparison media rejected successfully',
      verification: verification.comparisonMedia
    });
  } catch (error) {
    console.error('Reject comparison media error:', error);
    res.status(500).json({ message: 'Server error during comparison media rejection' });
  }
};

// Admin: Get pending verifications
exports.getPendingVerifications = async (req, res) => {
  try {
    // Find all verifications with at least one pending component
    const verifications = await Verification.find({
      $or: [
        { 'idVerification.status': 'pending' },
        { 'selfieVerification.status': 'pending' },
        { 'comparisonMedia.status': 'pending' }
      ]
    }).populate('user', 'email firstName lastName');
    
    res.json(verifications);
  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({ message: 'Server error while fetching pending verifications' });
  }
};
