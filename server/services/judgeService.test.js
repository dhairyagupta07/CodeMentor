import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { problems } from '../data/problems.js'
import { additionalProblems } from '../data/additionalProblems.js'
import { debuggingChallenges } from '../data/debuggingChallenges.js'
import { generateEdgeCases } from '../data/edgeCaseGenerators.js'
import { getDashboard, getLearningJournal, getWeakSpotMap, saveSubmissionReflection, submitCode, updateDashboardPreferences } from '../controllers/submissionController.js'
import { getDebuggingChallenge, listDebuggingChallenges, runDebuggingChallenge } from '../controllers/dojoController.js'
import { getProblem, getProblemHint, listProblemSubmissions, toggleBookmark } from '../controllers/problemController.js'
import Problem from '../models/Problem.js'
import Submission from '../models/Submission.js'
import User from '../models/User.js'
import { evaluateCode } from './judgeService.js'
import { runCustomTest } from '../controllers/submissionController.js'

const originalFetch = globalThis.fetch
const originalJudgeUrl = process.env.JUDGE0_URL
const originalFindById = Problem.findById
const originalProblemExists = Problem.exists
const originalFindOne = Problem.findOne
const originalCreateSubmission = Submission.create
const originalSubmissionExists = Submission.exists
const originalSubmissionCountDocuments = Submission.countDocuments
const originalSubmissionFind = Submission.find
const originalSubmissionDistinct = Submission.distinct
const originalSubmissionFindOneAndUpdate = Submission.findOneAndUpdate
const originalUserFindById = User.findById
const originalUserFindByIdAndUpdate = User.findByIdAndUpdate

after(() => {
  globalThis.fetch = originalFetch
  Problem.findById = originalFindById
  Problem.exists = originalProblemExists
  Problem.findOne = originalFindOne
  Submission.create = originalCreateSubmission
  Submission.exists = originalSubmissionExists
  Submission.countDocuments = originalSubmissionCountDocuments
  Submission.find = originalSubmissionFind
  Submission.distinct = originalSubmissionDistinct
  Submission.findOneAndUpdate = originalSubmissionFindOneAndUpdate
  User.findById = originalUserFindById
  User.findByIdAndUpdate = originalUserFindByIdAndUpdate
  if (originalJudgeUrl === undefined) delete process.env.JUDGE0_URL
  else process.env.JUDGE0_URL = originalJudgeUrl
})

function expectedTwoSumOutput(input) {
  const [length, target, ...values] = input.trim().split(/\s+/).map(Number)
  const numbers = values.slice(0, length)
  for (let first = 0; first < numbers.length; first += 1) {
    for (let second = first + 1; second < numbers.length; second += 1) {
      if (numbers[first] + numbers[second] === target) return `${first} ${second}`
    }
  }
  return ''
}

test('free Judge0 evaluates all Two Sum cases on repeated C++ runs and submission', async () => {
  const problem = problems.find(({ slug }) => slug === 'two-sum')
  const testCases = problem.testCases
  for (const { input, output } of testCases) {
    const [length, target, ...values] = input.trim().split(/\s+/).map(Number)
    const numbers = values.slice(0, length)
    const matchingPairs = []
    for (let first = 0; first < numbers.length; first += 1) {
      for (let second = first + 1; second < numbers.length; second += 1) {
        if (numbers[first] + numbers[second] === target) matchingPairs.push(`${first} ${second}`)
      }
    }
    assert.deepEqual(matchingPairs, [output], 'Every Two Sum test must have exactly one expected answer')
  }

  delete process.env.JUDGE0_URL
  const submissions = new Map()
  let tokenCount = 0
  let pendingPollUsed = false
  globalThis.fetch = async (url, options) => {
    const requestUrl = new URL(url)
    assert.equal(requestUrl.origin, 'https://ce.judge0.com')
    assert.equal(options.headers['X-RapidAPI-Key'], undefined)
    assert.equal(options.headers['X-RapidAPI-Host'], undefined)

    if (options.method === 'POST') {
      assert.equal(requestUrl.searchParams.get('wait'), 'false')
      assert.equal(requestUrl.searchParams.get('base64_encoded'), 'false')
      const { source_code: sourceCode, language_id: languageId, stdin } = JSON.parse(options.body)
      assert.equal(languageId, 54)
      const token = `submission-${++tokenCount}`
      submissions.set(token, {
        stdout: sourceCode === 'wrong solution' && stdin === testCases[3].input
          ? '0 4\n'
          : `${expectedTwoSumOutput(stdin)}\n`,
      })
      return Response.json({ token }, { status: 201 })
    }

    const token = requestUrl.pathname.split('/').at(-1)
    assert.ok(submissions.has(token))
    if (!pendingPollUsed) {
      pendingPollUsed = true
      return Response.json({ status: { id: 2 } })
    }
    return Response.json({ ...submissions.get(token), time: '0.01', status: { id: 3 } })
  }

  for (let run = 0; run < 2; run += 1) {
    const results = await evaluateCode('correct C++ solution', 'cpp', testCases)
    assert.equal(results.length, 4)
    assert.deepEqual(results.map(({ verdict }) => verdict), [
      'Accepted',
      'Accepted',
      'Accepted',
      'Accepted',
    ])
  }

  const incorrectResults = await evaluateCode('wrong solution', 'cpp', testCases)
  assert.equal(incorrectResults.length, 4)
  assert.deepEqual(incorrectResults.map(({ verdict }) => verdict), [
    'Accepted',
    'Accepted',
    'Accepted',
    'Wrong Answer',
  ])
})

