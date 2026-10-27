import { useEffect, useMemo, useState } from 'react'
import { ThemeContext } from './themeContext'

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => (
    localStorage.getItem('codementor-theme') === 'dark' ? 'dark' : 'light'
  ))

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('codementor-theme', theme)
  }, [theme])

  const value = useMemo(() => ({
    theme,
    toggleTheme: () => setTheme((current) => current === 'light' ? 'dark' : 'light'),
  }), [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
