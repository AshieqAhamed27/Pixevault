import { readSession, publicUser } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = readSession(req);
  return res.status(200).json({ user: session ? publicUser(session) : null });
}
