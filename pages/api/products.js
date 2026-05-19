import { connectDB } from '../../lib/mongoose';
import { Product } from '../../lib/models';
import { getPublicStarterProducts } from '../../lib/starter-products.mjs';

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

        return res.status(200).json([...dbProducts, ...starterProducts]);
      }
    } catch (err) {
      console.error('Falling back to starter products:', err.message);
    }

    res.setHeader('x-pixelvault-catalog', 'starter');
    return res.status(200).json(getPublicStarterProducts(category));
  }

  await connectDB();

  if (req.method === 'POST') {
    const adminSecret = req.headers['x-admin-secret'];
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const product = await Product.create(req.body);
      return res.status(201).json(product);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
