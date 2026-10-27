import Problem from '../models/Problem.js'
import Submission from '../models/Submission.js'
import User from '../models/User.js'
import { learningPaths } from '../data/learningPaths.js'
import { generateEdgeCases } from '../data/edgeCaseGenerators.js'

export async function listLearningPaths(req, res) {
  const slugs = [...new Set(learningPaths.flatMap((path) => path.problemSlugs))]
  const problems = await Problem.find({ slug: { $in: slugs } }).select('title slug difficulty topics').lean()
  const solvedIds = req.user
    ? new Set((await Submission.distinct('problem', { user: req.user._id, verdict: 'Accepted' })).map(String))
    : new Set()
  const bySlug = new Map(problems.map((problem) => [problem.slug, problem]))
  res.json({
    paths: learningPaths.map((path) => ({
      ...path,
      problems: path.problemSlugs.map((slug) => {
        const problem = bySlug.get(slug)
        return problem ? { ...problem, solved: solvedIds.has(problem._id.toString()) } : null
      }).filter(Boolean),
    })),
  })
}

export async function listBookmarks(req, res) {
  const [user, accepted] = await Promise.all([
    User.findById(req.user._id).select('bookmarks').lean(),
    Submission.distinct('problem', { user: req.user._id, verdict: 'Accepted' }),
  ])
  const solved = new Set(accepted.map((id) => id.toString()))
  const problems = await Problem.find({ _id: { $in: user.bookmarks || [] } }).select('-hints -testCases').sort({ title: 1 }).lean()
  res.json({ problems: problems.map((problem) => ({ ...problem, bookmarked: true, solved: solved.has(problem._id.toString()) })) })
}

export async function toggleBookmark(req, res) {
  const problem = await Problem.exists({ _id: req.params.id })
  if (!problem) return res.status(404).json({ message: 'Problem not found.' })

  const user = await User.findById(req.user._id).select('bookmarks')
  const bookmarks = user.bookmarks || (user.bookmarks = [])
  const existing = bookmarks.some((id) => id.toString() === req.params.id)
  if (existing) user.bookmarks.pull(req.params.id)
  else user.bookmarks.addToSet(req.params.id)
  await user.save()
  res.json({ bookmarked: !existing })
}

export async function listProblems(req, res) {
  const { search = '', difficulty, topic, status } = req.query
  const query = {}
  if (difficulty && ['Easy', 'Medium', 'Hard'].includes(difficulty)) query.difficulty = difficulty
  if (topic) query.topics = topic
  if (search) query.title = { $regex: search.slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
  let problems = await Problem.find(query).select('-hints -testCases').sort({ difficulty: 1, title: 1 }).lean()
  if (req.user) {
    const [accepted, user] = await Promise.all([
      Submission.distinct('problem', { user: req.user._id, verdict: 'Accepted' }),
      User.findById(req.user._id).select('bookmarks').lean(),
    ])
    const solved = new Set(accepted.map((id) => id.toString()))
    const bookmarks = new Set((user?.bookmarks || []).map((id) => id.toString()))
    problems = problems.map((problem) => ({
      ...problem,
      solved: solved.has(problem._id.toString()),
      bookmarked: bookmarks.has(problem._id.toString()),
    }))
  } else {
    problems = problems.map((problem) => ({ ...problem, solved: false, bookmarked: false }))
  }
  if (status === 'solved') problems = problems.filter((problem) => problem.solved)
  if (status === 'unsolved') problems = problems.filter((problem) => !problem.solved)
  res.json({ problems })
}

export async function getProblem(req, res) {
  const problem = await Problem.findOne({ slug: req.params.slug }).select('+testCases').lean()
  if (!problem) return res.status(404).json({ message: 'Problem not found.' })
  const [solved, user] = req.user
    ? await Promise.all([
      Submission.exists({ user: req.user._id, problem: problem._id, verdict: 'Accepted' }),
      User.findById(req.user._id).select('bookmarks').lean(),
    ])
    : [false, null]
  const { testCases, ...publicProblem } = problem
  const { hints, ...problemDetails } = publicProblem
  const sampleTestCount = testCases.filter((testCase) => !testCase.isHidden).length
  res.json({
    problem: {
      ...problemDetails,
      hintCount: hints?.length || 0,
      sampleTestCount,
      solved: Boolean(solved),
      bookmarked: Boolean(user?.bookmarks?.some((id) => id.toString() === problem._id.toString())),
    },
  })
}

export async function getProblemHint(req, res) {
  const index = Number(req.params.index)
  if (!Number.isInteger(index) || index < 0) return res.status(400).json({ message: 'Hint number must be a non-negative integer.' })
  const problem = await Problem.findById(req.params.id).select('hints').lean()
  if (!problem) return res.status(404).json({ message: 'Problem not found.' })
  const hint = problem.hints?.[index]
  if (!hint) return res.status(404).json({ message: 'No hint is available at that position.' })
  res.json({ hint })
}

export async function getProblemEdgeCases(req, res) {
  const problem = await Problem.findOne({ slug: req.params.slug }).select('title').lean()
  if (!problem) return res.status(404).json({ message: 'Problem not found.' })
  const cases = generateEdgeCases(req.params.slug)
  if (!cases) return res.status(404).json({ message: 'No edge-case generator is available for this problem yet.' })
  res.json({ problemTitle: problem.title, cases })
}

export async function listProblemSubmissions(req, res) {
  const problemExists = await Problem.exists({ slug: req.params.slug })
  if (!problemExists) return res.status(404).json({ message: 'Problem not found.' })

  const submissions = await Submission.find({
    user: req.user._id,
    problemSlug: req.params.slug,
  })
    .select('problemTitle problemSlug language verdict passedTests totalTests failedTest executionTime createdAt')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean()
  res.json({ submissions })
}
