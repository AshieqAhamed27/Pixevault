import { connectDB } from '../../../lib/mongoose';
import { Product } from '../../../lib/models';
import { getSeedProducts } from '../../../lib/starter-products.mjs';

function isMissing(value) {
  return !value || /xxxxx|your_|replace|example/i.test(value);
}

function requireAdmin(req, res) {
  if (!process.env.ADMIN_SECRET || req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

export default async function handler(req, res) {
  const slug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;
  if (!slug) return res.status(400).json({ error: 'slug is required' });

  if (req.method === 'GET') {
    let product = getSeedProducts().find((item) => item.slug === slug);

    if (!isMissing(process.env.MONGODB_URI)) {
      try {
        await connectDB();
        const dbProduct = await Product.findOne({ slug, active: true }).lean();
        if (dbProduct) product = dbProduct;
      } catch (err) {
        console.error('Product detail lookup failed:', err.message);
      }
    }

    if (!product) return res.status(404).json({ error: 'Product was not found.' });
    return res.status(200).json(product);
  }

  if (!requireAdmin(req, res)) return;

  if (isMissing(process.env.MONGODB_URI)) {
    return res.status(503).json({ error: 'MongoDB is not configured.' });
  }

  await connectDB();

  if (req.method === 'PATCH' || req.method === 'PUT') {
    const product = await Product.findOneAndUpdate(
      { slug },
      { $set: req.body || {} },
      { new: true, runValidators: true },
    );

    if (!product) return res.status(404).json({ error: 'Product was not found.' });
    return res.status(200).json(product);
  }

  if (req.method === 'DELETE') {
    const product = await Product.findOneAndUpdate(
      { slug },
      { $set: { active: false } },
      { new: true },
    );

    if (!product) return res.status(404).json({ error: 'Product was not found.' });
    return res.status(200).json({ ok: true, product });
  }

  res.setHeader('Allow', ['GET', 'PATCH', 'PUT', 'DELETE']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
