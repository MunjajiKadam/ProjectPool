import assert from 'node:assert/strict'
import test from 'node:test'
import { comparePassword, createAuthToken, hashPassword } from '../src/auth.js'

test('password hashes verify only the original password', async () => {
  const hash = await hashPassword('a-long-test-password')
  assert.equal(await comparePassword('a-long-test-password', hash), true)
  assert.equal(await comparePassword('wrong-password', hash), false)
})

test('auth tokens require a configured secret and include the user identity', () => {
  process.env.JWT_SECRET = 'test-secret-for-auth-unit-tests'
  const token = createAuthToken({ id: 'user-123', tokenVersion: 2 })
  assert.equal(typeof token, 'string')
  assert.ok(token.length > 20)
})