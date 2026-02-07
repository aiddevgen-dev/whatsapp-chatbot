import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

const sampleProducts = [
  {
    sku: 'TSHIRT-001',
    name: 'Premium Cotton T-Shirt',
    description: 'High-quality 100% cotton t-shirt available in multiple colors. Comfortable fit for everyday wear.',
    price: 1299,
    currency: 'PKR',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
    active: true,
    stock: 50,
    category: 'T-Shirts',
    category_ur: 'ٹی شرٹس',
  },
  {
    sku: 'JEANS-001',
    name: 'Slim Fit Denim Jeans',
    description: 'Stylish slim fit jeans made from premium denim fabric. Perfect for casual and semi-formal occasions.',
    price: 2499,
    currency: 'PKR',
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800',
    active: true,
    stock: 30,
    category: 'Jeans',
    category_ur: 'جینز',
  },
  {
    sku: 'SHOES-001',
    name: 'Casual Sneakers',
    description: 'Comfortable and durable sneakers for daily use. Available in sizes 40-44.',
    price: 3999,
    currency: 'PKR',
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800',
    active: true,
    stock: 25,
    category: 'Shoes',
    category_ur: 'جوتے',
  },
  {
    sku: 'WATCH-001',
    name: 'Stainless Steel Watch',
    description: 'Elegant stainless steel watch with water resistance. Perfect gift for special occasions.',
    price: 4999,
    currency: 'PKR',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
    active: true,
    stock: 15,
    category: 'Watches',
    category_ur: 'گھڑیاں',
  },
  {
    sku: 'BAG-001',
    name: 'Leather Backpack',
    description: 'Premium leather backpack with laptop compartment. Ideal for office and travel.',
    price: 5999,
    currency: 'PKR',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
    active: true,
    stock: 20,
    category: 'Bags',
    category_ur: 'بیگز',
  },
];

async function seedProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');

    // Insert sample products
    const inserted = await Product.insertMany(sampleProducts);
    console.log(`✅ Inserted ${inserted.length} products:`);

    inserted.forEach((product) => {
      console.log(`   - ${product.sku}: ${product.name} (Rs ${product.price})`);
    });

    console.log('\n✨ Database seeding completed successfully!');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedProducts();
