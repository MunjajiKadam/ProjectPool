import { Router } from 'express'
import { User } from '../models/User.js'
import { authenticate, clearAuthCookie, comparePassword, hashPassword, publicUser, setAuthCookie } from '../auth.js'

const router = Router()

router.post('/register', async (request, response, next) => {
  try {
    const name = String(request.body.name || '').trim()
    const email = String(request.body.email || '').trim().toLowerCase()
    const password = String(request.body.password || '')
    if (name.length < 2 || name.length > 80) return response.status(400).json({ message: 'Name must be between 2 and 80 characters.' })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return response.status(400).json({ message: 'Enter a valid email address.' })
    if (password.length < 12 || password.length > 128) return response.status(400).json({ message: 'Password must be between 12 and 128 characters.' })
    if (await User.exists({ email })) return response.status(409).json({ message: 'An account with that email already exists.' })

    const user = await User.create({ name, email, passwordHash: await hashPassword(password) })
    setAuthCookie(response, user)
    return response.status(201).json({ user: publicUser(user) })
  } catch (error) {
    if (error.code === 11000) return response.status(409).json({ message: 'An account with that email already exists.' })
    return next(error)
  }
})

router.post('/login', async (request, response, next) => {
  try {
    const email = String(request.body.email || '').trim().toLowerCase()
    const password = String(request.body.password || '')
    const user = await User.findOne({ email }).select('+passwordHash')
    if (!user || !(await comparePassword(password, user.passwordHash))) return response.status(401).json({ message: 'Email or password is incorrect.' })
    setAuthCookie(response, user)
    return response.json({ user: publicUser(user) })
  } catch (error) {
    return next(error)
  }
})

router.post('/logout', authenticate, async (request, response, next) => {
  try {
    request.user.tokenVersion += 1
    await request.user.save()
    clearAuthCookie(response)
    return response.status(204).end()
  } catch (error) {
    return next(error)
  }
})

router.get('/me', authenticate, (request, response) => response.json({ user: publicUser(request.user) }))

export default router