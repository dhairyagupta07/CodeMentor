import { useEffect, useMemo, useState } from 'react'
import { AuthContext } from './authContext'
import { api } from '../services/api'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/auth/me')
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [])

  async function login(credentials) {
    const { user: nextUser } = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    setUser(nextUser)
    setError('')
  }

  async function register(details) {
    const { user: nextUser } = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify(details),
    })
    setUser(nextUser)
    setError('')
  }

  async function logout() {
    await api('/auth/logout', { method: 'POST' })
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, loading, error, login, register, logout }),
    [user, loading, error],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
