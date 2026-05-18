// pages/api/products.js
import { connectDB } from '../../lib/mongoose';
import { Product } from '../../lib/models';

export default async function handler(req, res) {
  await connectDB();

  if (req.method === 'GET') {
    const { category } = req.query;
    const filter = { active: true };
    if (category && category !== 'all') filter.category = category;
    const products = await Product.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(products);
  }

  // POST — add a product (admin only; protect with a secret header in production)
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
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
