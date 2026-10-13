import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import mongoose from 'mongoose'
import { authenticate, authorize } from '../auth.js'
import { Project } from '../models/Project.js'
import { User } from '../models/User.js'
import { starterProjects } from '../data/projects.js'

const router = Router()
const categories = ['Web development', 'AI & machine learning', 'Mobile apps', 'IoT & hardware', 'Data & visualization', 'Cybersecurity']
const difficulties = ['Beginner', 'Intermediate', 'Advanced']
const projectFields = ['title', 'category', 'difficulty', 'duration', 'teamSize', 'estimatedCost', 'description', 'overview', 'impact', 'features', 'technology', 'deliverables', 'prerequisites', 'learningOutcomes', 'milestones', 'image', 'imageAlt', 'skills', 'tags']

export function validateProjectInput(input) {
  const errors = {}
  const value = {}
  for (const field of projectFields) if (input[field] !== undefined) value[field] = input[field]
  for (const field of ['title', 'duration', 'description', 'overview']) {
    if (typeof value[field] !== 'string' || !value[field].trim()) errors[field] = 'This field is required.'
    else value[field] = value[field].trim()
  }
  if (value.title?.length > 120) errors.title = 'Title must be at most 120 characters.'
  if (value.duration?.length > 60) errors.duration = 'Duration must be at most 60 characters.'
  if (value.description && (value.description.length < 20 || value.description.length > 300)) errors.description = 'Description must be between 20 and 300 characters.'
  if (value.overview && (value.overview.length < 20 || value.overview.length > 2000)) errors.overview = 'Overview must be between 20 and 2000 characters.'
  if (!categories.includes(value.category)) errors.category = 'Choose a valid project category.'
  if (!difficulties.includes(value.difficulty)) errors.difficulty = 'Choose a valid difficulty.'
  for (const field of ['teamSize', 'estimatedCost', 'impact']) {
    if (value[field] === undefined) value[field] = ''
    if (typeof value[field] !== 'string' || value[field].length > 300) errors[field] = 'Provide up to 300 characters.'
    else value[field] = value[field].trim()
  }
  for (const field of ['features', 'technology', 'deliverables', 'prerequisites', 'learningOutcomes', 'milestones', 'skills', 'tags']) {
    if (value[field] === undefined) value[field] = []
    if (!Array.isArray(value[field]) || value[field].length > 20 || value[field].some((item) => typeof item !== 'string' || item.trim().length > 100)) {
      errors[field] = 'Provide a list of up to 20 text values, each at most 100 characters.'
    } else value[field] = value[field].map((item) => item.trim()).filter(Boolean)
  }
  for (const field of ['image', 'imageAlt']) if (value[field] === undefined) value[field] = ''
  if (value.image && !/^https:\/\//i.test(value.image)) errors.image = 'Image URL must use HTTPS.'
  return { value, errors }
}

function projectIdFilter(id) {
  return mongoose.isValidObjectId(id) ? { $or: [{ _id: id }, { id }] } : { id }
}

function paginate(items, page, limit) {
  const start = (page - 1) * limit
  return { items: items.slice(start, start + limit), page, limit, total: items.length, pages: Math.ceil(items.length / limit) }
}

function queryOptions(request) {
  const page = Math.max(1, Number.parseInt(request.query.page, 10) || 1)
  const limit = Math.min(48, Math.max(1, Number.parseInt(request.query.limit, 10) || 12))
  const sort = String(request.query.sort || 'newest')
  const sortMap = { newest: { createdAt: -1 }, oldest: { createdAt: 1 }, title: { title: 1 }, shortest: { duration: 1 }, difficulty: { difficulty: 1, createdAt: -1 } }
  return { page, limit, sort: sortMap[sort] || sortMap.newest }
}

function buildFilters(request) {
  const filters = { status: 'approved' }
  if (categories.includes(request.query.category)) filters.category = request.query.category
  if (difficulties.includes(request.query.difficulty)) filters.difficulty = request.query.difficulty
  if (request.query.tag) filters.tags = String(request.query.tag).slice(0, 60)
  if (request.query.q) {
    const term = String(request.query.q).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    filters.$or = ['title', 'description', 'technology', 'tags', 'skills'].map((field) => ({ [field]: { $regex: term, $options: 'i' } }))
  }
  return filters
}

router.get('/mine', authenticate, async (request, response, next) => {
  try {
    const projects = await Project.find({ createdBy: request.user.id }).sort({ updatedAt: -1 }).lean()
    return response.json(projects)
  } catch (error) { return next(error) }
})

router.get('/moderation', authenticate, authorize('admin', 'moderator'), async (_request, response, next) => {
  try {
    const projects = await Project.find({ status: 'pending' }).populate('createdBy', 'name email').sort({ createdAt: 1 }).lean()
    return response.json(projects)
  } catch (error) { return next(error) }
})

router.patch('/moderation/bulk', authenticate, authorize('admin', 'moderator'), async (request, response, next) => {
  try {
    const { ids, decision } = request.body
    if (!Array.isArray(ids) || !ids.length || ids.length > 50 || ids.some((id) => typeof id !== 'string')) return response.status(400).json({ message: 'Choose between 1 and 50 submissions.' })
    if (!['approved', 'rejected'].includes(decision)) return response.status(400).json({ message: 'Decision must be approved or rejected.' })
    const result = await Project.updateMany({ $or: [{ id: { $in: ids } }, { _id: { $in: ids.filter(mongoose.isValidObjectId) } }], status: 'pending' }, { $set: { status: decision, reviewedBy: request.user.id } })
    return response.json({ updated: result.modifiedCount })
  } catch (error) { return next(error) }
})

router.get('/analytics', async (_request, response, next) => {
  try {
    const connected = mongoose.connection.readyState === 1
    const [allProjects, users] = connected ? await Promise.all([
      Project.find({}, 'id title category difficulty status createdAt createdBy').lean(),
      User.find({}, 'savedProjects activity').lean(),
    ]) : [[], []]
    const source = connected ? allProjects : starterProjects.map((project) => ({ ...project, status: 'approved', createdAt: new Date() }))
    const approved = source.filter((project) => project.status === 'approved')
    const submitted = source.filter((project) => project.createdBy)
    const categories = [...new Set(approved.map((project) => project.category))].map((name) => ({ name, count: approved.filter((project) => project.category === name).length }))
    const difficulties = ['Beginner', 'Intermediate', 'Advanced'].map((name) => ({ name, count: approved.filter((project) => project.difficulty === name).length }))
    const submissions = { pending: submitted.filter((project) => project.status === 'pending').length, approved: submitted.filter((project) => project.status === 'approved').length, rejected: submitted.filter((project) => project.status === 'rejected').length }
    const start = new Date()
    start.setDate(start.getDate() - 41)
    const weeks = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(start)
      date.setDate(date.getDate() + index * 7)
      return { date, week: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count: 0 }
    })
    for (const project of submitted) {
      const created = new Date(project.createdAt || Date.now())
      const index = Math.floor((created - start) / (7 * 24 * 60 * 60 * 1000))
      if (index >= 0 && index < weeks.length) weeks[index].count += 1
    }
    const saveCounts = new Map()
    const trendingCounts = new Map()
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    for (const user of users) {
      for (const projectId of user.savedProjects || []) saveCounts.set(String(projectId), (saveCounts.get(String(projectId)) || 0) + 1)
      for (const activity of user.activity || []) if (activity.type === 'save' && new Date(activity.createdAt).getTime() >= weekAgo) trendingCounts.set(activity.projectId, (trendingCounts.get(activity.projectId) || 0) + 1)
    }
    const projectCards = approved.map((project) => ({ id: project.id || String(project._id), title: project.title, category: project.category }))
    const ranked = (counts) => projectCards.map((project) => ({ ...project, saves: counts.get(project.id) || counts.get(String(source.find((item) => (item.id || String(item._id)) === project.id)?._id)) || 0 })).filter((project) => project.saves).sort((first, second) => second.saves - first.saves).slice(0, 5)
    const totalSaves = [...saveCounts.values()].reduce((total, count) => total + count, 0)
    return response.json({ totalProjects: approved.length, totalSaves, categories, difficulties, submissions, submissionsOverTime: weeks.map(({ week, count }) => ({ week, count })), mostSaved: ranked(saveCounts), trendingThisWeek: ranked(trendingCounts) })
  } catch (error) { return next(error) }
})

