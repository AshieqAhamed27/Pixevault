import Razorpay from 'razorpay';
import { connectDB } from '../../lib/mongoose';
import { Order, Product } from '../../lib/models';

function getRazorpayClient() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys are not configured');
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { items, customer } = req.body;

  if (!items?.length || !customer?.email || !customer?.name) {
    return res.status(400).json({ error: 'items and customer (name, email) are required' });
  }

  let razorpay;

  try {
    razorpay = getRazorpayClient();
    await connectDB();
  } catch (err) {
    console.error('Checkout setup error:', err.message);
    return res.status(500).json({
      error: 'Checkout is not configured yet. Add Razorpay and MongoDB environment variables in Vercel.',
    });
  }

  const productIds = items.map((item) => item.productId);
  const dbProducts = await Product.find({ _id: { $in: productIds }, active: true });

  if (dbProducts.length !== items.length) {
    return res.status(400).json({ error: 'One or more products not found or inactive' });
  }

  const enrichedItems = items.map((item) => {
    const product = dbProducts.find((entry) => entry._id.toString() === item.productId);
    return {
      productId: item.productId,
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
      name: item.name,
      price: item.price,
      qty: item.qty,
    })),
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
