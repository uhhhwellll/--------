const { Product, Category, User } = require('../models');
const { Op } = require('sequelize');

class ProductController {
  async getAllProducts(req, res, next) {
    try {
      const { category, search, minPrice, maxPrice, brand } = req.query;
      const where = { isActive: true };

      if (category) {
        where.CategoryId = category;
      }

      if (search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
          { brand: { [Op.like]: `%${search}%` } }
        ];
      }

      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price[Op.gte] = minPrice;
        if (maxPrice) where.price[Op.lte] = maxPrice;
      }

      if (brand) {
        where.brand = brand;
      }

      const products = await Product.findAll({
        where,
        include: [
          { model: Category },
          { 
            model: User, 
            as: 'Seller',
            attributes: ['id', 'username', 'sellerCity', 'sellerCountry']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.json({ products });
    } catch (error) {
      console.error('Get all products error:', error);
      res.status(500).json({ error: 'Error fetching products' });
    }
  }

  async getProductById(req, res, next) {
    try {
      const productId = parseInt(req.params.id);
      
      console.log('getProductById called with ID:', productId);
      
      if (isNaN(productId)) {
        return res.status(400).json({ error: 'Invalid product ID' });
      }

      const product = await Product.findByPk(productId, {
        include: [
          { model: Category },
          { 
            model: User, 
            as: 'Seller',
            attributes: ['id', 'username', 'sellerCity', 'sellerCountry', 'sellerRating', 'isVerifiedSeller', 'totalSales']
          }
        ]
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json({ product });
    } catch (error) {
      console.error('Get product by ID error:', error);
      res.status(500).json({ error: 'Error fetching product: ' + error.message });
    }
  }

  async createProduct(req, res, next) {
    try {
      const product = await Product.create(req.body);
      res.status(201).json({ product });
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({ error: 'Error creating product' });
    }
  }

  async updateProduct(req, res, next) {
    try {
      const product = await Product.findByPk(req.params.id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      await product.update(req.body);
      res.json({ product });
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({ error: 'Error updating product' });
    }
  }

  async deleteProduct(req, res, next) {
    try {
      const product = await Product.findByPk(req.params.id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      await product.destroy();
      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({ error: 'Error deleting product' });
    }
  }
}

module.exports = new ProductController();