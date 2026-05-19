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
  referral: {
    code: String,
    referrerEmail: String,
    referrerName: String,
    commissionRate: Number,
    commissionAmount: Number,
    status: { type: String, enum: ['pending', 'approved', 'paid'], default: 'pending' },
  },
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

const LeadCaptureSchema = new mongoose.Schema({
  name:       { type: String, trim: true },
  email:      { type: String, required: true, lowercase: true, trim: true },
  phone:      { type: String, trim: true },
  slug:       { type: String, required: true, index: true },
  productName:{ type: String },
  category:   { type: String },
  source:     { type: String, default: 'free-download' },
  referralCode: { type: String, uppercase: true, trim: true },
  downloads:  { type: Number, default: 1 },
  lastDownloadedAt: { type: Date, default: Date.now },
}, { timestamps: true });

LeadCaptureSchema.index({ email: 1, slug: 1 }, { unique: true });

const AffiliateProfileSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, unique: true, lowercase: true, trim: true },
  userName:  { type: String, trim: true },
  code:      { type: String, required: true, unique: true, uppercase: true, trim: true },
  active:    { type: Boolean, default: true },
}, { timestamps: true });

const ReferralConversionSchema = new mongoose.Schema({
  orderId:       { type: String, required: true, unique: true },
  code:          { type: String, required: true, uppercase: true, trim: true, index: true },
  referrerEmail: { type: String, required: true, lowercase: true, trim: true },
  buyerEmail:    { type: String, lowercase: true, trim: true },
  buyerName:     { type: String },
  productSlugs:  [String],
  subtotal:      { type: Number, default: 0 },
  total:         { type: Number, default: 0 },
  commissionRate:{ type: Number, default: 0 },
  commissionAmount: { type: Number, default: 0 },
  status:        { type: String, enum: ['pending', 'approved', 'paid'], default: 'approved' },
  paidAt:        { type: Date },
}, { timestamps: true });

export const Order   = mongoose.models.Order   || mongoose.model('Order',   OrderSchema);
export const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
export const User    = mongoose.models.User    || mongoose.model('User',    UserSchema);
export const Review  = mongoose.models.Review  || mongoose.model('Review',  ReviewSchema);
export const CreatorSubmission = mongoose.models.CreatorSubmission || mongoose.model('CreatorSubmission', CreatorSubmissionSchema);
export const LeadCapture = mongoose.models.LeadCapture || mongoose.model('LeadCapture', LeadCaptureSchema);
export const AffiliateProfile = mongoose.models.AffiliateProfile || mongoose.model('AffiliateProfile', AffiliateProfileSchema);
export const ReferralConversion = mongoose.models.ReferralConversion || mongoose.model('ReferralConversion', ReferralConversionSchema);
