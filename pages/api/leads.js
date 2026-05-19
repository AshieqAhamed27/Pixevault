import { connectDB } from '../../lib/mongoose';
import { LeadCapture } from '../../lib/models';

function requireAdmin(req, res) {
  if (!process.env.ADMIN_SECRET || req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  if (!requireAdmin(req, res)) return;

  try {
    await connectDB();

    const [leads, total, downloadCount] = await Promise.all([
      LeadCapture.find({}).sort({ updatedAt: -1 }).limit(100).lean(),
      LeadCapture.countDocuments({}),
      LeadCapture.aggregate([{ $group: { _id: null, downloads: { $sum: '$downloads' } } }]),
    ]);

    return res.status(200).json({
      total,
      downloads: downloadCount[0]?.downloads || 0,
      leads,
    });
  } catch (err) {
    console.error('Load leads failed:', err.message);
    return res.status(500).json({ error: 'Unable to load leads right now.' });
  }
}
