import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import mongoose from 'mongoose'
import { authenticate } from '../auth.js'
import { ProjectCollection } from '../models/ProjectCollection.js'
import { Project } from '../models/Project.js'

const router = Router()

async function collectionProjects(projectIds) {
  if (!projectIds.length) return []
  const objectIds = projectIds.filter(mongoose.isValidObjectId)
  const projects = await Project.find({
    status: 'approved',
    $or: [{ id: { $in: projectIds } }, { _id: { $in: objectIds } }],
  }).lean()
  return projectIds.map((id) => projects.find((project) => id === (project.id || String(project._id)) || id === String(project._id))).filter(Boolean)
}

async function serializeCollection(collection) {
  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    projectIds: collection.projectIds,
    projects: await collectionProjects(collection.projectIds),
    isPublic: collection.isPublic,
    shareId: collection.isPublic ? collection.shareId : '',
    createdAt: collection.createdAt,
  }
}

router.get('/shared/:shareId', async (request, response, next) => {
  try {
    const collection = await ProjectCollection.findOne({ shareId: request.params.shareId, isPublic: true })
    if (!collection) return response.status(404).json({ message: 'Shared collection not found.' })
    return response.json({
      name: collection.name,
      description: collection.description,
      projects: await collectionProjects(collection.projectIds),
    })
  } catch (error) { return next(error) }
})

router.use(authenticate)

router.get('/', async (request, response, next) => {
  try {
    const collections = await ProjectCollection.find({ userId: request.user.id }).sort({ createdAt: 1 })
    return response.json({ items: await Promise.all(collections.map(serializeCollection)) })
  } catch (error) { return next(error) }
})

router.post('/', async (request, response, next) => {
  try {
    const name = String(request.body.name || '').trim()
    const description = String(request.body.description || '').trim()
    if (!name || name.length > 60) return response.status(400).json({ message: 'Collection names must be between 1 and 60 characters.' })
    if (description.length > 240) return response.status(400).json({ message: 'Collection descriptions must be at most 240 characters.' })
    if (await ProjectCollection.countDocuments({ userId: request.user.id }) >= 20) return response.status(400).json({ message: 'You can create up to 20 collections.' })
    const collection = await ProjectCollection.create({ id: randomUUID(), userId: request.user.id, name, description })
    return response.status(201).json(await serializeCollection(collection))
  } catch (error) { return next(error) }
})

router.patch('/:collectionId', async (request, response, next) => {
  try {
    const collection = await ProjectCollection.findOne({ id: request.params.collectionId, userId: request.user.id })
    if (!collection) return response.status(404).json({ message: 'Collection not found.' })
    if (request.body.name !== undefined) {
      const name = String(request.body.name).trim()
      if (!name || name.length > 60) return response.status(400).json({ message: 'Collection names must be between 1 and 60 characters.' })
      collection.name = name
    }
    if (request.body.description !== undefined) {
      const description = String(request.body.description).trim()
      if (description.length > 240) return response.status(400).json({ message: 'Collection descriptions must be at most 240 characters.' })
      collection.description = description
    }
    if (request.body.isPublic !== undefined) {
      if (typeof request.body.isPublic !== 'boolean') return response.status(400).json({ message: 'Collection visibility must be public or private.' })
      collection.isPublic = request.body.isPublic
      collection.shareId = request.body.isPublic ? collection.shareId || randomUUID() : ''
    }
    await collection.save()
    return response.json(await serializeCollection(collection))
  } catch (error) { return next(error) }
})

router.delete('/:collectionId', async (request, response, next) => {
  try {
    const result = await ProjectCollection.deleteOne({ id: request.params.collectionId, userId: request.user.id })
    if (!result.deletedCount) return response.status(404).json({ message: 'Collection not found.' })
    return response.status(204).end()
  } catch (error) { return next(error) }
})

router.post('/:collectionId/projects/:projectId', async (request, response, next) => {
  try {
    const [collection, project] = await Promise.all([
      ProjectCollection.findOne({ id: request.params.collectionId, userId: request.user.id }),
      Project.findOne({ status: 'approved', ...(mongoose.isValidObjectId(request.params.projectId) ? { $or: [{ _id: request.params.projectId }, { id: request.params.projectId }] } : { id: request.params.projectId }) }),
    ])
    if (!collection) return response.status(404).json({ message: 'Collection not found.' })
    if (!project) return response.status(404).json({ message: 'Approved project not found.' })
    const projectId = project.id || String(project._id)
    if (!collection.projectIds.includes(projectId) && collection.projectIds.length >= 50) return response.status(400).json({ message: 'Collections can contain up to 50 projects.' })
    collection.projectIds.addToSet(projectId)
    await collection.save()
    return response.json(await serializeCollection(collection))
  } catch (error) { return next(error) }
})

router.delete('/:collectionId/projects/:projectId', async (request, response, next) => {
  try {
    const collection = await ProjectCollection.findOne({ id: request.params.collectionId, userId: request.user.id })
    if (!collection) return response.status(404).json({ message: 'Collection not found.' })
    collection.projectIds.pull(request.params.projectId)
    await collection.save()
    return response.json(await serializeCollection(collection))
  } catch (error) { return next(error) }
})

export default router