import { connectDB } from '../../../lib/mongoose';
import { User } from '../../../lib/models';
import { normalizeEmail, publicUser, setSessionCookie, verifyPassword } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { email, password } = req.body || {};
  const cleanEmail = normalizeEmail(email);

  if (!cleanEmail || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    await connectDB();

    const user = await User.findOne({ email: cleanEmail });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }

    setSessionCookie(res, user);
    return res.status(200).json({ user: publicUser(user) });
  } catch (err) {
    console.error('Login failed:', err.message);
    return res.status(500).json({ error: 'Unable to log in right now.' });
  }
}
