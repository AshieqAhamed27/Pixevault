import crypto from 'crypto';

export const REFERRAL_COMMISSION_RATE = 0.20;

export function normalizeReferralCode(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 18);
}

export function buildReferralCode(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const prefix = normalizedEmail
    .split('@')[0]
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 8) || 'PVUSER';
  const hash = crypto.createHash('sha1').update(normalizedEmail).digest('hex').slice(0, 6);

  return normalizeReferralCode(`${prefix}${hash}`);
}

export function calculateReferralCommission(amount) {
  return Math.round(Number(amount || 0) * REFERRAL_COMMISSION_RATE);
}
