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
  discount: { type: Number, default: 0 },
  coupon: {
    code: String,
    label: String,
    percent: Number,
  },
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
  curriculum:  [String],
  realWorldProjects: [String],
  includedProducts: [String],
  fileList:    [String],
  preview:     [String],
  sampleUrl:   { type: String },
  bundle:      { type: Boolean, default: false },
  premium:     { type: Boolean, default: false },
  downloadUrl: { type: String },    // Google Drive / S3 URL — sent after payment
  active:      { type: Boolean, default: true },
}, { timestamps: true });

const ReviewSchema = new mongoose.Schema({
  productSlug: { type: String, required: true, index: true },
  orderId:     { type: String, required: true },
  userEmail:   { type: String, required: true, lowercase: true, trim: true },
  userName:    { type: String },
  rating:      { type: Number, required: true, min: 1, max: 5 },
  comment:     { type: String, required: true, trim: true, maxlength: 800 },
  verified:    { type: Boolean, default: true },
  status:      { type: String, enum: ['approved', 'pending', 'hidden'], default: 'approved' },
}, { timestamps: true });

ReviewSchema.index({ productSlug: 1, orderId: 1, userEmail: 1 }, { unique: true });

const CreatorSubmissionSchema = new mongoose.Schema({
  creatorName:  { type: String, required: true, trim: true },
  email:        { type: String, required: true, lowercase: true, trim: true },
  productName:  { type: String, required: true, trim: true },
  category:     { type: String, required: true },
  description:  { type: String, required: true, trim: true },
  targetPrice:  { type: Number, default: 0 },
  sampleUrl:    { type: String },
  downloadUrl:  { type: String },
  status:       { type: String, enum: ['submitted', 'reviewing', 'approved', 'rejected'], default: 'submitted' },
  notes:        { type: String },
}, { timestamps: true });

export const Order   = mongoose.models.Order   || mongoose.model('Order',   OrderSchema);
export const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
export const User    = mongoose.models.User    || mongoose.model('User',    UserSchema);
export const Review  = mongoose.models.Review  || mongoose.model('Review',  ReviewSchema);
export const CreatorSubmission = mongoose.models.CreatorSubmission || mongoose.model('CreatorSubmission', CreatorSubmissionSchema);
