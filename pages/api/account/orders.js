import { readSession } from '../../../lib/auth';
import { connectDB } from '../../../lib/mongoose';
import { Order } from '../../../lib/models';

function buildDownloadHref(order, item) {
  if (order.status !== 'paid' || !order.downloadToken || !item.slug) return null;

  const params = new URLSearchParams({
    orderId: order.orderId,
    token: order.downloadToken,
    slug: item.slug,
  });

  return `/api/download?${params.toString()}`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = readSession(req);
  if (!session?.email) {
    return res.status(401).json({ error: 'Login required' });
  }

  try {
    await connectDB();

    const orders = await Order.find({ 'customer.email': session.email })
      .sort({ createdAt: -1 })
      .limit(50);

    const safeOrders = orders.map((order) => ({
      id: order._id.toString(),
      orderId: order.orderId,
      status: order.status,
      total: order.total || 0,
      subtotal: order.subtotal || 0,
      gst: order.gst || 0,
      currency: order.currency || 'INR',
      createdAt: order.createdAt,
      razorpayPaymentId: order.razorpayPaymentId || null,
      items: order.items.map((item) => ({
        productId: item.productId,
        slug: item.slug,
        name: item.name,
        price: item.price || 0,
        qty: item.qty || 1,
        downloadHref: buildDownloadHref(order, item),
      })),
    }));

    const paidOrders = safeOrders.filter((order) => order.status === 'paid');
    const downloads = paidOrders.flatMap((order) => (
      order.items
        .filter((item) => item.downloadHref)
        .map((item) => ({
          orderId: order.orderId,
          purchasedAt: order.createdAt,
          name: item.name,
          slug: item.slug,
          href: item.downloadHref,
        }))
    ));

    return res.status(200).json({
      summary: {
        orders: safeOrders.length,
        paidOrders: paidOrders.length,
        pendingOrders: safeOrders.filter((order) => order.status === 'created').length,
        downloads: downloads.length,
        totalSpent: paidOrders.reduce((sum, order) => sum + order.total, 0),
      },
      orders: safeOrders,
      downloads,
    });
  } catch (err) {
    console.error('Account orders failed:', err.message);
    const isDatabaseError = /mongo|querySrv|ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i.test(err.message);

    return res.status(isDatabaseError ? 503 : 500).json({
      error: 'Unable to load account orders right now.',
    });
  }
}
