const jwt = require('jsonwebtoken');
const { User } = require('../models');

const auth = async (req, res, next) => {
  try {
    // Check multiple places for the token
    let token = null;
    
    // Check cookies first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // Check Authorization header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check session
    else if (req.session && req.session.token) {
      token = req.session.token;
    }

    if (!token) {
      console.log('No token found in request');
      return res.status(401).json({ error: 'Access denied. Please login first.' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findByPk(decoded.userId);
      
      if (!user) {
        console.log('User not found for token');
        return res.status(401).json({ error: 'Invalid token. User not found.' });
      }

      req.user = user;
      req.token = token;
      next();
    } catch (jwtError) {
      console.log('JWT verification failed:', jwtError.message);
      return res.status(401).json({ error: 'Invalid or expired token. Please login again.' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Please login first.' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

// Optional auth - doesn't require login but checks if user is logged in
const optionalAuth = async (req, res, next) => {
  try {
    let token = null;
    
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findByPk(decoded.userId);
        if (user) {
          req.user = user;
          req.token = token;
        }
      } catch (jwtError) {
        // Token invalid, but that's okay for optional auth
        console.log('Optional auth: Invalid token');
      }
    }
    next();
  } catch (error) {
    // Continue without user info
    next();
  }
};

module.exports = { auth, isAdmin, optionalAuth };