test('wrong-answer submission returns test number and actual output instead of a server error', async () => {
  Problem.findById = () => ({
    select: async () => ({
      _id: 'problem-id',
      title: 'Two Sum',
      slug: 'two-sum',
      testCases: [{ input: '2 6\n3 3', output: '0 1' }],
    }),
  })

  let savedSubmission
  Submission.create = async (data) => {
    savedSubmission = data
    return {
      ...data,
      _id: 'submission-id',
      createdAt: new Date('2026-01-01T00:00:00Z'),
    }
  }

  globalThis.fetch = async (_url, options) => {
    if (options.method === 'POST') return Response.json({ token: 'wrong-answer-token' }, { status: 201 })
    return Response.json({ status: { id: 4 }, stdout: '1 0\n', time: '0.01' })
  }

  const response = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(body) {
      this.body = body
      return this
    },
  }

  await submitCode(
    { params: { problemId: 'problem-id' }, body: { code: 'incorrect solution', language: 'cpp' }, user: { _id: 'user-id' } },
    response,
  )

  assert.equal(response.statusCode, 201)
  assert.equal(response.body.submission.verdict, 'Wrong Answer')
  assert.equal(response.body.submission.failedTest, 1)
  assert.equal(response.body.submission.diagnostic, '1 0\n')
  assert.equal(savedSubmission.passedTests, 0)
  assert.equal(savedSubmission.totalTests, 1)
})

test('accepted program with no stdout is evaluated as empty output', async () => {
  globalThis.fetch = async (_url, options) => {
    if (options.method === 'POST') return Response.json({ token: 'empty-output-token' }, { status: 201 })
    return Response.json({ status: { id: 3 }, stdout: null, time: '0.01' })
  }

  const results = await evaluateCode('int main() { return 0; }', 'cpp', [
    { input: '', output: 'expected output' },
  ])
  assert.equal(results.length, 1)
  assert.equal(results[0].verdict, 'Wrong Answer')
})

test('problem details report the sample count without exposing test cases', async () => {
  const problem = problems.find(({ slug }) => slug === 'two-sum')
  Problem.findOne = () => ({
    select: () => ({
      lean: async () => ({ ...problem, _id: 'problem-id' }),
    }),
  })
  Submission.exists = async () => false

  const response = {
    body: null,
    json(body) {
      this.body = body
      return this
    },
  }
  await getProblem({ params: { slug: 'two-sum' } }, response)

  assert.equal(response.body.problem.sampleTestCount, 3)
  assert.equal(Object.hasOwn(response.body.problem, 'testCases'), false)
})

