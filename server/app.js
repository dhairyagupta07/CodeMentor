import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import authRoutes from './routes/authRoutes.js'
import problemRoutes from './routes/problemRoutes.js'
import submissionRoutes from './routes/submissionRoutes.js'
import dojoRoutes from './routes/dojoRoutes.js'
import { errorHandler, notFound } from './middleware/errorMiddleware.js'

const app = express()
const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

app.disable('x-powered-by')
app.use(helmet())
app.use(cors({ origin: allowedOrigin, credentials: true }))
app.use(express.json({ limit: '30kb' }))
app.use(cookieParser())
app.use((req, res, next) => {
  const origin = req.get('origin')
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && origin && origin !== allowedOrigin) {
    return res.status(403).json({ message: 'Requests from this origin are not allowed.' })
  }
  next()
})
app.get('/api/health', (req, res) => res.json({ status: 'ok' }))
app.use('/api/auth', authRoutes)
app.use('/api/problems', problemRoutes)
app.use('/api/submissions', submissionRoutes)
app.use('/api/dojo', dojoRoutes)
app.use(notFound)
app.use(errorHandler)

export default app
