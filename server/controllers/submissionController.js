import Problem from '../models/Problem.js'
import Submission from '../models/Submission.js'
import User from '../models/User.js'
import { evaluateCode, runCustomCode } from '../services/judgeService.js'

const utcDateKey = (date) => date.toISOString().slice(0, 10)

function getActivityMetrics(submissions) {
  const solvedByDay = new Map()
  for (const submission of submissions) {
    const day = utcDateKey(submission.createdAt)
    if (!solvedByDay.has(day)) solvedByDay.set(day, new Set())
    solvedByDay.get(day).add(submission.problem.toString())
  }

  const today = new Date()
  const todayKey = utcDateKey(today)
  const todayCount = solvedByDay.get(todayKey)?.size || 0
  const activeDays = new Set(solvedByDay.keys())
  const cursor = new Date(`${activeDays.has(todayKey) ? todayKey : utcDateKey(new Date(today.getTime() - 86400000))}T00:00:00.000Z`)
  let streak = 0
  while (activeDays.has(utcDateKey(cursor))) {
    streak += 1
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return { todayCount, streak }
}

export async function runCode(req, res) {
  const { code, language } = req.body
  const problem = await Problem.findById(req.params.problemId).select('+testCases')
  if (!problem) return res.status(404).json({ message: 'Problem not found.' })
  const samples = problem.testCases.filter((testCase) => !testCase.isHidden)
  const results = await evaluateCode(code, language, samples)
  res.json({ results, passedTests: results.filter((result) => result.verdict === 'Accepted').length, totalTests: samples.length })
}

export async function runCustomTest(req, res) {
  const problemExists = await Problem.exists({ _id: req.params.problemId })
  if (!problemExists) return res.status(404).json({ message: 'Problem not found.' })

  const { code, language, input, expectedOutput } = req.body
  const result = await runCustomCode(code, language, input, expectedOutput)
  res.json({ result })
}

export async function submitCode(req, res) {
  const { code, language } = req.body
  const problem = await Problem.findById(req.params.problemId).select('+testCases')
  if (!problem) return res.status(404).json({ message: 'Problem not found.' })
  const testCases = problem.testCases
  if (!testCases.length) return res.status(500).json({ message: 'This problem has no evaluation tests configured.' })
  const startedAt = Date.now()
  const results = await evaluateCode(code, language, testCases)
  const failedResultIndex = results.findIndex((result) => result.verdict !== 'Accepted')
  const failedResult = failedResultIndex === -1 ? null : results[failedResultIndex]
  const verdict = failedResult?.verdict || 'Accepted'
  const diagnostic = failedResult
    ? failedResult.compileOutput || failedResult.stderr || failedResult.output || ''
    : ''
  const submission = await Submission.create({
    user: req.user._id,
    problem: problem._id,
    problemTitle: problem.title,
    problemSlug: problem.slug,
    language,
    sourceCode: code,
    verdict,
    passedTests: results.filter((result) => result.verdict === 'Accepted').length,
    totalTests: testCases.length,
    failedTest: failedResult ? failedResultIndex + 1 : null,
    diagnostic,
    executionTime: Math.round((Date.now() - startedAt) / 10) / 100,
  })
  res.status(201).json({
    submission: {
      id: submission._id,
      verdict,
      passedTests: submission.passedTests,
      totalTests: submission.totalTests,
      failedTest: submission.failedTest,
      diagnostic: submission.diagnostic,
      executionTime: submission.executionTime,
      createdAt: submission.createdAt,
    },
  })
}

export async function listSubmissions(req, res) {
  const submissions = await Submission.find({ user: req.user._id })
    .select('-sourceCode')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean()
  res.json({ submissions })
}

export async function getDashboard(req, res) {
  const [total, accepted, recent, solvedProblems, activity, user] = await Promise.all([
    Submission.countDocuments({ user: req.user._id }),
    Submission.countDocuments({ user: req.user._id, verdict: 'Accepted' }),
    Submission.find({ user: req.user._id }).select('-sourceCode').sort({ createdAt: -1 }).limit(5).lean(),
    Submission.distinct('problem', { user: req.user._id, verdict: 'Accepted' }),
    Submission.find({ user: req.user._id, verdict: 'Accepted' }).select('problem createdAt').lean(),
    User.findById(req.user._id).select('dailyGoal').lean(),
  ])
  const { todayCount, streak } = getActivityMetrics(activity)
  res.json({
    stats: {
      solved: solvedProblems.length,
      submissions: total,
      accuracy: total ? Math.round((accepted / total) * 100) : 0,
    },
    dailyProgress: {
      solved: todayCount,
      goal: user?.dailyGoal || 1,
      streak,
      timezone: 'UTC',
    },
    recent,
  })
}

export async function updateDashboardPreferences(req, res) {
  const dailyGoal = Number(req.body.dailyGoal)
  if (!Number.isInteger(dailyGoal) || dailyGoal < 1 || dailyGoal > 10) {
    return res.status(400).json({ message: 'Daily goal must be a whole number between 1 and 10.' })
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { dailyGoal } },
    { new: true, runValidators: true },
  ).select('dailyGoal')
  res.json({ dailyGoal: user.dailyGoal })
}

