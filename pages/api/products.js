import { connectDB } from '../../lib/mongoose';
import { Product, Review } from '../../lib/models';
import { getPublicStarterProducts } from '../../lib/starter-products.mjs';
import { getProductValueContent } from '../../lib/product-intelligence.mjs';

async function attachReviewStats(products) {
  const slugs = products.map((product) => product.slug).filter(Boolean);
  if (slugs.length === 0) return products;

  const stats = await Review.aggregate([
    { $match: { productSlug: { $in: slugs }, verified: true, status: 'approved' } },
    { $group: { _id: '$productSlug', count: { $sum: 1 }, average: { $avg: '$rating' } } },
  ]);

  const statsBySlug = new Map(stats.map((item) => [item._id, {
    verifiedReviewCount: item.count,
    verifiedRatingAverage: Number(item.average.toFixed(1)),
  }]));

  return products.map((product) => ({
    ...product,
    ...(statsBySlug.get(product.slug) || {}),
  }));
}

function attachValuePreview(products) {
  return products.map((product) => {
    const valueContent = getProductValueContent(product);
    return {
      ...product,
      valuePreview: valueContent.valueHighlights.slice(0, 2),
      quickStartPreview: valueContent.quickStartPlan.slice(0, 2),
      aiPromptPreview: valueContent.aiPrompts[0] || '',
      buyerIntent: valueContent.buyerIntent,
    };
  });
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { category = 'all' } = req.query;

    try {
      await connectDB();

      const filter = { active: true };
      if (category !== 'all') filter.category = category;
      const products = await Product.find(filter).sort({ createdAt: -1 });

      if (products.length > 0) {
        const dbProducts = products.map((product) => product.toObject());
        const existingSlugs = new Set(dbProducts.map((product) => product.slug));
        const starterProducts = getPublicStarterProducts(category)
          .filter((product) => !existingSlugs.has(product.slug));

        const mergedProducts = attachValuePreview([...dbProducts, ...starterProducts]);
        return res.status(200).json(await attachReviewStats(mergedProducts));
      }
    } catch (err) {
      console.error('Falling back to starter products:', err.message);
    }

    res.setHeader('x-pixelvault-catalog', 'starter');
    return res.status(200).json(attachValuePreview(getPublicStarterProducts(category)));
  }

  await connectDB();

  if (req.method === 'POST') {
    const adminSecret = req.headers['x-admin-secret'];
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const body = req.body || {};
      const product = await Product.create({
        ...body,
        price: Number(body.price || 0),
        comparePrice: Number(body.comparePrice || 0),
        active: body.active !== false,
      });
      return res.status(201).json(product);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
