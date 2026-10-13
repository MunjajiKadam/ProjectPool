import mongoose from 'mongoose'

const projectSchema = new mongoose.Schema({
  id: { type: String, unique: true, sparse: true, index: true },
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true, index: true },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
  duration: { type: String, required: true },
  teamSize: { type: String, default: '' },
  estimatedCost: { type: String, default: '' },
  description: { type: String, required: true },
  overview: { type: String, required: true },
  impact: { type: String, default: '' },
  features: { type: [String], default: [] },
  technology: { type: [String], default: [] },
  deliverables: { type: [String], default: [] },
  prerequisites: { type: [String], default: [] },
  learningOutcomes: { type: [String], default: [] },
  milestones: { type: [String], default: [] },
  image: { type: String, default: '' },
  imageAlt: { type: String, default: '' },
  skills: { type: [String], default: [] },
  tags: { type: [String], default: [] },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'archived'], default: 'pending', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewNote: { type: String, default: '', maxlength: 1000 },
}, { timestamps: true })

export const Project = mongoose.model('Project', projectSchema, 'ProjectPool')