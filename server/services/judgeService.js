const LANGUAGE_IDS = { cpp: 54, java: 62, python: 71 }
const DEFAULT_JUDGE0_URL = 'https://ce.judge0.com'
const POLL_INTERVAL_MS = 1000
const EXECUTION_TIMEOUT_MS = 45000
const REQUEST_TIMEOUT_MS = 10000

function normalizeOutput(value) {
  return (typeof value === 'string' ? value : '')
    .trim()
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
}

function judgeError(message, status) {
  return Object.assign(new Error(message), { status })
}

async function requestJudge(url, options) {
  try {
    return await fetch(url, { ...options, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw judgeError('Judge0 did not respond in time. Please try again.', 504)
    }
    throw judgeError('Could not connect to the free Judge0 service. Please try again.', 502)
  }
}

async function readJson(response) {
  try {
    return await response.json()
  } catch {
    throw judgeError('Judge0 returned an invalid response. Please try again.', 502)
  }
}

function serviceError(response) {
  if (response.status === 429) {
    return judgeError('The free Judge0 service is rate-limited right now. Please wait a moment and try again.', 503)
  }
  if (response.status >= 500) {
    return judgeError('The free Judge0 service is temporarily unavailable. Please try again.', 502)
  }
  return judgeError(`The Judge0 request failed with status ${response.status}.`, 502)
}

async function execute(sourceCode, language, input) {
  const baseUrl = (process.env.JUDGE0_URL || DEFAULT_JUDGE0_URL).replace(/\/+$/, '')
  const headers = { 'Content-Type': 'application/json' }
  const response = await requestJudge(
    `${baseUrl}/submissions?base64_encoded=false&wait=false`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        source_code: sourceCode,
        language_id: LANGUAGE_IDS[language],
        stdin: input,
        cpu_time_limit: 5,
        wall_time_limit: 10,
      }),
    },
  )

  if (!response.ok) throw serviceError(response)
  const submission = await readJson(response)
  if (typeof submission.token !== 'string' || !submission.token) {
    throw judgeError('Judge0 did not return a submission token. Please try again.', 502)
  }

  const deadline = Date.now() + EXECUTION_TIMEOUT_MS
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
    if (Date.now() >= deadline) break

    const resultResponse = await requestJudge(
      `${baseUrl}/submissions/${encodeURIComponent(submission.token)}?base64_encoded=false`,
      { headers },
    )
    if (resultResponse.status === 429 || resultResponse.status >= 500) continue
    if (!resultResponse.ok) throw serviceError(resultResponse)

    const result = await readJson(resultResponse)
    const statusId = result.status?.id
    if (statusId === 1 || statusId === 2) continue
    if (Number.isInteger(statusId) && statusId >= 3) return result
    throw judgeError('Judge0 returned an unexpected execution status.', 502)
  }

  throw judgeError('Judge0 took too long to finish. Please try again.', 504)
}

function verdictFor(result) {
  const statusId = result.status?.id
  if (statusId === 3) return 'Accepted'
  if (statusId === 4) return 'Wrong Answer'
  if (statusId === 5) return 'Time Limit Exceeded'
  if (statusId === 6) return 'Compilation Error'
  if ([7, 8, 9, 10, 11, 12, 14].includes(statusId)) return 'Runtime Error'
  if (statusId === 13) return 'Internal Error'
  throw judgeError('Judge0 returned an unexpected execution result.', 502)
}

function validateSourceCode(sourceCode, language) {
  if (!LANGUAGE_IDS[language]) throw judgeError('Choose a supported language.', 400)
  if (typeof sourceCode !== 'string' || sourceCode.trim().length === 0 || sourceCode.length > 20000) {
    throw judgeError('Code must contain between 1 and 20,000 characters.', 400)
  }
}

export async function evaluateCode(sourceCode, language, testCases) {
  validateSourceCode(sourceCode, language)

  const results = []
  for (const testCase of testCases) {
    const result = await execute(sourceCode, language, testCase.input)
    const verdict = verdictFor(result)
    results.push({
      verdict: verdict === 'Accepted' && normalizeOutput(result.stdout) === normalizeOutput(testCase.output)
        ? 'Accepted'
        : verdict === 'Accepted' ? 'Wrong Answer' : verdict,
      time: Number.parseFloat(result.time) || 0,
      ...(result.compile_output ? { compileOutput: result.compile_output.slice(0, 2000) } : {}),
      ...(result.stderr ? { stderr: result.stderr.slice(0, 2000) } : {}),
      ...(result.stdout ? { output: result.stdout.slice(0, 2000) } : {}),
    })
    if (results.at(-1).verdict !== 'Accepted') break
  }
  return results
}

export async function runCustomCode(sourceCode, language, input, expectedOutput) {
  validateSourceCode(sourceCode, language)
  if (typeof input !== 'string' || input.length > 10000) {
    throw judgeError('Custom input must be a string no longer than 10,000 characters.', 400)
  }
  if (expectedOutput !== undefined && (typeof expectedOutput !== 'string' || expectedOutput.length > 10000)) {
    throw judgeError('Expected output must be a string no longer than 10,000 characters.', 400)
  }

  const result = await execute(sourceCode, language, input)
  const verdict = verdictFor(result)
  const output = typeof result.stdout === 'string' ? result.stdout : ''
  return {
    verdict,
    output,
    ...(typeof expectedOutput === 'string'
      ? { matchesExpected: verdict === 'Accepted' && normalizeOutput(output) === normalizeOutput(expectedOutput) }
      : {}),
    time: Number.parseFloat(result.time) || 0,
    ...(result.compile_output ? { compileOutput: result.compile_output.slice(0, 2000) } : {}),
    ...(result.stderr ? { stderr: result.stderr.slice(0, 2000) } : {}),
  }
}
