import assert from 'node:assert/strict'
import test from 'node:test'
import request from 'supertest'
import { app } from '../src/app.js'
import { validateProjectInput } from '../src/routes/projects.js'

test('project validation accepts a complete submission and trims list values', () => {
  const { value, errors } = validateProjectInput({
    title: 'Campus map', category: 'Web development', difficulty: 'Beginner', duration: '3 weeks',
    teamSize: ' 2 students ', estimatedCost: ' Free ', impact: 'A more welcoming first week on campus.',
    description: 'A useful campus map for new students.', overview: 'Build a searchable and accessible map of campus resources.',
    features: ['  Find quiet study spaces  '], technology: ['React'], deliverables: ['Map'],
    prerequisites: ['  Basic browser skills  '], learningOutcomes: ['Build an accessible map'], milestones: ['  Sketch the first flow  '],
  })
  assert.deepEqual(errors, {})
  assert.deepEqual(value.features, ['Find quiet study spaces'])
  assert.equal(value.teamSize, '2 students')
  assert.deepEqual(value.prerequisites, ['Basic browser skills'])
  assert.deepEqual(value.milestones, ['Sketch the first flow'])
})

test('project validation rejects unsupported categories and unsafe image URLs', () => {
  const { errors } = validateProjectInput({
    title: 'Campus map', category: 'Other', difficulty: 'Beginner', duration: '3 weeks',
    description: 'A useful campus map for new students.', overview: 'Build a searchable and accessible map of campus resources.',
    image: 'javascript:alert(1)',
  })
  assert.ok(errors.category)
  assert.ok(errors.image)
})

test('protected routes reject unauthenticated requests', async () => {
  const profile = await request(app).get('/api/auth/me')
  const submission = await request(app).post('/api/projects').send({})
  assert.equal(profile.status, 401)
  assert.equal(submission.status, 401)
})

test('health and readiness endpoints expose database availability', async () => {
  const health = await request(app).get('/api/health')
  const ready = await request(app).get('/api/ready')
  assert.equal(health.status, 200)
  assert.equal(health.body.status, 'ok')
  assert.equal(ready.status, 503)
})

test('API documentation exposes Swagger UI and an OpenAPI document', async () => {
  const docs = await request(app).get('/api/docs')
  const definition = await request(app).get('/api/openapi.json')
  assert.equal(docs.status, 200)
  assert.match(docs.text, /swagger-ui-bundle/)
  assert.equal(definition.status, 200)
  assert.equal(definition.body.openapi, '3.0.3')
  assert.ok(definition.body.paths['/projects/analytics'])
})