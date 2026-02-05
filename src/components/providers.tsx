'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { AppMode, AppState } from '@/types'

// Theme context
interface ThemeContextType {
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

// App state context
interface AppContextType {
  mode: AppMode
  setMode: (mode: AppMode) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

// Combined providers
export function Providers({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark')
  const [mode, setMode] = useState<AppMode>('notebook')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Load theme from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('fitmd-theme') as 'light' | 'dark' | 'system' | null
    if (stored) {
      setThemeState(stored)
    }
  }, [])

  // Apply theme
  useEffect(() => {
    const root = document.documentElement

    const applyTheme = (t: 'light' | 'dark') => {
      if (t === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
      setResolvedTheme(t)
    }

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      applyTheme(mediaQuery.matches ? 'dark' : 'light')

      const handler = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light')
      }
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    } else {
      applyTheme(theme)
    }
  }, [theme])

  const setTheme = (t: 'light' | 'dark' | 'system') => {
    setThemeState(t)
    localStorage.setItem('fitmd-theme', t)
  }

  // Load mode from localStorage
  useEffect(() => {
    const storedMode = localStorage.getItem('fitmd-mode') as AppMode | null
    if (storedMode) {
      setMode(storedMode)
    }
    const storedSidebar = localStorage.getItem('fitmd-sidebar')
    if (storedSidebar !== null) {
      setSidebarOpen(storedSidebar === 'true')
    }
  }, [])

  const handleSetMode = (m: AppMode) => {
    setMode(m)
    localStorage.setItem('fitmd-mode', m)
  }

  const handleSetSidebar = (open: boolean) => {
    setSidebarOpen(open)
    localStorage.setItem('fitmd-sidebar', String(open))
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      <AppContext.Provider
        value={{
          mode,
          setMode: handleSetMode,
          sidebarOpen,
          setSidebarOpen: handleSetSidebar,
        }}
      >
        {children}
      </AppContext.Provider>
    </ThemeContext.Provider>
  )
}
