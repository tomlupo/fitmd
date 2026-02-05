'use client'

import type { WorkoutState } from '@/types'
import { formatDuration, formatVolume, calculateVolume } from '@/lib/utils'
import { Trophy, Clock, Dumbbell, Flame, Check, Share2 } from 'lucide-react'

interface WorkoutCompleteProps {
  state: WorkoutState
  onDone: () => void
}

export function WorkoutComplete({ state, onDone }: WorkoutCompleteProps) {
  // Calculate stats
  const totalSets = state.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.isCompleted).length,
    0
  )

  const totalReps = state.exercises.reduce(
    (acc, ex) =>
      acc +
      ex.sets.reduce((setAcc, s) => setAcc + (s.actualReps || s.targetReps || 0), 0),
    0
  )

  const totalVolume = state.exercises.reduce(
    (acc, ex) =>
      acc +
      ex.sets.reduce(
        (setAcc, s) =>
          setAcc +
          calculateVolume(
            s.actualReps || s.targetReps || 0,
            s.actualWeight || s.targetWeight || 0
          ),
        0
      ),
    0
  )

  const exerciseStats = state.exercises.map((ex) => ({
    name: ex.name,
    sets: ex.sets.filter((s) => s.isCompleted).length,
    volume: ex.sets.reduce(
      (acc, s) =>
        acc +
        calculateVolume(
          s.actualReps || s.targetReps || 0,
          s.actualWeight || s.targetWeight || 0
        ),
      0
    ),
  }))

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-primary-600 to-primary-700 text-white p-6 overflow-auto">
      {/* Header */}
      <div className="text-center py-8 animate-fade-in">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/20 flex items-center justify-center">
          <Trophy className="w-10 h-10 text-accent-400" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Workout Complete!</h1>
        <p className="text-primary-100 text-lg">{state.name}</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Clock className="w-6 h-6" />}
          label="Duration"
          value={formatDuration(state.totalTime)}
        />
        <StatCard
          icon={<Dumbbell className="w-6 h-6" />}
          label="Sets"
          value={totalSets.toString()}
        />
        <StatCard
          icon={<Flame className="w-6 h-6" />}
          label="Total Reps"
          value={totalReps.toString()}
        />
        <StatCard
          icon={<Trophy className="w-6 h-6" />}
          label="Volume"
          value={`${formatVolume(totalVolume)}kg`}
        />
      </div>

      {/* Exercise Breakdown */}
      <div className="flex-1 bg-white/10 rounded-2xl p-6 mb-6 backdrop-blur">
        <h2 className="text-lg font-semibold mb-4">Exercise Summary</h2>
        <div className="space-y-3">
          {exerciseStats.map((ex, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 border-b border-white/10 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Check className="w-5 h-5 text-primary-200" />
                </div>
                <div>
                  <div className="font-medium">{ex.name}</div>
                  <div className="text-sm text-primary-200">{ex.sets} sets completed</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">{formatVolume(ex.volume)}kg</div>
                <div className="text-xs text-primary-200">volume</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PRs Section (placeholder) */}
      <div className="bg-accent-500/20 rounded-2xl p-6 mb-6 border border-accent-500/30">
        <div className="flex items-center gap-3 mb-3">
          <Trophy className="w-6 h-6 text-accent-400" />
          <h2 className="text-lg font-semibold">Personal Records</h2>
        </div>
        <p className="text-sm text-primary-100">
          Complete more workouts to track your PRs
        </p>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={onDone}
          className="w-full py-4 px-6 rounded-xl bg-white text-primary-700 font-bold text-lg hover:bg-primary-50 transition-colors"
        >
          Done
        </button>
        <button className="w-full py-4 px-6 rounded-xl bg-white/20 text-white font-semibold hover:bg-white/30 transition-colors flex items-center justify-center gap-2">
          <Share2 className="w-5 h-5" />
          Share Workout
        </button>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="bg-white/10 rounded-xl p-4 backdrop-blur text-center">
      <div className="flex justify-center mb-2 text-primary-200">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-primary-200 uppercase tracking-wider">{label}</div>
    </div>
  )
}
