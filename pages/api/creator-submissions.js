import { connectDB } from '../../lib/mongoose';
import { CreatorSubmission } from '../../lib/models';

function requireAdmin(req, res) {
  if (!process.env.ADMIN_SECRET || req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const body = req.body || {};
    const required = ['creatorName', 'email', 'productName', 'category', 'description'];
    const missing = required.filter((key) => !String(body[key] || '').trim());
    if (missing.length) return res.status(400).json({ error: `${missing.join(', ')} required` });

    try {
      await connectDB();
      const submission = await CreatorSubmission.create({
        creatorName: body.creatorName,
        email: body.email,
        productName: body.productName,
        category: body.category,
        description: body.description,
        targetPrice: Number(body.targetPrice || 0),
        sampleUrl: body.sampleUrl,
        downloadUrl: body.downloadUrl,
      });

      return res.status(201).json({ ok: true, id: submission._id.toString() });
    } catch (err) {
      console.error('Creator submission failed:', err.message);
      return res.status(500).json({ error: 'Unable to submit product right now.' });
    }
  }

  if (req.method === 'GET') {
    if (!requireAdmin(req, res)) return;

    try {
      await connectDB();
      const submissions = await CreatorSubmission.find({}).sort({ createdAt: -1 }).limit(100).lean();
      return res.status(200).json({ submissions });
    } catch (err) {
      console.error('Load creator submissions failed:', err.message);
      return res.status(500).json({ error: 'Unable to load submissions right now.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
