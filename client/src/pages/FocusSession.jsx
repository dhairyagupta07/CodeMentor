import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Check, Clock3, Coffee, Play, RotateCcw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'

const SESSION_KEY = 'codementor-focus-history'
const STUDY_SECONDS = 25 * 60
const BREAK_SECONDS = 5 * 60

function formatTime(seconds) {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
}

export default function FocusSession() {
  const [problems, setProblems] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [error, setError] = useState('')
  const [phase, setPhase] = useState('setup')
  const [secondsLeft, setSecondsLeft] = useState(STUDY_SECONDS)
  const [running, setRunning] = useState(false)
  const [completedIds, setCompletedIds] = useState([])
  const [sessionRecap, setSessionRecap] = useState(null)
  const selectedProblems = useMemo(() => problems.filter((problem) => selectedIds.includes(problem._id)), [problems, selectedIds])

  useEffect(() => {
    api('/problems')
      .then(({ problems: items }) => {
        setProblems(items)
        setSelectedIds(items.slice(0, 2).map((problem) => problem._id))
      })
      .catch((requestError) => setError(requestError.message))
  }, [])

  useEffect(() => {
    if (!running) return undefined
    const timerId = window.setTimeout(() => {
      if (secondsLeft <= 1) {
        setSecondsLeft(0)
        setRunning(false)
        if (phase === 'break') setPhase('complete')
        return
      }
      setSecondsLeft(secondsLeft - 1)
    }, 1000)
    return () => window.clearTimeout(timerId)
  }, [phase, running, secondsLeft])

  function startSession() {
    if (!selectedIds.length) {
      setError('Choose at least one problem for your focus session.')
      return
    }
    setError('')
    setCompletedIds([])
    setPhase('study')
    setSecondsLeft(STUDY_SECONDS)
    setRunning(true)
  }

  function finishEarly() {
    if (!saveSessionSummary()) return
    setPhase('complete')
    setRunning(false)
  }

  function startBreak() {
    if (!saveSessionSummary()) return
    setPhase('break')
    setSecondsLeft(BREAK_SECONDS)
    setRunning(true)
  }

  function saveSessionSummary() {
    const record = {
      finishedAt: new Date().toISOString(),
      plannedProblems: selectedProblems.length,
      completedProblems: completedIds.length,
      focusMinutes: Math.max(1, Math.floor((STUDY_SECONDS - secondsLeft) / 60)),
    }
    try {
      const previous = JSON.parse(localStorage.getItem(SESSION_KEY) || '[]')
      localStorage.setItem(SESSION_KEY, JSON.stringify([record, ...previous].slice(0, 20)))
      setSessionRecap(record)
      setError('')
      return true
    } catch {
      setError('Could not save this session summary in browser storage.')
      return false
    }
  }

  function toggleCompleted(id) {
    setCompletedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id])
  }

  return (
    <main className="page-shell focus-page">
      <div className="page-heading"><div><span className="eyebrow"><Clock3 size={14} /> FOCUS SESSION</span><h1>Make room for deep practice.</h1><p>Choose a small problem set, work distraction-free, and finish with a short break and a saved session recap.</p></div></div>
      {error && <div role="alert" className="alert-error">{error}</div>}
      {phase === 'setup' ? <section className="dashboard-panel focus-setup">
        <div className="panel-title"><div><span className="eyebrow">YOUR FOCUS SET</span><h2>Choose up to three problems</h2></div><Clock3 size={18} /></div>
        <p>One focus block is 25 minutes, followed by an optional 5-minute break.</p>
        <div className="focus-problem-options">{problems.map((problem) => <label key={problem._id}><input type="checkbox" checked={selectedIds.includes(problem._id)} disabled={!selectedIds.includes(problem._id) && selectedIds.length >= 3} onChange={() => setSelectedIds((current) => current.includes(problem._id) ? current.filter((id) => id !== problem._id) : [...current, problem._id])} /><span><strong>{problem.title}</strong><small>{problem.difficulty} · {problem.topics.join(' · ')}</small></span></label>)}</div>
        <button className="button button-primary" disabled={!problems.length} onClick={startSession}><Play size={15} /> Start 25-minute focus</button>
      </section> : phase === 'complete' ? <section className="dashboard-panel focus-complete"><span className="focus-complete-icon"><Check size={22} /></span><span className="eyebrow">SESSION SAVED LOCALLY</span><h2>Nice work showing up.</h2><p>You checked off {sessionRecap?.completedProblems ?? completedIds.length} of {sessionRecap?.plannedProblems ?? selectedProblems.length} selected problems in about {sessionRecap?.focusMinutes ?? 0} focus minutes. Your recap is stored in this browser.</p><button className="button button-primary" onClick={() => { setPhase('setup'); setSecondsLeft(STUDY_SECONDS) }}><RotateCcw size={14} /> Plan another session</button></section> : <section className="dashboard-panel active-focus">
        <div className="focus-phase-label">{phase === 'study' ? <><Clock3 size={16} /> FOCUS BLOCK</> : <><Coffee size={16} /> SHORT BREAK</>}</div>
        <div className="focus-clock" aria-live="polite">{formatTime(secondsLeft)}</div>
        <p>{phase === 'study' ? 'Work on one thing at a time. You can pause whenever you need.' : 'Step away from the screen, stretch, and come back refreshed.'}</p>
        <div className="focus-timer-actions"><button className="button button-outline" onClick={() => setRunning((current) => !current)}>{running ? 'Pause timer' : 'Resume timer'}</button>{phase === 'study' ? <button className="button button-primary" onClick={finishEarly}><Check size={14} /> Finish session</button> : <button className="button button-primary" onClick={() => { setPhase('setup'); setSecondsLeft(STUDY_SECONDS); setRunning(false) }}>Done with break</button>}</div>
        {phase === 'study' && <div className="focus-task-list"><h3>Session problems</h3>{selectedProblems.map((problem) => <div className="focus-task" key={problem._id}><label><input type="checkbox" checked={completedIds.includes(problem._id)} onChange={() => toggleCompleted(problem._id)} /><span>{problem.title}</span></label><Link to={`/problems/${problem.slug}`}><span>Open problem</span><ArrowRight size={13} /></Link></div>)}</div>}
        {phase === 'break' && secondsLeft === 0 && <button className="button button-outline" onClick={() => { setPhase('complete'); setRunning(false) }}><Check size={14} /> Finish break</button>}
        {phase === 'study' && secondsLeft === 0 && <button className="button button-outline" onClick={startBreak}><Coffee size={14} /> Start 5-minute break</button>}
      </section>}
      <p className="focus-history-note">Session recaps are stored only in this browser; no timer data is sent to the server.</p>
    </main>
  )
}
