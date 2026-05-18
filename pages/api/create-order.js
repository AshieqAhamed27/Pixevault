// pages/api/create-order.js
import Razorpay from 'razorpay';
import { connectDB } from '../../lib/mongoose';
import { Order, Product } from '../../lib/models';

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { items, customer } = req.body;
  // items: [{ productId, qty }]
  // customer: { name, email, phone }

  if (!items?.length || !customer?.email || !customer?.name) {
    return res.status(400).json({ error: 'items and customer (name, email) are required' });
  }

  await connectDB();

  // Fetch products from DB to get authoritative prices (never trust client-side prices)
  const productIds = items.map(i => i.productId);
  const dbProducts = await Product.find({ _id: { $in: productIds }, active: true });

  if (dbProducts.length !== items.length) {
    return res.status(400).json({ error: 'One or more products not found or inactive' });
  }

  const enrichedItems = items.map(i => {
    const p = dbProducts.find(p => p._id.toString() === i.productId);
    return { productId: i.productId, name: p.name, price: p.price, downloadUrl: p.downloadUrl, qty: i.qty || 1 };
  });

  const subtotal = enrichedItems.reduce((s, i) => s + i.price * i.qty, 0);
  const gst      = Math.round(subtotal * 0.18);
  const total    = subtotal + gst;
  const orderId  = `PV-${Date.now()}`;

  // Create Razorpay order (amount in paise)
  const rzpOrder = await razorpay.orders.create({
    amount:   total * 100,
    currency: 'INR',
    receipt:  orderId,
    notes:    { customer_email: customer.email, customer_name: customer.name },
  });

  // Persist to MongoDB with status=created
  await Order.create({
    orderId,
    razorpayOrderId: rzpOrder.id,
    customer,
    items: enrichedItems.map(i => ({ productId: i.productId, name: i.name, price: i.price, qty: i.qty })),
    subtotal,
    gst,
    total,
    status: 'created',
  });

  return res.status(200).json({
    orderId,
    razorpayOrderId: rzpOrder.id,
    amount: rzpOrder.amount,
    currency: rzpOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
}
