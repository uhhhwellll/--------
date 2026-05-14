const { Cart, Product, CartItem, User } = require('../models');

class CartController {
  async getCart(req, res, next) {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Please login to view your cart' });
      }

      let cart = await Cart.findOne({
        where: { UserId: req.user.id },
        include: [{
          model: Product,
          through: {
            attributes: ['quantity', 'id']
          }
        }]
      });

      if (!cart) {
        cart = await Cart.create({ UserId: req.user.id });
        return res.json({ 
          cart: { 
            id: cart.id,
            Products: [] 
          } 
        });
      }

      // Format the cart data to include quantity properly
      const formattedProducts = cart.Products.map(product => {
        // Get the through table data
        const throughData = product.CartItem || product.CartItems || {};
        const quantity = throughData.quantity || 1;
        
        return {
          id: product.id,
          name: product.name || 'Unknown Product',
          price: parseFloat(product.price) || 0,
          brand: product.brand || '',
          description: product.description || '',
          stock: parseInt(product.stock) || 0,
          imageUrl: product.imageUrl || '',
          rating: parseFloat(product.rating) || 0,
          CategoryId: product.CategoryId,
          specifications: product.specifications || {},
          CartItems: {
            quantity: parseInt(quantity)
          }
        };
      });

      const formattedCart = {
        id: cart.id,
        UserId: cart.UserId,
        Products: formattedProducts
      };

