import { useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import { Bug, Check, CirclePlay, LoaderCircle, RotateCcw, ShieldCheck, Wrench } from 'lucide-react'
import { api } from '../services/api'
import { useTheme } from '../context/useTheme'

export default function DebuggingDojo() {
  const { theme } = useTheme()
  const [challenges, setChallenges] = useState([])
  const [selectedSlug, setSelectedSlug] = useState('')
  const [challenge, setChallenge] = useState(null)
  const [code, setCode] = useState('')
  const [result, setResult] = useState(null)
  const [loadingList, setLoadingList] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/dojo')
      .then(({ challenges: items }) => {
        setChallenges(items)
        if (items.length) setSelectedSlug(items[0].slug)
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoadingList(false))
  }, [])

  useEffect(() => {
    if (!selectedSlug) return undefined
    let cancelled = false
    api(`/dojo/${selectedSlug}`)
      .then(({ challenge: item }) => {
        if (cancelled) return
        setChallenge(item)
        setCode(item.buggyCode)
        setError('')
      })
      .catch((requestError) => { if (!cancelled) setError(requestError.message) })
    return () => { cancelled = true }
  }, [selectedSlug])

  async function runAttempt() {
    setRunning(true)
    setError('')
    setResult(null)
    try {
      setResult(await api(`/dojo/${selectedSlug}/run`, {
        method: 'POST',
        body: JSON.stringify({ code, language: 'python' }),
      }))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setRunning(false)
    }
  }

  function selectChallenge(slug) {
    setChallenge(null)
    setResult(null)
    setError('')
    setSelectedSlug(slug)
  }

  function resetCode() {
    setCode(challenge.buggyCode)
    setResult(null)
  }

  return (
    <main className="dojo-page">
      <header className="dojo-heading">
        <span className="eyebrow"><Bug size={14} /> DEBUGGING DOJO</span>
        <h1>Find the bug. Fix the idea.</h1>
        <p>Read the behavior, inspect the code, and repair the logic. Your fix runs in Judge0’s isolated environment against public and hidden checks.</p>
        <div className="dojo-safety"><ShieldCheck size={15} /> Hidden test inputs and expected answers stay on the server.</div>
      </header>
      {error && <div role="alert" className="alert-error">{error}</div>}
      <div className="dojo-layout">
        <aside className="dojo-challenge-list" aria-label="Debugging challenges">
          <div className="dojo-list-heading"><span>CHALLENGES</span><strong>{challenges.length}</strong></div>
          {loadingList ? <div className="loading-inline">Loading challenges…</div> : challenges.map((item, index) => (
            <button type="button" className={selectedSlug === item.slug ? 'dojo-challenge active' : 'dojo-challenge'} key={item.slug} onClick={() => selectChallenge(item.slug)}>
              <span className="dojo-index">{String(index + 1).padStart(2, '0')}</span>
              <span><strong>{item.title}</strong><small>{item.category}</small></span>
              <span className={`difficulty difficulty-${item.difficulty.toLowerCase()}`}>{item.difficulty}</span>
            </button>
          ))}
        </aside>
        <section className="dojo-workspace">
          {!selectedSlug && !loadingList ? <div className="empty-state"><div className="empty-icon"><Bug size={20} /></div><h3>No debugging challenges yet</h3><p>Check back after challenges have been added.</p></div> : !challenge || challenge.slug !== selectedSlug ? (error ? <div role="alert" className="alert-error">{error}</div> : <div className="page-loading"><LoaderCircle className="spin" /> Loading challenge…</div>) : <>
            <div className="dojo-prompt"><div className="dojo-prompt-title"><span className="dojo-icon"><Wrench size={17} /></span><div><span className="eyebrow">{challenge.category}</span><h2>{challenge.title}</h2></div></div><p>{challenge.description}</p>
              <h3>Example behavior</h3>
              <div className="dojo-examples">{challenge.examples.map((example, index) => <div className="example-block" key={index}><strong>Example {index + 1}</strong><div className="example-io"><span>Input</span><code>{example.input}</code><span>Expected</span><code>{example.output}</code></div></div>)}</div>
            </div>
            <div className="dojo-editor-heading"><span>Python 3 · edit the buggy solution</span><div><button className="icon-button" title="Reset buggy code" aria-label="Reset buggy code" onClick={resetCode}><RotateCcw size={15} /></button><button type="button" className="button button-primary" disabled={running || !code.trim()} onClick={runAttempt}>{running ? <LoaderCircle className="spin" size={15} /> : <CirclePlay size={15} />}{running ? 'Checking fix…' : 'Check my fix'}</button></div></div>
            <div className="dojo-editor"><Editor height="100%" language="python" theme={theme === 'dark' ? 'vs-dark' : 'vs'} value={code} onChange={(value) => { setCode(value || ''); setResult(null) }} options={{ fontSize: 14, fontFamily: 'JetBrains Mono, Consolas, monospace', minimap: { enabled: false }, padding: { top: 16 }, scrollBeyondLastLine: false, automaticLayout: true, tabSize: 4, wordWrap: 'on', lineNumbersMinChars: 3 }} /></div>
            {result && <section className={`dojo-result ${result.verdict === 'Accepted' ? 'solved' : ''}`} aria-live="polite">
              <div className="dojo-result-heading"><span className="dojo-icon">{result.verdict === 'Accepted' ? <Check size={17} /> : <Bug size={17} />}</span><div><h3>{result.verdict === 'Accepted' ? 'Bug fixed!' : result.verdict}</h3><p>{result.passedTests} of {result.totalTests} checks passed</p></div></div>
              {result.solutionNote && <p className="dojo-solution-note">{result.solutionNote}</p>}
              <div className="dojo-test-list">{result.results.map((test, index) => <div className="dojo-test" key={index}><span className={test.verdict === 'Accepted' ? 'status-dot passed' : 'status-dot failed'} />{test.hidden ? `Hidden check ${index + 1}` : `Example check ${index + 1}`}<strong>{test.verdict}</strong>
                {!test.hidden && test.verdict !== 'Accepted' && <div className="dojo-test-detail"><span>Input</span><pre>{test.input}</pre><span>Expected output</span><pre>{test.expectedOutput}</pre><span>Your output</span><pre>{test.output || test.compileOutput || test.stderr || '(no output)'}</pre></div>}
              </div>)}</div>
            </section>}
          </>}
        </section>
      </div>
    </main>
  )
}
