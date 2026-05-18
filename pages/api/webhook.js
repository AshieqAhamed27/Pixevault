// pages/api/webhook.js
// Razorpay sends this even if the user closes the browser after payment.
// Set webhook URL in Razorpay Dashboard → Webhooks → https://yourdomain.com/api/webhook

import crypto from 'crypto';
import { connectDB } from '../../lib/mongoose';
import { Order } from '../../lib/models';
import { sendOrderConfirmation } from '../../lib/mailer';

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const rawBody  = await getRawBody(req);
  const signature = req.headers['x-razorpay-signature'];

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  if (expected !== signature) {
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  const event = JSON.parse(rawBody);

  if (event.event === 'payment.captured') {
    const payment  = event.payload.payment.entity;
    const rzpOrderId = payment.order_id;

    await connectDB();
    const order = await Order.findOne({ razorpayOrderId: rzpOrderId });

    if (order && order.status !== 'paid') {
      order.status           = 'paid';
      order.razorpayPaymentId = payment.id;
      await order.save();

      if (!order.downloadsSent) {
        try {
          await sendOrderConfirmation({ order });
          order.downloadsSent = true;
          await order.save();
        } catch (e) {
          console.error('Webhook email failed:', e.message);
        }
      }
    }
  }

  return res.status(200).json({ received: true });
}
