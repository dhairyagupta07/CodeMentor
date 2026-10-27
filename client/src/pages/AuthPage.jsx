import { useState } from 'react'
import { ArrowLeft, ArrowRight, Code2, Sparkles } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import ThemeToggle from '../components/ThemeToggle'

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register'
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (isRegister) await register(form)
      else await login({ email: form.email, password: form.password })
      navigate('/dashboard')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-story">
        <Link className="brand brand-light" to="/">
          <span className="brand-mark"><Code2 size={20} /></span>
          <span>code<span>mentor</span></span>
        </Link>
        <div className="story-copy">
          <span className="eyebrow eyebrow-light"><Sparkles size={14} /> YOUR NEXT CHAPTER STARTS HERE</span>
          <h1>Small steps.<br />Sharper skills.</h1>
          <p>Build the confidence to solve anything, one thoughtful problem at a time.</p>
        </div>
        <div className="story-footer">
          <div className="avatar-stack" aria-hidden="true"><i>J</i><i>A</i><i>M</i><i>+</i></div>
          <span>Good problems make great developers.</span>
        </div>
      </section>
      <section className="auth-form-side">
        <Link to="/" className="back-home"><ArrowLeft size={16} /> Back home</Link>
        <div className="auth-theme-toggle"><ThemeToggle /></div>
        <div className="auth-card">
          <span className="auth-kicker">{isRegister ? 'CREATE YOUR ACCOUNT' : 'WELCOME BACK'}</span>
          <h2>{isRegister ? 'Start your journey' : 'Pick up where you left off'}</h2>
          <p>{isRegister ? 'Your next breakthrough is one problem away.' : 'Your practice space is ready when you are.'}</p>
          {error && <div role="alert" className="alert-error">{error}</div>}
          <form onSubmit={handleSubmit} className="auth-fields">
            {isRegister && (
              <label>
                Your name
                <input autoComplete="name" required minLength={2} maxLength={60} placeholder="Alex Morgan" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </label>
            )}
            <label>
              Email address
              <input autoComplete="email" type="email" required placeholder="you@example.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </label>
            <label>
              Password
              <input autoComplete={isRegister ? 'new-password' : 'current-password'} type="password" required minLength={isRegister ? 8 : undefined} maxLength={72} placeholder={isRegister ? 'At least 8 characters' : 'Enter your password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            </label>
            <button type="submit" className="button button-primary auth-submit" disabled={busy}>
              {busy ? 'One moment…' : isRegister ? 'Create account' : 'Log in'}
              {!busy && <ArrowRight size={17} />}
            </button>
          </form>
          <div className="auth-switch">
            {isRegister ? 'Already have an account?' : 'New to CodeMentor?'}
            {' '}<Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Log in' : 'Create an account'}</Link>
          </div>
          <div className="auth-note"><span /> Your code and progress stay yours.</div>
        </div>
        <span className="auth-legal">© 2026 CodeMentor · Made for the curious</span>
      </section>
    </main>
  )
}
