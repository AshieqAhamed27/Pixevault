import mongoose from 'mongoose';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { connectDB } from '../../lib/mongoose';
import { Order, Product } from '../../lib/models';

const CHECKOUT_ENV = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'MONGODB_URI'];

function missingEnv(keys) {
  return keys.filter((key) => {
    const value = process.env[key];
    return !value || /xxxxx|your_|replace|example/i.test(value);
  });
}

function getRazorpayClient() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

function buildProductQuery(productRefs) {
  const validObjectIds = productRefs.filter((ref) => mongoose.Types.ObjectId.isValid(ref));
  const clauses = [{ slug: { $in: productRefs } }];

  if (validObjectIds.length > 0) {
    clauses.push({ _id: { $in: validObjectIds } });
  }

  return { active: true, $or: clauses };
}

function findRequestedProduct(products, productRef) {
  return products.find((product) => (
    product.slug === productRef || product._id.toString() === productRef
  ));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { items, customer } = req.body || {};

  if (!items?.length || !customer?.email || !customer?.name) {
    return res.status(400).json({ error: 'items and customer (name, email) are required' });
  }

  const missing = missingEnv(CHECKOUT_ENV);
  if (missing.length > 0) {
    return res.status(503).json({
      error: 'Checkout is not configured yet. Add the required Vercel environment variables.',
      missing,
    });
  }

  try {
    await connectDB();

    const productRefs = items.map((item) => item.productId);
    const dbProducts = await Product.find(buildProductQuery(productRefs));

    if (dbProducts.length !== items.length) {
      return res.status(400).json({
        error: 'One or more products were not found. Seed MongoDB after adding products.',
      });
    }

    const enrichedItems = items.map((item) => {
      const product = findRequestedProduct(dbProducts, item.productId);
      return {
        productId: product._id.toString(),
        slug: product.slug,
        name: product.name,
        price: product.price,
        downloadUrl: product.downloadUrl,
        qty: item.qty || 1,
      };
    });

    const subtotal = enrichedItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    const gst = Math.round(subtotal * 0.18);
    const total = subtotal + gst;
    const orderId = `PV-${Date.now()}`;
    const downloadToken = crypto.randomBytes(24).toString('hex');

    const razorpay = getRazorpayClient();
    const rzpOrder = await razorpay.orders.create({
      amount: total * 100,
      currency: 'INR',
      receipt: orderId,
      notes: { customer_email: customer.email, customer_name: customer.name },
    });

    await Order.create({
      orderId,
      razorpayOrderId: rzpOrder.id,
      customer,
      items: enrichedItems.map((item) => ({
        productId: item.productId,
        slug: item.slug,
        name: item.name,
        price: item.price,
        downloadUrl: item.downloadUrl,
        qty: item.qty,
      })),
      subtotal,
      gst,
      total,
      status: 'created',
      downloadToken,
    });

    return res.status(200).json({
      orderId,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Create order failed:', err.message);
    const isDatabaseError = /mongo|querySrv|ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i.test(err.message);

    return res.status(isDatabaseError ? 503 : 500).json({
      error: 'Unable to create order right now. Check Vercel function logs for details.',
    });
  }
}
