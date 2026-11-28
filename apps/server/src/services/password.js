'use strict';
const { randomBytes, scrypt, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');
const derive = promisify(scrypt);
const options = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const prefix = 'scrypt-v1';
function validPassword(password) {
  return typeof password === 'string' && Buffer.byteLength(password, 'utf8') >= 12 && Buffer.byteLength(password, 'utf8') <= 256;
}
async function hashPassword(password) {
  if (!validPassword(password)) throw new Error('Password must be 12–256 UTF-8 bytes');
  const salt = randomBytes(16);
  const hash = await derive(password, salt, 32, options);
  return `${prefix}$${salt.toString('hex')}$${hash.toString('hex')}`;
}
async function verifyPassword(password, encoded) {
  if (!validPassword(password) || typeof encoded !== 'string') return false;
  const parts = encoded.split('$');
  if (parts.length !== 3 || parts[0] !== prefix || !/^[a-f0-9]{32}$/.test(parts[1]) || !/^[a-f0-9]{64}$/.test(parts[2])) return false;
  const expected = Buffer.from(parts[2], 'hex');
  const actual = await derive(password, Buffer.from(parts[1], 'hex'), 32, options);
  return timingSafeEqual(expected, actual);
}
module.exports = { hashPassword, verifyPassword };
