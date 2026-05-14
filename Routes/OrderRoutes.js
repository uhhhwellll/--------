const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const { auth, isAdmin } = require('../middleware/auth');

// Debug middleware
router.use((req, res, next) => {
  console.log('Order route accessed by user:', req.user?.id);
  next();
});

// All order routes require authentication
router.use(auth);

// User routes
router.post('/', OrderController.createOrder);
router.get('/', OrderController.getUserOrders);
router.get('/:id', OrderController.getOrderById);

// Admin routes
router.get('/admin/all', isAdmin, OrderController.getAllOrders);
router.put('/:id/status', isAdmin, OrderController.updateOrderStatus);

module.exports = router;