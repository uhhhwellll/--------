const express = require('express');
const router = express.Router();
const SellerController = require('../controllers/sellerController');
const { auth } = require('../middleware/auth');

// All seller routes require authentication
router.use(auth);

// Seller registration with address
router.post('/register', SellerController.becomeSeller);
router.put('/profile', SellerController.updateSellerInfo);

// Product management
router.get('/products', SellerController.getMyProducts);
router.post('/products', SellerController.createProduct);
router.put('/products/:productId', SellerController.updateProduct);
router.delete('/products/:productId', SellerController.deleteProduct);

// Statistics
router.get('/stats', SellerController.getSellerStats);

// Public seller profile (no auth required)
const { optionalAuth } = require('../middleware/auth');
router.get('/profile/:sellerId', optionalAuth, SellerController.getSellerProfile);

module.exports = router;