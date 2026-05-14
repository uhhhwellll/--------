const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/reviewController');
const { auth, optionalAuth } = require('../middleware/auth');

// Public routes (no auth required to view reviews)
router.get('/product/:productId', optionalAuth, ReviewController.getProductReviews);

// Protected routes (auth required)
router.post('/product/:productId', auth, ReviewController.createReview);
router.put('/:reviewId', auth, ReviewController.updateReview);
router.delete('/:reviewId', auth, ReviewController.deleteReview);
router.get('/user/me', auth, ReviewController.getUserReviews);

module.exports = router;