router.get('/similar/:id', async (request, response, next) => {
  try {
    const project = await Project.findOne({ ...projectIdFilter(request.params.id), status: 'approved' }).lean()
    if (!project) return response.status(404).json({ message: 'Project not found.' })
    const matches = await Project.find({ status: 'approved', _id: { $ne: project._id }, $or: [{ category: project.category }, { tags: { $in: project.tags || [] } }] }).limit(5).lean()
    return response.json(matches)
  } catch (error) { return next(error) }
})

router.get('/admin/all', authenticate, authorize('admin'), async (request, response, next) => {
  try {
    const status = ['pending', 'approved', 'rejected', 'archived'].includes(request.query.status) ? request.query.status : undefined
    const projects = await Project.find(status ? { status } : {}).sort({ updatedAt: -1 }).lean()
    return response.json(projects)
  } catch (error) { return next(error) }
})

router.get('/', async (request, response, next) => {
  try {
    const { page, limit, sort } = queryOptions(request)
    const filters = buildFilters(request)
    const [items, total] = await Promise.all([
      Project.find(filters).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
      Project.countDocuments(filters),
    ])
    return response.json({ items, page, limit, total, pages: Math.ceil(total / limit) })
  } catch (error) {
    if (mongoose.connection.readyState !== 1 && process.env.NODE_ENV !== 'production') {
      const { page, limit } = queryOptions(request)
      const filters = buildFilters(request)
      const results = starterProjects.filter((project) => {
        const matchesCategory = !filters.category || project.category === filters.category
        const matchesDifficulty = !filters.difficulty || project.difficulty === filters.difficulty
        const searchTerm = String(request.query.q || '').toLowerCase()
        const matchesSearch = !searchTerm || `${project.title} ${project.description} ${project.technology.join(' ')}`.toLowerCase().includes(searchTerm)
        return matchesCategory && matchesDifficulty && matchesSearch
      })
      return response.json(paginate(results, page, limit))
    }
    return next(error)
  }
})

