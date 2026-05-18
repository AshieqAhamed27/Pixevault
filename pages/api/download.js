import { connectDB } from '../../lib/mongoose';
import { Order } from '../../lib/models';
import { getProductDownload } from '../../lib/product-downloads.mjs';

function isMissing(value) {
  return !value || /xxxxx|your_|replace|example/i.test(value);
}

function safeFilename(filename) {
  return filename.replace(/[^a-z0-9._-]/gi, '-').toLowerCase();
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const orderId = Array.isArray(req.query.orderId) ? req.query.orderId[0] : req.query.orderId;
  const token = Array.isArray(req.query.token) ? req.query.token[0] : req.query.token;
  const slug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;
  if (!orderId || !token || !slug) {
    return res.status(400).json({ error: 'orderId, token, and slug are required' });
  }

  if (isMissing(process.env.MONGODB_URI)) {
    return res.status(503).json({ error: 'Downloads are not configured yet.' });
  }

  try {
    await connectDB();

    const order = await Order.findOne({
      orderId,
      downloadToken: token,
      status: 'paid',
      'items.slug': slug,
    });

    if (!order) {
      return res.status(403).json({ error: 'Download link is invalid or payment is not complete.' });
    }

    const item = order.items.find((orderItem) => orderItem.slug === slug);
    const download = getProductDownload(slug);

    if (download?.content) {
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename(download.filename)}"`);
      return res.status(200).send(download.content);
    }

    if (item?.downloadUrl) {
      return res.redirect(302, item.downloadUrl);
    }

    return res.status(404).json({ error: 'Product download is not available yet.' });
  } catch (err) {
    console.error('Download failed:', err.message);
    const isDatabaseError = /mongo|querySrv|ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i.test(err.message);

    return res.status(isDatabaseError ? 503 : 500).json({
      error: 'Unable to prepare download right now. Try again in a few minutes.',
    });
  }
}
