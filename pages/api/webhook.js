import crypto from 'crypto';
import { connectDB } from '../../lib/mongoose';
import { Order } from '../../lib/models';
import { sendOrderConfirmation } from '../../lib/mailer';

export const config = { api: { bodyParser: false } };

function envMissing(key) {
  const value = process.env[key];
  return !value || /xxxxx|your_|replace|example/i.test(value);
}

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  if (envMissing('RAZORPAY_WEBHOOK_SECRET') || envMissing('MONGODB_URI')) {
    return res.status(503).json({
      error: 'Webhook is not configured yet. Add Razorpay webhook secret and MongoDB environment variables in Vercel.',
    });
  }

  const rawBody = await getRawBody(req);
  const signature = req.headers['x-razorpay-signature'];

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  if (expected !== signature) {
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: 'Invalid webhook payload' });
  }

  if (event.event !== 'payment.captured') {
    return res.status(200).json({ received: true });
  }

  try {
    const payment = event.payload.payment.entity;
    const rzpOrderId = payment.order_id;

    await connectDB();
    const order = await Order.findOne({ razorpayOrderId: rzpOrderId });

    if (order && order.status !== 'paid') {
      order.status = 'paid';
      order.razorpayPaymentId = payment.id;
      await order.save();

      if (!order.downloadsSent) {
        try {
          await sendOrderConfirmation({ order });
          order.downloadsSent = true;
          await order.save();
        } catch (err) {
          console.error('Webhook email failed:', err.message);
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook processing failed:', err.message);
    const isDatabaseError = /mongo|querySrv|ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i.test(err.message);
    return res.status(isDatabaseError ? 503 : 500).json({ error: 'Webhook processing failed' });
  }
}
