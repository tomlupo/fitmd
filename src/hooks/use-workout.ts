'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { WorkoutState, ExecutionExercise } from '@/types'
import { v4 as uuid } from 'uuid'

interface UseWorkoutOptions {
  onComplete?: (state: WorkoutState) => void
  autoSave?: boolean
}

export function useWorkout(options: UseWorkoutOptions = {}) {
  const { onComplete, autoSave = true } = options
  const [state, setState] = useState<WorkoutState | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Timer effect
  useEffect(() => {
    if (!state || state.status === 'completed' || state.status === 'idle') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(() => {
      setState((prev) => {
        if (!prev) return prev

        let newState = { ...prev, totalTime: prev.totalTime + 1 }

        // Handle rest timer
        if (prev.status === 'rest' && prev.restTimeRemaining > 0) {
          const newRestTime = prev.restTimeRemaining - 1
          newState.restTimeRemaining = newRestTime

          if (newRestTime <= 0) {
            newState.status = 'running'
          }
        }

        return newState
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [state?.status])

  // Start a new workout
  const startWorkout = useCallback((name: string, exercises: ExecutionExercise[]) => {
    const newState: WorkoutState = {
      sessionId: uuid(),
      name,
      status: 'running',
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      exercises,
      startedAt: new Date(),
      totalTime: 0,
      restTimeRemaining: 0,
    }
    setState(newState)
    return newState.sessionId
  }, [])

  // Complete a set
  const completeSet = useCallback(
    (actualReps?: number, actualWeight?: number, rpe?: number) => {
      setState((prev) => {
        if (!prev) return prev

        const exercises = [...prev.exercises]
        const currentExercise = exercises[prev.currentExerciseIndex]
        const currentSet = currentExercise.sets[prev.currentSetIndex]

        // Update the set
        currentSet.actualReps = actualReps ?? currentSet.targetReps
        currentSet.actualWeight = actualWeight ?? currentSet.targetWeight
        currentSet.rpe = rpe
        currentSet.isCompleted = true
        currentSet.completedAt = new Date()

        // Check if workout is done
        const isLastSet = prev.currentSetIndex === currentExercise.sets.length - 1
        const isLastExercise = prev.currentExerciseIndex === prev.exercises.length - 1

        if (isLastSet && isLastExercise) {
          const completedState: WorkoutState = {
            ...prev,
            exercises,
            status: 'completed',
          }
          onComplete?.(completedState)
          return completedState
        }

        // Move to next set or exercise
        let nextExerciseIndex = prev.currentExerciseIndex
        let nextSetIndex = prev.currentSetIndex

        if (isLastSet) {
          nextExerciseIndex++
          nextSetIndex = 0
        } else {
          nextSetIndex++
        }

        return {
          ...prev,
          exercises,
          currentExerciseIndex: nextExerciseIndex,
          currentSetIndex: nextSetIndex,
          status: 'rest',
          restTimeRemaining: currentExercise.restSeconds,
        }
      })
    },
    [onComplete]
  )

  // Skip rest
  const skipRest = useCallback(() => {
    setState((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        status: 'running',
        restTimeRemaining: 0,
      }
    })
  }, [])

  // Pause workout
  const pauseWorkout = useCallback(() => {
    setState((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        status: 'paused',
      }
    })
  }, [])

  // Resume workout
  const resumeWorkout = useCallback(() => {
    setState((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        status: 'running',
      }
    })
  }, [])

  // End workout early
  const endWorkout = useCallback(() => {
    setState((prev) => {
      if (!prev) return prev
      const completedState: WorkoutState = {
        ...prev,
        status: 'completed',
      }
      onComplete?.(completedState)
      return completedState
    })
  }, [onComplete])

  // Reset workout
  const resetWorkout = useCallback(() => {
    setState(null)
  }, [])

  // Calculate progress
  const progress = state
    ? (() => {
        const totalSets = state.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)
        const completedSets = state.exercises.reduce(
          (acc, ex) => acc + ex.sets.filter((s) => s.isCompleted).length,
          0
        )
        return {
          totalSets,
          completedSets,
          percentage: totalSets > 0 ? (completedSets / totalSets) * 100 : 0,
        }
      })()
    : null

  // Get current exercise and set
  const current = state
    ? {
        exercise: state.exercises[state.currentExerciseIndex],
        set: state.exercises[state.currentExerciseIndex]?.sets[state.currentSetIndex],
      }
    : null

  return {
    state,
    progress,
    current,
    startWorkout,
    completeSet,
    skipRest,
    pauseWorkout,
    resumeWorkout,
    endWorkout,
    resetWorkout,
    isRunning: state?.status === 'running',
    isResting: state?.status === 'rest',
    isPaused: state?.status === 'paused',
    isCompleted: state?.status === 'completed',
  }
}
