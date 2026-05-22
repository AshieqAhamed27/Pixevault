import { connectDB } from '../../lib/mongoose';
import { Product } from '../../lib/models';
import { getPublicStarterProducts } from '../../lib/starter-products.mjs';
import { getAdvisorRecommendations } from '../../lib/product-advisor.mjs';
import { getProductValueContent } from '../../lib/product-intelligence.mjs';

async function loadProducts() {
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
    console.error('Advisor using starter catalog:', err.message);
    return starterProducts;
  }
}

function safeProduct(product) {
  if (!product) return null;
  const valueContent = getProductValueContent(product);
  return {
    _id: product._id || product.slug,
    slug: product.slug,
    name: product.name,
    description: product.description,
    longDesc: product.longDesc || '',
    audience: product.audience || '',
    problem: product.problem || '',
    outcome: product.outcome || '',
    category: product.category,
    categoryLabel: product.categoryLabel,
    format: product.format,
    price: Number(product.price || 0),
    comparePrice: Number(product.comparePrice || 0),
    image: product.image,
    emoji: product.emoji,
    color: product.color,
    badge: product.badge,
    features: product.features || [],
    curriculum: product.curriculum || [],
    realWorldProjects: product.realWorldProjects || [],
    fileList: product.fileList || [],
    bundle: product.bundle === true,
    premium: product.premium === true,
    advisorScore: product.advisorScore || 0,
    advisorReasons: product.advisorReasons || [],
    valuePreview: valueContent.valueHighlights.slice(0, 2),
    quickStartPreview: valueContent.quickStartPlan.slice(0, 2),
    aiPromptPreview: valueContent.aiPrompts[0] || '',
    buyerIntent: valueContent.buyerIntent,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const answers = req.body || {};
  const products = await loadProducts();
  const result = getAdvisorRecommendations(products, answers);

  return res.status(200).json({
    profile: result.profile,
    primary: safeProduct(result.primary),
    bundlePick: safeProduct(result.bundlePick),
    freeStarter: safeProduct(result.freeStarter),
    recommendations: result.recommendations.map(safeProduct),
  });
}
