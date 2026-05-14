const { Product, User, Category, Order, Review } = require('../models');
const { Op } = require('sequelize');

class SellerController {
  
  // Register as a seller - NOW REQUIRES ADDRESS
  async becomeSeller(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Please login first' });
      }

      const user = await User.findByPk(req.user.id);
      
      if (user.role === 'seller') {
        return res.status(400).json({ error: 'You are already registered as a seller' });
      }

      if (user.role === 'admin') {
        return res.status(400).json({ error: 'Admins are automatically sellers' });
      }

      // Extract seller address details
      const {
        sellerAddress,
        sellerCity,
        sellerCountry,
        sellerZipCode,
        sellerPhone
      } = req.body;

      // Validate required seller information
      const errors = [];
      if (!sellerAddress || sellerAddress.trim().length < 10) {
        errors.push('Full shipping address is required (minimum 10 characters)');
      }
      if (!sellerCity || sellerCity.trim().length < 2) {
        errors.push('City is required');
      }
      if (!sellerCountry || sellerCountry.trim().length < 2) {
        errors.push('Country is required');
      }
      if (!sellerZipCode || sellerZipCode.trim().length < 3) {
        errors.push('ZIP/Postal code is required');
      }
      if (!sellerPhone || sellerPhone.trim().length < 7) {
        errors.push('Valid phone number is required');
      }

      if (errors.length > 0) {
        return res.status(400).json({ 
          error: 'Please provide complete seller information',
          details: errors
        });
      }

      // Update user to seller with address
      await user.update({
        role: 'seller',
        isVerifiedSeller: true,
        sellerAddress: sellerAddress.trim(),
        sellerCity: sellerCity.trim(),
        sellerCountry: sellerCountry.trim(),
        sellerZipCode: sellerZipCode.trim(),
        sellerPhone: sellerPhone.trim()
      });

