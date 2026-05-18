import { connectDB } from '../../../lib/mongoose';
import { User } from '../../../lib/models';
import { hashPassword, normalizeEmail, publicUser, setSessionCookie } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { name, email, password } = req.body || {};
  const cleanName = String(name || '').trim();
  const cleanEmail = normalizeEmail(email);

  if (cleanName.length < 2) {
    return res.status(400).json({ error: 'Enter your full name.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }

  if (!password || String(password).length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  try {
    await connectDB();

    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ error: 'An account already exists for this email.' });
    }

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      passwordHash: hashPassword(password),
    });

    setSessionCookie(res, user);
    return res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    console.error('Signup failed:', err.message);
    return res.status(500).json({ error: 'Unable to create account right now.' });
  }
}
