// lib/models.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
}, { timestamps: true });

// ── Order ─────────────────────────────────────────────────────────────────────
const OrderSchema = new mongoose.Schema({
  orderId:        { type: String, required: true, unique: true }, // e.g. PV-1716012345678
  razorpayOrderId:{ type: String },   // order_XXXXXXXXX
  razorpayPaymentId:{ type: String }, // pay_XXXXXXXXX  (set after capture)
  customer: {
    name:  { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
  },
  items: [{
    productId: String,
    slug:      String,
    name:      String,
    price:     Number,
    downloadUrl: String,
    qty:       { type: Number, default: 1 },
  }],
  subtotal: Number,
  gst:      Number,
  total:    Number,
  currency: { type: String, default: 'INR' },
  status:   { type: String, enum: ['created','paid','failed'], default: 'created' },
  downloadToken: { type: String },
  downloadsSent: { type: Boolean, default: false },
}, { timestamps: true });

// ── Product ───────────────────────────────────────────────────────────────────
const ProductSchema = new mongoose.Schema({
  slug:        { type: String, required: true, unique: true },
  name:        { type: String, required: true },
  description: { type: String, required: true },
  longDesc:    { type: String },
  audience:     { type: String },
  problem:      { type: String },
  outcome:      { type: String },
  category:    { type: String, required: true },
  categoryLabel:{ type: String },
  format:      { type: String },
  price:       { type: Number, required: true },   // in INR (not paise)
  comparePrice:{ type: Number },                   // struck-through price
  image:       { type: String },
  emoji:       { type: String, default: '📦' },
  color:       { type: String, default: 'teal' },  // card accent color
  badge:       { type: String },                   // "New" | "Hot" | "Sale"
  features:    [String],
  downloadUrl: { type: String },    // Google Drive / S3 URL — sent after payment
  active:      { type: Boolean, default: true },
  rating:      { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
}, { timestamps: true });

export const Order   = mongoose.models.Order   || mongoose.model('Order',   OrderSchema);
export const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
export const User    = mongoose.models.User    || mongoose.model('User',    UserSchema);
