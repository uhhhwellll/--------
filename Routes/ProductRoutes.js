const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const { auth, isAdmin } = require('../middleware/auth');

// Debug middleware for this router
router.use((req, res, next) => {
  console.log(`Product route accessed: ${req.method} ${req.originalUrl}`);
  next();
});

// Public routes
router.get('/', ProductController.getAllProducts);

// Admin routes - MUST be before /:id
router.post('/', auth, isAdmin, ProductController.createProduct);

// This route MUST be last to avoid catching "add", "create", etc.
router.get('/:id', ProductController.getProductById);
router.put('/:id', auth, isAdmin, ProductController.updateProduct);
router.delete('/:id', auth, isAdmin, ProductController.deleteProduct);

module.exports = router;