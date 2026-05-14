const jwt = require('jsonwebtoken');
const { User, Cart } = require('../models');
const { validationResult } = require('express-validator');

class AuthController {
 async register(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { username, email, password, fullName } = req.body;

      console.log('Registration attempt:', { username, email }); // Debug log

      // Check if email exists
      const existingEmail = await User.findOne({ where: { email: email } });
      if (existingEmail) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Check if username exists
      const existingUsername = await User.findOne({ where: { username: username } });
      if (existingUsername) {
        return res.status(400).json({ error: 'Username already taken' });
      }

      // Create new user - password will be hashed by the model hook
      const user = await User.create({
        username,
        email,
        password, // Plain password - the hook will hash it
        fullName
      });

      console.log('User created:', user.id);

      // Create a cart for the new user
      await Cart.create({ UserId: user.id });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      // Set cookie
      res.cookie('token', token, {
        httpOnly: false,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax',
        secure: false
      });

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role
        },
        token: token
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  }
  
 async login(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { email, password } = req.body;

      console.log('Login attempt for:', email); // Debug log

      // Find user by email
      const user = await User.findOne({ where: { email: email } });
      
      if (!user) {
        console.log('User not found:', email);
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      console.log('User found:', user.username);
      console.log('Stored password hash:', user.password.substring(0, 10) + '...');

      // Try to validate password
      let isValidPassword = false;
      try {
        isValidPassword = await user.validatePassword(password);
        console.log('Password validation result:', isValidPassword);
      } catch (validationError) {
        console.error('Password validation error:', validationError);
        return res.status(500).json({ error: 'Error validating credentials' });
      }
      
      if (!isValidPassword) {
        console.log('Invalid password for user:', email);
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      // Set cookie - make sure httpOnly is false so JavaScript can read it
      res.cookie('token', token, {
        httpOnly: false, // IMPORTANT: Set to false for frontend access
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax',
        secure: false
      });

      console.log('Login successful for:', email);

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role
        },
        token: token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed. Please try again.' });
    }
  }

  async logout(req, res) {
    // Clear the token cookie
    res.clearCookie('token', {
        httpOnly: false,
        secure: false,
        sameSite: 'lax'
    });
    
    // Also clear any session data if you're using sessions
    if (req.session) {
        req.session.destroy();
    }
    
    res.json({ message: 'Logged out successfully' });
}

 async getProfile(req, res) {
    try {
      // Fetch user with all details including seller info
      const user = await User.findByPk(req.user.id, {
        attributes: [
          'id', 'username', 'email', 'fullName', 'role',
          'address', 'phone',
          'isVerifiedSeller', 'sellerAddress', 'sellerCity', 
          'sellerCountry', 'sellerZipCode', 'sellerPhone',
          'sellerRating', 'totalSales'
        ]
      });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ user });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Error fetching profile' });
    }
  }
}

module.exports = new AuthController();