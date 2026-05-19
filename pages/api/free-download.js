import { getProductDownload } from '../../lib/product-downloads.mjs';
import { getSeedProducts } from '../../lib/starter-products.mjs';
import { connectDB } from '../../lib/mongoose';
import { LeadCapture } from '../../lib/models';

function safeFilename(filename) {
  return filename.replace(/[^a-z0-9._-]/gi, '-').toLowerCase();
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const slug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;
  const leadId = Array.isArray(req.query.lead) ? req.query.lead[0] : req.query.lead;

  if (!slug) {
    return res.status(400).json({ error: 'slug is required' });
  }

  const product = getSeedProducts().find((item) => item.slug === slug);

  if (!product || product.active === false) {
    return res.status(404).json({ error: 'Free product was not found.' });
  }

  if (Number(product.price || 0) > 0) {
    return res.status(403).json({ error: 'This product requires checkout before download.' });
  }

  if (!leadId) {
    return res.status(403).json({ error: 'Enter your email to unlock this free download.' });
  }

  try {
    await connectDB();
    const lead = await LeadCapture.findOne({ _id: leadId, slug }).lean();
    if (!lead) {
      return res.status(403).json({ error: 'Free download access was not found. Please submit your email again.' });
    }
  } catch (err) {
    console.error('Free download lead check failed:', err.message);
    return res.status(503).json({ error: 'Unable to verify free download access right now.' });
  }

  const download = getProductDownload(slug);

  if (!download?.content) {
    return res.status(404).json({ error: 'Free download is not available yet.' });
  }

  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename(download.filename)}"`);
  return res.status(200).send(download.content);
}