router.get('/:id', async (request, response, next) => {
  try {
    const project = await Project.findOne({ ...projectIdFilter(request.params.id), status: 'approved' }).lean()
    if (!project) return response.status(404).json({ message: 'Project not found.' })
    return response.json(project)
  } catch (error) { return next(error) }
})

router.post('/', authenticate, async (request, response, next) => {
  try {
    const { value, errors } = validateProjectInput(request.body)
    if (Object.keys(errors).length) return response.status(400).json({ message: 'Review the highlighted project fields.', errors })
    const project = await Project.create({ ...value, id: `submission-${randomUUID()}`, createdBy: request.user.id, status: 'pending' })
    request.user.activity.push({ type: 'submission', projectId: project.id, projectTitle: project.title })
    await request.user.save()
    return response.status(201).json({ project, message: 'Your project is submitted for review.' })
  } catch (error) { return next(error) }
})

router.patch('/:id', authenticate, async (request, response, next) => {
  try {
    const project = await Project.findOne({ ...projectIdFilter(request.params.id), createdBy: request.user.id, status: { $in: ['pending', 'rejected'] } })
    if (!project) return response.status(404).json({ message: 'Editable submission not found.' })
    const { value, errors } = validateProjectInput({ ...project.toObject(), ...request.body })
    if (Object.keys(errors).length) return response.status(400).json({ message: 'Review the highlighted project fields.', errors })
    Object.assign(project, value, { status: 'pending', reviewNote: '', reviewedBy: null })
    await project.save()
    return response.json({ project })
  } catch (error) { return next(error) }
})

router.delete('/:id', authenticate, async (request, response, next) => {
  try {
    const filter = projectIdFilter(request.params.id)
    const project = request.user.role === 'admin'
      ? await Project.findOneAndDelete(filter)
      : await Project.findOneAndDelete({ ...filter, createdBy: request.user.id, status: { $in: ['pending', 'rejected'] } })
    if (!project) return response.status(404).json({ message: 'Deletable project not found.' })
    return response.status(204).end()
  } catch (error) { return next(error) }
})

router.post('/admin', authenticate, authorize('admin'), async (request, response, next) => {
  try {
    const { value, errors } = validateProjectInput(request.body)
    if (Object.keys(errors).length) return response.status(400).json({ message: 'Review the highlighted project fields.', errors })
    const project = await Project.create({ ...value, id: `project-${randomUUID()}`, status: 'approved', createdBy: request.user.id })
    return response.status(201).json({ project })
  } catch (error) { return next(error) }
})

router.patch('/:id/review', authenticate, authorize('admin', 'moderator'), async (request, response, next) => {
  try {
    const { decision, note = '' } = request.body
    if (!['approved', 'rejected'].includes(decision)) return response.status(400).json({ message: 'Decision must be approved or rejected.' })
    if (typeof note !== 'string' || note.length > 1000) return response.status(400).json({ message: 'Review note must be under 1000 characters.' })
    const project = await Project.findOneAndUpdate(
      { ...projectIdFilter(request.params.id), status: 'pending' },
      { status: decision, reviewNote: note.trim(), reviewedBy: request.user.id },
      { new: true, runValidators: true },
    )
    if (!project) return response.status(404).json({ message: 'Pending submission not found.' })
    return response.json({ project })
  } catch (error) { return next(error) }
})

router.patch('/:id/admin', authenticate, authorize('admin'), async (request, response, next) => {
  try {
    const project = await Project.findOne(projectIdFilter(request.params.id))
    if (!project) return response.status(404).json({ message: 'Project not found.' })
    const { value, errors } = validateProjectInput({ ...project.toObject(), ...request.body })
    if (Object.keys(errors).length) return response.status(400).json({ message: 'Review the highlighted project fields.', errors })
    Object.assign(project, value)
    if (request.body.status && ['pending', 'approved', 'rejected', 'archived'].includes(request.body.status)) project.status = request.body.status
    await project.save()
    return response.json({ project })
  } catch (error) { return next(error) }
})

export default router