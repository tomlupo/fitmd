// ==================== Workout Parser Types ====================

export interface ParsedWorkout {
  name: string
  metadata: WorkoutMetadata
  exercises: ParsedExercise[]
  isValid: boolean
  errors: string[]
}

export interface WorkoutMetadata {
  duration?: number // minutes
  goal?: string
  tags?: string[]
  notes?: string
}

export interface ParsedExercise {
  name: string
  sets: ParsedSet[]
  restSeconds?: number
  rpe?: number
  notes?: string
  isSuperset: boolean
  supersetGroup?: number
}

export interface ParsedSet {
  reps: string // Can be "5" or "8-12" or "AMRAP"
  weight?: number
  unit?: 'kg' | 'lbs'
  isWarmup?: boolean
}

// ==================== Workout Execution Types ====================

export interface WorkoutState {
  sessionId: string
  templateId?: string
  name: string
  status: 'idle' | 'running' | 'paused' | 'rest' | 'completed'
  currentExerciseIndex: number
  currentSetIndex: number
  exercises: ExecutionExercise[]
  startedAt?: Date
  totalTime: number // seconds
  restTimeRemaining: number // seconds
}

export interface ExecutionExercise {
  id: string
  exerciseId: string
  name: string
  sets: ExecutionSet[]
  restSeconds: number
  isSuperset: boolean
  supersetGroup?: number
  notes?: string
}

export interface ExecutionSet {
  id: string
  setNumber: number
  targetReps: number
  targetWeight?: number
  actualReps?: number
  actualWeight?: number
  rpe?: number
  isWarmup: boolean
  isCompleted: boolean
  completedAt?: Date
}

// ==================== Analytics Types ====================

export interface WeeklyVolume {
  week: string // ISO week string
  volume: number // total reps * weight
  sessions: number
  exercises: Record<string, number> // exercise -> volume
}

export interface PersonalRecord {
  exerciseId: string
  exerciseName: string
  type: 'weight' | 'reps' | 'volume'
  value: number
  previousValue?: number
  achievedAt: Date
  sessionId: string
}

export interface ProgressData {
  exerciseId: string
  exerciseName: string
  data: {
    date: string
    maxWeight: number
    maxReps: number
    volume: number
  }[]
}

export interface ComplianceStats {
  planned: number
  completed: number
  skipped: number
  percentage: number
  streak: number
}

// ==================== AI Coach Types ====================

export interface AICoachRequest {
  type: 'generate' | 'adapt' | 'suggest' | 'periodize'
  goals?: string[]
  availableTime?: number // minutes
  equipment?: string[]
  fatigueLevel?: number // 1-10
  history?: WorkoutHistorySummary
  currentPlan?: string // markdown
  preferences?: UserPreferences
}

export interface AICoachResponse {
  markdown: string
  reasoning?: string
  suggestions?: string[]
  warnings?: string[]
}

export interface WorkoutHistorySummary {
  recentSessions: number
  weeklyVolume: number
  frequencyPerWeek: number
  topExercises: { name: string; frequency: number }[]
  recentPRs: string[]
}

export interface UserPreferences {
  preferredExercises?: string[]
  avoidExercises?: string[]
  workoutDuration?: number
  daysPerWeek?: number
  goals?: string[]
}

// ==================== File System Types ====================

export interface VaultFile {
  id: string
  path: string
  title: string
  content: string
  folder: 'workouts' | 'plans' | 'logs' | 'notes' | 'clients'
  tags: string[]
  links: string[]
  metadata: Record<string, string | number>
  createdAt: Date
  updatedAt: Date
}

export interface FileTreeNode {
  id: string
  name: string
  type: 'file' | 'folder'
  path: string
  children?: FileTreeNode[]
  file?: VaultFile
}

// ==================== Editor Types ====================

export interface EditorState {
  activeFile: VaultFile | null
  isModified: boolean
  isSaving: boolean
  lastSaved?: Date
}

export interface NormalizationResult {
  original: string
  normalized: string
  diff: DiffLine[]
  isChanged: boolean
}

export interface DiffLine {
  type: 'unchanged' | 'added' | 'removed'
  content: string
  lineNumber: number
}

// ==================== UI State Types ====================

export type AppMode = 'notebook' | 'workout' | 'analytics' | 'coach'

export interface AppState {
  mode: AppMode
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'
}

// ==================== Export Types ====================

export interface ExportOptions {
  format: 'csv' | 'json' | 'markdown'
  dateRange?: {
    start: Date
    end: Date
  }
  includeMetadata: boolean
}

export interface CSVExportRow {
  date: string
  session: string
  exercise: string
  setNumber: number
  reps: number
  weight: number
  rpe?: number
  volume: number
}
