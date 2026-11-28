const { test } = require('node:test');
const assert = require('node:assert/strict');
const { hashPassword, verifyPassword } = require('../src/services/password');
test('password hashes verify and wrong password is rejected', async () => {
  const hash = await hashPassword('test-password-123');
  assert.ok(await verifyPassword('test-password-123',hash));
  assert.equal(await verifyPassword('wrong-password-123',hash),false);
});
test('random salt produces distinct hashes', async () => {
  assert.notEqual(await hashPassword('test-password-123'),await hashPassword('test-password-123'));
});
test('invalid and placeholder credentials rejected',async()=>{
  assert.equal(await verifyPassword('test-password-123','NOT_A_REAL_PASSWORD_HASH'),false);
  assert.equal(await verifyPassword('test-password-123','scrypt-v1$bad$bad'),false);
  await assert.rejects(hashPassword('short'));
});