      res.json({
        message: 'Congratulations! You are now a verified seller.',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: 'seller',
          isVerifiedSeller: true,
          sellerAddress: user.sellerAddress,
          sellerCity: user.sellerCity,
          sellerCountry: user.sellerCountry
        }
      });
    } catch (error) {
      console.error('Become seller error:', error);
      next(error);
    }
  }

  // Update seller information
  async updateSellerInfo(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Please login first' });
      }

      if (req.user.role !== 'seller' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'You are not a seller' });
      }

      const user = await User.findByPk(req.user.id);
      
      const updates = {};
      const {
        sellerAddress,
        sellerCity,
        sellerCountry,
        sellerZipCode,
        sellerPhone
      } = req.body;

      if (sellerAddress) updates.sellerAddress = sellerAddress.trim();
      if (sellerCity) updates.sellerCity = sellerCity.trim();
      if (sellerCountry) updates.sellerCountry = sellerCountry.trim();
      if (sellerZipCode) updates.sellerZipCode = sellerZipCode.trim();
      if (sellerPhone) updates.sellerPhone = sellerPhone.trim();

      await user.update(updates);

      res.json({
        message: 'Seller information updated successfully',
        user: {
          id: user.id,
          sellerAddress: user.sellerAddress,
          sellerCity: user.sellerCity,
          sellerCountry: user.sellerCountry
        }
      });
    } catch (error) {
      console.error('Update seller info error:', error);
      next(error);
    }
  }

  // Get seller's listed products
  async getMyProducts(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Please login first' });
      }

      const products = await Product.findAll({
        where: { sellerId: req.user.id },
        include: [{
          model: Category,
          attributes: ['id', 'name']
        }],
        order: [['createdAt', 'DESC']]
      });

      // Get sales statistics
      const totalProducts = products.length;
      const activeProducts = products.filter(p => p.isActive).length;
      const soldProducts = products.filter(p => !p.isActive && p.stock === 0).length;
      
      const totalRevenue = products.reduce((sum, p) => {
        return sum + parseFloat(p.price || 0);
      }, 0);

      res.json({
        products,
        stats: {
          totalProducts,
          activeProducts,
          soldProducts,
          totalRevenue: totalRevenue.toFixed(2)
        }
      });
    } catch (error) {
      console.error('Get my products error:', error);
      next(error);
    }
  }

  // Create a new product listing
  async createProduct(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Please login first' });
      }

      // Check if user is a verified seller
      if (req.user.role !== 'seller' && req.user.role !== 'admin') {
        return res.status(403).json({ 
          error: 'You need to be a verified seller to list products. Please register as a seller first.' 
        });
      }

      // Check if seller has complete address
      if (!req.user.sellerAddress || !req.user.sellerCity || !req.user.sellerCountry) {
        return res.status(400).json({
          error: 'Please complete your seller profile with shipping address before listing products'
        });
      }

      const {
        name,
        description,
        price,
        brand,
        stock,
        categoryId,
        specifications
      } = req.body;

      // Validate required fields
      if (!name || !description || !price || !brand || !categoryId) {
        return res.status(400).json({ 
          error: 'Missing required fields. Name, description, price, brand, and category are required.' 
        });
      }

      // Validate price
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        return res.status(400).json({ error: 'Price must be a positive number' });
      }

      // Validate stock
      const parsedStock = parseInt(stock) || 0;
      if (parsedStock < 0) {
        return res.status(400).json({ error: 'Stock cannot be negative' });
      }

      // Check if category exists
      const category = await Category.findByPk(parseInt(categoryId));
      if (!category) {
        return res.status(400).json({ error: 'Invalid category' });
      }

      // Parse specifications if provided as string
      let parsedSpecifications = null;
      if (specifications) {
        try {
          parsedSpecifications = typeof specifications === 'string' 
            ? JSON.parse(specifications) 
            : specifications;
        } catch (e) {
          return res.status(400).json({ error: 'Invalid specifications format' });
        }
      }

      // Create the product
      const product = await Product.create({
        name: name.trim(),
        description: description.trim(),
        price: parsedPrice,
        brand: brand.trim(),
        stock: parsedStock,
        CategoryId: parseInt(categoryId),
        sellerId: req.user.id,
        specifications: parsedSpecifications,
        isActive: true,
        rating: 0,
        reviewCount: 0
      });

      const createdProduct = await Product.findByPk(product.id, {
        include: [
          { model: Category, attributes: ['id', 'name'] },
          { 
            model: User, 
            as: 'Seller',
            attributes: ['id', 'username', 'sellerCity', 'sellerCountry', 'sellerRating'] 
          }
        ]
      });

      res.status(201).json({
        message: 'Product listed successfully!',
        product: createdProduct
      });
    } catch (error) {
      console.error('Create product error:', error);
      next(error);
    }
  }

  // Update a product listing
  async updateProduct(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Please login first' });
      }

      const { productId } = req.params;
      const product = await Product.findByPk(parseInt(productId));

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Check if user owns this product
      if (product.sellerId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'You can only edit your own products' });
      }

      const {
        name,
        description,
        price,
        brand,
        stock,
        categoryId,
        specifications,
        isActive
      } = req.body;

      const updates = {};
      
      if (name) updates.name = name.trim();
      if (description) updates.description = description.trim();
      if (price) {
        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
          return res.status(400).json({ error: 'Price must be a positive number' });
        }
        updates.price = parsedPrice;
      }
      if (brand) updates.brand = brand.trim();
      if (stock !== undefined) {
        const parsedStock = parseInt(stock);
        if (isNaN(parsedStock) || parsedStock < 0) {
          return res.status(400).json({ error: 'Stock cannot be negative' });
        }
        updates.stock = parsedStock;
      }
      if (categoryId) {
        const category = await Category.findByPk(parseInt(categoryId));
        if (!category) {
          return res.status(400).json({ error: 'Invalid category' });
        }
        updates.CategoryId = parseInt(categoryId);
      }
      if (specifications) {
        try {
          updates.specifications = typeof specifications === 'string' 
            ? JSON.parse(specifications) 
            : specifications;
        } catch (e) {
          return res.status(400).json({ error: 'Invalid specifications format' });
        }
      }
      if (isActive !== undefined) {
        updates.isActive = isActive;
      }

      await product.update(updates);

      const updatedProduct = await Product.findByPk(product.id, {
        include: [
          { model: Category },
          { model: User, as: 'Seller', attributes: ['id', 'username', 'sellerCity', 'sellerCountry'] }
        ]
      });

      res.json({
        message: 'Product updated successfully!',
        product: updatedProduct
      });
    } catch (error) {
      console.error('Update product error:', error);
      next(error);
    }
  }

  // Delete a product listing
  async deleteProduct(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Please login first' });
      }

      const { productId } = req.params;
      const product = await Product.findByPk(parseInt(productId));

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      if (product.sellerId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'You can only delete your own products' });
      }

      await product.destroy();

      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Delete product error:', error);
      next(error);
    }
  }

  // Get seller statistics
  async getSellerStats(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Please login first' });
      }

      const products = await Product.findAll({
        where: { sellerId: req.user.id }
      });

      const user = await User.findByPk(req.user.id);

      const stats = {
        totalProducts: products.length,
        activeProducts: products.filter(p => p.isActive).length,
        outOfStock: products.filter(p => p.stock === 0).length,
        averagePrice: products.length > 0 
          ? (products.reduce((sum, p) => sum + parseFloat(p.price), 0) / products.length).toFixed(2)
          : 0,
        totalReviews: products.reduce((sum, p) => sum + (p.reviewCount || 0), 0),
        averageRating: products.length > 0
          ? (products.reduce((sum, p) => sum + parseFloat(p.rating || 0), 0) / products.length).toFixed(1)
          : 0,
        sellerInfo: {
          address: user.sellerAddress,
          city: user.sellerCity,
          country: user.sellerCountry,
          phone: user.sellerPhone,
          rating: user.sellerRating,
          totalSales: user.totalSales
        }
      };

      res.json({ stats });
    } catch (error) {
      console.error('Get seller stats error:', error);
      next(error);
    }
  }

  // Get seller public profile
  async getSellerProfile(req, res, next) {
    try {
      const { sellerId } = req.params;
      
      const seller = await User.findByPk(parseInt(sellerId), {
        attributes: [
          'id', 'username', 'sellerCity', 'sellerCountry', 
          'sellerRating', 'totalSales', 'isVerifiedSeller'
        ]
      });

      if (!seller || seller.role !== 'seller') {
        return res.status(404).json({ error: 'Seller not found' });
      }

      const products = await Product.findAll({
        where: { 
          sellerId: seller.id,
          isActive: true 
        },
        include: [{ model: Category }],
        order: [['createdAt', 'DESC']]
      });

      res.json({
        seller: {
          id: seller.id,
          username: seller.username,
          location: `${seller.sellerCity}, ${seller.sellerCountry}`,
          rating: seller.sellerRating,
          totalSales: seller.totalSales,
          isVerified: seller.isVerifiedSeller,
          productCount: products.length
        },
        products
      });
    } catch (error) {
      console.error('Get seller profile error:', error);
      next(error);
    }
  }
}

module.exports = new SellerController();