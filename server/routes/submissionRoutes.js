import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { getDashboard, getLearningJournal, getSubmission, getWeakSpotMap, listSubmissions, runCode, runCustomTest, saveSubmissionReflection, submitCode, updateDashboardPreferences } from '../controllers/submissionController.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { asyncHandler } from '../middleware/errorMiddleware.js'

const router = Router()
const executionLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'You have made too many execution requests. Please wait a minute.' },
})

router.use(authenticate)
router.get('/dashboard', asyncHandler(getDashboard))
router.patch('/dashboard/preferences', asyncHandler(updateDashboardPreferences))
router.get('/weak-spots', asyncHandler(getWeakSpotMap))
router.get('/journal', asyncHandler(getLearningJournal))
router.get('/', asyncHandler(listSubmissions))
router.get('/:id', asyncHandler(getSubmission))
router.put('/:id/reflection', asyncHandler(saveSubmissionReflection))
router.post('/run/:problemId', executionLimiter, asyncHandler(runCode))
router.post('/run-custom/:problemId', executionLimiter, asyncHandler(runCustomTest))
router.post('/submit/:problemId', executionLimiter, asyncHandler(submitCode))

export default router
