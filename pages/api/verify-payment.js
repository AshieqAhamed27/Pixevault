import crypto from 'crypto';
import { connectDB } from '../../lib/mongoose';
import { Order, ReferralConversion } from '../../lib/models';
import { sendOrderConfirmation } from '../../lib/mailer';

function envMissing(key) {
  const value = process.env[key];
  return !value || /xxxxx|your_|replace|example/i.test(value);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  if (envMissing('RAZORPAY_KEY_SECRET') || envMissing('MONGODB_URI')) {
    return res.status(503).json({
      success: false,
      error: 'Payment verification is not configured yet. Add Razorpay and MongoDB environment variables in Vercel.',
    });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body || {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
    return res.status(400).json({ success: false, error: 'Missing payment verification fields' });
  }

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expected !== razorpay_signature) {
    return res.status(400).json({ success: false, error: 'Payment signature invalid' });
  }

  try {
    await connectDB();

    const order = await Order.findOneAndUpdate(
      { orderId },
      { status: 'paid', razorpayPaymentId: razorpay_payment_id },
      { new: true }
    );

    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    if (order.referral?.code && order.referral?.referrerEmail) {
      await ReferralConversion.findOneAndUpdate(
        { orderId: order.orderId },
        {
          $set: {
            code: order.referral.code,
            referrerEmail: order.referral.referrerEmail,
            buyerEmail: order.customer?.email,
            buyerName: order.customer?.name,
            productSlugs: order.items.map((item) => item.slug).filter(Boolean),
            subtotal: order.subtotal || 0,
            total: order.total || 0,
            commissionRate: order.referral.commissionRate || 0,
            commissionAmount: order.referral.commissionAmount || 0,
            status: 'approved',
            paidAt: new Date(),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      order.referral.status = 'approved';
      await order.save();
    }

    if (!order.downloadsSent) {
      try {
        await sendOrderConfirmation({ order });
        order.downloadsSent = true;
        await order.save();
      } catch (mailErr) {
        console.error('Email send failed:', mailErr.message);
      }
    }

    return res.status(200).json({ success: true, orderId: order.orderId });
  } catch (err) {
    console.error('Payment verification failed:', err.message);
    const isDatabaseError = /mongo|querySrv|ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i.test(err.message);
    return res.status(isDatabaseError ? 503 : 500).json({ success: false, error: 'Payment verification failed' });
  }
}
