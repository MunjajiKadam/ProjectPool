import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'
import morgan from 'morgan'
import mongoose from 'mongoose'
import authRouter from './routes/auth.js'
import projectsRouter from './routes/projects.js'
import usersRouter from './routes/users.js'
import openApi from './openapi.js'

export const app = express()
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

app.disable('x-powered-by')
app.use(helmet())
app.use(cors({ origin: clientOrigin, credentials: true }))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
if (process.env.NODE_ENV === 'production') {
  app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false }))
  app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false }))
}

app.get('/api/health', (_request, response) => response.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }))
app.get('/api/ready', (_request, response) => {
  const ready = globalThis.projectPoolDatabaseReady === true
  return response.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not-ready' })
})
app.get('/api/openapi.json', (_request, response) => response.json(openApi))
app.get('/api/docs', (_request, response) => {
  response.set('Content-Security-Policy', "default-src 'self'; script-src 'self' https://unpkg.com 'unsafe-inline'; style-src 'self' https://unpkg.com 'unsafe-inline'; img-src 'self' data:; connect-src 'self'")
  return response.type('html').send('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ProjectPool API</title><link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"></head><body><div id="swagger-ui"></div><script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script><script>SwaggerUIBundle({url:"/api/openapi.json",dom_id:"#swagger-ui"})</script></body></html>')
})
app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/projects', projectsRouter)
app.use((request, response) => response.status(404).json({ message: `No route for ${request.method} ${request.path}` }))
app.use((error, _request, response, _next) => {
  if (error.name === 'ValidationError') return response.status(400).json({ message: error.message })
  if (error.name === 'CastError') return response.status(400).json({ message: 'Invalid identifier.' })
  console.error(error)
  return response.status(500).json({ message: 'Something went wrong. Please try again.' })
})