import { Check, Leaf, Moon, Palette, Snowflake, Sun } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../context/useTheme'

const themeOptions = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'autumn', label: 'Autumn', icon: Leaf },
  { value: 'winter', label: 'Winter', icon: Snowflake },
  { value: 'summer', label: 'Summer', icon: Sun },
]

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const pickerRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    function handlePointerDown(event) {
      if (!pickerRef.current?.contains(event.target)) setOpen(false)
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape' && pickerRef.current?.contains(event.target)) {
        setOpen(false)
        pickerRef.current.querySelector('.theme-toggle')?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div className="theme-picker" ref={pickerRef}>
      <button
        type="button"
        className="theme-toggle"
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Choose a theme. Current theme: ${themeOptions.find((option) => option.value === theme)?.label ?? 'Light'}`}
        title="Choose a theme"
      >
        <Palette size={16} />
      </button>
      {open && (
        <div className="theme-menu" role="group" aria-label="Choose a theme">
          {themeOptions.map(({ value, label, icon: Icon }) => (
            <button
              type="button"
              className="theme-option"
              key={value}
              aria-pressed={theme === value}
              onClick={() => {
                setTheme(value)
                setOpen(false)
              }}
            >
              <Icon size={15} />
              <span>{label}</span>
              {theme === value && <Check className="theme-option-check" size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
