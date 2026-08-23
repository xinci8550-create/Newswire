import crypto from 'node:crypto';

const KEYLEN = 64;
const SALT_BYTES = 16;
// scrypt cost parameters (N=16384, r=8, p=1) — reasonable interactive cost.
const COST = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

function scryptAsync(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, KEYLEN, COST, (err, derived) => {
      if (err) return reject(err);
      resolve(derived);
    });
  });
}

/** Hash a plaintext password. Returns "$scrypt$<salt hex>$<hash hex>". */
export async function hashPassword(plaintext) {
  const salt = crypto.randomBytes(SALT_BYTES);
  const derived = await scryptAsync(plaintext, salt);
  return `$scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}

/** Verify a plaintext password against a stored $scrypt$... string. */
export async function verifyPassword(plaintext, stored) {
  if (!stored || typeof stored !== 'string' || !stored.startsWith('$scrypt$')) {
    return false;
  }
  const parts = stored.split('$');
  if (parts.length !== 4) return false;
  const [, , saltHex, hashHex] = parts;
  let salt, expected;
  try {
    salt = Buffer.from(saltHex, 'hex');
    expected = Buffer.from(hashHex, 'hex');
  } catch {
    return false;
  }
  const derived = await scryptAsync(plaintext, salt);
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

/** Basic email format sanity check (returns normalized email or null). */
export function validateEmail(email) {
  if (typeof email !== 'string') return null;
  const e = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  if (e.length > 254) return null;
  return e;
}
