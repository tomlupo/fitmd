/**
 * Workout Parser - Converts Markdown workout files to structured JSON
 *
 * Grammar:
 * - # Title = Workout name
 * - @key value = Metadata (duration, goal, etc.)
 * - ## Exercise Name = Exercise header
 * - 4x5 @80kg = Sets x Reps @ Weight
 * - rest 120s = Rest time
 * - rpe 8 = Rate of Perceived Exertion
 * - ## Superset = Superset group starts
 */

import type { ParsedWorkout, ParsedExercise, ParsedSet, WorkoutMetadata } from '@/types'

// Regex patterns for parsing
const PATTERNS = {
  title: /^#\s+(.+)$/,
  metadata: /^@(\w+)\s+(.+)$/,
  exerciseHeader: /^##\s+(.+)$/,
  setPattern: /^(\d+)x(\d+(?:-\d+)?|AMRAP)\s*(?:@\s*(\d+(?:\.\d+)?)\s*(kg|lbs)?)?$/i,
  rest: /^rest\s+(\d+)\s*(s|sec|seconds?|m|min|minutes?)?$/i,
  rpe: /^rpe\s+(\d+(?:\.\d+)?)$/i,
  superset: /^##\s*superset$/i,
  comment: /^>\s*(.+)$/, // Markdown blockquote as notes
}

export function parseWorkoutMarkdown(content: string): ParsedWorkout {
  const lines = content.split('\n').map((line) => line.trim())
  const errors: string[] = []
  let name = 'Untitled Workout'
  const metadata: WorkoutMetadata = {}
  const exercises: ParsedExercise[] = []

  let currentExercise: ParsedExercise | null = null
  let inSuperset = false
  let supersetGroup = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineNum = i + 1

    // Skip empty lines
    if (!line) continue

    // Parse title (# Workout Name)
    const titleMatch = line.match(PATTERNS.title)
    if (titleMatch) {
      name = titleMatch[1].trim()
      continue
    }

    // Parse metadata (@key value)
    const metaMatch = line.match(PATTERNS.metadata)
    if (metaMatch) {
      const [, key, value] = metaMatch
      switch (key.toLowerCase()) {
        case 'duration':
          metadata.duration = parseDuration(value)
          break
        case 'goal':
          metadata.goal = value.trim()
          break
        case 'tags':
          metadata.tags = value.split(',').map((t) => t.trim())
          break
        case 'notes':
          metadata.notes = value.trim()
          break
        default:
          // Store unknown metadata
          ;(metadata as Record<string, unknown>)[key] = value.trim()
      }
      continue
    }

    // Check for superset header
    if (PATTERNS.superset.test(line)) {
      inSuperset = true
      supersetGroup++
      continue
    }

    // Parse exercise header (## Exercise Name)
    const exerciseMatch = line.match(PATTERNS.exerciseHeader)
    if (exerciseMatch) {
      // Save previous exercise if exists
      if (currentExercise) {
        exercises.push(currentExercise)
      }

      currentExercise = {
        name: exerciseMatch[1].trim(),
        sets: [],
        isSuperset: inSuperset,
        supersetGroup: inSuperset ? supersetGroup : undefined,
      }

      // End superset after first non-superset exercise header
      if (!inSuperset) {
        supersetGroup = 0
      }
      continue
    }

    // Parse set pattern (4x5 @80kg)
    const setMatch = line.match(PATTERNS.setPattern)
    if (setMatch && currentExercise) {
      const [, setsCount, reps, weight, unit] = setMatch
      const numSets = parseInt(setsCount, 10)

      for (let s = 0; s < numSets; s++) {
        const set: ParsedSet = {
          reps: reps.toUpperCase() === 'AMRAP' ? 'AMRAP' : reps,
        }
        if (weight) {
          set.weight = parseFloat(weight)
          set.unit = (unit?.toLowerCase() as 'kg' | 'lbs') || 'kg'
        }
        currentExercise.sets.push(set)
      }
      continue
    }

    // Parse rest time
    const restMatch = line.match(PATTERNS.rest)
    if (restMatch && currentExercise) {
      const [, time, unit] = restMatch
      let seconds = parseInt(time, 10)
      if (unit && (unit.startsWith('m') || unit === 'min' || unit.startsWith('minute'))) {
        seconds *= 60
      }
      currentExercise.restSeconds = seconds
      continue
    }

    // Parse RPE
    const rpeMatch = line.match(PATTERNS.rpe)
    if (rpeMatch && currentExercise) {
      currentExercise.rpe = Math.min(10, Math.max(1, parseFloat(rpeMatch[1])))
      continue
    }

    // Parse notes (blockquote)
    const commentMatch = line.match(PATTERNS.comment)
    if (commentMatch && currentExercise) {
      currentExercise.notes = (currentExercise.notes || '') + commentMatch[1] + '\n'
      continue
    }

    // If we get here and the line isn't empty or a markdown element, it might be an error
    if (line && !line.startsWith('-') && !line.startsWith('*')) {
      // Could be freeform text, try to parse as alternative set format
      const altSetMatch = parseAlternativeSetFormat(line)
      if (altSetMatch && currentExercise) {
        currentExercise.sets.push(...altSetMatch)
        continue
      }

      // Unrecognized line - could add to errors but might be intentional
      // errors.push(`Line ${lineNum}: Unrecognized format: "${line}"`)
    }
  }

  // Don't forget last exercise
  if (currentExercise) {
    exercises.push(currentExercise)
  }

  // Validate
  if (exercises.length === 0) {
    errors.push('No exercises found in workout')
  }

  for (const exercise of exercises) {
    if (exercise.sets.length === 0) {
      errors.push(`Exercise "${exercise.name}" has no sets defined`)
    }
  }

  return {
    name,
    metadata,
    exercises,
    isValid: errors.length === 0,
    errors,
  }
}

