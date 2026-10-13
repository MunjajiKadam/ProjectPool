import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
	name: { type: String, required: true, trim: true, maxlength: 80 },
	email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
	passwordHash: { type: String, required: true, select: false },
	role: { type: String, enum: ['student', 'admin', 'moderator'], default: 'student' },
	tokenVersion: { type: Number, default: 0 },
	savedProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
	avatar: { type: String, default: 'sprout', enum: ['sprout', 'sunrise', 'ocean', 'coral', 'violet', 'citrus'] },
	interests: { type: [String], default: [], validate: (items) => items.length <= 12 },
	activity: [{ type: { type: String, enum: ['save', 'submission'], required: true }, projectId: String, projectTitle: String, createdAt: { type: Date, default: Date.now } }],
}, { timestamps: true })

export const User = mongoose.model('User', userSchema)
