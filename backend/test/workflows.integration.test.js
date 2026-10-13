import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import request from 'supertest'
import { app } from '../src/app.js'
import { hashPassword } from '../src/auth.js'
import { Project } from '../src/models/Project.js'
import { User } from '../src/models/User.js'

test('student submission can be approved and saved', async () => {
  process.env.JWT_SECRET = 'integration-test-secret-with-enough-characters'
  const databaseName = `ProjectPoolApiTest${process.pid}`
  await mongoose.connect('mongodb://127.0.0.1:27017/ProjectPool', { dbName: databaseName })
  try {
    await mongoose.connection.dropDatabase()
    await Promise.all([User.init(), Project.init()])
    const registration = await request(app).post('/api/auth/register').send({
      name: 'Demo Student', email: `student-${process.pid}@example.test`, password: 'demo-password-long-enough',
    })
    assert.equal(registration.status, 201)
    const studentCookie = registration.headers['set-cookie']

    const submission = await request(app).post('/api/projects').set('Cookie', studentCookie).send({
      title: 'Campus Study Map', category: 'Web development', difficulty: 'Beginner', duration: '3 weeks',
      description: 'Help students find welcoming and useful study spaces around campus.',
      overview: 'Build an accessible map that lets students find study spaces by noise level and amenities.',
      features: ['Filter study spaces'], technology: ['React'], deliverables: ['Campus map'],
    })
    assert.equal(submission.status, 201, JSON.stringify(submission.body))
    assert.equal(submission.body.project.status, 'pending')
    assert.equal((await request(app).get('/api/projects')).body.total, 0)

    const admin = await User.create({
      name: 'Demo Admin', email: `admin-${process.pid}@example.test`,
      passwordHash: await hashPassword('admin-password-long-enough'), role: 'admin',
    })
    const adminLogin = await request(app).post('/api/auth/login').send({ email: admin.email, password: 'admin-password-long-enough' })
    assert.equal(adminLogin.status, 200)
    const review = await request(app).patch(`/api/projects/${submission.body.project.id}/review`)
      .set('Cookie', adminLogin.headers['set-cookie']).send({ decision: 'approved' })
    assert.equal(review.status, 200)

    const listing = await request(app).get('/api/projects')
    assert.equal(listing.body.total, 1)
    const saved = await request(app).post(`/api/users/saved/${submission.body.project.id}`).set('Cookie', studentCookie)
    assert.equal(saved.status, 204, JSON.stringify(saved.body))
    const savedList = await request(app).get('/api/users/saved').set('Cookie', studentCookie)
    assert.equal(savedList.body.items.length, 1)
    assert.equal(savedList.body.items[0].title, 'Campus Study Map')
  } finally {
    await mongoose.connection.dropDatabase()
    await mongoose.disconnect()
  }
})