// Parse alternative set formats like "Bench Press: 4x8"
function parseAlternativeSetFormat(line: string): ParsedSet[] | null {
  // Format: "Exercise: 4x8 @100kg" - extract just the set info
  const match = line.match(/(\d+)x(\d+(?:-\d+)?|AMRAP)\s*(?:@\s*(\d+(?:\.\d+)?)\s*(kg|lbs)?)?/i)
  if (!match) return null

  const [, setsCount, reps, weight, unit] = match
  const numSets = parseInt(setsCount, 10)
  const sets: ParsedSet[] = []

  for (let s = 0; s < numSets; s++) {
    const set: ParsedSet = {
      reps: reps.toUpperCase() === 'AMRAP' ? 'AMRAP' : reps,
    }
    if (weight) {
      set.weight = parseFloat(weight)
      set.unit = (unit?.toLowerCase() as 'kg' | 'lbs') || 'kg'
    }
    sets.push(set)
  }

  return sets
}

// Parse duration string like "45m" or "1h 30m"
function parseDuration(value: string): number {
  let minutes = 0
  const hourMatch = value.match(/(\d+)\s*h/)
  const minMatch = value.match(/(\d+)\s*m/)

  if (hourMatch) {
    minutes += parseInt(hourMatch[1], 10) * 60
  }
  if (minMatch) {
    minutes += parseInt(minMatch[1], 10)
  }

  // If no units, assume minutes
  if (!hourMatch && !minMatch) {
    const num = parseInt(value, 10)
    if (!isNaN(num)) {
      minutes = num
    }
  }

  return minutes
}

