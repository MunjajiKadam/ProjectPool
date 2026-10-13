import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from './models/User.js'

const tokenCookieName = 'projectpool_session'
const tokenLifetimeSeconds = 60 * 60 * 24 * 7

export function hashPassword(password) {
	return bcrypt.hash(password, 12)
}

export function comparePassword(password, passwordHash) {
	return bcrypt.compare(password, passwordHash)
}

export function createAuthToken(user) {
	const secret = process.env.JWT_SECRET
	if (!secret) throw new Error('JWT_SECRET must be configured')
	return jwt.sign({ sub: user.id, ver: user.tokenVersion }, secret, { expiresIn: tokenLifetimeSeconds })
}

export function setAuthCookie(response, user) {
	response.cookie(tokenCookieName, createAuthToken(user), {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'strict',
		path: '/api',
		maxAge: tokenLifetimeSeconds * 1000,
	})
}

export function clearAuthCookie(response) {
	response.clearCookie(tokenCookieName, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'strict',
		path: '/api',
	})
}

export async function authenticate(request, response, next) {
	let payload
	try {
		const secret = process.env.JWT_SECRET
		const token = request.cookies?.[tokenCookieName]
		if (!secret || !token) return response.status(401).json({ message: 'Sign in to continue.' })
		payload = jwt.verify(token, secret)
	} catch {
		return response.status(401).json({ message: 'Your session is invalid or expired.' })
	}
	try {
		const user = await User.findById(payload.sub)
		if (!user || user.tokenVersion !== payload.ver) return response.status(401).json({ message: 'Your session has expired. Sign in again.' })
		request.user = user
		return next()
	} catch (error) { return next(error) }
}

export function authorize(...roles) {
	return (request, response, next) => {
		if (!request.user || !roles.includes(request.user.role)) return response.status(403).json({ message: 'You do not have permission to do that.' })
		return next()
	}
}

export function publicUser(user) {
	return { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, interests: user.interests || [], createdAt: user.createdAt }
}
