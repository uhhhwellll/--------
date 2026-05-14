const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MIDDLEWARE ====================

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ==================== AUTH MIDDLEWARE FOR VIEWS ====================

app.use(async (req, res, next) => {
  // Default: user is not logged in
  res.locals.user = null;
  res.locals.isAuthenticated = false;
  
  try {
    const token = req.cookies?.token;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const { User } = require('./models');
        const user = await User.findByPk(decoded.userId, {
          attributes: ['id', 'username', 'email', 'fullName', 'role']
        });
        
        if (user) {
          res.locals.user = user;
          res.locals.isAuthenticated = true;
        }
      } catch (jwtError) {
        // Token invalid - user stays as null
      }
    }
  } catch (error) {
    // Silently continue if models aren't loaded yet
  }
  
  next();
});

// ==================== ROUTES & SERVER START ====================

let authRoutes, productRoutes, cartRoutes, orderRoutes, reviewRoutes, sellerRoutes;

async function startServer() {
  try {
    const { sequelize } = require('./models');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Sync models (never force: true in production)
    await sequelize.sync({ force: false });
    console.log('✅ Database synced successfully.');
    
    // Load routes
    authRoutes = require('./routes/authRoutes');
    productRoutes = require('./routes/productRoutes');
    cartRoutes = require('./routes/cartRoutes');
    orderRoutes = require('./routes/orderRoutes');
    reviewRoutes = require('./routes/reviewRoutes');
    sellerRoutes = require('./routes/sellerRoutes');
    
    // ==================== API ROUTES ====================
    
    app.use('/api/auth', authRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/cart', cartRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/reviews', reviewRoutes);
    app.use('/api/seller', sellerRoutes);
    
    console.log('✅ Routes loaded successfully.');
    
    // ==================== FRONTEND ROUTES ====================
    
    // Home page
    app.get('/', (req, res) => {
      res.render('index');
    });

    // Authentication pages
    app.get('/login', (req, res) => {
      if (res.locals.isAuthenticated) {
        return res.redirect('/products');
      }
      res.render('auth/login');
    });

    app.get('/register', (req, res) => {
      if (res.locals.isAuthenticated) {
        return res.redirect('/products');
      }
      res.render('auth/register');
    });

    // Product pages
    app.get('/products', (req, res) => {
      res.render('products/index');
    });

    app.get('/products/:id', (req, res) => {
      res.render('products/details', { productId: req.params.id });
    });

    // Cart page
    app.get('/cart', (req, res) => {
      if (!res.locals.isAuthenticated) {
        return res.redirect('/login');
      }
      res.render('cart/index');
    });

    // Orders page
    app.get('/orders', (req, res) => {
      if (!res.locals.isAuthenticated) {
        return res.redirect('/login');
      }
      res.render('orders/index');
    });

    // Profile page
    app.get('/profile', (req, res) => {
    if (!res.locals.isAuthenticated) {
        return res.redirect('/login');
    }
    // Only allow sellers and admins to view profile
    if (res.locals.user.role !== 'seller' && res.locals.user.role !== 'admin') {
        return res.redirect('/seller/dashboard');
    }
    res.render('profile');
});

    // Reviews page
    app.get('/my-reviews', (req, res) => {
      if (!res.locals.isAuthenticated) {
        return res.redirect('/login');
      }
      res.render('reviews/my-reviews');
    });

    // Seller dashboard
    app.get('/seller/dashboard', (req, res) => {
      if (!res.locals.isAuthenticated) {
        return res.redirect('/login');
      }
      res.render('seller/dashboard');
    });

    // ==================== 404 HANDLER ====================
    
    app.use((req, res, next) => {
      // If it's an API route, return JSON
      if (req.originalUrl.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      
      // For regular pages, render 404 or send HTML
      res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>404 - Page Not Found</title>
            <link rel="stylesheet" href="/css/style.css">
        </head>
        <body>
            <%- include('partials/header') %>
            <main class="container" style="text-align: center; padding: 4rem 0;">
                <div style="font-size: 6rem; color: #2563eb;">404</div>
                <h1>Page Not Found</h1>
                <p style="color: #6b7280; margin: 1rem 0;">The page you're looking for doesn't exist.</p>
                <a href="/" class="btn btn-primary" style="text-decoration: none;">Go Home</a>
            </main>
            <%- include('partials/footer') %>
        </body>
        </html>
      `);
    });

    // ==================== ERROR HANDLER ====================
    
    app.use((err, req, res, next) => {
      console.error('🔥 SERVER ERROR:');
      console.error('Message:', err.message);
      console.error('Stack:', err.stack);
      console.error('URL:', req.originalUrl);
      
      // If it's an API route, return JSON error
      if (req.originalUrl.startsWith('/api/')) {
        return res.status(err.status || 500).json({
          error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
        });
      }
      
      // For regular pages, send HTML error
      res.status(err.status || 500).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>500 - Server Error</title>
            <link rel="stylesheet" href="/css/style.css">
        </head>
        <body>
            <%- include('partials/header') %>
            <main class="container" style="text-align: center; padding: 4rem 0;">
                <div style="font-size: 6rem;">🔧</div>
                <h1>Server Error</h1>
                <p style="color: #6b7280; margin: 1rem 0;">${err.message}</p>
                <a href="/" class="btn btn-primary" style="text-decoration: none;">Go Home</a>
            </main>
            <%- include('partials/footer') %>
        </body>
        </html>
      `);
    });

    // ==================== START SERVER ====================
    
    app.listen(PORT, () => {
      console.log('================================');
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📱 Products: http://localhost:${PORT}/products`);
      console.log(`🔑 Login: http://localhost:${PORT}/login`);
      console.log(`📊 Seller: http://localhost:${PORT}/seller/dashboard`);
      console.log('================================');
      console.log('\n📋 Test Accounts:');
      console.log('  Admin: admin@electronics.com / admin123');
      console.log('  User:  john@example.com / user123');
      console.log('================================\n');
    });
    
  } catch (error) {
    console.error('❌ Unable to start server:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// ==================== START ====================

startServer();

module.exports = app;