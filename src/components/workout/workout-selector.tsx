'use client'

import { Play, Clock, Dumbbell, Calendar, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Workout {
  id: string
  name: string
  duration: number
  exercises: number
  content: string
}

interface WorkoutSelectorProps {
  workouts: Workout[]
  onStart: (workoutId: string) => void
}

export function WorkoutSelector({ workouts, onStart }: WorkoutSelectorProps) {
  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-neutral-950 to-neutral-900 text-white p-6 md:p-8 overflow-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Ready to Train?</h1>
        <p className="text-neutral-400">Select a workout to begin</p>
      </div>

      {/* Quick Start */}
      <div className="mb-8">
        <button className="w-full flex items-center justify-center gap-3 py-6 px-8 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 transition-all shadow-lg shadow-primary-500/25 text-xl font-semibold">
          <Sparkles className="w-6 h-6" />
          AI Suggest Workout
        </button>
      </div>

      {/* Recent Workouts */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-neutral-300 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Your Workouts
        </h2>
      </div>

      {/* Workout Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {workouts.map((workout) => (
          <WorkoutCard key={workout.id} workout={workout} onStart={onStart} />
        ))}
      </div>

      {/* Empty State */}
      {workouts.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <Dumbbell className="w-16 h-16 text-neutral-600 mb-4" />
          <p className="text-xl font-semibold text-neutral-400">No workouts yet</p>
          <p className="text-neutral-500 mt-2">
            Create a workout in Notebook mode to get started
          </p>
        </div>
      )}
    </div>
  )
}

function WorkoutCard({
  workout,
  onStart,
}: {
  workout: Workout
  onStart: (id: string) => void
}) {
  return (
    <div className="glass-card p-6 hover:bg-white/10 transition-colors group cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">{workout.name}</h3>
          <div className="flex items-center gap-4 text-sm text-neutral-400">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {workout.duration}m
            </span>
            <span className="flex items-center gap-1">
              <Dumbbell className="w-4 h-4" />
              {workout.exercises} exercises
            </span>
          </div>
        </div>
      </div>

      {/* Preview of exercises */}
      <div className="text-sm text-neutral-500 mb-4 space-y-1">
        {workout.content
          .split('\n')
          .filter((line) => line.startsWith('## ') && !line.toLowerCase().includes('superset'))
          .slice(0, 3)
          .map((line, i) => (
            <div key={i} className="truncate">
              • {line.replace('## ', '')}
            </div>
          ))}
        {workout.exercises > 3 && (
          <div className="text-neutral-600">+{workout.exercises - 3} more</div>
        )}
      </div>

      {/* Start Button */}
      <button
        onClick={() => onStart(workout.id)}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-semibold transition-colors"
      >
        <Play className="w-5 h-5" fill="currentColor" />
        Start Workout
      </button>
    </div>
  )
}
