import { useState } from 'react'
import { ArrowRight, Bookmark, Bug, ChevronDown, Code2, LogOut, Menu, X } from 'lucide-react'
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider'
import { useAuth } from './context/useAuth'
import { ThemeProvider } from './context/ThemeProvider'
import ThemeToggle from './components/ThemeToggle'
import AuthPage from './pages/AuthPage'
import { Dashboard, LearningJournal, LearningPaths, Landing, Problems, Profile, SubmissionDetail, Submissions, WeakSpotMap } from './pages/Pages'
import Workspace from './pages/Workspace'
import DebuggingDojo from './pages/DebuggingDojo'
import AlgorithmVisualizer from './pages/AlgorithmVisualizer'
import FocusSession from './pages/FocusSession'

function Header() {
  const { user, logout, error: authError } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const location = useLocation()
  const isWorkspace = location.pathname.startsWith('/problems/')

  if (isWorkspace || location.pathname === '/login' || location.pathname === '/register') return null

  async function handleLogout() {
    try {
      await logout()
      setLogoutError('')
      setMenuOpen(false)
    } catch (requestError) {
      setLogoutError(requestError.message)
    }
  }

  const nav = (
    <>
      {user ? (
        <>
          <NavLink to="/dashboard" onClick={() => setMenuOpen(false)}>Overview</NavLink>
          <NavLink to="/problems" onClick={() => setMenuOpen(false)}>Problems</NavLink>
          <NavLink to="/learning-paths" onClick={() => setMenuOpen(false)}>Learning paths</NavLink>
          <NavLink to="/dojo" onClick={() => setMenuOpen(false)}><Bug size={13} /> Debugging dojo</NavLink>
          <NavLink to="/bookmarks" onClick={() => setMenuOpen(false)}><Bookmark size={13} /> Saved</NavLink>
          <NavLink to="/submissions" onClick={() => setMenuOpen(false)}>Submissions</NavLink>
        </>
      ) : (
        <>
          <Link to="/#how-it-works" onClick={() => setMenuOpen(false)}>How it works</Link>
          <Link to="/problems" onClick={() => setMenuOpen(false)}>Problems</Link>
        </>
      )}
    </>
  )

  return (
    <>
      <header className="site-header">
        <div className="nav-wrap">
          <Link className="brand" to={user ? '/dashboard' : '/'} onClick={() => setMenuOpen(false)}>
            <span className="brand-mark"><Code2 size={20} /></span>
            <span>code<span>mentor</span></span>
          </Link>
          <nav className="main-nav">{nav}</nav>
          <div className="nav-actions">
            <ThemeToggle />
            {user ? (
              <>
                <NavLink className="profile-link" to="/profile"><span className="mini-avatar">{user.name?.[0]?.toUpperCase()}</span><span>{user.name?.split(' ')[0]}</span><ChevronDown size={14} /></NavLink>
                <button className="logout-button" onClick={handleLogout} aria-label="Log out"><LogOut size={17} /></button>
              </>
            ) : (
              <>
                <Link className="login-link" to="/login">Log in</Link>
                <Link className="button button-dark nav-cta" to="/register">Get started <ArrowRight size={15} /></Link>
              </>
            )}
            <button className="mobile-menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
        </div>
      </header>
      {(authError || logoutError) && <div role="alert" className="global-error">{authError || logoutError}</div>}
      {menuOpen && <nav className="mobile-nav">{nav}{user && <button onClick={handleLogout}>Log out <LogOut size={15} /></button>}</nav>}
    </>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="page-loading"><span className="loading-ring" /> Getting your workspace ready…</div>
  return user ? children : <Navigate to="/login" replace />
}

function NotFound() {
  return <div className="not-found"><span className="eyebrow">404 · NOT QUITE HERE</span><h1>Lost in the code?</h1><p>We couldn't find that page, but there's always another problem to solve.</p><Link className="button button-primary" to="/problems">Browse problems <ArrowRight size={16} /></Link></div>
}

function Footer() {
  return <footer className="site-footer"><Link className="brand footer-brand" to="/"><span className="brand-mark"><Code2 size={18} /></span><span>code<span>mentor</span></span></Link><span>Thoughtful practice. Real progress.</span><span>© 2026 CodeMentor</span></footer>
}

function AppRoutes() {
  const location = useLocation()
  const showFooter = location.pathname === '/' || location.pathname === '/problems' || location.pathname === '/dashboard' || location.pathname === '/submissions' || location.pathname === '/profile' || location.pathname === '/bookmarks' || location.pathname === '/learning-paths' || location.pathname === '/dojo' || location.pathname === '/visualizer' || location.pathname === '/focus' || location.pathname === '/weak-spots' || location.pathname === '/journal'
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/problems" element={<Problems />} />
        <Route path="/bookmarks" element={<ProtectedRoute><Problems bookmarksOnly /></ProtectedRoute>} />
        <Route path="/learning-paths" element={<LearningPaths />} />
        <Route path="/dojo" element={<ProtectedRoute><DebuggingDojo /></ProtectedRoute>} />
        <Route path="/visualizer" element={<AlgorithmVisualizer />} />
        <Route path="/focus" element={<ProtectedRoute><FocusSession /></ProtectedRoute>} />
        <Route path="/weak-spots" element={<ProtectedRoute><WeakSpotMap /></ProtectedRoute>} />
        <Route path="/journal" element={<ProtectedRoute><LearningJournal /></ProtectedRoute>} />
        <Route path="/problems/:slug" element={<ProtectedRoute><Workspace /></ProtectedRoute>} />
        <Route path="/submissions" element={<ProtectedRoute><Submissions /></ProtectedRoute>} />
        <Route path="/submissions/:id" element={<ProtectedRoute><SubmissionDetail /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {showFooter && <Footer />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
