import { connectDB } from '../../lib/mongoose';
import { Product } from '../../lib/models';
import { getPublicStarterProducts } from '../../lib/starter-products.mjs';
import { buildProductCoach, getProductValueContent } from '../../lib/product-intelligence.mjs';

async function loadCatalog() {
  const starterProducts = getPublicStarterProducts('all');

  try {
    await connectDB();
    const dbProducts = await Product.find({ active: true }).sort({ createdAt: -1 }).lean();
    if (!dbProducts.length) return starterProducts;

    const existingSlugs = new Set(dbProducts.map((product) => product.slug));
    return [
      ...dbProducts.map((product) => ({ ...product, _id: product._id.toString() })),
      ...starterProducts.filter((product) => !existingSlugs.has(product.slug)),
    ];
  } catch (err) {
    console.error('Product coach using starter catalog:', err.message);
    return starterProducts;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { slug, ...answers } = req.body || {};
  if (!slug) return res.status(400).json({ error: 'Product slug is required' });

  const catalog = await loadCatalog();
  const product = catalog.find((item) => item.slug === slug);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  return res.status(200).json({
    slug: product.slug,
    valueContent: getProductValueContent(product),
    coach: buildProductCoach(product, answers, catalog),
  });
}
