import { readSession } from '../../../lib/auth';
import { connectDB } from '../../../lib/mongoose';
import { Order } from '../../../lib/models';

function money(value) {
  return `Rs. ${Number(value || 0).toLocaleString('en-IN')}`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = readSession(req);
  if (!session?.email) return res.status(401).json({ error: 'Login required' });

  const orderId = Array.isArray(req.query.orderId) ? req.query.orderId[0] : req.query.orderId;
  if (!orderId) return res.status(400).json({ error: 'orderId is required' });

  try {
    await connectDB();
    const order = await Order.findOne({ orderId, 'customer.email': session.email });
    if (!order) return res.status(404).json({ error: 'Order was not found.' });

    const rows = order.items.map((item) => (
      `- ${item.name} x${item.qty || 1}: ${money((item.price || 0) * (item.qty || 1))}`
    )).join('\n');

    const invoice = `PixelVault Invoice
Order ID: ${order.orderId}
Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}
Customer: ${order.customer.name}
Email: ${order.customer.email}
Status: ${order.status}

Items
${rows}

Subtotal: ${money(order.subtotal)}
Discount: ${money(order.discount)}
GST: ${money(order.gst)}
Total: ${money(order.total)}

This is a digital product invoice generated from your PixelVault account.
`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${order.orderId.toLowerCase()}-invoice.txt"`);
    return res.status(200).send(invoice);
  } catch (err) {
    console.error('Invoice failed:', err.message);
    return res.status(500).json({ error: 'Unable to prepare invoice right now.' });
  }
}
