import { useEffect, useMemo, useState } from 'react'
import { ThemeContext } from './themeContext'

const themes = ['light', 'dark', 'autumn', 'winter', 'summer']

function getSavedTheme() {
  const savedTheme = localStorage.getItem('codementor-theme')
  return themes.includes(savedTheme) ? savedTheme : 'light'
}

function SeasonalEffects({ theme }) {
  if (!['autumn', 'winter', 'summer'].includes(theme)) return null

  const particle = theme === 'autumn' ? '🍂' : '❄'
  const particleCount = theme === 'autumn' ? 8 : 10

  return (
    <div className={`seasonal-effects seasonal-effects-${theme}`} aria-hidden="true">
      {theme === 'summer' ? (
        <span className="seasonal-sun" />
      ) : (
        Array.from({ length: particleCount }, (_, index) => (
          <span className="seasonal-particle" key={index}>{particle}</span>
        ))
      )}
    </div>
  )
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getSavedTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('codementor-theme', theme)
  }, [theme])

  const value = useMemo(() => ({
    theme,
    setTheme,
  }), [theme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
      <SeasonalEffects theme={theme} />
    </ThemeContext.Provider>
  )
}