test('problem details work for existing users without stored bookmark data', async () => {
  const problem = problems.find(({ slug }) => slug === 'two-sum')
  Problem.findOne = () => ({
    select: () => ({
      lean: async () => ({ ...problem, _id: 'problem-id' }),
    }),
  })
  Submission.exists = async () => false
  User.findById = () => ({ select: () => ({ lean: async () => ({}) }) })
  const response = { json(body) { this.body = body; return this } }
  await getProblem({ params: { slug: 'two-sum' }, user: { _id: 'user-id' } }, response)
  assert.equal(response.body.problem.bookmarked, false)
  assert.equal(response.body.problem.sampleTestCount, 3)
})

test('problem submission history is scoped to the current user and excludes source code', async () => {
  Problem.exists = async (query) => {
    assert.deepEqual(query, { slug: 'two-sum' })
    return true
  }
  const submissions = [{ _id: 'attempt-id', verdict: 'Wrong Answer', language: 'python' }]
  Submission.find = (query) => {
    assert.deepEqual(query, { user: 'user-id', problemSlug: 'two-sum' })
    return {
      select(selection) {
        assert.match(selection, /verdict/)
        assert.doesNotMatch(selection, /sourceCode/)
        return this
      },
      sort(order) {
        assert.deepEqual(order, { createdAt: -1 })
        return this
      },
      limit(count) {
        assert.equal(count, 50)
        return this
      },
      lean: async () => submissions,
    }
  }
  const response = { body: null, json(body) { this.body = body; return this } }
  await listProblemSubmissions({ params: { slug: 'two-sum' }, user: { _id: 'user-id' } }, response)
  assert.deepEqual(response.body, { submissions })
})

test('custom test runs user input and compares expected output', async () => {
  Problem.exists = async () => true
  globalThis.fetch = async (_url, options) => {
    if (options.method === 'POST') {
      const request = JSON.parse(options.body)
      assert.equal(request.stdin, '5 14\n1 5 8 2 9')
      return Response.json({ token: 'custom-input-token' }, { status: 201 })
    }
    return Response.json({ status: { id: 3 }, stdout: '1 4\n', time: '0.02' })
  }

  const response = {
    body: null,
    json(body) {
      this.body = body
      return this
    },
  }
  await runCustomTest({
    params: { problemId: 'problem-id' },
    body: {
      code: 'solution',
      language: 'cpp',
      input: '5 14\n1 5 8 2 9',
      expectedOutput: '1 4',
    },
  }, response)

  assert.equal(response.body.result.verdict, 'Accepted')
  assert.equal(response.body.result.output, '1 4\n')
  assert.equal(response.body.result.matchesExpected, true)
})

test('expanded problem set has language starters and unambiguous evaluation cases', () => {
  const slugs = [...problems, ...additionalProblems].map(({ slug }) => slug)
  assert.equal(new Set(slugs).size, slugs.length)
  for (const problem of additionalProblems) {
    assert.deepEqual(Object.keys(problem.starterCode).sort(), ['cpp', 'java', 'python'])
    assert.ok(problem.hints.length > 0)
    assert.ok(problem.testCases.some(({ isHidden }) => !isHidden))
    assert.ok(problem.testCases.some(({ isHidden }) => isHidden))
    assert.ok(problem.testCases.every(({ input, output }) => typeof input === 'string' && typeof output === 'string'))
  }
})

test('progressive hint endpoint returns only the requested hint', async () => {
  Problem.findById = () => ({
    select: () => ({
      lean: async () => ({ hints: ['First hint', 'Second hint', 'Third hint'] }),
    }),
  })
  const response = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this },
  }
  await getProblemHint({ params: { id: 'problem-id', index: '1' } }, response)
  assert.deepEqual(response.body, { hint: 'Second hint' })
  assert.equal(Object.hasOwn(response.body, 'hints'), false)
})

test('bookmark toggle persists the requested problem for the current user', async () => {
  Problem.exists = async () => ({ _id: 'problem-id' })
  const bookmarkIds = []
  bookmarkIds.addToSet = (id) => bookmarkIds.push(id)
  const user = {
    bookmarks: bookmarkIds,
    save: async () => {},
  }
  User.findById = () => ({ select: async () => user })
  const response = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this },
  }
  await toggleBookmark({ params: { id: 'problem-id' }, user: { _id: 'user-id' } }, response)
  assert.deepEqual(response.body, { bookmarked: true })
  assert.deepEqual([...bookmarkIds], ['problem-id'])
})

