import 'dotenv/config'
import mongoose from 'mongoose'
import { app } from './app.js'
import { Project } from './models/Project.js'
import { starterProjects } from './data/projects.js'

const port = process.env.PORT || 5000
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ProjectPool'
const mongoDatabase = process.env.MONGODB_DB || 'ProjectPool'

if (!process.env.JWT_SECRET) throw new Error('Set JWT_SECRET before starting the API.')

const server = app.listen(port, () => console.log(`ProjectPool API listening on http://localhost:${port}`))

try {
  await mongoose.connect(mongoUri, { dbName: mongoDatabase })
  globalThis.projectPoolDatabaseReady = true
  await Project.updateMany({ status: { $exists: false } }, { $set: { status: 'approved' } })
  if (await Project.countDocuments() === 0) await Project.insertMany(starterProjects.map((project) => ({ ...project, status: 'approved' })))
  console.log(`Connected to MongoDB database ${mongoDatabase}, collection ${Project.collection.collectionName}`)
} catch (error) {
  globalThis.projectPoolDatabaseReady = false
  console.error(`MongoDB unavailable: ${error.message}`)
  if (process.env.NODE_ENV === 'production') server.close(() => process.exit(1))
}

async function shutdown(signal) {
  console.log(`${signal} received; shutting down`)
  server.close()
  await mongoose.disconnect()
  process.exit(0)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))