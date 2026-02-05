'use client'

import { useApp, useTheme } from './providers'
import {
  BookOpen,
  Play,
  BarChart3,
  Users,
  Settings,
  Sun,
  Moon,
  Menu,
  X,
  FileText,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AppMode } from '@/types'

const navItems: { mode: AppMode; icon: typeof BookOpen; label: string }[] = [
  { mode: 'notebook', icon: BookOpen, label: 'Notebook' },
  { mode: 'workout', icon: Play, label: 'Workout' },
  { mode: 'analytics', icon: BarChart3, label: 'Analytics' },
  { mode: 'coach', icon: Users, label: 'Coach' },
]

export function Navigation() {
  const { mode, setMode, sidebarOpen, setSidebarOpen } = useApp()
  const { theme, setTheme, resolvedTheme } = useTheme()

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col h-full bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">FitMD</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = mode === item.mode

            return (
              <button
                key={item.mode}
                onClick={() => setMode(item.mode)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                  isActive
                    ? 'bg-primary-500 text-white'
                    : 'hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            )
          })}

          {/* AI Coach Button */}
          {sidebarOpen && (
            <div className="pt-4 mt-4 border-t border-neutral-200 dark:border-neutral-800">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:opacity-90 transition-opacity">
                <Sparkles className="w-5 h-5" />
                <span className="font-medium">AI Coach</span>
              </button>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-neutral-200 dark:border-neutral-800">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
            {sidebarOpen && (
              <span className="font-medium">
                {resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </span>
            )}
          </button>

          {/* Settings */}
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors">
            <Settings className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Settings</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 safe-bottom z-50">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = mode === item.mode

            return (
              <button
                key={item.mode}
                onClick={() => setMode(item.mode)}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'text-primary-500'
                    : 'text-neutral-500 dark:text-neutral-400'
                )}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
