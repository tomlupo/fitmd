'use client'

import { useState, useEffect, useCallback } from 'react'
import { WorkoutSelector } from './workout-selector'
import { WorkoutExecution } from './workout-execution'
import { WorkoutComplete } from './workout-complete'
import type { WorkoutState, ExecutionExercise, ExecutionSet } from '@/types'
import { parseWorkoutMarkdown } from '@/lib/parser'
import { v4 as uuid } from 'uuid'

// Demo workouts for selection
const DEMO_WORKOUTS = [
  {
    id: '1',
    name: 'Push Day',
    duration: 45,
    exercises: 5,
    content: `# Push Day

@duration 45m
@goal hypertrophy

## Bench Press
4x5 @80kg
rest 120s
rpe 8

## Incline Dumbbell Press
3x10 @30kg
rest 90s
rpe 7

## Lateral Raise
3x12 @10kg
rest 60s

## Tricep Pushdown
3x12 @25kg
rest 60s

## Push-ups
3xAMRAP
rest 60s`,
  },
  {
    id: '2',
    name: 'Pull Day',
    duration: 50,
    exercises: 5,
    content: `# Pull Day

@duration 50m
@goal strength

## Deadlift
5x3 @140kg
rest 180s
rpe 9

## Pull-ups
4x8
rest 90s
rpe 8

## Barbell Row
4x6 @80kg
rest 120s
rpe 8

## Face Pull
3x15 @15kg
rest 60s

## Bicep Curl
3x12 @12kg
rest 60s`,
  },
  {
    id: '3',
    name: 'Leg Day',
    duration: 60,
    exercises: 5,
    content: `# Leg Day

@duration 60m
@goal hypertrophy

## Squat
4x6 @100kg
rest 150s
rpe 8

## Romanian Deadlift
3x10 @80kg
rest 90s
rpe 7

## Leg Press
3x12 @180kg
rest 90s

## Bulgarian Split Squat
3x10 @20kg
rest 60s

## Calf Raise
4x15 @60kg
rest 60s`,
  },
]

type WorkoutPhase = 'select' | 'active' | 'complete'

export function WorkoutMode() {
  const [phase, setPhase] = useState<WorkoutPhase>('select')
  const [workoutState, setWorkoutState] = useState<WorkoutState | null>(null)

  const handleStartWorkout = useCallback((workoutId: string) => {
    const workout = DEMO_WORKOUTS.find((w) => w.id === workoutId)
    if (!workout) return

    // Parse the workout markdown
    const parsed = parseWorkoutMarkdown(workout.content)

    // Convert to execution format
    const exercises: ExecutionExercise[] = parsed.exercises.map((ex) => ({
      id: uuid(),
      exerciseId: uuid(), // Would be from DB in real implementation
      name: ex.name,
      sets: ex.sets.map((set, index) => ({
        id: uuid(),
        setNumber: index + 1,
        targetReps:
          set.reps === 'AMRAP' ? 0 : parseInt(set.reps.split('-')[0], 10),
        targetWeight: set.weight,
        isWarmup: set.isWarmup || false,
        isCompleted: false,
      })),
      restSeconds: ex.restSeconds || 90,
      isSuperset: ex.isSuperset,
      supersetGroup: ex.supersetGroup,
      notes: ex.notes,
    }))

    const state: WorkoutState = {
      sessionId: uuid(),
      templateId: workoutId,
      name: workout.name,
      status: 'running',
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      exercises,
      startedAt: new Date(),
      totalTime: 0,
      restTimeRemaining: 0,
    }

    setWorkoutState(state)
    setPhase('active')
  }, [])

  const handleCompleteSet = useCallback(
    (actualReps?: number, actualWeight?: number, rpe?: number) => {
      if (!workoutState) return

      setWorkoutState((prev) => {
        if (!prev) return prev

        const exercises = [...prev.exercises]
        const currentExercise = exercises[prev.currentExerciseIndex]
        const currentSet = currentExercise.sets[prev.currentSetIndex]

        // Update the completed set
        currentSet.actualReps = actualReps ?? currentSet.targetReps
        currentSet.actualWeight = actualWeight ?? currentSet.targetWeight
        currentSet.rpe = rpe
        currentSet.isCompleted = true
        currentSet.completedAt = new Date()

        // Check if workout is complete
        const isLastSet =
          prev.currentSetIndex === currentExercise.sets.length - 1
        const isLastExercise =
          prev.currentExerciseIndex === prev.exercises.length - 1

        if (isLastSet && isLastExercise) {
          // Workout complete
          return {
            ...prev,
            exercises,
            status: 'completed',
          }
        }

        // Move to rest or next set
        let nextExerciseIndex = prev.currentExerciseIndex
        let nextSetIndex = prev.currentSetIndex

        if (isLastSet) {
          // Move to next exercise
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
    [workoutState]
  )

  const handleEndRest = useCallback(() => {
    setWorkoutState((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        status: 'running',
        restTimeRemaining: 0,
      }
    })
  }, [])

  const handleFinishWorkout = useCallback(() => {
    if (workoutState) {
      // In real app, save to database
      console.log('Workout completed:', workoutState)
    }
    setPhase('complete')
  }, [workoutState])

  const handleReset = useCallback(() => {
    setWorkoutState(null)
    setPhase('select')
  }, [])

  // Handle workout completion
  useEffect(() => {
    if (workoutState?.status === 'completed') {
      handleFinishWorkout()
    }
  }, [workoutState?.status, handleFinishWorkout])

  // Timer for total workout time
  useEffect(() => {
    if (phase !== 'active' || !workoutState) return

    const interval = setInterval(() => {
      setWorkoutState((prev) => {
        if (!prev) return prev

        // Update rest timer if in rest mode
        if (prev.status === 'rest' && prev.restTimeRemaining > 0) {
          const newRestTime = prev.restTimeRemaining - 1
          if (newRestTime <= 0) {
            return {
              ...prev,
              totalTime: prev.totalTime + 1,
              status: 'running',
              restTimeRemaining: 0,
            }
          }
          return {
            ...prev,
            totalTime: prev.totalTime + 1,
            restTimeRemaining: newRestTime,
          }
        }

        return {
          ...prev,
          totalTime: prev.totalTime + 1,
        }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [phase, workoutState])

  return (
    <div className="h-full overflow-hidden bg-neutral-950">
      {phase === 'select' && (
        <WorkoutSelector workouts={DEMO_WORKOUTS} onStart={handleStartWorkout} />
      )}

      {phase === 'active' && workoutState && (
        <WorkoutExecution
          state={workoutState}
          onCompleteSet={handleCompleteSet}
          onEndRest={handleEndRest}
          onQuit={handleReset}
        />
      )}

      {phase === 'complete' && workoutState && (
        <WorkoutComplete state={workoutState} onDone={handleReset} />
      )}
    </div>
  )
}
