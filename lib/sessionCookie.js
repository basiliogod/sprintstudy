import crypto from 'crypto';

const COOKIE_NAME = 'sprintstudy_session';
const SECRET_KEY =
  process.env.SESSION_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sprintstudy-default-secure-secret-key-salt';

const ONE_MONTH_SECONDS = 60 * 60 * 24 * 30;

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

export function createSessionToken(payload) {
  const data = {
    ...payload,
    exp: Date.now() + ONE_MONTH_SECONDS * 1000,
  };
  const body = base64UrlEncode(JSON.stringify(data));
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(body)
    .digest('base64url');

  return `${body}.${signature}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [body, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(body)
    .digest('base64url');

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const data = JSON.parse(base64UrlDecode(body));
    if (data.exp && Date.now() > data.exp) {
      return null;
    }
    return data;
  } catch (err) {
    return null;
  }
}

export function getSessionFromRequest(req) {
  const cookieValue = req.cookies.get(COOKIE_NAME)?.value;
  if (cookieValue) {
    const session = verifySessionToken(cookieValue);
    if (session) return session;
  }

  // Fallback: cabeçalho x-user-id para facilitar migração gradual do frontend existente
  const headerUserId = req.headers.get('x-user-id');
  if (headerUserId) {
    return {
      userId: headerUserId,
      username: req.headers.get('x-username') || null,
      abGroup: req.headers.get('x-ab-group') || 'A',
      isGuest: !req.headers.get('x-username'),
    };
  }

  return null;
}

export function setSessionCookie(response, payload) {
  const token = createSessionToken(payload);
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: ONE_MONTH_SECONDS,
    secure: process.env.NODE_ENV === 'production',
  });
  return response;
}

export function clearSessionCookie(response) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });
  return response;
}
