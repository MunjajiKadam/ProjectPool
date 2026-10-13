import 'dotenv/config'
import { randomBytes } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'
import { hashPassword } from '../auth.js'
import { User } from '../models/User.js'

const credentialsPath = fileURLToPath(new URL('../../.demo-admin-credentials.txt', import.meta.url))
let savedCredentials
try { savedCredentials = JSON.parse(await readFile(credentialsPath, 'utf8')) }
catch { savedCredentials = null }

const email = String(process.env.ADMIN_EMAIL || savedCredentials?.email || 'admin@projectpool.local').trim().toLowerCase()
const password = String(process.env.ADMIN_PASSWORD || (savedCredentials?.email === email ? savedCredentials.password : '') || randomBytes(24).toString('base64url'))
if (password.length < 12) throw new Error('Admin password must be at least 12 characters.')

try {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ProjectPoolDemo', { dbName: process.env.MONGODB_DB || 'ProjectPoolDemo' })
  const existing = await User.findOne({ email }).select('+passwordHash')
  if (existing) {
    existing.name = existing.name || 'ProjectPool Admin'
    existing.role = 'admin'
    await existing.save()
  } else {
    await User.create({ name: 'ProjectPool Admin', email, passwordHash: await hashPassword(password), role: 'admin' })
  }
  await writeFile(credentialsPath, JSON.stringify({ email, password }, null, 2), { encoding: 'utf8', mode: 0o600 })
  console.log(`Admin account configured for ${email}`)
  console.log(`Local sign-in details are stored in ${credentialsPath}`)
} finally {
  await mongoose.disconnect()
}