import { useCallback, useEffect, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import { ArrowLeft, Bookmark, Check, ChevronDown, CirclePlay, Clock3, Code2, FileCode2, LoaderCircle, Minus, Plus, RotateCcw, Send, Terminal, WrapText } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../services/api'
import ThemeToggle from '../components/ThemeToggle'
import { useTheme } from '../context/useTheme'

const LANGUAGES = {
  python: { label: 'Python 3', monaco: 'python' },
  java: { label: 'Java', monaco: 'java' },
  cpp: { label: 'C++', monaco: 'cpp' },
}
const SETTINGS_KEY = 'codementor-editor-settings'

function getEditorSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
    return {
      fontSize: [12, 14, 16, 18].includes(stored.fontSize) ? stored.fontSize : 14,
      wordWrap: typeof stored.wordWrap === 'boolean' ? stored.wordWrap : true,
    }
  } catch {
    return { fontSize: 14, wordWrap: true }
  }
}

export default function Workspace() {
  const { slug } = useParams()
  const { theme } = useTheme()
  const [problem, setProblem] = useState(null)
  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [activeTab, setActiveTab] = useState('description')
  const [result, setResult] = useState(null)
  const [customInput, setCustomInput] = useState('')
  const [expectedOutput, setExpectedOutput] = useState('')
  const [customResult, setCustomResult] = useState(null)
  const [edgeCases, setEdgeCases] = useState([])
  const [loadingEdgeCases, setLoadingEdgeCases] = useState(false)
  const [submissions, setSubmissions] = useState([])
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  const [loadingSubmissionCode, setLoadingSubmissionCode] = useState(false)
  const [error, setError] = useState('')
  const [revealedHints, setRevealedHints] = useState([])
  const [loadingHint, setLoadingHint] = useState(false)
  const [editorSettings, setEditorSettings] = useState(getEditorSettings)
  const executeRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    api(`/problems/${slug}`)
      .then(({ problem: nextProblem }) => {
        if (cancelled) return
        setError('')
        setProblem(nextProblem)
        setRevealedHints([])
        setResult(null)
        const key = `codementor:${slug}:python`
        setCode(localStorage.getItem(key) || nextProblem.starterCode?.python || '')
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [slug])

  function changeLanguage(nextLanguage) {
    if (problem) {
      localStorage.setItem(`codementor:${slug}:${language}`, code)
      setCode(localStorage.getItem(`codementor:${slug}:${nextLanguage}`) || problem.starterCode?.[nextLanguage] || '')
    }
    setLanguage(nextLanguage)
    setResult(null)
  }

  function changeCode(nextCode) {
    setCode(nextCode || '')
    localStorage.setItem(`codementor:${slug}:${language}`, nextCode || '')
    setCustomResult(null)
  }

  const execute = useCallback(async (mode) => {
    if (!problem || running) return
    setRunning(true)
    setError('')
    setActiveTab('results')
    setResult(null)
    try {
      const { submission, results, passedTests, totalTests } = await api(`/submissions/${mode}/${problem._id}`, {
        method: 'POST',
        body: JSON.stringify({ code, language }),
      })
      setResult(mode === 'submit'
        ? {
          verdict: submission.verdict,
          passedTests: submission.passedTests,
          totalTests: submission.totalTests,
          failedTest: submission.failedTest,
          diagnostic: submission.diagnostic,
          time: submission.executionTime,
          submissionId: submission.id,
          submitted: true,
        }
        : { verdict: results.find((test) => test.verdict !== 'Accepted')?.verdict || 'Accepted', passedTests, totalTests, results, submitted: false })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setRunning(false)
    }
  }, [code, language, problem, running])
  useEffect(() => {
    executeRef.current = execute
  }, [execute])

  function updateEditorSettings(nextSettings) {
    setEditorSettings(nextSettings)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(nextSettings))
  }

  function onEditorMount(editor, monaco) {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => executeRef.current?.('run'))
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => executeRef.current?.('submit'))
  }

  async function toggleProblemBookmark() {
    try {
      const { bookmarked } = await api(`/problems/${problem._id}/bookmark`, { method: 'POST' })
      setProblem((current) => ({ ...current, bookmarked }))
      setError('')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function revealNextHint() {
    setLoadingHint(true)
    try {
      const { hint } = await api(`/problems/${problem._id}/hints/${revealedHints.length}`)
      setRevealedHints((current) => [...current, hint])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoadingHint(false)
    }
  }

  async function executeCustom() {
    setRunning(true)
    setError('')
    setCustomResult(null)
    try {
      const { result: nextResult } = await api(`/submissions/run-custom/${problem._id}`, {
        method: 'POST',
        body: JSON.stringify({
          code,
          language,
          input: customInput,
          ...(expectedOutput.length ? { expectedOutput } : {}),
        }),
      })
      setCustomResult(nextResult)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setRunning(false)
    }
  }

  async function loadEdgeCases() {
    setLoadingEdgeCases(true)
    setError('')
    try {
      const { cases } = await api(`/problems/${slug}/edge-cases`)
      setEdgeCases(cases)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoadingEdgeCases(false)
    }
  }

  async function openSubmissionHistory() {
    setActiveTab('submissions')
    setError('')
    setLoadingSubmissions(true)
    setSelectedSubmission(null)
    try {
      const { submissions: attempts } = await api(`/problems/${slug}/submissions`)
      setSubmissions(attempts)
    } catch (requestError) {
      setError(requestError.message)
      setSubmissions([])
    } finally {
      setLoadingSubmissions(false)
    }
  }

  async function showSubmissionCode(submissionId) {
    setLoadingSubmissionCode(true)
    setError('')
    try {
      const { submission } = await api(`/submissions/${submissionId}`)
      setSelectedSubmission(submission)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoadingSubmissionCode(false)
    }
  }

  if (loading || (!error && problem?.slug !== slug)) return <div className="page-loading"><LoaderCircle className="spin" /> Loading workspace…</div>
  if (!problem || problem.slug !== slug) return <div className="page-shell"><div className="alert-error">{error || 'Problem not found.'}</div><Link className="text-link" to="/problems">Back to problems</Link></div>

  return (
    <main className="workspace">
      <header className="workspace-topbar">
        <Link className="workspace-back" to="/problems"><ArrowLeft size={16} /><span>Problems</span></Link>
        <span className="workspace-title">{problem.title}</span>
        <div className="workspace-top-right"><span className="save-status"><Check size={14} /> Saved locally</span><span className="language-chip">● &nbsp;{LANGUAGES[language].label}</span><ThemeToggle /></div>
      </header>
      {error && <div role="alert" className="workspace-error">{error}</div>}
      <div className="workspace-grid">
        <section className="problem-pane">
          <div className="pane-tabs">
            <button className={activeTab === 'description' ? 'pane-tab active' : 'pane-tab'} onClick={() => setActiveTab('description')}><Code2 size={15} /> Description</button>
            <button className={activeTab === 'results' ? 'pane-tab active' : 'pane-tab'} onClick={() => setActiveTab('results')}><Terminal size={15} /> Test results</button>
            <button className={activeTab === 'custom' ? 'pane-tab active' : 'pane-tab'} onClick={() => setActiveTab('custom')}><CirclePlay size={15} /> Custom input</button>
            <button className={activeTab === 'submissions' ? 'pane-tab active' : 'pane-tab'} onClick={openSubmissionHistory}><FileCode2 size={15} /> Submissions</button>
          </div>
          <div className="problem-scroll">
            {activeTab === 'description' ? (
              <>
                <div className="problem-heading"><span className={`difficulty difficulty-${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span><span className="problem-acceptance">{problem.acceptance}% acceptance</span></div>
                <h1>{problem.title}</h1>
                <div className="topic-list">{problem.topics?.map((topic) => <span className="topic-tag" key={topic}>{topic}</span>)}</div>
                <p className="problem-description">{problem.description}</p>
                {problem.hintCount > 0 && <section className="hint-panel"><div className="hint-panel-heading"><h3 className="section-title">Progressive hints</h3><span>{revealedHints.length}/{problem.hintCount} revealed</span></div>
                  {revealedHints.length > 0 && <ol aria-live="polite">{revealedHints.map((hint, index) => <li key={index}>{hint}</li>)}</ol>}
                  {revealedHints.length < problem.hintCount && <button className="button button-outline" disabled={loadingHint} onClick={revealNextHint}>{loadingHint ? 'Loading hint…' : `Reveal hint ${revealedHints.length + 1}`}</button>}
                </section>}
                <h3 className="section-title">Examples</h3>
                {problem.examples?.map((example, index) => (
                  <div className="example-block" key={index}>
                    <strong>Example {index + 1}</strong>
                    <div className="example-io"><span>Input</span><code>{example.input}</code><span>Output</span><code>{example.output}</code></div>
                    {example.explanation && <p><b>Explanation:</b> {example.explanation}</p>}
                  </div>
                ))}
                <h3 className="section-title">Constraints</h3>
                <ul className="constraints-list">{problem.constraints?.map((constraint) => <li key={constraint}><code>{constraint}</code></li>)}</ul>
              </>
            ) : activeTab === 'results' ? (
              <div className="results-panel">
                <div className="results-heading"><div className="result-icon"><Terminal size={19} /></div><div><h2>{result ? result.verdict : 'Ready when you are'}</h2><p>{result ? `${result.passedTests} of ${result.totalTests} test cases passed` : 'Run your code to see how it performs against the sample cases.'}</p></div></div>
                {running && <div className="run-loading"><LoaderCircle className="spin" size={18} /> Running against {problem.sampleTestCount} sample tests…</div>}
                {error && <div className="alert-error">{error}</div>}
                {result && <div className="result-stats"><span><Check size={15} /> {result.passedTests}/{result.totalTests} passed</span><span><Clock3 size={15} /> {result.time}s</span></div>}
                {result?.submitted && result.verdict !== 'Accepted' && (
                  <div className={`test-result ${result.verdict === 'Wrong Answer' ? 'test-fail' : 'test-result-info'}`}>
                    <div><strong>{result.failedTest ? `Test case ${result.failedTest}` : 'Submission result'}</strong><span>{result.verdict}</span></div>
                    <p className="diagnostic-hint">
                      {result.verdict === 'Wrong Answer'
                        ? 'The output for this test case did not match the expected answer.'
                        : result.verdict === 'Compilation Error'
                          ? 'Check the compiler message below and fix the reported error.'
                          : 'Review the program output and execution details below.'}
                    </p>
                    {result.diagnostic && <pre>{result.diagnostic}</pre>}
                  </div>
                )}
                {result?.results?.map((test, index) => <div className={`test-result ${test.verdict === 'Accepted' ? 'test-pass' : 'test-fail'}`} key={index}><div><strong>{test.verdict === 'Accepted' ? '✓' : '×'} &nbsp;Test case {index + 1}</strong><span>{test.verdict}</span></div>{test.output && <pre>Output: {test.output}</pre>}{test.stderr && <pre>{test.stderr}</pre>}{test.compileOutput && <pre>{test.compileOutput}</pre>}</div>)}
                {result?.submitted && result.verdict === 'Accepted' && <div className="success-note"><p>Nice work! Your solution has been saved to submissions.</p><Link className="button button-outline" to={`/submissions/${result.submissionId}`}>Reflect on this solution</Link></div>}
              </div>
            ) : activeTab === 'custom' ? (
              <div className="custom-test-panel">
                <div className="results-heading"><div className="result-icon"><CirclePlay size={19} /></div><div><h2>Try your own test</h2><p>Enter stdin to run your code. Expected output is optional.</p></div></div>
                <div className="edge-case-tools"><button type="button" className="button button-outline" disabled={loadingEdgeCases} onClick={loadEdgeCases}>{loadingEdgeCases ? 'Generating…' : 'Generate edge cases'}</button><span>Public practice inputs only; no hidden judge cases are used.</span></div>
                {edgeCases.length > 0 && <div className="edge-case-list">{edgeCases.map((item, index) => <button type="button" className="edge-case-item" key={`${index}-${item.input}`} onClick={() => { setCustomInput(item.input); setExpectedOutput(''); setCustomResult(null) }}><strong>Case {index + 1}</strong><span>{item.focus}</span><code>{item.input}</code><small>Use input</small></button>)}</div>}
                <label className="custom-field">Custom input<textarea value={customInput} onChange={(event) => { setCustomInput(event.target.value); setCustomResult(null) }} maxLength={10000} placeholder={'Example:\\n4 9\\n2 7 11 15'} spellCheck="false" /></label>
                <label className="custom-field">Expected output <span className="optional-label">optional</span><textarea value={expectedOutput} onChange={(event) => { setExpectedOutput(event.target.value); setCustomResult(null) }} maxLength={10000} placeholder="Enter expected output to compare" spellCheck="false" /></label>
                {error && <div role="alert" className="alert-error">{error}</div>}
                <button type="button" className="button button-primary custom-run-button" disabled={running || !code.trim()} onClick={executeCustom}>
                  {running ? <LoaderCircle className="spin" size={16} /> : <CirclePlay size={16} />}
                  {running ? 'Running your test…' : 'Run custom test'}
                </button>
                {customResult && (
                  <div className={`custom-output ${customResult.verdict !== 'Accepted' ? 'test-fail' : ''}`}>
                    <div className="custom-output-heading"><strong>{customResult.verdict}</strong><span>{customResult.time}s</span></div>
                    {customResult.matchesExpected !== undefined && <p className={customResult.matchesExpected ? 'custom-match' : 'custom-mismatch'}>{customResult.matchesExpected ? 'Output matches the expected result.' : 'Output does not match the expected result.'}</p>}
                    <span className="custom-output-label">Program output</span>
                    <pre>{customResult.output || '(no output)'}</pre>
                    {customResult.compileOutput && <><span className="custom-output-label">Compiler output</span><pre>{customResult.compileOutput}</pre></>}
                    {customResult.stderr && <><span className="custom-output-label">Standard error</span><pre>{customResult.stderr}</pre></>}
                  </div>
                )}
              </div>
            ) : (
              <div className="problem-submissions-panel">
                <div className="results-heading"><div className="result-icon"><FileCode2 size={19} /></div><div><h2>Your attempts</h2><p>Previous submissions for {problem.title}, newest first.</p></div></div>
                {loadingSubmissions ? <div className="loading-inline"><LoaderCircle className="spin" size={16} /> Loading submissions…</div>
                  : submissions.length === 0 ? <div className="empty-state compact"><div className="empty-icon"><FileCode2 size={18} /></div><h3>No submissions for this problem yet</h3><p>Submit your solution and your verdict and code will appear here.</p></div>
                    : <div className="problem-attempt-list">{submissions.map((submission) => (
                      <button type="button" className={selectedSubmission?._id === submission._id ? 'problem-attempt active' : 'problem-attempt'} key={submission._id} onClick={() => showSubmissionCode(submission._id)}>
                        <span className={submission.verdict === 'Accepted' ? 'recent-verdict accepted' : 'recent-verdict'}>{submission.verdict === 'Accepted' ? <Check size={14} /> : <span>×</span>}</span>
                        <span className="problem-attempt-main"><strong>{submission.verdict}</strong><small>{submission.language} · {new Date(submission.createdAt).toLocaleString()}</small></span>
                        <span className="problem-attempt-count">{submission.passedTests}/{submission.totalTests}</span>
                      </button>
                    ))}</div>}
                {loadingSubmissionCode && <div className="loading-inline"><LoaderCircle className="spin" size={16} /> Loading submitted code…</div>}
                {selectedSubmission && !loadingSubmissionCode && <section className="selected-attempt-code">
                  <div className="selected-attempt-heading"><div><strong>{selectedSubmission.verdict}</strong><span>{selectedSubmission.language} · {new Date(selectedSubmission.createdAt).toLocaleString()}</span></div><Link className="subtle-link" to={`/submissions/${selectedSubmission._id}`}>View details</Link></div>
                  <pre aria-label="Submitted source code">{selectedSubmission.sourceCode}</pre>
                  {selectedSubmission.diagnostic && <details><summary>Execution details</summary><pre>{selectedSubmission.diagnostic}</pre></details>}
                </section>}
              </div>
            )}
          </div>
        </section>
        <section className="editor-pane">
          <div className="editor-toolbar">
            <label className="language-select"><Code2 size={15} /><select aria-label="Programming language" value={language} onChange={(event) => changeLanguage(event.target.value)}>{Object.entries(LANGUAGES).map(([key, value]) => <option value={key} key={key}>{value.label}</option>)}</select><ChevronDown size={14} /></label>
            <div className="editor-preferences">
              <button className="icon-button" title="Decrease editor font size" aria-label="Decrease editor font size" disabled={editorSettings.fontSize <= 12} onClick={() => updateEditorSettings({ ...editorSettings, fontSize: Math.max(12, editorSettings.fontSize - 2) })}><Minus size={14} /></button>
              <span className="font-size-label" aria-live="polite">{editorSettings.fontSize}px</span>
              <button className="icon-button" title="Increase editor font size" aria-label="Increase editor font size" disabled={editorSettings.fontSize >= 18} onClick={() => updateEditorSettings({ ...editorSettings, fontSize: Math.min(18, editorSettings.fontSize + 2) })}><Plus size={14} /></button>
              <button className={editorSettings.wordWrap ? 'icon-button active' : 'icon-button'} title="Toggle word wrap" aria-label={`Turn word wrap ${editorSettings.wordWrap ? 'off' : 'on'}`} aria-pressed={editorSettings.wordWrap} onClick={() => updateEditorSettings({ ...editorSettings, wordWrap: !editorSettings.wordWrap })}><WrapText size={15} /></button>
              <button className={problem.bookmarked ? 'icon-button active' : 'icon-button'} title={problem.bookmarked ? 'Remove from saved problems' : 'Save problem'} aria-label={problem.bookmarked ? 'Remove from saved problems' : 'Save problem'} onClick={toggleProblemBookmark}><Bookmark size={15} fill={problem.bookmarked ? 'currentColor' : 'none'} /></button>
              <button className="icon-button" title="Reset starter code" aria-label="Reset starter code" onClick={() => { setCode(problem.starterCode?.[language] || ''); localStorage.removeItem(`codementor:${slug}:${language}`) }}><RotateCcw size={15} /></button>
            </div>
          </div>
          <div className="editor-surface">
            <Editor height="100%" language={LANGUAGES[language].monaco} theme={theme === 'dark' ? 'vs-dark' : 'vs'} value={code} onChange={changeCode} onMount={onEditorMount} options={{ fontSize: editorSettings.fontSize, fontFamily: 'JetBrains Mono, Consolas, monospace', minimap: { enabled: false }, padding: { top: 20 }, scrollBeyondLastLine: false, automaticLayout: true, tabSize: 4, wordWrap: editorSettings.wordWrap ? 'on' : 'off', lineNumbersMinChars: 3, renderLineHighlight: 'all' }} />
          </div>
          <footer className="editor-footer">
            <div className="editor-meta"><span><span className="online-dot" /> Ready</span><span>Ln {code.split('\n').length}, Col 1</span><span className="keyboard-hint">Ctrl/⌘ Enter: Run · Ctrl/⌘ Shift Enter: Submit</span></div>
            <div className="editor-actions"><button className="button button-outline" disabled={running} onClick={() => execute('run')}><CirclePlay size={16} /> Run</button><button className="button button-primary" disabled={running || !code.trim()} onClick={() => execute('submit')}>{running ? <LoaderCircle className="spin" size={16} /> : <Send size={15} />} Submit</button></div>
          </footer>
        </section>
      </div>
    </main>
  )
}
