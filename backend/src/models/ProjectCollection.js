import mongoose from 'mongoose'

const projectCollectionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 60 },
  description: { type: String, default: '', trim: true, maxlength: 240 },
  projectIds: { type: [String], default: [] },
  isPublic: { type: Boolean, default: false },
  shareId: { type: String, default: '', unique: true, sparse: true },
}, { timestamps: true })

export const ProjectCollection = mongoose.model('ProjectCollection', projectCollectionSchema)