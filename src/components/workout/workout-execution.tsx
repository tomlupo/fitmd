'use client'

import { useState, useEffect } from 'react'
import type { WorkoutState } from '@/types'
import { formatDuration } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  Play,
  Pause,
  SkipForward,
  X,
  ChevronUp,
  ChevronDown,
  Check,
  Timer,
  Dumbbell,
} from 'lucide-react'

interface WorkoutExecutionProps {
  state: WorkoutState
  onCompleteSet: (actualReps?: number, actualWeight?: number, rpe?: number) => void
  onEndRest: () => void
  onQuit: () => void
}

export function WorkoutExecution({
  state,
  onCompleteSet,
  onEndRest,
  onQuit,
}: WorkoutExecutionProps) {
  const currentExercise = state.exercises[state.currentExerciseIndex]
  const currentSet = currentExercise?.sets[state.currentSetIndex]
  const isResting = state.status === 'rest'

  // Local state for editing actual values
  const [editReps, setEditReps] = useState(currentSet?.targetReps || 0)
  const [editWeight, setEditWeight] = useState(currentSet?.targetWeight || 0)

  // Reset edit values when set changes
  useEffect(() => {
    if (currentSet) {
      setEditReps(currentSet.targetReps)
      setEditWeight(currentSet.targetWeight || 0)
    }
  }, [currentSet])

  // Calculate progress
  const totalSets = state.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)
  const completedSets = state.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.isCompleted).length,
    0
  )
  const progress = (completedSets / totalSets) * 100

  if (!currentExercise || !currentSet) {
    return null
  }

  return (
    <div className="h-full flex flex-col bg-neutral-950 text-white safe-bottom">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-900/50">
        <button
          onClick={onQuit}
          className="p-2 rounded-full hover:bg-neutral-800 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center">
          <div className="text-sm text-neutral-400">{state.name}</div>
          <div className="text-lg font-mono tabular-nums">
            {formatDuration(state.totalTime)}
          </div>
        </div>

        <div className="w-10" /> {/* Spacer for alignment */}
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-neutral-800">
        <div
          className="h-full bg-primary-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-hidden">
        {isResting ? (
          /* Rest Timer */
          <div className="text-center animate-fade-in">
            <div className="text-2xl text-neutral-400 mb-4">Rest</div>
            <div className="workout-timer text-primary-500 mb-8">
              {formatDuration(state.restTimeRemaining)}
            </div>
            <div className="text-lg text-neutral-500 mb-2">Next up:</div>
            <div className="text-2xl font-bold">
              {state.currentSetIndex < currentExercise.sets.length - 1
                ? `${currentExercise.name} - Set ${state.currentSetIndex + 2}`
                : state.exercises[state.currentExerciseIndex + 1]?.name || 'Workout Complete'}
            </div>

            <button
              onClick={onEndRest}
              className="mt-8 flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary-500 hover:bg-primary-400 text-xl font-bold transition-colors"
            >
              <SkipForward className="w-6 h-6" />
              Skip Rest
            </button>
          </div>
        ) : (
          /* Exercise Execution */
          <div className="w-full max-w-md text-center animate-fade-in">
            {/* Exercise Name */}
            <div className="mb-2 text-neutral-500 text-sm uppercase tracking-wider">
              Exercise {state.currentExerciseIndex + 1} of {state.exercises.length}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-8">{currentExercise.name}</h1>

            {/* Set Counter */}
            <div className="mb-8">
              <div className="text-neutral-400 mb-2">
                Set {state.currentSetIndex + 1} of {currentExercise.sets.length}
              </div>
              <div className="flex justify-center gap-2">
                {currentExercise.sets.map((set, i) => (
                  <div
                    key={set.id}
                    className={cn(
                      'w-3 h-3 rounded-full transition-colors',
                      set.isCompleted
                        ? 'bg-primary-500'
                        : i === state.currentSetIndex
                          ? 'bg-white'
                          : 'bg-neutral-700'
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Reps Selector */}
            <div className="mb-6">
              <div className="text-sm text-neutral-500 mb-2">REPS</div>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setEditReps((r) => Math.max(0, r - 1))}
                  className="p-4 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors active:scale-95"
                >
                  <ChevronDown className="w-8 h-8" />
                </button>
                <div className="workout-set-display min-w-[120px]">{editReps}</div>
                <button
                  onClick={() => setEditReps((r) => r + 1)}
                  className="p-4 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors active:scale-95"
                >
                  <ChevronUp className="w-8 h-8" />
                </button>
              </div>
              {currentSet.targetReps > 0 && editReps !== currentSet.targetReps && (
                <div className="text-sm text-neutral-500 mt-2">
                  Target: {currentSet.targetReps}
                </div>
              )}
            </div>

            {/* Weight Selector */}
            {currentSet.targetWeight !== undefined && (
              <div className="mb-8">
                <div className="text-sm text-neutral-500 mb-2">WEIGHT (kg)</div>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setEditWeight((w) => Math.max(0, w - 2.5))}
                    className="p-4 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors active:scale-95"
                  >
                    <ChevronDown className="w-8 h-8" />
                  </button>
                  <div className="workout-set-display min-w-[140px]">{editWeight}</div>
                  <button
                    onClick={() => setEditWeight((w) => w + 2.5)}
                    className="p-4 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors active:scale-95"
                  >
                    <ChevronUp className="w-8 h-8" />
                  </button>
                </div>
                {editWeight !== currentSet.targetWeight && (
                  <div className="text-sm text-neutral-500 mt-2">
                    Target: {currentSet.targetWeight}kg
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            {currentExercise.notes && (
              <div className="text-sm text-neutral-400 italic mb-8 px-4">
                {currentExercise.notes}
              </div>
            )}

            {/* Complete Button */}
            <button
              onClick={() => onCompleteSet(editReps, editWeight)}
              className="w-full flex items-center justify-center gap-3 py-5 px-8 rounded-2xl bg-primary-500 hover:bg-primary-400 text-2xl font-bold transition-colors active:scale-98"
            >
              <Check className="w-8 h-8" />
              Complete Set
            </button>
          </div>
        )}
      </div>

      {/* Bottom Info Bar */}
      <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-neutral-900/50 border-t border-neutral-800">
        <div className="text-center">
          <div className="text-xs text-neutral-500 uppercase">Sets Done</div>
          <div className="text-lg font-bold">
            {completedSets}/{totalSets}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-neutral-500 uppercase">Rest Time</div>
          <div className="text-lg font-bold">{currentExercise.restSeconds}s</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-neutral-500 uppercase">Elapsed</div>
          <div className="text-lg font-bold font-mono">
            {formatDuration(state.totalTime)}
          </div>
        </div>
      </div>
    </div>
  )
}