test('dashboard tracks unique UTC solves per day and consecutive active days', async () => {
  const today = new Date()
  today.setUTCHours(12, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  Submission.countDocuments = async ({ verdict }) => verdict === 'Accepted' ? 3 : 4
  Submission.distinct = async () => ['problem-a', 'problem-b']
  Submission.find = (query) => ({
    select: (selection) => selection === 'problem createdAt'
      ? { lean: async () => [
        { problem: 'problem-a', createdAt: today },
        { problem: 'problem-a', createdAt: today },
        { problem: 'problem-b', createdAt: today },
        { problem: 'problem-a', createdAt: yesterday },
      ] }
      : { sort: () => ({ limit: () => ({ lean: async () => [] }) }) },
  })
  User.findById = () => ({ select: () => ({ lean: async () => ({ dailyGoal: 3 }) }) })
  const response = {
    body: null,
    json(body) { this.body = body; return this },
  }
  await getDashboard({ user: { _id: 'user-id' } }, response)
  assert.deepEqual(response.body.dailyProgress, { solved: 2, goal: 3, streak: 2, timezone: 'UTC' })
})

test('daily goal preferences reject out-of-range values and persist valid goals', async () => {
  let savedGoal
  User.findByIdAndUpdate = (_id, update, options) => ({
    select: async () => {
      savedGoal = update.$set.dailyGoal
      assert.equal(options.runValidators, true)
      return { dailyGoal: savedGoal }
    },
  })
  const response = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this },
  }
  await updateDashboardPreferences({ user: { _id: 'user-id' }, body: { dailyGoal: 11 } }, response)
  assert.equal(response.statusCode, 400)
  await updateDashboardPreferences({ user: { _id: 'user-id' }, body: { dailyGoal: 4 } }, response)
  assert.equal(savedGoal, 4)
  assert.deepEqual(response.body, { dailyGoal: 4 })
})

test('debugging dojo public endpoints never return hidden tests or the solution note', async () => {
  const response = { json(body) { this.body = body; return this } }
  await listDebuggingChallenges({}, response)
  assert.equal(response.body.challenges.length, debuggingChallenges.length)
  assert.equal(Object.hasOwn(response.body.challenges[0], 'testCases'), false)
  assert.equal(Object.hasOwn(response.body.challenges[0], 'solutionNote'), false)

  await getDebuggingChallenge({ params: { slug: debuggingChallenges[0].slug } }, response)
  assert.equal(response.body.challenge.title, debuggingChallenges[0].title)
  assert.equal(Object.hasOwn(response.body.challenge, 'testCases'), false)
  assert.equal(Object.hasOwn(response.body.challenge, 'solutionNote'), false)
})

test('debugging dojo evaluates the fixed code while keeping hidden case details private', async () => {
  const challenge = debuggingChallenges[0]
  const outputByInput = new Map(challenge.testCases.map(({ input, output }) => [input, output]))
  const outputs = new Map()
  let tokenNumber = 0
  globalThis.fetch = async (url, options) => {
    const requestUrl = new URL(url)
    if (options.method === 'POST') {
      const { stdin } = JSON.parse(options.body)
      const token = `dojo-${++tokenNumber}`
      outputs.set(token, outputByInput.get(stdin))
      return Response.json({ token }, { status: 201 })
    }
    const token = requestUrl.pathname.split('/').at(-1)
    return Response.json({ status: { id: 3 }, stdout: `${outputs.get(token)}\n`, time: '0.01' })
  }
  const response = { json(body) { this.body = body; return this } }
  await runDebuggingChallenge({
    params: { slug: challenge.slug },
    body: { code: 'fixed solution', language: 'python' },
  }, response)
  assert.equal(response.body.verdict, 'Accepted')
  assert.equal(response.body.results.length, challenge.testCases.length)
  const hiddenResult = response.body.results.at(-1)
  assert.equal(hiddenResult.hidden, true)
  assert.equal(Object.hasOwn(hiddenResult, 'input'), false)
  assert.equal(Object.hasOwn(hiddenResult, 'expectedOutput'), false)
  assert.equal(Object.hasOwn(hiddenResult, 'output'), false)
  assert.equal(response.body.solutionNote, challenge.solutionNote)
})

