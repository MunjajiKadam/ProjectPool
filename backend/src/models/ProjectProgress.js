import mongoose from 'mongoose'

const projectProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: String, required: true },
  completedMilestones: { type: [Number], default: [] },
}, { timestamps: true })

projectProgressSchema.index({ userId: 1, projectId: 1 }, { unique: true })

export const ProjectProgress = mongoose.model('ProjectProgress', projectProgressSchema)