const { sequelize, User, Category, Product, Cart, Review } = require('../models');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  try {
    // Sync database - force true to recreate tables
    await sequelize.sync({ force: true });
    console.log('✅ Database synced and tables recreated.');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      username: 'admin',
      email: 'admin@electronics.com',
      password: adminPassword,
      fullName: 'Admin User',
      role: 'admin',
      address: '123 Admin Street, Tech City',
      phone: '555-0100'
    });
    console.log('✅ Admin user created');

    // Create regular user
    const userPassword = await bcrypt.hash('user123', 10);
    const user = await User.create({
      username: 'john_doe',
      email: 'john@example.com',
      password: userPassword,
      fullName: 'John Doe',
      address: '456 User Avenue, Client City',
      phone: '555-0200'
    });
    console.log('✅ Regular user created');

    // Create carts for users
    await Cart.create({ UserId: admin.id });
    await Cart.create({ UserId: user.id });
    console.log('✅ Carts created');

    // Create categories
    const categories = await Category.bulkCreate([
      { name: 'Smartphones', description: 'Mobile phones and accessories', imageUrl: '/images/smartphones.jpg' },
      { name: 'Laptops', description: 'Notebooks and laptops', imageUrl: '/images/laptops.jpg' },
      { name: 'Audio', description: 'Headphones, speakers, and audio equipment', imageUrl: '/images/audio.jpg' },
      { name: 'Cameras', description: 'Digital cameras and accessories', imageUrl: '/images/cameras.jpg' },
      { name: 'Gaming', description: 'Gaming consoles and accessories', imageUrl: '/images/gaming.jpg' }
    ]);
    console.log('✅ Categories created');

    // Create products
    const products = await Product.bulkCreate([
      {
        name: 'iPhone 15 Pro',
        description: 'Latest iPhone with A17 Pro chip, 48MP camera system, and titanium design',
        price: 999.99,
        brand: 'Apple',
        stock: 50,
        CategoryId: 1,
        rating: 0,
        reviewCount: 0,
        specifications: JSON.stringify({ screen: '6.1 inch', storage: '256GB', ram: '8GB', battery: '3274 mAh' }),
        isActive: true
      },
      {
        name: 'Samsung Galaxy S24 Ultra',
        description: 'Premium Android smartphone with S Pen and advanced AI features',
        price: 1199.99,
        brand: 'Samsung',
        stock: 35,
        CategoryId: 1,
        rating: 0,
        reviewCount: 0,
        specifications: JSON.stringify({ screen: '6.8 inch', storage: '512GB', ram: '12GB', battery: '5000 mAh' }),
        isActive: true
      },
      {
        name: 'MacBook Pro 16"',
        description: 'Powerful laptop with M3 Pro chip for professional work',
        price: 2499.99,
        brand: 'Apple',
        stock: 20,
        CategoryId: 2,
        rating: 0,
        reviewCount: 0,
        specifications: JSON.stringify({ screen: '16 inch', processor: 'M3 Pro', ram: '18GB', storage: '512GB SSD' }),
        isActive: true
      },
      {
        name: 'Dell XPS 15',
        description: 'Premium Windows laptop with InfinityEdge display',
        price: 1499.99,
        brand: 'Dell',
        stock: 15,
        CategoryId: 2,
        rating: 0,
        reviewCount: 0,
        specifications: JSON.stringify({ screen: '15.6 inch', processor: 'Intel i7', ram: '16GB', storage: '512GB SSD' }),
        isActive: true
      },
      {
        name: 'Sony WH-1000XM5',
        description: 'Industry-leading noise canceling headphones',
        price: 349.99,
        brand: 'Sony',
        stock: 100,
        CategoryId: 3,
        rating: 0,
        reviewCount: 0,
        specifications: JSON.stringify({ type: 'Over-ear', battery: '30 hours', noiseCancelling: 'Yes', bluetooth: '5.2' }),
        isActive: true
      },
      {
        name: 'AirPods Pro 2',
        description: 'Active Noise Cancellation with Transparency Mode',
        price: 249.99,
        brand: 'Apple',
        stock: 75,
        CategoryId: 3,
        rating: 0,
        reviewCount: 0,
        specifications: JSON.stringify({ type: 'In-ear', battery: '6 hours', noiseCancelling: 'Yes', bluetooth: '5.3' }),
        isActive: true
      },
      {
        name: 'Sony A7 IV',
        description: 'Full-frame mirrorless camera for professionals',
        price: 2498.00,
        brand: 'Sony',
        stock: 10,
        CategoryId: 4,
        rating: 0,
        reviewCount: 0,
        specifications: JSON.stringify({ sensor: 'Full-frame', megapixels: '33MP', video: '4K 60fps', stabilization: '5-axis' }),
        isActive: true
      },
      {
        name: 'PlayStation 5',
        description: 'Next-gen gaming console with lightning-fast loading',
        price: 499.99,
        brand: 'Sony',
        stock: 25,
        CategoryId: 5,
        rating: 0,
        reviewCount: 0,
        specifications: JSON.stringify({ storage: '825GB SSD', resolution: '4K/8K', framerate: '120fps', raytracing: 'Yes' }),
        isActive: true
      },
      {
        name: 'Nintendo Switch OLED',
        description: 'Versatile gaming console with vibrant OLED screen',
        price: 349.99,
        brand: 'Nintendo',
        stock: 40,
        CategoryId: 5,
        rating: 0,
        reviewCount: 0,
        specifications: JSON.stringify({ screen: '7 inch OLED', storage: '64GB', battery: '4.5-9 hours', resolution: '1080p' }),
        isActive: true
      },
      {
        name: 'Xbox Series X',
        description: 'Most powerful Xbox ever with 12 teraflops of power',
        price: 499.99,
        brand: 'Microsoft',
        stock: 30,
        CategoryId: 5,
        rating: 0,
        reviewCount: 0,
        specifications: JSON.stringify({ storage: '1TB SSD', resolution: '4K/8K', framerate: '120fps', raytracing: 'Yes' }),
        isActive: true
      }
    ]);
    console.log('✅ Products created');

    // Create sample reviews - FIXED: Use proper async iteration
    console.log('📝 Creating sample reviews...');
    
    const sampleReviews = [
      {
        rating: 5,
        comment: "Absolutely amazing product! The quality is outstanding and it exceeded all my expectations. Would highly recommend to anyone looking for a premium device.",
        userId: user.id,
        productId: 1
      },
      {
        rating: 4,
        comment: "Great product overall. The build quality is excellent and the features are impressive. Only giving 4 stars because of the price point.",
        userId: admin.id,
        productId: 1
      },
      {
        rating: 5,
        comment: "Best laptop I have ever owned. The performance is incredible and the battery life lasts all day. Perfect for professional work and creative projects.",
        userId: user.id,
        productId: 3
      },
      {
        rating: 3,
        comment: "Decent product but not worth the premium price. There are better alternatives available at a lower price point. Build quality is good though.",
        userId: admin.id,
        productId: 4
      },
      {
        rating: 5,
        comment: "These headphones are incredible! The noise canceling is top-notch and they are super comfortable for long listening sessions.",
        userId: user.id,
        productId: 5
      },
      {
        rating: 4,
        comment: "Great gaming console with amazing graphics. The loading times are incredibly fast. Just wish there were more exclusive games available.",
        userId: user.id,
        productId: 8
      },
      {
        rating: 5,
        comment: "The camera quality is outstanding. Perfect for both professional photography and video recording. The autofocus system is revolutionary.",
        userId: admin.id,
        productId: 7
      },
      {
        rating: 4,
        comment: "Love the OLED screen on this Switch. Colors are vibrant and the larger screen makes portable gaming much more enjoyable.",
        userId: user.id,
        productId: 9
      }
    ];

    // Create reviews one by one using for...of loop
    for (const reviewData of sampleReviews) {
      const review = await Review.create(reviewData);
      console.log(`  ✅ Created review #${review.id} (${reviewData.rating} stars)`);
    }
    
    console.log('✅ Sample reviews created');

    // Update product ratings based on reviews
    console.log('📊 Updating product ratings...');
    for (let productId = 1; productId <= 10; productId++) {
      const reviews = await Review.findAll({
        where: { productId: productId },
        attributes: ['rating']
      });
      
      if (reviews.length > 0) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        await Product.update(
          { 
            rating: parseFloat(avgRating.toFixed(1)),
            reviewCount: reviews.length
          },
          { where: { id: productId } }
        );
        console.log(`  ✅ Product #${productId}: ${avgRating.toFixed(1)} stars (${reviews.length} reviews)`);
      }
    }

    console.log('\n========================================');
    console.log('✅ Database seeded successfully!');
    console.log('========================================');
    console.log('\n📋 Test Accounts:');
    console.log('  Admin: admin@electronics.com / admin123');
    console.log('  User:  john@example.com / user123');
    console.log('\n🚀 Start the server with: npm run dev');
    console.log('🌐 Visit: http://localhost:3000/products');
    console.log('========================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }

  const user = await User.create({
    username: 'john_doe',
    email: 'john@example.com',
    password: userPassword,
    fullName: 'John Doe',
    address: '456 User Avenue, Client City',
    phone: '555-0200',
    role: 'seller',        // Make John a seller
    isVerifiedSeller: true  // Verify him
});
}

// Execute the seed function
seedDatabase();