const express = require('express');
const router = express.Router();
const CartController = require('../controllers/cartController');
const { auth } = require('../middleware/auth');

// Apply auth middleware to ALL cart routes
router.use(auth);

// Debug middleware to check authentication
router.use((req, res, next) => {
  console.log('Cart route accessed by user:', req.user?.id);
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
});

router.get('/', CartController.getCart);
router.post('/add', CartController.addToCart);
router.put('/update', CartController.updateCartItem);
router.delete('/remove/:productId', CartController.removeFromCart);
router.delete('/clear', CartController.clearCart);

module.exports = router;