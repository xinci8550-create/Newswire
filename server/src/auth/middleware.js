import { verifyAccessToken } from './jwt.js';
import { getDb } from '../db/database.js';

function parseBearer(req) {
  const header = req.headers.authorization || '';
  const m = header.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

/** Require a valid access token; attach req.user = { id, email }. */
export async function requireAuth(req, res, next) {
  try {
    const token = parseBearer(req);
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    const payload = verifyAccessToken(token);
    if (payload.type !== 'access') return res.status(401).json({ error: 'Invalid token' });
    const user = await getDb().get('SELECT id, email FROM users WHERE id = ?', [Number(payload.sub)]);
    if (!user) return res.status(401).json({ error: 'Account no longer exists' });
    req.user = { id: user.id, email: user.email };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/** Attach req.user if a valid token is present, otherwise continue anonymously. */
export async function optionalAuth(req, _res, next) {
  try {
    const token = parseBearer(req);
    if (token) {
      const payload = verifyAccessToken(token);
      if (payload.type === 'access') {
        const user = await getDb().get('SELECT id, email FROM users WHERE id = ?', [Number(payload.sub)]);
        if (user) req.user = { id: user.id, email: user.email };
      }
    }
  } catch {
    // ignore — anonymous request
  }
  next();
}
