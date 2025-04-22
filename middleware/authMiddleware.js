const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'angelclass_secret_key';

// Middleware to authenticate token
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user by id
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Token is valid but user not found' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ message: 'User account is deactivated' });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Token is invalid or expired' });
  }
};

// Middleware to check user role
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }

    next();
  };
};

module.exports = { auth, checkRole };
