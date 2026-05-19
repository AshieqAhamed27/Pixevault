import { connectDB } from '../../lib/mongoose';
import { Product } from '../../lib/models';
import { getSeedProducts } from '../../lib/starter-products.mjs';
import { buildProductSample } from '../../lib/product-samples.mjs';

function safeFilename(filename) {
  return filename.replace(/[^a-z0-9._-]/gi, '-').toLowerCase();
}

function isMissing(value) {
  return !value || /xxxxx|your_|replace|example/i.test(value);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const slug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;
  if (!slug) return res.status(400).json({ error: 'slug is required' });

  let product = getSeedProducts().find((item) => item.slug === slug);

  if (!product && !isMissing(process.env.MONGODB_URI)) {
    try {
      await connectDB();
      const dbProduct = await Product.findOne({ slug, active: true }).lean();
      if (dbProduct) product = dbProduct;
    } catch (err) {
      console.error('Sample lookup failed:', err.message);
    }
  }

  if (!product) return res.status(404).json({ error: 'Product was not found.' });

  const content = buildProductSample(product);
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename(`${slug}-sample.md`)}"`);
  return res.status(200).send(content);
}