// Convert parsed workout back to normalized Markdown
export function workoutToMarkdown(workout: ParsedWorkout): string {
  const lines: string[] = []

  // Title
  lines.push(`# ${workout.name}`)
  lines.push('')

  // Metadata
  if (workout.metadata.duration) {
    lines.push(`@duration ${workout.metadata.duration}m`)
  }
  if (workout.metadata.goal) {
    lines.push(`@goal ${workout.metadata.goal}`)
  }
  if (workout.metadata.tags?.length) {
    lines.push(`@tags ${workout.metadata.tags.join(', ')}`)
  }
  if (workout.metadata.notes) {
    lines.push(`@notes ${workout.metadata.notes}`)
  }

  if (Object.keys(workout.metadata).length > 0) {
    lines.push('')
  }

  // Exercises
  let currentSupersetGroup: number | undefined

  for (const exercise of workout.exercises) {
    // Handle superset headers
    if (exercise.isSuperset && exercise.supersetGroup !== currentSupersetGroup) {
      if (currentSupersetGroup !== undefined) {
        lines.push('')
      }
      lines.push('## Superset')
      currentSupersetGroup = exercise.supersetGroup
    } else if (!exercise.isSuperset && currentSupersetGroup !== undefined) {
      currentSupersetGroup = undefined
      lines.push('')
    }

    lines.push(`## ${exercise.name}`)

    // Consolidate sets with same reps/weight
    const consolidatedSets = consolidateSets(exercise.sets)
    for (const setGroup of consolidatedSets) {
      let setLine = `${setGroup.count}x${setGroup.reps}`
      if (setGroup.weight !== undefined) {
        setLine += ` @${setGroup.weight}${setGroup.unit || 'kg'}`
      }
      lines.push(setLine)
    }

    if (exercise.restSeconds) {
      lines.push(`rest ${exercise.restSeconds}s`)
    }
    if (exercise.rpe) {
      lines.push(`rpe ${exercise.rpe}`)
    }
    if (exercise.notes) {
      for (const note of exercise.notes.trim().split('\n')) {
        lines.push(`> ${note}`)
      }
    }

    lines.push('')
  }

  return lines.join('\n').trim()
}

interface ConsolidatedSet {
  count: number
  reps: string
  weight?: number
  unit?: 'kg' | 'lbs'
}

function consolidateSets(sets: ParsedSet[]): ConsolidatedSet[] {
  const result: ConsolidatedSet[] = []

  for (const set of sets) {
    const last = result[result.length - 1]
    if (last && last.reps === set.reps && last.weight === set.weight && last.unit === set.unit) {
      last.count++
    } else {
      result.push({
        count: 1,
        reps: set.reps,
        weight: set.weight,
        unit: set.unit,
      })
    }
  }

  return result
}

// Validate that exercises exist in the database
export async function validateExercises(
  exercises: ParsedExercise[],
  exerciseDb: Map<string, string> // name -> id
): Promise<{ valid: ParsedExercise[]; unknown: string[] }> {
  const valid: ParsedExercise[] = []
  const unknown: string[] = []

  for (const exercise of exercises) {
    const normalizedName = exercise.name.toLowerCase().trim()
    // Check direct match or alias
    if (exerciseDb.has(normalizedName)) {
      valid.push(exercise)
    } else {
      // Try fuzzy match
      const match = findClosestExercise(normalizedName, exerciseDb)
      if (match) {
        valid.push({ ...exercise, name: match })
      } else {
        unknown.push(exercise.name)
      }
    }
  }

  return { valid, unknown }
}

// Simple fuzzy matching for exercise names
function findClosestExercise(
  name: string,
  exerciseDb: Map<string, string>
): string | null {
  const threshold = 0.7

  for (const [dbName] of exerciseDb) {
    const similarity = calculateSimilarity(name, dbName)
    if (similarity >= threshold) {
      return dbName
    }
  }

  return null
}

// Levenshtein distance based similarity
function calculateSimilarity(a: string, b: string): number {
  const longer = a.length > b.length ? a : b
  const shorter = a.length > b.length ? b : a

  if (longer.length === 0) return 1.0

  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[b.length][a.length]
}
