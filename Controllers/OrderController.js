const { Order, Product, Cart, CartItem, OrderItem, User } = require('../models');

class OrderController {
  async createOrder(req, res, next) {
    try {
      // Check authentication
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Please login to create an order' });
      }

      const { shippingAddress, paymentMethod } = req.body;

      if (!shippingAddress || !paymentMethod) {
        return res.status(400).json({ error: 'Shipping address and payment method are required' });
      }

      // Find the cart with products
      const cart = await Cart.findOne({
        where: { UserId: req.user.id },
        include: [{
          model: Product,
          through: {
            attributes: ['quantity', 'id']
          }
        }]
      });

      if (!cart || !cart.Products || cart.Products.length === 0) {
        return res.status(400).json({ error: 'Your cart is empty' });
      }

      // Calculate total and prepare order items
      let totalAmount = 0;
      const orderItems = [];

      for (const product of cart.Products) {
        // Get quantity from the junction table
        let quantity = 1;
        
        // Try different possible locations for quantity
        if (product.CartItem && product.CartItem.quantity) {
          quantity = parseInt(product.CartItem.quantity);
        } else if (product.CartItems && product.CartItems.quantity) {
          quantity = parseInt(product.CartItems.quantity);
        } else {
          // Try to find the cart item directly
          const cartItem = await CartItem.findOne({
            where: {
              CartId: cart.id,
              ProductId: product.id
            }
          });
          if (cartItem) {
            quantity = parseInt(cartItem.quantity);
          }
        }

        const price = parseFloat(product.price) || 0;
        const itemTotal = price * quantity;
        totalAmount += itemTotal;

        orderItems.push({
          product: product,
          quantity: quantity,
          price: price
        });

        // Check stock availability
        if (product.stock < quantity) {
          return res.status(400).json({ 
            error: `Insufficient stock for ${product.name}. Available: ${product.stock}` 
          });
        }
      }

      // Create the order
      const order = await Order.create({
        UserId: req.user.id,
        totalAmount: totalAmount,
        shippingAddress: shippingAddress,
        paymentMethod: paymentMethod,
        status: 'pending'
      });

      // Create order items and update stock
      for (const item of orderItems) {
        await OrderItem.create({
          OrderId: order.id,
          ProductId: item.product.id,
          quantity: item.quantity,
          price: item.price
        });

        // Update product stock
        await Product.update(
          { stock: item.product.stock - item.quantity },
          { where: { id: item.product.id } }
        );
      }

      // Clear the cart after order is created
      await CartItem.destroy({
        where: { CartId: cart.id }
      });

      // Fetch the complete order with products
      const createdOrder = await Order.findByPk(order.id, {
        include: [{
          model: Product,
          through: OrderItem
        }]
      });

      // Format the response
      const formattedOrder = {
        id: createdOrder.id,
        totalAmount: parseFloat(createdOrder.totalAmount),
        status: createdOrder.status,
        shippingAddress: createdOrder.shippingAddress,
        paymentMethod: createdOrder.paymentMethod,
        createdAt: createdOrder.createdAt,
        Products: createdOrder.Products.map(product => ({
          id: product.id,
          name: product.name,
          price: parseFloat(product.price),
          brand: product.brand,
          OrderItem: {
            quantity: parseInt(product.OrderItem?.quantity || 1),
            price: parseFloat(product.OrderItem?.price || 0)
          }
        }))
      };

      console.log('Order created successfully:', formattedOrder.id);
      res.status(201).json({ 
        message: 'Order created successfully',
        order: formattedOrder 
      });

    } catch (error) {
      console.error('Create order error:', error);
      next(error);
    }
  }

  async getUserOrders(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Please login to view orders' });
      }

      const orders = await Order.findAll({
        where: { UserId: req.user.id },
        include: [{
          model: Product,
          through: OrderItem
        }],
        order: [['createdAt', 'DESC']]
      });

      // Format orders to ensure proper data types
      const formattedOrders = orders.map(order => ({
        id: order.id,
        totalAmount: parseFloat(order.totalAmount),
        status: order.status,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        Products: order.Products ? order.Products.map(product => ({
          id: product.id,
          name: product.name,
          price: parseFloat(product.price),
          brand: product.brand,
          OrderItem: {
            quantity: parseInt(product.OrderItem?.quantity || 1),
            price: parseFloat(product.OrderItem?.price || 0)
          }
        })) : []
      }));

      res.json({ orders: formattedOrders });
    } catch (error) {
      console.error('Get orders error:', error);
      next(error);
    }
  }

  async getOrderById(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Please login to view this order' });
      }

      const order = await Order.findOne({
        where: { 
          id: req.params.id,
          UserId: req.user.id
        },
        include: [{
          model: Product,
          through: OrderItem
        }]
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Format the order
      const formattedOrder = {
        id: order.id,
        totalAmount: parseFloat(order.totalAmount),
        status: order.status,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        Products: order.Products ? order.Products.map(product => ({
          id: product.id,
          name: product.name,
          price: parseFloat(product.price),
          brand: product.brand,
          OrderItem: {
            quantity: parseInt(product.OrderItem?.quantity || 1),
            price: parseFloat(product.OrderItem?.price || 0)
          }
        })) : []
      };

      res.json({ order: formattedOrder });
    } catch (error) {
      console.error('Get order error:', error);
      next(error);
    }
  }

  // Admin methods
  async getAllOrders(req, res, next) {
    try {
      const orders = await Order.findAll({
        include: [
          { model: User, attributes: ['id', 'username', 'email', 'fullName'] },
          { model: Product, through: OrderItem }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.json({ orders });
    } catch (error) {
      console.error('Get all orders error:', error);
      next(error);
    }
  }

  async updateOrderStatus(req, res, next) {
    try {
      const { status } = req.body;
      const order = await Order.findByPk(req.params.id);
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      await order.update({ status });
      res.json({ message: 'Order status updated', order });
    } catch (error) {
      console.error('Update order error:', error);
      next(error);
    }
  }
}

module.exports = new OrderController();