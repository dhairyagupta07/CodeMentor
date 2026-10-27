import { Router } from 'express'
import { currentUser, login, logout, register } from '../controllers/authController.js'
import { optionalAuthentication } from '../middleware/authMiddleware.js'
import { asyncHandler } from '../middleware/errorMiddleware.js'
import { rateLimit } from 'express-rate-limit'

const router = Router()
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please try again later.' },
})

router.post('/register', authLimiter, asyncHandler(register))
router.post('/login', authLimiter, asyncHandler(login))
router.post('/logout', logout)
router.get('/me', optionalAuthentication, asyncHandler(currentUser))

export default router
