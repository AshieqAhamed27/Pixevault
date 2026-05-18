import crypto from 'crypto';

const COOKIE_NAME = 'pv_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function getSecret() {
  return (
    process.env.AUTH_SECRET ||
    process.env.ADMIN_SECRET ||
    process.env.JWT_SECRET ||
    process.env.RAZORPAY_KEY_SECRET ||
    'pixelvault-development-secret'
  );
}

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function sign(value) {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('base64url');
}

function parseCookies(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .reduce((cookies, cookie) => {
      const index = cookie.indexOf('=');
      if (index === -1) return cookies;
      cookies[cookie.slice(0, index)] = decodeURIComponent(cookie.slice(index + 1));
      return cookies;
    }, {});
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.maxAge != null) parts.push(`Max-Age=${options.maxAge}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.secure) parts.push('Secure');
  return parts.join('; ');
}

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  if (!password || !stored || !stored.includes(':')) return false;
  const [salt, original] = stored.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(original, 'hex'));
}

export function createSessionToken(user) {
  const payload = {
    userId: user._id.toString(),
    name: user.name,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const body = base64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export function readSession(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies[COOKIE_NAME];
  if (!token || !token.includes('.')) return null;

  const [body, signature] = token.split('.');
  if (signature !== sign(body)) return null;

  try {
    const session = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!session.exp || session.exp < Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

export function setSessionCookie(res, user) {
  res.setHeader('Set-Cookie', serializeCookie(COOKIE_NAME, createSessionToken(user), {
    httpOnly: true,
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  }));
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', serializeCookie(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  }));
}

export function publicUser(user) {
  return {
    id: user._id?.toString?.() || user.userId,
    name: user.name,
    email: user.email,
  };
}
