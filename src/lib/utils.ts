import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function formatWeight(weight: number, unit: 'kg' | 'lbs' = 'kg'): string {
  return `${weight}${unit}`
}

export function formatVolume(volume: number): string {
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M`
  }
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K`
  }
  return volume.toString()
}

export function calculateVolume(reps: number, weight: number): number {
  return reps * weight
}

export function parseReps(repsString: string): { min: number; max: number } {
  if (repsString.toUpperCase() === 'AMRAP') {
    return { min: 1, max: 99 }
  }

  if (repsString.includes('-')) {
    const [min, max] = repsString.split('-').map(Number)
    return { min, max }
  }

  const fixed = parseInt(repsString, 10)
  return { min: fixed, max: fixed }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function generatePath(folder: string, title: string): string {
  return `/${folder}/${slugify(title)}.md`
}

export function extractLinks(content: string): string[] {
  const linkRegex = /\[\[(.*?)\]\]/g
  const matches = content.matchAll(linkRegex)
  return [...matches].map((m) => m[1])
}

export function extractTags(content: string): string[] {
  const tagRegex = /#([a-zA-Z0-9_-]+)/g
  const matches = content.matchAll(tagRegex)
  return [...matches].map((m) => m[1])
}

export function extractMetadata(content: string): Record<string, string | number> {
  const metadata: Record<string, string | number> = {}
  const metaRegex = /@(\w+)\s+(.+)/g
  const matches = content.matchAll(metaRegex)

  for (const match of matches) {
    const key = match[1]
    const value = match[2].trim()
    // Try to parse as number
    const numValue = parseFloat(value)
    metadata[key] = isNaN(numValue) ? value : numValue
  }

  return metadata
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

export function getWeekNumber(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`
}

export function getDateRange(period: 'week' | 'month' | 'year'): { start: Date; end: Date } {
  const now = new Date()
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  const start = new Date(now)
  start.setHours(0, 0, 0, 0)

  switch (period) {
    case 'week':
      start.setDate(start.getDate() - 7)
      break
    case 'month':
      start.setMonth(start.getMonth() - 1)
      break
    case 'year':
      start.setFullYear(start.getFullYear() - 1)
      break
  }

  return { start, end }
}
