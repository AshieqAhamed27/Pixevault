import { readSession } from '../../lib/auth';
import { connectDB } from '../../lib/mongoose';
import { Order, Review } from '../../lib/models';

function cleanComment(value) {
  return String(value || '').trim().slice(0, 800);
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const slug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;
    if (!slug) return res.status(400).json({ error: 'slug is required' });

    try {
      await connectDB();
      const reviews = await Review.find({
        productSlug: slug,
        verified: true,
        status: 'approved',
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      const average = reviews.length
        ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1))
        : 0;

      return res.status(200).json({
        average,
        count: reviews.length,
        reviews: reviews.map((review) => ({
          id: review._id.toString(),
          productSlug: review.productSlug,
          orderId: review.orderId,
          userName: review.userName || 'Verified buyer',
          rating: review.rating,
          comment: review.comment,
          verified: review.verified,
          createdAt: review.createdAt,
        })),
      });
    } catch (err) {
      console.error('Load reviews failed:', err.message);
      return res.status(500).json({ error: 'Unable to load reviews right now.' });
    }
  }

  if (req.method === 'POST') {
    const session = readSession(req);
    if (!session?.email) return res.status(401).json({ error: 'Login required' });

    const { slug, orderId, rating, comment } = req.body || {};
    const numericRating = Number(rating);
    const clean = cleanComment(comment);

    if (!slug || !orderId || numericRating < 1 || numericRating > 5 || clean.length < 10) {
      return res.status(400).json({ error: 'Product, order, rating, and a useful comment are required.' });
    }

    try {
      await connectDB();
      const order = await Order.findOne({
        orderId,
        status: 'paid',
        'customer.email': session.email,
        'items.slug': slug,
      });

      if (!order) {
        return res.status(403).json({ error: 'Only verified buyers can review this product.' });
      }

      const review = await Review.findOneAndUpdate(
        { productSlug: slug, orderId, userEmail: session.email },
        {
          $set: {
            productSlug: slug,
            orderId,
            userEmail: session.email,
            userName: session.name,
            rating: numericRating,
            comment: clean,
            verified: true,
            status: 'approved',
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      );

      return res.status(200).json({ ok: true, review });
    } catch (err) {
      console.error('Save review failed:', err.message);
      return res.status(500).json({ error: 'Unable to save review right now.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
