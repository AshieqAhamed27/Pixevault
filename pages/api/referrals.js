import { readSession } from '../../lib/auth';
import { connectDB } from '../../lib/mongoose';
import { AffiliateProfile, ReferralConversion } from '../../lib/models';
import { buildReferralCode, REFERRAL_COMMISSION_RATE } from '../../lib/referrals.mjs';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = readSession(req);
  if (!session?.email) {
    return res.status(401).json({ error: 'Login required' });
  }

  try {
    await connectDB();

    const code = buildReferralCode(session.email);
    const profile = await AffiliateProfile.findOneAndUpdate(
      { userEmail: session.email },
      {
        $set: {
          userName: session.name || '',
          code,
          active: true,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    const referrals = await ReferralConversion.find({ code: profile.code })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const approved = referrals.filter((item) => ['approved', 'paid'].includes(item.status));
    const paid = referrals.filter((item) => item.status === 'paid');

    return res.status(200).json({
      profile: {
        code: profile.code,
        link: `https://pixevault.vercel.app/?ref=${profile.code}`,
        commissionRate: REFERRAL_COMMISSION_RATE,
      },
      summary: {
        conversions: referrals.length,
        approvedConversions: approved.length,
        revenue: referrals.reduce((sum, item) => sum + Number(item.total || 0), 0),
        approvedCommission: approved.reduce((sum, item) => sum + Number(item.commissionAmount || 0), 0),
        paidCommission: paid.reduce((sum, item) => sum + Number(item.commissionAmount || 0), 0),
      },
      referrals: referrals.map((item) => ({
        orderId: item.orderId,
        buyerEmail: item.buyerEmail,
        productSlugs: item.productSlugs || [],
        total: item.total || 0,
        commissionAmount: item.commissionAmount || 0,
        status: item.status,
        createdAt: item.createdAt,
      })),
    });
  } catch (err) {
    console.error('Referral stats failed:', err.message);
    return res.status(500).json({ error: 'Unable to load referral stats right now.' });
  }
}
