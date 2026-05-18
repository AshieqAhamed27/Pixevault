import { connectDB } from '../../lib/mongoose';
import { Product } from '../../lib/models';
import { getSeedProducts } from '../../lib/starter-products.mjs';

function isMissingEnv(key) {
  const value = process.env[key];
  return !value || /xxxxx|your_|replace|example/i.test(value);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  if (isMissingEnv('ADMIN_SECRET') || req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (isMissingEnv('MONGODB_URI')) {
    return res.status(503).json({
      error: 'MongoDB is not configured. Add MONGODB_URI before seeding products.',
    });
  }

  try {
    await connectDB();

    const products = await Promise.all(
      getSeedProducts().map((product) => (
        Product.findOneAndUpdate(
          { slug: product.slug },
          { $set: product },
          { new: true, setDefaultsOnInsert: true, upsert: true },
        )
      )),
    );

    return res.status(200).json({
      seeded: products.length,
      slugs: products.map((product) => product.slug),
    });
  } catch (err) {
    console.error('Seed products failed:', err.message);
    const isDatabaseError = /mongo|querySrv|ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i.test(err.message);

    return res.status(isDatabaseError ? 503 : 500).json({
      error: 'Unable to seed products right now. Check deployment logs for details.',
    });
  }
}
