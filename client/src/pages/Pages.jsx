import { useEffect, useState } from 'react'
import { ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, BarChart3, BookOpen, Bookmark, Check, ChevronRight, CircleCheck, Clock3, Code2, Flame, GitCompareArrows, Search, Target, Trophy } from 'lucide-react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { api } from '../services/api'

const difficultyOrder = { Easy: 0, Medium: 1, Hard: 2 }

function ProblemRows({ problems, onBookmarkChanged, emptyTitle = 'No problems found', emptyMessage = 'Try changing your search or filters.' }) {
  const [bookmarkError, setBookmarkError] = useState('')
  async function toggleBookmark(event, problem) {
    event.preventDefault()
    try {
      const { bookmarked } = await api(`/problems/${problem._id}/bookmark`, { method: 'POST' })
      setBookmarkError('')
      onBookmarkChanged(problem._id, bookmarked)
    } catch (requestError) {
      setBookmarkError(requestError.message)
    }
  }

  if (!problems.length) return <div className="empty-state"><div className="empty-icon"><Search size={20} /></div><h3>{emptyTitle}</h3><p>{emptyMessage}</p></div>
  return (
    <>
      {bookmarkError && <div role="alert" className="alert-error">{bookmarkError}</div>}
      <div className="problem-table">
        {problems.map((problem, index) => (
          <div className="problem-row" key={problem._id}>
            <span className="row-number">{String(index + 1).padStart(2, '0')}</span>
            <span className={problem.solved ? 'row-check solved' : 'row-check'}>{problem.solved ? <Check size={14} /> : <span />}</span>
            <Link to={`/problems/${problem.slug}`} className="row-main"><strong>{problem.title}</strong><span>{problem.topics?.slice(0, 3).join(' · ')}</span></Link>
            <span className={`difficulty difficulty-${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span>
            <span className="acceptance-cell">{problem.acceptance}%</span>
            <button type="button" className={problem.bookmarked ? 'bookmark-button active' : 'bookmark-button'} aria-label={problem.bookmarked ? `Remove ${problem.title} from saved problems` : `Save ${problem.title}`} onClick={(event) => toggleBookmark(event, problem)}><Bookmark size={15} fill={problem.bookmarked ? 'currentColor' : 'none'} /></button>
            <Link to={`/problems/${problem.slug}`} aria-label={`Open ${problem.title}`}><ChevronRight className="row-chevron" size={16} /></Link>
          </div>
        ))}
      </div>
    </>
  )
}

export function Landing() {
  const { user } = useAuth()
  const location = useLocation()

  useEffect(() => {
    if (location.pathname === '/' && location.hash === '#how-it-works') {
      document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [location.pathname, location.hash])

  return (
    <div className="landing">
      <section className="landing-hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> A CALMER WAY TO GET BETTER AT CODE</div>
          <h1>Practice with<br /><span>purpose.</span></h1>
          <p>Good problem solving isn't about grinding harder. It's about showing up, thinking clearly, and getting a little better every day.</p>
          <div className="hero-actions"><Link className="button button-primary button-large" to={user ? '/problems' : '/register'}>{user ? 'Explore problems' : 'Start practicing'} <ArrowRight size={17} /></Link><Link className="hero-secondary" to="/problems"><span className="play-mark">↗</span> Explore the library</Link></div>
          <div className="hero-proof"><span className="proof-check"><CircleCheck size={15} /></span><span>Made for learners, not leaderboards</span><span className="proof-divider" /><span>Python · Java · C++</span></div>
        </div>
        <div className="hero-art" aria-label="CodeMentor coding workspace preview">
          <div className="art-glow" />
          <div className="preview-window">
            <div className="preview-top"><div className="window-dots"><i /><i /><i /></div><span>practice / two-sum.py</span><span className="preview-live"><i /> saved</span></div>
            <div className="preview-body">
              <div className="preview-gutter">01<br />02<br />03<br />04<br />05<br />06<br />07<br />08</div>
              <pre><span className="code-purple">def</span> <span className="code-yellow">two_sum</span>(nums, target):{'\n'}  seen = {'{}'}{'\n'}  <span className="code-purple">for</span> i, num <span className="code-purple">in</span> <span className="code-yellow">enumerate</span>(nums):{'\n'}    complement = target - num{'\n'}    <span className="code-purple">if</span> complement <span className="code-purple">in</span> seen:{'\n'}      <span className="code-purple">return</span> seen[complement], i{'\n'}    seen[num] = i{'\n'}  <span className="code-purple">return</span> []</pre>
            </div>
            <div className="preview-result"><span><CircleCheck size={15} /> All tests passed</span><span>3 / 3 cases</span></div>
          </div>
          <div className="floating-note"><span className="note-icon"><Target size={17} /></span><span><b>One problem at a time</b><small>Your pace. Your progress.</small></span><ArrowUpRight size={16} /></div>
          <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
          <span className="sparkle sparkle-one">✳</span><span className="sparkle sparkle-two">✳</span>
        </div>
      </section>
      <section className="principles" id="how-it-works">
        <div><span className="principle-icon mint"><BookOpen size={18} /></span><span><b>A focused library</b><small>Handpicked problems, from fundamentals to the fun stuff.</small></span></div>
        <div><span className="principle-icon lilac"><Code2 size={18} /></span><span><b>Your own workspace</b><small>Write, run, and refine solutions without the noise.</small></span></div>
        <div><span className="principle-icon peach"><BarChart3 size={18} /></span><span><b>Progress you can feel</b><small>See your practice add up, one solved problem at a time.</small></span></div>
      </section>
      <section className="landing-bottom"><div><span className="eyebrow">THE FIRST STEP IS THE IMPORTANT ONE</span><h2>Ready to make today count?</h2></div><Link to={user ? '/dashboard' : '/register'} className="button button-primary">{user ? 'Go to your dashboard' : 'Create your free account'} <ArrowRight size={16} /></Link></section>
    </div>
  )
}

export function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [problems, setProblems] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api('/submissions/dashboard'), api('/problems')])
      .then(([dashboard, problemData]) => { setData(dashboard); setProblems(problemData.problems) })
      .catch((requestError) => setError(requestError.message))
  }, [])

  const firstName = user?.name?.split(' ')[0] || 'there'
  const solvedCount = data?.stats?.solved || 0
  const progress = Math.min(100, Math.round((solvedCount / Math.max(problems.length, 1)) * 100))
  const nextProblem = problems.find((problem) => !problem.solved) || problems[0]

  return (
    <div className="page-shell">
      <div className="dashboard-welcome"><div><span className="eyebrow"><span className="eyebrow-dot" /> YOUR PRACTICE SPACE</span><h1>Good to see you, {firstName}<span className="wave">✳</span></h1><p>Every session makes a difference. What will you solve today?</p></div><Link className="button button-primary" to="/problems">Find a problem <ArrowRight size={16} /></Link></div>
      {error && <div role="alert" className="alert-error">{error}</div>}
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon mint"><CircleCheck size={19} /></div><span className="stat-label">Problems solved</span><strong>{data?.stats.solved ?? '—'}</strong><small>Keep that momentum going</small></div>
        <div className="stat-card"><div className="stat-icon lilac"><Code2 size={19} /></div><span className="stat-label">Submissions</span><strong>{data?.stats.submissions ?? '—'}</strong><small>Each one is a step forward</small></div>
        <div className="stat-card"><div className="stat-icon peach"><Target size={19} /></div><span className="stat-label">Accepted rate</span><strong>{data ? `${data.stats.accuracy}%` : '—'}</strong><small>Accepted submissions</small></div>
        <div className="stat-card"><div className="stat-icon amber"><Flame size={19} /></div><span className="stat-label">Current streak</span><strong>{data?.dailyProgress?.streak ?? '—'}</strong><small>Active practice days</small></div>
      </div>
      <div className="dashboard-columns">
        <section className="dashboard-panel progress-panel"><div className="panel-title"><div><span className="eyebrow">YOUR JOURNEY</span><h2>Steady progress</h2></div><span className="panel-icon"><BarChart3 size={17} /></span></div><p className="panel-description">You're building a strong foundation. Keep going at your own pace.</p><div className="progress-overview"><div className="progress-ring" style={{ '--progress': `${progress * 3.6}deg` }}><div>{progress}<small>%</small></div></div><div><strong>{solvedCount} <span>of {problems.length || '—'} solved</span></strong><p>Every problem is progress.</p></div></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><div className="progress-foot"><span>Getting started</span><span>{progress}% complete</span></div></section>
        <section className="dashboard-panel next-panel"><div className="panel-title"><div><span className="eyebrow">PICK UP WHERE YOU LEFT OFF</span><h2>Your next problem</h2></div><span className="panel-icon"><ArrowDownRight size={17} /></span></div>{nextProblem ? <Link to={`/problems/${nextProblem.slug}`} className="next-problem-card"><div><span className={`difficulty difficulty-${nextProblem.difficulty.toLowerCase()}`}>{nextProblem.difficulty}</span><span className="next-acceptance">{nextProblem.acceptance}% acceptance</span></div><h3>{nextProblem.title}</h3><p>{nextProblem.topics?.join(' · ')}</p><span className="next-cta">Take a look <ArrowRight size={15} /></span></Link> : <div className="empty-inline">Loading your next challenge…</div>}</section>
      </div>
      <section className="dashboard-panel daily-goal-panel">
        <div className="panel-title"><div><span className="eyebrow">CONSISTENCY, NOT SPEED</span><h2>Daily practice goal</h2></div><span className="panel-icon"><Target size={17} /></span></div>
        <div className="daily-goal-content"><div><strong>{data?.dailyProgress?.solved ?? 0} / {data?.dailyProgress?.goal ?? 1}</strong><span>unique problems accepted today (UTC)</span></div><div className="goal-track"><span style={{ width: `${Math.min(100, Math.round(((data?.dailyProgress?.solved || 0) / (data?.dailyProgress?.goal || 1)) * 100))}%` }} /></div>
          <label className="goal-select">Daily goal<select disabled={!data} value={data?.dailyProgress?.goal || 1} onChange={async (event) => {
            const goal = Number(event.target.value)
            try {
              const { dailyGoal } = await api('/submissions/dashboard/preferences', { method: 'PATCH', body: JSON.stringify({ dailyGoal: goal }) })
              setData((current) => ({ ...current, dailyProgress: { ...current.dailyProgress, goal: dailyGoal } }))
              setError('')
            } catch (requestError) { setError(requestError.message) }
          }}>{Array.from({ length: 10 }, (_, index) => index + 1).map((goal) => <option value={goal} key={goal}>{goal} {goal === 1 ? 'problem' : 'problems'}</option>)}</select></label>
        </div>
        <Link className="subtle-link" to="/learning-paths">Explore guided learning paths <ArrowRight size={14} /></Link>
      </section>
      <section className="dashboard-panel feature-launch-panel">
        <div className="panel-title"><div><span className="eyebrow">TOOLS FOR YOUR NEXT SESSION</span><h2>Practice in a new way</h2></div></div>
        <div className="feature-launch-grid">
          <Link to="/weak-spots"><Target size={16} /><span><strong>Topic map</strong><small>Choose what to review</small></span><ChevronRight size={14} /></Link>
          <Link to="/journal"><BookOpen size={16} /><span><strong>Learning journal</strong><small>Revisit saved reflections</small></span><ChevronRight size={14} /></Link>
          <Link to="/visualizer"><Code2 size={16} /><span><strong>Algorithm walkthroughs</strong><small>Step through a trace</small></span><ChevronRight size={14} /></Link>
          <Link to="/focus"><Clock3 size={16} /><span><strong>Focus session</strong><small>Plan a quiet practice block</small></span><ChevronRight size={14} /></Link>
        </div>
      </section>
      <section className="dashboard-panel recent-panel"><div className="panel-title"><div><span className="eyebrow">A LITTLE LOOK BACK</span><h2>Recent submissions</h2></div><Link to="/submissions" className="subtle-link">View all <ArrowRight size={14} /></Link></div>{data?.recent?.length ? <div className="recent-list">{data.recent.map((submission) => <Link className="recent-row" key={submission._id} to={`/submissions/${submission._id}`}><span className={submission.verdict === 'Accepted' ? 'recent-verdict accepted' : 'recent-verdict'}>{submission.verdict === 'Accepted' ? <Check size={15} /> : <span>×</span>}</span><span className="recent-name">{submission.problemTitle}<small>{submission.language} · {new Date(submission.createdAt).toLocaleDateString()}</small></span><span className={submission.verdict === 'Accepted' ? 'verdict-text accepted-text' : 'verdict-text'}>{submission.verdict}</span><ChevronRight size={15} className="row-chevron" /></Link>)}</div> : <div className="empty-state compact"><div className="empty-icon"><Trophy size={18} /></div><h3>Your first submission is waiting</h3><p>Pick a problem and give it a try.</p><Link className="text-link" to="/problems">Browse problems <ArrowRight size={14} /></Link></div>}</section>
    </div>
  )
}

export function Problems({ bookmarksOnly = false }) {
  const [searchParams] = useSearchParams()
  const [problems, setProblems] = useState([])
  const [search, setSearch] = useState(() => searchParams.get('search') || '')
  const [difficulty, setDifficulty] = useState(() => ['Easy', 'Medium', 'Hard'].includes(searchParams.get('difficulty')) ? searchParams.get('difficulty') : 'All levels')
  const [status, setStatus] = useState('All problems')
  const [topic, setTopic] = useState(() => searchParams.get('topic') || 'All topics')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams()
    if (search.trim()) params.set('search', search.trim())
    if (difficulty !== 'All levels') params.set('difficulty', difficulty)
    if (status !== 'All problems') params.set('status', status === 'Solved' ? 'solved' : 'unsolved')
    if (topic !== 'All topics') params.set('topic', topic)
    api(bookmarksOnly ? '/problems/bookmarks' : `/problems?${params}`)
      .then(({ problems: list }) => {
        setError('')
        setProblems(list.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]))
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [search, difficulty, status, topic, bookmarksOnly])

  function onBookmarkChanged(id, bookmarked) {
    setProblems((current) => bookmarksOnly && !bookmarked
      ? current.filter((problem) => problem._id !== id)
      : current.map((problem) => problem._id === id ? { ...problem, bookmarked } : problem))
  }

  const topics = [...new Set(problems.flatMap((problem) => problem.topics || []))].sort()
  return (
    <div className="page-shell">
      <div className="page-heading"><div><span className="eyebrow"><BookOpen size={13} /> {bookmarksOnly ? 'YOUR SAVED LIST' : 'THE PROBLEM LIBRARY'}</span><h1>{bookmarksOnly ? 'Problems to come back to.' : 'Find your next challenge.'}</h1><p>{bookmarksOnly ? 'Keep useful challenges close while you plan your practice.' : 'Thoughtful problems to help you build real problem-solving skills.'}</p></div><div className="problem-total"><strong>{problems.length}</strong><span>problems</span></div></div>
      <div className="library-card">
        {!bookmarksOnly && <div className="filter-bar">
          <label className="search-field"><Search size={17} /><input placeholder="Search problems..." value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>⌘ K</kbd></label>
          <select aria-label="Filter by difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option>All levels</option><option>Easy</option><option>Medium</option><option>Hard</option></select>
          <select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}><option>All problems</option><option>Solved</option><option>Unsolved</option></select>
          <select aria-label="Filter by topic" value={topic} onChange={(event) => setTopic(event.target.value)}><option>All topics</option>{topics.map((item) => <option key={item}>{item}</option>)}</select>
        </div>}
        {error && <div role="alert" className="alert-error">{error}</div>}
        <div className="table-heading"><span>STATUS</span><span>PROBLEM</span><span>DIFFICULTY</span><span>ACCEPTANCE</span><span /></div>
        {loading ? <div className="loading-inline">Loading problems…</div> : <ProblemRows problems={problems} onBookmarkChanged={onBookmarkChanged} emptyTitle={bookmarksOnly ? 'No saved problems yet' : undefined} emptyMessage={bookmarksOnly ? 'Use the bookmark icon in the library or workspace to save a challenge.' : undefined} />}
        <div className="library-footer"><span>Small, intentional steps add up.</span><span>{problems.length} problems <span className="online-dot" /></span></div>
      </div>
      <div className="library-note"><span className="note-icon"><Target size={17} /></span><span><b>Learning tip</b><small>Try thinking through an example before you start coding. A clear plan is half the solution.</small></span></div>
    </div>
  )
}

export function Submissions() {
  const [submissions, setSubmissions] = useState([])
  const [error, setError] = useState('')
  useEffect(() => { api('/submissions').then(({ submissions: list }) => setSubmissions(list)).catch((requestError) => setError(requestError.message)) }, [])
  return (
    <div className="page-shell">
      <div className="page-heading"><div><span className="eyebrow"><Code2 size={13} /> YOUR WORK</span><h1>Submission history.</h1><p>Every attempt is part of the learning process.</p></div><div className="problem-total"><strong>{submissions.length}</strong><span>submissions</span></div></div>
      <div className="library-card">
        <div className="table-heading submission-heading"><span>VERDICT</span><span>PROBLEM</span><span>LANGUAGE</span><span>TESTS</span><span>DATE</span></div>
        {error && <div role="alert" className="alert-error">{error}</div>}
        {submissions.length ? <div className="problem-table">{submissions.map((submission) => <Link className="submission-row" key={submission._id} to={`/submissions/${submission._id}`}><span className={submission.verdict === 'Accepted' ? 'verdict-text accepted-text' : 'verdict-text'}><span className={submission.verdict === 'Accepted' ? 'status-dot passed' : 'status-dot failed'} />{submission.verdict}</span><strong>{submission.problemTitle}</strong><span className="language-chip">{submission.language}</span><span>{submission.passedTests}/{submission.totalTests}</span><span className="date-cell">{new Date(submission.createdAt).toLocaleDateString()}</span></Link>)}</div> : <div className="empty-state"><div className="empty-icon"><Code2 size={20} /></div><h3>No submissions yet</h3><p>Your completed attempts will show up right here.</p><Link className="text-link" to="/problems">Find a problem <ArrowRight size={14} /></Link></div>}
      </div>
      <div className="library-note"><span className="note-icon"><Target size={17} /></span><span><b>Progress, not perfection</b><small>Rejected submissions are just useful feedback. Each one brings you a bit closer.</small></span></div>
    </div>
  )
}

export function LearningPaths() {
  const [paths, setPaths] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    api('/problems/paths')
      .then(({ paths: list }) => { setPaths(list); setError('') })
      .catch((requestError) => setError(requestError.message))
  }, [])

  return (
    <div className="page-shell">
      <div className="page-heading"><div><span className="eyebrow"><BookOpen size={13} /> CURATED PRACTICE</span><h1>Learn one step at a time.</h1><p>Follow a focused sequence of problems, or jump to any challenge that interests you.</p></div></div>
      {error && <div role="alert" className="alert-error">{error}</div>}
      <div className="learning-path-grid">{paths.map((path) => {
        const completed = path.problems.filter((problem) => problem.solved).length
        return <section className="path-card" key={path.slug}>
          <div className="path-card-heading"><span className="path-icon"><BookOpen size={18} /></span><span>{completed}/{path.problems.length} complete</span></div>
          <h2>{path.title}</h2><p>{path.description}</p>
          <div className="path-progress"><span style={{ width: `${path.problems.length ? (completed / path.problems.length) * 100 : 0}%` }} /></div>
          <ol className="path-problems">{path.problems.map((problem, index) => <li key={problem.slug}><span className={problem.solved ? 'path-step done' : 'path-step'}>{problem.solved ? <Check size={12} /> : index + 1}</span><Link to={`/problems/${problem.slug}`}><strong>{problem.title}</strong><small>{problem.difficulty} · {problem.topics.join(' · ')}</small></Link><ChevronRight size={15} /></li>)}</ol>
        </section>
      })}</div>
    </div>
  )
}

export function WeakSpotMap() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/submissions/weak-spots')
      .then((result) => { setData(result); setError('') })
      .catch((requestError) => setError(requestError.message))
  }, [])

  return (
    <main className="page-shell">
      <div className="page-heading"><div><span className="eyebrow"><Target size={14} /> PERSONAL PRACTICE MAP</span><h1>Find where to focus next.</h1><p>Topic patterns are based on your own submission verdicts—not a ranking of you against other learners.</p></div></div>
      {error && <div role="alert" className="alert-error">{error}</div>}
      {data?.message && <div className="dashboard-panel weak-spot-empty"><span className="empty-icon"><Target size={20} /></span><h2>Your topic map is getting started</h2><p>{data.message}</p><Link className="button button-primary" to="/problems">Try a problem <ArrowRight size={14} /></Link></div>}
      {data?.topics?.length > 0 && <div className="weak-spot-grid">{data.topics.map((topic) => (
        <article className="dashboard-panel weak-spot-card" key={topic.topic}>
          <div className="weak-spot-heading"><span className="topic-tag">{topic.topic}</span><strong>{topic.accuracy}% accepted</strong></div>
          <div className="weak-spot-track"><span style={{ width: `${topic.accuracy}%` }} /></div>
          <div className="weak-spot-stats"><span>{topic.attempts} attempts</span><span>{topic.needsReview} to review</span></div>
          <p>{topic.recommendation}</p>
          <Link className="subtle-link" to={`/problems?topic=${encodeURIComponent(topic.topic)}`}>Practice {topic.topic} <ArrowRight size={13} /></Link>
        </article>
      ))}</div>}
      <p className="weak-spot-disclaimer">Accuracy is accepted submissions divided by all recorded attempts for problems tagged with each topic. A problem with multiple topics contributes to each topic.</p>
    </main>
  )
}

export function LearningJournal() {
  const [entries, setEntries] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    api('/submissions/journal')
      .then(({ entries: items }) => { setEntries(items); setError('') })
      .catch((requestError) => setError(requestError.message))
  }, [])

  return (
    <main className="page-shell">
      <div className="page-heading"><div><span className="eyebrow"><BookOpen size={14} /> YOUR LEARNING JOURNAL</span><h1>Lessons worth keeping.</h1><p>Your saved reflections, organized by accepted attempt and problem.</p></div><div className="problem-total"><strong>{entries.length}</strong><span>entries</span></div></div>
      {error && <div role="alert" className="alert-error">{error}</div>}
      {entries.length ? <div className="journal-list">{entries.map((entry) => <article className="dashboard-panel journal-entry" key={entry._id}>
        <div className="journal-entry-heading"><div><span className="eyebrow">{entry.language} · {new Date(entry.reflection.updatedAt || entry.createdAt).toLocaleDateString()}</span><h2>{entry.problemTitle}</h2></div><Link className="subtle-link" to={`/submissions/${entry._id}`}>Open attempt <ArrowRight size={13} /></Link></div>
        <div className="journal-entry-notes">
          {entry.reflection.approach && <section><h3>Approach</h3><p>{entry.reflection.approach}</p></section>}
          {entry.reflection.complexity && <section><h3>Complexity</h3><p>{entry.reflection.complexity}</p></section>}
          {entry.reflection.alternative && <section><h3>Alternative / next time</h3><p>{entry.reflection.alternative}</p></section>}
        </div>
      </article>)}</div> : !error && <div className="dashboard-panel weak-spot-empty"><span className="empty-icon"><BookOpen size={20} /></span><h2>Your journal is ready when you are</h2><p>After an accepted submission, open its attempt review and save a solution reflection.</p><Link className="button button-primary" to="/problems">Find a problem <ArrowRight size={14} /></Link></div>}
    </main>
  )
}

function codeDifferences(current, previous) {
  const currentLines = current.split('\n')
  const previousLines = previous.split('\n')
  const rows = []
  const length = Math.max(currentLines.length, previousLines.length)
  for (let index = 0; index < length; index += 1) {
    rows.push({
      line: index + 1,
      current: currentLines[index] ?? '',
      previous: previousLines[index] ?? '',
      changed: currentLines[index] !== previousLines[index],
    })
  }
  return rows
}

export function SubmissionDetail() {
  const { id } = useParams()
  const [submission, setSubmission] = useState(null)
  const [attempts, setAttempts] = useState([])
  const [comparisonId, setComparisonId] = useState('')
  const [comparison, setComparison] = useState(null)
  const [error, setError] = useState('')
  const [reflection, setReflection] = useState({ approach: '', complexity: '', alternative: '' })
  const [reflectionSavedAt, setReflectionSavedAt] = useState(null)
  const [savingReflection, setSavingReflection] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([api(`/submissions/${id}`), api('/submissions')])
      .then(([detail, history]) => {
        if (cancelled) return
        setSubmission(detail.submission)
        const savedReflection = detail.submission.reflection || {}
        setReflection({
          approach: savedReflection.approach || '',
          complexity: savedReflection.complexity || '',
          alternative: savedReflection.alternative || '',
        })
        setReflectionSavedAt(savedReflection.updatedAt || null)
        const otherAttempts = history.submissions.filter((attempt) => attempt.problemSlug === detail.submission.problemSlug && attempt._id !== id)
        setAttempts(otherAttempts)
        setComparisonId(otherAttempts[0]?._id || '')
        setError('')
      })
      .catch((requestError) => { if (!cancelled) setError(requestError.message) })
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    if (!comparisonId) return undefined
    let cancelled = false
    api(`/submissions/${comparisonId}`)
      .then(({ submission: attempt }) => { if (!cancelled) setComparison(attempt) })
      .catch((requestError) => { if (!cancelled) setError(requestError.message) })
    return () => { cancelled = true }
  }, [comparisonId])

  const diff = comparison && submission ? codeDifferences(submission.sourceCode, comparison.sourceCode) : []
  const coaching = {
    'Wrong Answer': 'Compare your output with the visible examples, then try boundary inputs such as the smallest allowed size, duplicates, negative values, or already ordered data. Hidden tests are not shown here.',
    'Compilation Error': 'Read the first compiler error and its line number. Fix that issue first; later messages may be cascading errors.',
    'Runtime Error': 'Check input parsing, empty or single-item cases, and array or string indexes before changing the overall algorithm.',
    'Time Limit Exceeded': 'Look for repeated work inside loops. Consider whether a hash map, two pointers, or a single-pass update fits this problem.',
    'Internal Error': 'The isolated execution service did not complete normally. Try again later; your source code and hidden test inputs are not exposed in this review.',
  }[submission?.verdict]

  async function saveReflection(event) {
    event.preventDefault()
    setSavingReflection(true)
    setError('')
    try {
      const { reflection: saved } = await api(`/submissions/${id}/reflection`, {
        method: 'PUT',
        body: JSON.stringify(reflection),
      })
      setReflection({
        approach: saved.approach || '',
        complexity: saved.complexity || '',
        alternative: saved.alternative || '',
      })
      setReflectionSavedAt(saved.updatedAt)
      setSubmission((current) => ({ ...current, reflection: saved }))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSavingReflection(false)
    }
  }

  return (
    <div className="page-shell">
      <Link to="/submissions" className="text-link"><ArrowLeft size={14} /> Back to submissions</Link>
      {error && <div role="alert" className="alert-error">{error}</div>}
      {submission && <>
        <div className="page-heading submission-detail-heading"><div><span className="eyebrow"><Code2 size={13} /> ATTEMPT REVIEW</span><h1>{submission.problemTitle}</h1><p>{submission.language} · {new Date(submission.createdAt).toLocaleString()}</p></div><span className={submission.verdict === 'Accepted' ? 'verdict-text accepted-text' : 'verdict-text'}>{submission.verdict}</span></div>
        <section className="dashboard-panel attempt-summary"><span><strong>{submission.passedTests}/{submission.totalTests}</strong> tests passed</span><span><strong>{submission.failedTest ? `Test ${submission.failedTest}` : '—'}</strong> first failure</span><span><strong>{submission.executionTime}s</strong> runtime</span></section>
        {submission.diagnostic && <section className="dashboard-panel attempt-diagnostic"><h2>Execution details</h2><pre>{submission.diagnostic}</pre></section>}
        {coaching && <section className="dashboard-panel failure-coach"><span className="eyebrow">A NEXT DEBUGGING STEP</span><h2>{submission.verdict === 'Wrong Answer' ? 'Reason about the edge cases' : 'A useful place to start'}</h2><p>{coaching}</p><span>Coaching is based on the verdict only; it does not inspect or reveal hidden tests.</span></section>}
        {submission.verdict === 'Accepted' && <section className="dashboard-panel reflection-panel">
          <div className="panel-title"><div><span className="eyebrow">MAKE THE LEARNING STICK</span><h2>Solution reflection</h2></div>{reflectionSavedAt && <span className="reflection-saved">Saved {new Date(reflectionSavedAt).toLocaleDateString()}</span>}</div>
          <p>These private notes belong to this submission and are visible only to you.</p>
          <form onSubmit={saveReflection}>
            <label>How did you approach the problem?<textarea maxLength={2000} value={reflection.approach} onChange={(event) => setReflection((current) => ({ ...current, approach: event.target.value }))} placeholder="Describe the key idea and why it works." /></label>
            <label>What are the time and space complexities?<input maxLength={120} value={reflection.complexity} onChange={(event) => setReflection((current) => ({ ...current, complexity: event.target.value }))} placeholder="For example: O(n) time, O(n) space" /></label>
            <label>What alternative would you consider?<textarea maxLength={2000} value={reflection.alternative} onChange={(event) => setReflection((current) => ({ ...current, alternative: event.target.value }))} placeholder="Note another approach or what you would improve next time." /></label>
            <div className="reflection-footer"><span>{reflection.approach.length + reflection.complexity.length + reflection.alternative.length} / 4,120 characters</span><button className="button button-primary" type="submit" disabled={savingReflection}>{savingReflection ? 'Saving…' : 'Save reflection'}</button></div>
          </form>
        </section>}
        <section className="dashboard-panel comparison-panel">
          <div className="panel-title"><div><span className="eyebrow">LEARN FROM EACH ATTEMPT</span><h2><GitCompareArrows size={17} /> Compare code</h2></div>
            <label className="comparison-select">Compare with<select aria-label="Select another attempt to compare" value={comparisonId} onChange={(event) => { setComparison(null); setComparisonId(event.target.value) }}><option value="">No earlier attempt</option>{attempts.map((attempt) => <option value={attempt._id} key={attempt._id}>{new Date(attempt.createdAt).toLocaleString()} · {attempt.verdict}</option>)}</select></label>
          </div>
          {comparison && <div className="comparison-legend"><span>Selected attempt</span><span>Earlier attempt</span></div>}
          <div className={comparison ? 'code-comparison' : 'attempt-code'}>{diff.length ? diff.map((line) => <div className={line.changed ? 'diff-line changed' : 'diff-line'} key={line.line}><span>{line.line}</span><code>{line.previous || ' '}</code><code>{line.current || ' '}</code></div>) : <pre>{submission.sourceCode}</pre>}</div>
        </section>
      </>}
    </div>
  )
}

export function Profile() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { api('/submissions/dashboard').then(setStats).catch((requestError) => setError(requestError.message)) }, [])
  const initials = user?.name?.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="page-shell">
      <div className="page-heading"><div><span className="eyebrow">YOUR SPACE</span><h1>Profile & progress.</h1><p>A little snapshot of how far you've come.</p></div></div>
      {error && <div role="alert" className="alert-error">{error}</div>}
      <section className="profile-card"><div className="profile-avatar">{initials}</div><div className="profile-info"><span className="eyebrow">CODEMENTOR MEMBER</span><h2>{user?.name}</h2><p>{user?.email}</p></div><div className="profile-since">Learning at your own pace</div></section>
      <div className="stats-grid profile-stats"><div className="stat-card"><div className="stat-icon mint"><CircleCheck size={19} /></div><span className="stat-label">Problems solved</span><strong>{stats?.stats.solved ?? '—'}</strong></div><div className="stat-card"><div className="stat-icon lilac"><Code2 size={19} /></div><span className="stat-label">Total submissions</span><strong>{stats?.stats.submissions ?? '—'}</strong></div><div className="stat-card"><div className="stat-icon peach"><Target size={19} /></div><span className="stat-label">Accepted rate</span><strong>{stats ? `${stats.stats.accuracy}%` : '—'}</strong></div></div>
      <div className="profile-message"><span className="note-icon"><Trophy size={17} /></span><span><b>Showing up is the achievement.</b><small>Keep solving at your own pace. The progress will take care of itself.</small></span></div>
    </div>
  )
}
