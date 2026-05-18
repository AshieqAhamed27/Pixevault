// pages/api/verify-payment.js
import crypto from 'crypto';
import { connectDB } from '../../lib/mongoose';
import { Order } from '../../lib/models';
import { sendOrderConfirmation } from '../../lib/mailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

  // 1. Verify Razorpay signature
  const body      = razorpay_order_id + '|' + razorpay_payment_id;
  const expected  = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expected !== razorpay_signature) {
    return res.status(400).json({ success: false, error: 'Payment signature invalid' });
  }

  await connectDB();

  // 2. Mark order as paid
  const order = await Order.findOneAndUpdate(
    { orderId },
    { status: 'paid', razorpayPaymentId: razorpay_payment_id },
    { new: true }
  );

  if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

  // 3. Send confirmation email with download links
  if (!order.downloadsSent) {
    try {
      await sendOrderConfirmation({ order });
      order.downloadsSent = true;
      await order.save();
    } catch (mailErr) {
      console.error('Email send failed:', mailErr.message);
      // Don't fail the payment response — email can be retried
    }
  }

  return res.status(200).json({ success: true, orderId: order.orderId });
}
