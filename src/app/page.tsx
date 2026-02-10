'use client'

import { useApp } from '@/components/providers'
import { NotebookMode } from '@/components/editor/notebook-mode'
import { WorkoutMode } from '@/components/workout/workout-mode'
import { AnalyticsMode } from '@/components/analytics/analytics-mode'
import { CoachMode } from '@/components/coach/coach-mode'

export default function Home() {
  const { mode } = useApp()

  return (
    <div className="h-full overflow-hidden">
      {mode === 'notebook' && <NotebookMode />}
      {mode === 'workout' && <WorkoutMode />}
      {mode === 'analytics' && <AnalyticsMode />}
      {mode === 'coach' && <CoachMode />}
    </div>
  )
}
