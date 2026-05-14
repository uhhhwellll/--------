const { sequelize, Product, Category, User, Cart } = require('./models');

async function addProducts() {
  try {
    // Don't force sync - just connect
    await sequelize.authenticate();
    console.log('Connected to database');

    // Check if categories exist, if not create them
    const categories = await Category.findAll();
    if (categories.length === 0) {
      console.log('Creating categories...');
      await Category.bulkCreate([
        { name: 'Smartphones', description: 'Mobile phones and accessories' },
        { name: 'Laptops', description: 'Notebooks and laptops' },
        { name: 'Audio', description: 'Headphones, speakers, and audio equipment' },
        { name: 'Cameras', description: 'Digital cameras and accessories' },
        { name: 'Gaming', description: 'Gaming consoles and accessories' }
      ]);
      console.log('Categories created!');
    }

    // Check if products exist
    const existingProducts = await Product.count();
    if (existingProducts > 0) {
      console.log(`Database already has ${existingProducts} products.`);
      console.log('No new products added to avoid duplicates.');
      process.exit(0);
    }

    // Add products
    console.log('Adding products...');
    const products = [
      {
        name: 'iPhone 15 Pro',
        description: 'Latest iPhone with A17 Pro chip, 48MP camera system, and titanium design',
        price: 999.99,
        brand: 'Apple',
        stock: 50,
        CategoryId: 1,
        rating: 4.8,
        specifications: JSON.stringify({ screen: '6.1 inch', storage: '256GB', ram: '8GB', battery: '3274 mAh' })
      },
      {
        name: 'Samsung Galaxy S24 Ultra',
        description: 'Premium Android smartphone with S Pen and advanced AI features',
        price: 1199.99,
        brand: 'Samsung',
        stock: 35,
        CategoryId: 1,
        rating: 4.7,
        specifications: JSON.stringify({ screen: '6.8 inch', storage: '512GB', ram: '12GB', battery: '5000 mAh' })
      },
      {
        name: 'MacBook Pro 16"',
        description: 'Powerful laptop with M3 Pro chip for professional work',
        price: 2499.99,
        brand: 'Apple',
        stock: 20,
        CategoryId: 2,
        rating: 4.9,
        specifications: JSON.stringify({ screen: '16 inch', processor: 'M3 Pro', ram: '18GB', storage: '512GB SSD' })
      },
      {
        name: 'Dell XPS 15',
        description: 'Premium Windows laptop with InfinityEdge display',
        price: 1499.99,
        brand: 'Dell',
        stock: 15,
        CategoryId: 2,
        rating: 4.5,
        specifications: JSON.stringify({ screen: '15.6 inch', processor: 'Intel i7', ram: '16GB', storage: '512GB SSD' })
      },
      {
        name: 'Sony WH-1000XM5',
        description: 'Industry-leading noise canceling headphones',
        price: 349.99,
        brand: 'Sony',
        stock: 100,
        CategoryId: 3,
        rating: 4.7,
        specifications: JSON.stringify({ type: 'Over-ear', battery: '30 hours', noiseCancelling: 'Yes', bluetooth: '5.2' })
      },
      {
        name: 'AirPods Pro 2',
        description: 'Active Noise Cancellation with Transparency Mode',
        price: 249.99,
        brand: 'Apple',
        stock: 75,
        CategoryId: 3,
        rating: 4.8,
        specifications: JSON.stringify({ type: 'In-ear', battery: '6 hours', noiseCancelling: 'Yes', bluetooth: '5.3' })
      },
      {
        name: 'Sony A7 IV',
        description: 'Full-frame mirrorless camera for professionals',
        price: 2498.00,
        brand: 'Sony',
        stock: 10,
        CategoryId: 4,
        rating: 4.8,
        specifications: JSON.stringify({ sensor: 'Full-frame', megapixels: '33MP', video: '4K 60fps', stabilization: '5-axis' })
      },
      {
        name: 'Canon EOS R6',
        description: 'Advanced mirrorless camera for enthusiasts',
        price: 2299.00,
        brand: 'Canon',
        stock: 8,
        CategoryId: 4,
        rating: 4.6,
        specifications: JSON.stringify({ sensor: 'Full-frame', megapixels: '20MP', video: '4K 60fps', stabilization: '5-axis' })
      },
      {
        name: 'PlayStation 5',
        description: 'Next-gen gaming console with lightning-fast loading',
        price: 499.99,
        brand: 'Sony',
        stock: 25,
        CategoryId: 5,
        rating: 4.8,
        specifications: JSON.stringify({ storage: '825GB SSD', resolution: '4K/8K', framerate: '120fps', raytracing: 'Yes' })
      },
      {
        name: 'Nintendo Switch OLED',
        description: 'Versatile gaming console with vibrant OLED screen',
        price: 349.99,
        brand: 'Nintendo',
        stock: 40,
        CategoryId: 5,
        rating: 4.6,
        specifications: JSON.stringify({ screen: '7 inch OLED', storage: '64GB', battery: '4.5-9 hours', resolution: '1080p' })
      },
      {
        name: 'Xbox Series X',
        description: 'Most powerful Xbox ever with 12 teraflops of power',
        price: 499.99,
        brand: 'Microsoft',
        stock: 30,
        CategoryId: 5,
        rating: 4.7,
        specifications: JSON.stringify({ storage: '1TB SSD', resolution: '4K/8K', framerate: '120fps', raytracing: 'Yes' })
      },
      {
        name: 'iPad Pro 12.9"',
        description: 'Ultimate iPad with M2 chip and Liquid Retina XDR display',
        price: 1099.00,
        brand: 'Apple',
        stock: 20,
        CategoryId: 1,
        rating: 4.9,
        specifications: JSON.stringify({ screen: '12.9 inch', chip: 'M2', storage: '256GB', connectivity: 'WiFi 6E, 5G' })
      }
    ];

    for (const product of products) {
      await Product.create(product);
      console.log(`Added: ${product.name}`);
    }

    console.log(`\nSuccessfully added ${products.length} products!`);
    console.log('\nYou can now view them at http://localhost:3000/products');
    
    process.exit(0);
  } catch (error) {
    console.error('Error adding products:', error);
    process.exit(1);
  }
}

addProducts();