      console.log('Cart data:', JSON.stringify(formattedCart, null, 2));
      res.json({ cart: formattedCart });
    } catch (error) {
      console.error('Get cart error:', error);
      next(error);
    }
  }

  async addToCart(req, res, next) {
    try {
      // Check authentication
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Please login to add items to cart' });
      }

      const { productId, quantity = 1 } = req.body;

      if (!productId) {
        return res.status(400).json({ error: 'Product ID is required' });
      }

      const requestedQuantity = parseInt(quantity);
      if (isNaN(requestedQuantity) || requestedQuantity < 1) {
        return res.status(400).json({ error: 'Invalid quantity. Must be a positive number.' });
      }

      // Find the product
      const product = await Product.findByPk(parseInt(productId));
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Check if product is in stock
      if (product.stock <= 0) {
        return res.status(400).json({ error: 'Product is out of stock' });
      }

      // Find or create cart
      const [cart] = await Cart.findOrCreate({
        where: { UserId: req.user.id }
      });

      // Check how many are already in cart
      const existingCartItem = await CartItem.findOne({
        where: {
          CartId: cart.id,
          ProductId: parseInt(productId)
        }
      });

      const currentCartQuantity = existingCartItem ? parseInt(existingCartItem.quantity) : 0;
      const newTotalQuantity = currentCartQuantity + requestedQuantity;

      // Check if total would exceed stock
      if (newTotalQuantity > product.stock) {
        const availableToAdd = product.stock - currentCartQuantity;
        if (availableToAdd <= 0) {
          return res.status(400).json({ 
            error: `Cannot add more of this item. You already have the maximum available stock (${product.stock}) in your cart.` 
          });
        }
        return res.status(400).json({ 
          error: `Cannot add ${requestedQuantity} more. You already have ${currentCartQuantity} in cart. Only ${availableToAdd} more available. Maximum stock: ${product.stock}` 
        });
      }

      if (existingCartItem) {
        // Update quantity
        await existingCartItem.update({ quantity: newTotalQuantity });
      } else {
        // Add new item
        await CartItem.create({
          CartId: cart.id,
          ProductId: parseInt(productId),
          quantity: requestedQuantity
        });
      }

      // Return updated cart
      const updatedCart = await Cart.findOne({
        where: { UserId: req.user.id },
        include: [{
          model: Product,
          through: {
            attributes: ['quantity', 'id']
          }
        }]
      });

      // Format response
      const formattedProducts = updatedCart.Products.map(product => {
        const throughData = product.CartItem || {};
        const cartQuantity = parseInt(throughData.quantity || 0);
        return {
          id: product.id,
          name: product.name,
          price: parseFloat(product.price) || 0,
          brand: product.brand,
          stock: product.stock,
          CartItems: {
            quantity: cartQuantity
          }
        };
      });

      res.status(201).json({
        message: `Successfully added ${requestedQuantity} ${product.name} to cart`,
        cart: {
          id: updatedCart.id,
          Products: formattedProducts
        }
      });
    } catch (error) {
      console.error('Add to cart error:', error);
      next(error);
    }
  }

  async updateCartItem(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Please login to update cart' });
      }

      const { productId, quantity } = req.body;

      if (!productId || quantity === undefined) {
        return res.status(400).json({ error: 'Product ID and quantity are required' });
      }

      const cart = await Cart.findOne({
        where: { UserId: req.user.id }
      });

      if (!cart) {
        return res.status(404).json({ error: 'Cart not found' });
      }

      const parsedQuantity = parseInt(quantity);
      
      // Validate number
      if (isNaN(parsedQuantity)) {
        return res.status(400).json({ error: 'Invalid quantity. Please enter a number.' });
      }
      
      // Get the product to check stock
      const product = await Product.findByPk(parseInt(productId));
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Check minimum quantity
      if (parsedQuantity < 1) {
        return res.status(400).json({ error: 'Quantity cannot be less than 1' });
      }
      
      // Check if requested quantity exceeds stock
      if (parsedQuantity > product.stock) {
        return res.status(400).json({ 
          error: `Cannot set quantity to ${parsedQuantity}. Only ${product.stock} items available in stock.` 
        });
      }

      // Update quantity
      const cartItem = await CartItem.findOne({
        where: {
          CartId: cart.id,
          ProductId: parseInt(productId)
        }
      });

      if (cartItem) {
        await cartItem.update({ quantity: parsedQuantity });
      } else {
        return res.status(404).json({ error: 'Product not found in cart' });
      }

      // Return updated cart with formatted data
      const updatedCart = await Cart.findOne({
        where: { UserId: req.user.id },
        include: [{
          model: Product,
          through: {
            attributes: ['quantity', 'id']
          }
        }]
      });

      // Format response
      const formattedProducts = updatedCart.Products.map(product => {
        const throughData = product.CartItem || {};
        const cartQuantity = parseInt(throughData.quantity || 0);
        return {
          id: product.id,
          name: product.name,
          price: parseFloat(product.price) || 0,
          brand: product.brand,
          stock: product.stock,
          CartItems: {
            quantity: cartQuantity
          }
        };
      });

      res.json({ 
        message: 'Cart updated successfully',
        cart: {
          id: updatedCart.id,
          Products: formattedProducts
        }
      });
    } catch (error) {
      console.error('Update cart error:', error);
      next(error);
    }
  }

  async removeFromCart(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Please login to remove items from cart' });
      }

      const { productId } = req.params;

      if (!productId) {
        return res.status(400).json({ error: 'Product ID is required' });
      }

      const cart = await Cart.findOne({
        where: { UserId: req.user.id }
      });

      if (!cart) {
        return res.status(404).json({ error: 'Cart not found' });
      }

      // Remove the cart item
      const deletedCount = await CartItem.destroy({
        where: {
          CartId: cart.id,
          ProductId: parseInt(productId)
        }
      });

      if (deletedCount === 0) {
        return res.status(404).json({ error: 'Product not found in cart' });
      }

      // Return updated cart
      const updatedCart = await Cart.findOne({
        where: { UserId: req.user.id },
        include: [{
          model: Product,
          through: {
            attributes: ['quantity', 'id']
          }
        }]
      });

      const formattedProducts = updatedCart && updatedCart.Products ? 
        updatedCart.Products.map(product => {
          const throughData = product.CartItem || {};
          const cartQuantity = parseInt(throughData.quantity || 0);
          return {
            id: product.id,
            name: product.name,
            price: parseFloat(product.price) || 0,
            brand: product.brand,
            stock: product.stock,
            CartItems: {
              quantity: cartQuantity
            }
          };
        }) : [];

      res.json({ 
        message: 'Item removed from cart',
        cart: {
          id: updatedCart ? updatedCart.id : cart.id,
          Products: formattedProducts
        }
      });
    } catch (error) {
      console.error('Remove from cart error:', error);
      next(error);
    }
  }

  async clearCart(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Please login to clear cart' });
      }

      const cart = await Cart.findOne({
        where: { UserId: req.user.id }
      });

      if (cart) {
        await CartItem.destroy({
          where: { CartId: cart.id }
        });
      }

      res.json({ 
        message: 'Cart cleared successfully',
        cart: { 
          id: cart ? cart.id : null,
          Products: [] 
        }
      });
    } catch (error) {
      console.error('Clear cart error:', error);
      next(error);
    }
  }
}

module.exports = new CartController();