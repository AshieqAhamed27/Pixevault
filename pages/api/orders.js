// pages/api/orders.js
import { connectDB } from '../../lib/mongoose';
import { Order } from '../../lib/models';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const adminSecret = req.headers['x-admin-secret'];
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  await connectDB();
  const orders = await Order.find({ status: 'paid' })
    .sort({ createdAt: -1 })
    .limit(100);

  const revenue = orders.reduce((s, o) => s + o.total, 0);

  return res.status(200).json({ orders, revenue, count: orders.length });
}
