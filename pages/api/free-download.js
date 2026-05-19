import { getProductDownload } from '../../lib/product-downloads.mjs';
import { getSeedProducts } from '../../lib/starter-products.mjs';

function safeFilename(filename) {
  return filename.replace(/[^a-z0-9._-]/gi, '-').toLowerCase();
}

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const slug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;

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

  const download = getProductDownload(slug);

  if (!download?.content) {
    return res.status(404).json({ error: 'Free download is not available yet.' });
  }

  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename(download.filename)}"`);
  return res.status(200).send(download.content);
}
