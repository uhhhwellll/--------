const { Review, Product, User } = require('../models');
const { Op } = require('sequelize');

class ReviewController {
  // Get all reviews for a product
  async getProductReviews(req, res, next) {
    try {
      const { productId } = req.params;
      const { page = 1, limit = 10, sort = 'newest' } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      // Define sort order
      let order = [['createdAt', 'DESC']]; // Default: newest first
      if (sort === 'oldest') order = [['createdAt', 'ASC']];
      if (sort === 'highest') order = [['rating', 'DESC']];
      if (sort === 'lowest') order = [['rating', 'ASC']];

      const { count, rows: reviews } = await Review.findAndCountAll({
        where: { productId: parseInt(productId) },
        include: [{
          model: User,
          attributes: ['id', 'username', 'fullName']
        }],
        order,
        limit: parseInt(limit),
        offset: offset
      });

      // Calculate average rating
      const avgRating = await Review.findOne({
        where: { productId: parseInt(productId) },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews']
        ],
        raw: true
      });

      // Get rating distribution
      const ratingDistribution = await Promise.all(
        [5, 4, 3, 2, 1].map(async (star) => {
          const count = await Review.count({
            where: { 
              productId: parseInt(productId),
              rating: star
            }
          });
          return { stars: star, count };
        })
      );

      res.json({
        reviews,
        totalReviews: count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
        averageRating: avgRating ? parseFloat(avgRating.averageRating).toFixed(1) : 0,
        ratingDistribution
      });
    } catch (error) {
      console.error('Get reviews error:', error);
      next(error);
    }
  }

  // Create a new review
  async createReview(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Please login to leave a review' });
      }

      const { productId } = req.params;
      const { rating, comment } = req.body;

      // Validate rating
      const parsedRating = parseInt(rating);
      if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }

      // Validate comment
      if (!comment || comment.trim().length < 10) {
        return res.status(400).json({ error: 'Review comment must be at least 10 characters' });
      }

      if (comment.length > 1000) {
        return res.status(400).json({ error: 'Review comment cannot exceed 1000 characters' });
      }

      // Check if product exists
      const product = await Product.findByPk(parseInt(productId));
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Check if user has already reviewed this product
      const existingReview = await Review.findOne({
        where: {
          userId: req.user.id,
          productId: parseInt(productId)
        }
      });

      if (existingReview) {
        return res.status(400).json({ 
          error: 'You have already reviewed this product. You can update your existing review.' 
        });
      }

      // Create the review
      const review = await Review.create({
        rating: parsedRating,
        comment: comment.trim(),
        userId: req.user.id,
        productId: parseInt(productId)
      });

      // Update product's average rating
      await updateProductRating(parseInt(productId));

      // Fetch the created review with user data
      const createdReview = await Review.findByPk(review.id, {
        include: [{
          model: User,
          attributes: ['id', 'username', 'fullName']
        }]
      });

      res.status(201).json({
        message: 'Review created successfully',
        review: createdReview
      });
    } catch (error) {
      console.error('Create review error:', error);
      next(error);
    }
  }

  // Update an existing review
  async updateReview(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Please login to update your review' });
      }

      const { reviewId } = req.params;
      const { rating, comment } = req.body;

      const review = await Review.findByPk(parseInt(reviewId));

      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      // Check if user owns this review
      if (review.userId !== req.user.id) {
        return res.status(403).json({ error: 'You can only edit your own reviews' });
      }

      // Update fields
      if (rating) {
        const parsedRating = parseInt(rating);
        if (parsedRating < 1 || parsedRating > 5) {
          return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }
        review.rating = parsedRating;
      }

      if (comment) {
        if (comment.trim().length < 10) {
          return res.status(400).json({ error: 'Review comment must be at least 10 characters' });
        }
        if (comment.length > 1000) {
          return res.status(400).json({ error: 'Review comment cannot exceed 1000 characters' });
        }
        review.comment = comment.trim();
      }

      await review.save();

      // Update product's average rating
      await updateProductRating(review.productId);

      const updatedReview = await Review.findByPk(review.id, {
        include: [{
          model: User,
          attributes: ['id', 'username', 'fullName']
        }]
      });

      res.json({
        message: 'Review updated successfully',
        review: updatedReview
      });
    } catch (error) {
      console.error('Update review error:', error);
      next(error);
    }
  }

  // Delete a review
  async deleteReview(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Please login to delete your review' });
      }

      const { reviewId } = req.params;

      const review = await Review.findByPk(parseInt(reviewId));

      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      // Check if user owns this review or is admin
      if (review.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'You can only delete your own reviews' });
      }

      const productId = review.productId;
      await review.destroy();

      // Update product's average rating
      await updateProductRating(productId);

      res.json({ message: 'Review deleted successfully' });
    } catch (error) {
      console.error('Delete review error:', error);
      next(error);
    }
  }

  // Get user's reviews
  async getUserReviews(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Please login to view your reviews' });
      }

      const reviews = await Review.findAll({
        where: { userId: req.user.id },
        include: [{
          model: Product,
          attributes: ['id', 'name', 'brand', 'imageUrl']
        }],
        order: [['createdAt', 'DESC']]
      });

      res.json({ reviews });
    } catch (error) {
      console.error('Get user reviews error:', error);
      next(error);
    }
  }
}

// Helper function to update product's average rating
async function updateProductRating(productId) {
  const result = await Review.findOne({
    where: { productId },
    attributes: [
      [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'reviewCount']
    ],
    raw: true
  });

  const avgRating = result && result.avgRating ? parseFloat(result.avgRating).toFixed(1) : 0;
  
  await Product.update(
    { 
      rating: avgRating,
      reviewCount: result ? parseInt(result.reviewCount) : 0
    },
    { where: { id: productId } }
  );
}

// Import sequelize for aggregation functions
const sequelize = require('../config/database');

module.exports = new ReviewController();