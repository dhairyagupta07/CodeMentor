import { Router } from 'express'
import { getProblem, getProblemEdgeCases, getProblemHint, listBookmarks, listLearningPaths, listProblemSubmissions, listProblems, toggleBookmark } from '../controllers/problemController.js'
import { authenticate, optionalAuthentication } from '../middleware/authMiddleware.js'
import { asyncHandler } from '../middleware/errorMiddleware.js'

const router = Router()
router.get('/bookmarks', authenticate, asyncHandler(listBookmarks))
router.get('/paths', optionalAuthentication, asyncHandler(listLearningPaths))
router.post('/:id/bookmark', authenticate, asyncHandler(toggleBookmark))
router.get('/:id/hints/:index', authenticate, asyncHandler(getProblemHint))
router.get('/:slug/edge-cases', authenticate, asyncHandler(getProblemEdgeCases))
router.get('/:slug/submissions', authenticate, asyncHandler(listProblemSubmissions))
router.get('/', optionalAuthentication, asyncHandler(listProblems))
router.get('/:slug', optionalAuthentication, asyncHandler(getProblem))

export default router
