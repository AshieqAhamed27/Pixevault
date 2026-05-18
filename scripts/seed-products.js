// Run: MONGODB_URI="your_uri" node scripts/seed-products.js
//
// Product data lives in lib/starter-products.js so the storefront fallback,
// seed script, and first paid product stay in sync.

import mongoose from 'mongoose';
import { starterProducts } from '../lib/starter-products.mjs';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Set MONGODB_URI env var');
  process.exit(1);
}

const ProductSchema = new mongoose.Schema({
  slug: String,
  name: String,
  description: String,
  longDesc: String,
  category: String,
  price: Number,
  comparePrice: Number,
  emoji: String,
  color: String,
  badge: String,
  features: [String],
  downloadUrl: String,
  active: Boolean,
  rating: Number,
  reviewCount: Number,
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function seed() {
  await mongoose.connect(MONGODB_URI);
  await Product.deleteMany({});
  const inserted = await Product.insertMany(starterProducts);
  console.log(`Seeded ${inserted.length} products`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
