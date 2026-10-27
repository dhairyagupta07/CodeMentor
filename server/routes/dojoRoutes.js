import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { getDebuggingChallenge, listDebuggingChallenges, runDebuggingChallenge } from '../controllers/dojoController.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { asyncHandler } from '../middleware/errorMiddleware.js'

const router = Router()
const runLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'You have made too many execution requests. Please wait a minute.' },
})

router.get('/', listDebuggingChallenges)
router.get('/:slug', getDebuggingChallenge)
router.post('/:slug/run', authenticate, runLimiter, asyncHandler(runDebuggingChallenge))

export default router