export async function getSubmission(req, res) {
  const submission = await Submission.findOne({ _id: req.params.id, user: req.user._id }).lean()
  if (!submission) return res.status(404).json({ message: 'Submission not found.' })
  res.json({ submission })
}

export async function saveSubmissionReflection(req, res) {
  const { approach, complexity, alternative } = req.body || {}
  const fields = { approach, complexity, alternative }
  const limits = { approach: 2000, complexity: 120, alternative: 2000 }
  for (const [field, value] of Object.entries(fields)) {
    if (typeof value !== 'string' || value.length > limits[field]) {
      return res.status(400).json({ message: `${field} must be text no longer than ${limits[field]} characters.` })
    }
  }

  const submission = await Submission.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id, verdict: 'Accepted' },
    {
      $set: {
        'reflection.approach': approach.trim(),
        'reflection.complexity': complexity.trim(),
        'reflection.alternative': alternative.trim(),
        'reflection.updatedAt': new Date(),
      },
    },
    { new: true, runValidators: true },
  ).select('reflection')
  if (!submission) {
    const exists = await Submission.exists({ _id: req.params.id, user: req.user._id })
    return exists
      ? res.status(400).json({ message: 'Reflections are available for accepted submissions.' })
      : res.status(404).json({ message: 'Submission not found.' })
  }
  res.json({ reflection: submission.reflection })
}

export async function getWeakSpotMap(req, res) {
  const submissions = await Submission.find({ user: req.user._id })
    .select('problem verdict')
    .populate('problem', 'topics')
    .lean()
  const byTopic = new Map()
  for (const submission of submissions) {
    for (const topic of submission.problem?.topics || []) {
      const current = byTopic.get(topic) || { topic, attempts: 0, accepted: 0, needsReview: 0 }
      current.attempts += 1
      if (submission.verdict === 'Accepted') current.accepted += 1
      else current.needsReview += 1
      byTopic.set(topic, current)
    }
  }
  const topics = [...byTopic.values()]
    .map((item) => ({
      ...item,
      accuracy: Math.round((item.accepted / item.attempts) * 100),
      recommendation: item.needsReview > 0
        ? `Review a ${item.topic} problem and test boundary cases before submitting.`
        : `Keep your ${item.topic} skills fresh with a more challenging problem.`,
    }))
    .sort((left, right) => left.accuracy - right.accuracy || right.attempts - left.attempts)
  res.json({
    topics,
    message: topics.length ? null : 'Submit solutions to build your topic map. Your results are grouped by problem topic.',
  })
}

export async function getLearningJournal(req, res) {
  const submissions = await Submission.find({
    user: req.user._id,
    verdict: 'Accepted',
    $or: [
      { 'reflection.approach': { $exists: true, $ne: '' } },
      { 'reflection.complexity': { $exists: true, $ne: '' } },
      { 'reflection.alternative': { $exists: true, $ne: '' } },
    ],
  })
    .select('problemTitle problemSlug verdict reflection createdAt')
    .sort({ 'reflection.updatedAt': -1, createdAt: -1 })
    .limit(100)
    .lean()
  res.json({ entries: submissions })
}
