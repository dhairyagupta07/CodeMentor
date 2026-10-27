import { debuggingChallenges } from '../data/debuggingChallenges.js'
import { evaluateCode } from '../services/judgeService.js'

const publicChallenge = ({ testCases, solutionNote, ...challenge }) => ({
  ...challenge,
  testCount: testCases.length,
})

export async function listDebuggingChallenges(_req, res) {
  res.json({ challenges: debuggingChallenges.map(publicChallenge) })
}

export async function getDebuggingChallenge(req, res) {
  const challenge = debuggingChallenges.find(({ slug }) => slug === req.params.slug)
  if (!challenge) return res.status(404).json({ message: 'Debugging challenge not found.' })
  res.json({ challenge: publicChallenge(challenge) })
}

export async function runDebuggingChallenge(req, res) {
  const challenge = debuggingChallenges.find(({ slug }) => slug === req.params.slug)
  if (!challenge) return res.status(404).json({ message: 'Debugging challenge not found.' })

  const { code, language } = req.body
  const results = await evaluateCode(code, language, challenge.testCases)
  const passedTests = results.filter(({ verdict }) => verdict === 'Accepted').length
  const accepted = passedTests === challenge.testCases.length
  res.json({
    verdict: accepted ? 'Accepted' : results.find(({ verdict }) => verdict !== 'Accepted')?.verdict || 'Wrong Answer',
    passedTests,
    totalTests: challenge.testCases.length,
    results: results.map((result, index) => ({
      verdict: result.verdict,
      hidden: Boolean(challenge.testCases[index].isHidden),
      ...(challenge.testCases[index].isHidden ? {} : {
        input: challenge.testCases[index].input,
        expectedOutput: challenge.testCases[index].output,
        output: result.output || '',
      }),
      ...(result.compileOutput ? { compileOutput: result.compileOutput } : {}),
      ...(result.stderr ? { stderr: result.stderr } : {}),
    })),
    ...(accepted ? { solutionNote: challenge.solutionNote } : {}),
  })
}
