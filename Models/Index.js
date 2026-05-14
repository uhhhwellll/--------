const sequelize = require('../config/database');
const User = require('./User');
const Product = require('./Product');
const Category = require('./Category');
const Cart = require('./Cart');
const CartItem = require('./CartItem');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Review = require('./Review');

// ==================== CATEGORY ASSOCIATIONS ====================
Category.hasMany(Product, {
  foreignKey: 'CategoryId'
});
Product.belongsTo(Category, {
  foreignKey: 'CategoryId'
});

// ==================== USER - CART ASSOCIATIONS ====================
User.hasOne(Cart, {
  foreignKey: 'UserId',
  onDelete: 'CASCADE'
});
Cart.belongsTo(User, {
  foreignKey: 'UserId'
});

// ==================== CART - PRODUCT ASSOCIATIONS ====================
Cart.belongsToMany(Product, { 
  through: CartItem,
  foreignKey: 'CartId',
  otherKey: 'ProductId'
});
Product.belongsToMany(Cart, { 
  through: CartItem,
  foreignKey: 'ProductId',
  otherKey: 'CartId'
});

// ==================== USER - ORDER ASSOCIATIONS ====================
User.hasMany(Order, {
  foreignKey: 'UserId',
  onDelete: 'CASCADE'
});
Order.belongsTo(User, {
  foreignKey: 'UserId'
});

// ==================== ORDER - PRODUCT ASSOCIATIONS ====================
Order.belongsToMany(Product, { 
  through: OrderItem,
  foreignKey: 'OrderId',
  otherKey: 'ProductId'
});
Product.belongsToMany(Order, { 
  through: OrderItem,
  foreignKey: 'ProductId',
  otherKey: 'OrderId'
});

// ==================== REVIEW ASSOCIATIONS ====================
User.hasMany(Review, {
  foreignKey: 'userId',
  onDelete: 'CASCADE'
});
Review.belongsTo(User, {
  foreignKey: 'userId'
});

Product.hasMany(Review, {
  foreignKey: 'productId',
  onDelete: 'CASCADE'
});
Review.belongsTo(Product, {
  foreignKey: 'productId'
});

// ==================== SELLER ASSOCIATIONS ====================
User.hasMany(Product, {
  foreignKey: 'sellerId',
  as: 'ListedProducts'
});
Product.belongsTo(User, {
  foreignKey: 'sellerId',
  as: 'Seller'
});

// ==================== EXPORT ALL MODELS ====================
module.exports = {
  sequelize,
  User,
  Product,
  Category,
  Cart,
  CartItem,
  Order,
  OrderItem,
  Review
};