import jwt from 'jsonwebtoken';
import config from '../config.js';

const { accessSecret, refreshSecret, accessTtl, refreshTtl } = config.jwt;

const OPTS = { issuer: 'news-aggregator', audience: 'news-aggregator-web' };

export function signAccessToken(userId) {
  return jwt.sign({ type: 'access', sub: String(userId) }, accessSecret, {
    ...OPTS,
    expiresIn: accessTtl,
  });
}

export function signRefreshToken(userId, tokenVersion) {
  // token_version enables server-side revocation on logout; jti gives each
  // token a unique id for possible blocklisting.
  return jwt.sign({ type: 'refresh', sub: String(userId), ver: tokenVersion }, refreshSecret, {
    ...OPTS,
    expiresIn: refreshTtl,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, accessSecret, OPTS);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, refreshSecret, OPTS);
}
