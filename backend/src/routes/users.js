import { Router } from 'express'
import mongoose from 'mongoose'
import { authenticate, clearAuthCookie, comparePassword, hashPassword, publicUser } from '../auth.js'
import { Project } from '../models/Project.js'
import { ProjectCollection } from '../models/ProjectCollection.js'
import { ProjectProgress } from '../models/ProjectProgress.js'
import { User } from '../models/User.js'

const router = Router()
router.use(authenticate)

function projectFilter(id) {
  return mongoose.isValidObjectId(id) ? { $or: [{ _id: id }, { id }] } : { id }
}

router.get('/me', (request, response) => response.json({ user: publicUser(request.user) }))

router.patch('/me', async (request, response, next) => {
  try {
    const name = String(request.body.name || '').trim()
    if (request.body.name !== undefined && (name.length < 2 || name.length > 80)) return response.status(400).json({ message: 'Name must be between 2 and 80 characters.' })
    if (request.body.avatar !== undefined && !['sprout', 'sunrise', 'ocean', 'coral', 'violet', 'citrus'].includes(request.body.avatar)) return response.status(400).json({ message: 'Choose an available profile avatar.' })
    if (request.body.interests !== undefined && (!Array.isArray(request.body.interests) || request.body.interests.length > 12 || request.body.interests.some((item) => typeof item !== 'string' || item.length > 60))) return response.status(400).json({ message: 'Choose up to 12 project interests.' })
    if (request.body.name !== undefined) request.user.name = name
    if (request.body.avatar !== undefined) request.user.avatar = request.body.avatar
    if (request.body.interests !== undefined) request.user.interests = [...new Set(request.body.interests.map((item) => item.trim()).filter(Boolean))]
    await request.user.save()
    return response.json({ user: publicUser(request.user) })
  } catch (error) { return next(error) }
})

router.patch('/me/password', async (request, response, next) => {
  try {
    const currentPassword = String(request.body.currentPassword || '')
    const newPassword = String(request.body.newPassword || '')
    const user = await User.findById(request.user.id).select('+passwordHash')
    if (!user || !(await comparePassword(currentPassword, user.passwordHash))) return response.status(401).json({ message: 'Current password is incorrect.' })
    if (newPassword.length < 12 || newPassword.length > 128) return response.status(400).json({ message: 'New password must be between 12 and 128 characters.' })
    user.passwordHash = await hashPassword(newPassword)
    user.tokenVersion += 1
    await user.save()
    clearAuthCookie(response)
    return response.status(204).end()
  } catch (error) { return next(error) }
})

router.get('/saved', async (request, response, next) => {
  try {
    await request.user.populate({ path: 'savedProjects', match: { status: 'approved' } })
    return response.json({ items: request.user.savedProjects })
  } catch (error) { return next(error) }
})

router.get('/activity', async (request, response, next) => {
  try {
    const [activities, submissions] = await Promise.all([
      Promise.resolve(request.user.activity || []),
      Project.find({ createdBy: request.user.id }).select('id title status createdAt').sort({ createdAt: -1 }).lean(),
    ])
    const timeline = [
      ...activities.filter((item) => item.type === 'save').map((item) => ({ type: item.type, projectId: item.projectId, title: item.projectTitle, createdAt: item.createdAt })),
      ...submissions.map((item) => ({ type: 'submission', projectId: item.id || String(item._id), title: item.title, status: item.status, createdAt: item.createdAt })),
    ].sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt)).slice(0, 12)
    return response.json({ items: timeline })
  } catch (error) { return next(error) }
})

router.post('/saved/:projectId', async (request, response, next) => {
  try {
    const project = await Project.findOne({ ...projectFilter(request.params.projectId), status: 'approved' })
    if (!project) return response.status(404).json({ message: 'Project not found.' })
    await User.updateOne({ _id: request.user.id, savedProjects: { $ne: project._id } }, {
      $addToSet: { savedProjects: project._id },
      $push: { activity: { $each: [{ type: 'save', projectId: project.id || String(project._id), projectTitle: project.title, createdAt: new Date() }], $slice: -100 } },
    })
    return response.status(204).end()
  } catch (error) { return next(error) }
})

router.delete('/saved/:projectId', async (request, response, next) => {
  try {
    const project = await Project.findOne(projectFilter(request.params.projectId))
    if (project) await User.updateOne({ _id: request.user.id }, { $pull: { savedProjects: project._id } })
    return response.status(204).end()
  } catch (error) { return next(error) }
})

router.delete('/me', async (request, response, next) => {
  try {
    const password = String(request.body.password || '')
    const user = await User.findById(request.user.id).select('+passwordHash')
    if (!user || !(await comparePassword(password, user.passwordHash))) return response.status(401).json({ message: 'Password is incorrect.' })
    await Promise.all([
      Project.deleteMany({ createdBy: user.id }),
      ProjectCollection.deleteMany({ userId: user.id }),
      ProjectProgress.deleteMany({ userId: user.id }),
    ])
    await user.deleteOne()
    clearAuthCookie(response)
    return response.status(204).end()
  } catch (error) { return next(error) }
})

export default router