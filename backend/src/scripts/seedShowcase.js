import 'dotenv/config'
import mongoose from 'mongoose'
import { hashPassword } from '../auth.js'
import { showcaseProjects, starterProjects } from '../data/projects.js'
import { Project } from '../models/Project.js'
import { User } from '../models/User.js'

const databaseName = process.env.MONGODB_DB || 'ProjectPoolDemo'
const accounts = [
  { email: process.env.DEMO_ADMIN_EMAIL || 'showcase.admin@projectpool.demo', password: process.env.DEMO_ADMIN_PASSWORD || 'ProjectPool-Demo-Admin-2026!', name: 'Showcase Admin', role: 'admin' },
  { email: process.env.DEMO_MODERATOR_EMAIL || 'showcase.moderator@projectpool.demo', password: process.env.DEMO_MODERATOR_PASSWORD || 'ProjectPool-Demo-Moderator-2026!', name: 'Showcase Moderator', role: 'moderator' },
  { email: process.env.DEMO_STUDENT_EMAIL || 'showcase.student@projectpool.demo', password: process.env.DEMO_STUDENT_PASSWORD || 'ProjectPool-Demo-Student-2026!', name: 'Showcase Student', role: 'student' },
  { email: process.env.DEMO_BUILDER_EMAIL || 'showcase.builder@projectpool.demo', password: process.env.DEMO_BUILDER_PASSWORD || 'ProjectPool-Demo-Builder-2026!', name: 'Showcase Builder', role: 'student' },
]

if (!databaseName.toLowerCase().includes('demo')) throw new Error('Use a dedicated MongoDB database name containing "Demo" for showcase seeding.')
for (const { email, password } of accounts) {
  if (Boolean(email) !== Boolean(password)) throw new Error('Set both email and password for each demo account you want to create.')
  if (password && password.length < 12) throw new Error('Demo account passwords must be at least 12 characters.')
}

try {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ProjectPoolDemo', { dbName: databaseName })

  for (const project of [...starterProjects, ...showcaseProjects]) {
    const details = Object.fromEntries(['teamSize', 'estimatedCost', 'impact', 'prerequisites', 'learningOutcomes', 'milestones', 'skills', 'tags'].map((field) => [field, project[field]]))
    const initial = { ...project, status: 'approved' }
    for (const field of Object.keys(details)) delete initial[field]
    await Project.updateOne({ id: project.id }, { $set: details, $setOnInsert: initial }, { upsert: true })
  }

  const createdAccounts = new Map()
  for (const { email, password, name, role } of accounts) {
    if (!email || !password) continue
    const normalizedEmail = email.trim().toLowerCase()
    const existing = await User.findOne({ email: normalizedEmail }).select('+passwordHash')
    if (existing) {
      existing.name = name
      existing.role = role
      existing.passwordHash = await hashPassword(password)
      await existing.save()
      createdAccounts.set(email, existing)
      continue
    }
    const user = await User.create({ name, email: normalizedEmail, passwordHash: await hashPassword(password), role })
    createdAccounts.set(email, user)
  }

  const student = createdAccounts.get(accounts.find((account) => account.name === 'Showcase Student').email)
  const builder = createdAccounts.get(accounts.find((account) => account.name === 'Showcase Builder').email)
  const moderator = createdAccounts.get(accounts.find((account) => account.role === 'moderator').email)
  const savedSeeds = [
    [student, ['campus-compass', 'smart-study-planner', 'accessible-notes']],
    [builder, ['waste-not', 'campus-energy-dashboard', 'showcase-secure-file-drop']],
    [moderator, ['showcase-lab-partner-match']],
  ]
  for (const [user, projectIds] of savedSeeds) {
    if (!user) continue
    const saved = await Project.find({ id: { $in: projectIds } }, 'id title _id').lean()
    await User.updateOne({ _id: user._id }, {
      $addToSet: { savedProjects: { $each: saved.map((project) => project._id) } },
      $set: { activity: saved.map((project, index) => ({ type: 'save', projectId: project.id, projectTitle: project.title, createdAt: new Date(Date.now() - (index + 1) * 86400000) })) },
    })
  }

  const submissionSeeds = [
    { id: 'showcase-pending-submission', createdBy: student, status: 'pending', title: 'Quiet Study Spot Finder', category: 'Web development', difficulty: 'Beginner', duration: '2-3 weeks', description: 'Help classmates find quiet study spaces between lectures.', overview: 'Create a small campus map where students can mark quiet places, note available seating, and add opening hours. Begin with sample locations and keep every listing easy to review.', tags: ['campus', 'study'], technology: ['React', 'Express', 'MongoDB'] },
    { id: 'showcase-rejected-submission', createdBy: builder, status: 'rejected', title: 'Lecture Room Soundscape', category: 'IoT & hardware', difficulty: 'Intermediate', duration: '4-5 weeks', description: 'Explore classroom sound levels to find comfortable study spaces.', overview: 'Prototype a sound-level display using simulated readings. Keep the project focused on aggregate noise levels and never record or store conversations.', tags: ['sensors', 'campus'], technology: ['ESP32', 'React'] },
    { id: 'showcase-approved-submission', createdBy: student, status: 'approved', title: 'Campus Repair Cafe Board', category: 'Mobile apps', difficulty: 'Beginner', duration: '3-4 weeks', description: 'Connect students with campus repair events and shared tool libraries.', overview: 'Build a small event and resource board for student-led repair cafes. Listings should show event times, available tools, and basic accessibility information.', tags: ['community', 'sustainability'], technology: ['React Native', 'Expo'] },
  ]
  for (const submission of submissionSeeds) {
    if (!submission.createdBy) continue
    const { createdBy, status, ...project } = submission
    await Project.updateOne({ id: project.id }, {
      $set: { createdBy: createdBy._id, status },
      $setOnInsert: { ...project, image: `https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80`, imageAlt: `Student showcase submission: ${project.title}`, features: ['Browse clear project information', 'Use practical filters and examples'], deliverables: ['Responsive prototype', 'Short classroom demo'], skills: ['React'], reviewedBy: null, reviewNote: status === 'rejected' ? 'Please clarify the privacy protections and explain how readings are simulated.' : '' },
    }, { upsert: true })
  }

  const roles = accounts.map(({ role }) => role).join(', ')
  console.log(`Showcase catalog ready in ${databaseName}: ${starterProjects.length + showcaseProjects.length} catalog projects, ${accounts.length} demo accounts (${roles}), saved ideas, and sample submissions.`)
} finally {
  await mongoose.disconnect()
}