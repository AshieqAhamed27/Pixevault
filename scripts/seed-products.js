// scripts/seed-products.js
// Run: MONGODB_URI="your_uri" node scripts/seed-products.js
//
// Edit the products array below with YOUR real products.
// After seeding, manage products via MongoDB Atlas UI or add an admin UI later.

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error('Set MONGODB_URI env var'); process.exit(1); }

const ProductSchema = new mongoose.Schema({
  slug: String, name: String, description: String, longDesc: String,
  category: String, price: Number, comparePrice: Number,
  emoji: String, color: String, badge: String,
  features: [String], downloadUrl: String, active: Boolean,
  rating: Number, reviewCount: Number,
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

// ─── ADD YOUR REAL PRODUCTS HERE ─────────────────────────────────────────────
// Replace these with your actual products, prices, and Google Drive / S3 links.
const products = [
  {
    slug: 'uiux-mastery-course',
    name: 'UI/UX Mastery Course',
    description: '100+ video lessons covering Figma, prototyping, design systems and user research.',
    longDesc: 'Full course description here.',
    category: 'course',
    price: 2499,
    comparePrice: 3999,
    emoji: '🎨',
    color: 'teal',
    badge: 'Hot',
    features: ['100+ video lessons', 'Figma source files', 'Certificate of completion', 'Lifetime access'],
    downloadUrl: 'https://drive.google.com/your-course-link',   // ← replace
    active: true,
    rating: 4.9,
    reviewCount: 0,
  },
  {
    slug: 'notion-business-os',
    name: 'Notion Business OS',
    description: 'Complete Notion workspace: CRM, project tracker, finance dashboard, and client portal.',
    category: 'template',
    price: 1499,
    comparePrice: 1999,
    emoji: '📋',
    color: 'mint',
    features: ['CRM template', 'Project tracker', 'Finance dashboard', 'Client portal'],
    downloadUrl: 'https://drive.google.com/your-notion-link',   // ← replace
    active: true,
    rating: 4.8,
    reviewCount: 0,
  },
  {
    slug: 'figma-component-library',
    name: 'Figma Component Library',
    description: '1200+ production-ready Figma components with auto-layout and dark mode support.',
    category: 'tool',
    price: 2199,
    comparePrice: 2999,
    emoji: '🧩',
    color: 'plum',
    badge: 'New',
    features: ['1200+ components', 'Auto-layout', 'Dark mode', 'Lifetime updates'],
    downloadUrl: 'https://drive.google.com/your-figma-link',    // ← replace
    active: true,
    rating: 4.9,
    reviewCount: 0,
  },
  // Add more products here...
];
// ─────────────────────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(MONGODB_URI);
  await Product.deleteMany({});
  const inserted = await Product.insertMany(products);
  console.log(`✅ Seeded ${inserted.length} products`);
  await mongoose.disconnect();
}

seed().catch(console.error);
