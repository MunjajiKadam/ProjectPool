import mongoose from 'mongoose'

const projectCorrectionSchema = new mongoose.Schema({
  projectRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  projectId: { type: String, required: true, index: true },
  projectTitle: { type: String, required: true },
  message: { type: String, required: true, trim: true, maxlength: 1000 },
  contactEmail: { type: String, default: '', trim: true, maxlength: 254 },
  status: { type: String, enum: ['pending', 'resolved', 'dismissed'], default: 'pending', index: true },
}, { timestamps: true })

export const ProjectCorrection = mongoose.model('ProjectCorrection', projectCorrectionSchema)