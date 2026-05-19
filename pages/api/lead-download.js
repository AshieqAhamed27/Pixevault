import { connectDB } from '../../lib/mongoose';
import { LeadCapture } from '../../lib/models';
import { getSeedProducts } from '../../lib/starter-products.mjs';
import { normalizeReferralCode } from '../../lib/referrals.mjs';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { slug, name, email, phone, referralCode, source } = req.body || {};
  const cleanEmail = normalizeEmail(email);
  const cleanSlug = String(slug || '').trim();

  if (!cleanSlug || !cleanEmail) {
    return res.status(400).json({ error: 'Product and email are required.' });
  }

  const product = getSeedProducts().find((item) => item.slug === cleanSlug);

  if (!product || product.active === false) {
    return res.status(404).json({ error: 'Free product was not found.' });
  }

  if (Number(product.price || 0) > 0) {
    return res.status(403).json({ error: 'This product requires checkout before download.' });
  }

  try {
    await connectDB();

    const lead = await LeadCapture.findOneAndUpdate(
      { email: cleanEmail, slug: cleanSlug },
      {
        $set: {
          name: String(name || '').trim(),
          phone: String(phone || '').trim(),
          productName: product.name,
          category: product.category,
          source: source || 'free-download',
          referralCode: normalizeReferralCode(referralCode),
          lastDownloadedAt: new Date(),
        },
        $inc: { downloads: 1 },
        $setOnInsert: { email: cleanEmail, slug: cleanSlug },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    const params = new URLSearchParams({
      slug: cleanSlug,
      lead: lead._id.toString(),
    });

    return res.status(200).json({
      ok: true,
      message: 'Free download unlocked.',
      downloadUrl: `/api/free-download?${params.toString()}`,
    });
  } catch (err) {
    console.error('Lead download capture failed:', err.message);
    return res.status(503).json({ error: 'Unable to unlock the free download right now.' });
  }
}
