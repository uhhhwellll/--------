const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const AuthController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/register', [
  body('username').isLength({ min: 3 }).trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('fullName').notEmpty().trim().escape()
], AuthController.register);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], AuthController.login);

router.post('/logout', auth, AuthController.logout);
router.get('/profile', auth, AuthController.getProfile);

module.exports = router;