test('submission reflection is saved only for the owning user accepted attempt', async () => {
  let updateFilter
  let updateDocument
  Submission.findOneAndUpdate = (filter, update) => {
    updateFilter = filter
    updateDocument = update
    return { select: async () => ({ reflection: {
      approach: update.$set['reflection.approach'],
      complexity: update.$set['reflection.complexity'],
      alternative: update.$set['reflection.alternative'],
      updatedAt: update.$set['reflection.updatedAt'],
    } }) }
  }
  const response = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this },
  }
  await saveSubmissionReflection({
    params: { id: 'submission-id' },
    user: { _id: 'owner-id' },
    body: { approach: '  Hash map  ', complexity: 'O(n)', alternative: 'Sort first' },
  }, response)
  assert.deepEqual(updateFilter, { _id: 'submission-id', user: 'owner-id', verdict: 'Accepted' })
  assert.equal(updateDocument.$set['reflection.approach'], 'Hash map')
  assert.equal(updateDocument.$set['reflection.complexity'], 'O(n)')
  assert.equal(updateDocument.$set['reflection.alternative'], 'Sort first')
  assert.equal(response.body.reflection.updatedAt instanceof Date, true)
})

test('submission reflection rejects oversized content and non-accepted attempts', async () => {
  let updateCalled = false
  Submission.findOneAndUpdate = async () => { updateCalled = true }
  const response = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this },
  }
  await saveSubmissionReflection({
    params: { id: 'submission-id' },
    user: { _id: 'owner-id' },
    body: { approach: 'x'.repeat(2001), complexity: '', alternative: '' },
  }, response)
  assert.equal(response.statusCode, 400)
  assert.equal(updateCalled, false)

  Submission.findOneAndUpdate = () => ({ select: async () => null })
  Submission.exists = async () => true
  await saveSubmissionReflection({
    params: { id: 'submission-id' },
    user: { _id: 'owner-id' },
    body: { approach: '', complexity: '', alternative: '' },
  }, response)
  assert.equal(response.statusCode, 400)
  assert.equal(response.body.message, 'Reflections are available for accepted submissions.')
})

test('edge-case generators only return documented public inputs', () => {
  const cases = generateEdgeCases('binary-search')
  assert.equal(cases.length, 3)
  assert.ok(cases.every(({ input, focus }) => typeof input === 'string' && typeof focus === 'string'))
  assert.equal(generateEdgeCases('not-a-problem'), null)
})

test('weak-spot map aggregates only the current user submission topics', async () => {
  Submission.find = () => ({
    select: () => ({
      populate: () => ({
        lean: async () => [
          { verdict: 'Accepted', problem: { topics: ['Array', 'Hash Table'] } },
          { verdict: 'Wrong Answer', problem: { topics: ['Array'] } },
          { verdict: 'Compilation Error', problem: { topics: ['Hash Table'] } },
          { verdict: 'Accepted', problem: null },
        ],
      }),
    }),
  })
  const response = { json(body) { this.body = body; return this } }
  await getWeakSpotMap({ user: { _id: 'current-user' } }, response)
  assert.deepEqual(response.body.topics.map(({ topic, attempts, accepted, needsReview }) => ({
    topic, attempts, accepted, needsReview,
  })), [
    { topic: 'Array', attempts: 2, accepted: 1, needsReview: 1 },
    { topic: 'Hash Table', attempts: 2, accepted: 1, needsReview: 1 },
  ])
})

test('learning journal returns only the owner accepted attempts with reflection text', async () => {
  let query
  let selected
  Submission.find = (value) => {
    query = value
    return {
      select: (fields) => {
        selected = fields
        return { sort: () => ({ limit: () => ({ lean: async () => [{ _id: 'owned-entry' }] }) }) }
      },
    }
  }
  const response = { json(body) { this.body = body; return this } }
  await getLearningJournal({ user: { _id: 'current-user' } }, response)
  assert.equal(query.user, 'current-user')
  assert.equal(query.verdict, 'Accepted')
  assert.equal(query.$or.length, 3)
  assert.equal(query.$or[0]['reflection.approach'].$exists, true)
  assert.match(selected, /reflection/)
  assert.deepEqual(response.body.entries, [{ _id: 'owned-entry' }])
})
