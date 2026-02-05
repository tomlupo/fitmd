'use client'

import { useState } from 'react'
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Award,
  Download,
  ChevronDown,
  Dumbbell,
  Flame,
  Target,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatVolume } from '@/lib/utils'

type TimePeriod = 'week' | 'month' | 'year' | 'all'

// Demo data for analytics
const DEMO_DATA = {
  weeklyVolume: [
    { week: 'W1', volume: 45000, sessions: 4 },
    { week: 'W2', volume: 52000, sessions: 4 },
    { week: 'W3', volume: 48000, sessions: 3 },
    { week: 'W4', volume: 58000, sessions: 5 },
  ],
  prs: [
    { exercise: 'Bench Press', value: '100kg x 5', date: '2024-01-15', type: 'weight' },
    { exercise: 'Squat', value: '140kg x 3', date: '2024-01-12', type: 'weight' },
    { exercise: 'Deadlift', value: '180kg x 1', date: '2024-01-10', type: 'weight' },
    { exercise: 'Pull-ups', value: '15 reps', date: '2024-01-08', type: 'reps' },
  ],
  exerciseProgress: [
    { name: 'Bench Press', sessions: 12, volumeChange: 15 },
    { name: 'Squat', sessions: 10, volumeChange: 22 },
    { name: 'Deadlift', sessions: 8, volumeChange: 18 },
    { name: 'Pull-ups', sessions: 12, volumeChange: 8 },
    { name: 'Overhead Press', sessions: 8, volumeChange: 12 },
  ],
  stats: {
    totalSessions: 16,
    totalVolume: 203000,
    avgDuration: 52,
    streak: 8,
    compliance: 87,
  },
}

export function AnalyticsMode() {
  const [period, setPeriod] = useState<TimePeriod>('month')

  return (
    <div className="h-full overflow-auto bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-sm text-neutral-500">Track your progress and achievements</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Period Selector */}
            <div className="relative">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as TimePeriod)}
                className="appearance-none bg-neutral-100 dark:bg-neutral-800 rounded-lg px-4 py-2 pr-10 text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
                <option value="all">All Time</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
            </div>

            {/* Export Button */}
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-sm font-medium transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard
            icon={<Calendar className="w-5 h-5" />}
            label="Sessions"
            value={DEMO_DATA.stats.totalSessions.toString()}
            trend="+3 from last month"
            color="primary"
          />
          <StatCard
            icon={<Dumbbell className="w-5 h-5" />}
            label="Total Volume"
            value={`${formatVolume(DEMO_DATA.stats.totalVolume)}kg`}
            trend="+12% vs last month"
            color="primary"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Avg Duration"
            value={`${DEMO_DATA.stats.avgDuration}m`}
            color="neutral"
          />
          <StatCard
            icon={<Flame className="w-5 h-5" />}
            label="Streak"
            value={`${DEMO_DATA.stats.streak} days`}
            color="accent"
          />
          <StatCard
            icon={<Target className="w-5 h-5" />}
            label="Compliance"
            value={`${DEMO_DATA.stats.compliance}%`}
            color="primary"
          />
        </div>

        {/* Volume Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary-500" />
                Weekly Volume
              </h2>
              <p className="text-sm text-neutral-500">Training volume over time</p>
            </div>
          </div>

          {/* Simple Bar Chart */}
          <div className="h-64 flex items-end justify-around gap-4">
            {DEMO_DATA.weeklyVolume.map((week, i) => {
              const maxVolume = Math.max(...DEMO_DATA.weeklyVolume.map((w) => w.volume))
              const height = (week.volume / maxVolume) * 100

              return (
                <div key={week.week} className="flex-1 flex flex-col items-center">
                  <div className="text-sm font-medium mb-1">
                    {formatVolume(week.volume)}kg
                  </div>
                  <div
                    className="w-full bg-primary-500 rounded-t-lg transition-all duration-500 hover:bg-primary-400"
                    style={{ height: `${height}%` }}
                  />
                  <div className="mt-2 text-sm text-neutral-500">{week.week}</div>
                  <div className="text-xs text-neutral-400">{week.sessions} sessions</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Personal Records */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-accent-500" />
              Personal Records
            </h2>

            <div className="space-y-3">
              {DEMO_DATA.prs.map((pr, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                >
                  <div>
                    <div className="font-medium">{pr.exercise}</div>
                    <div className="text-sm text-neutral-500">{pr.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary-500">{pr.value}</div>
                    <div className="text-xs text-neutral-400 capitalize">{pr.type} PR</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Exercise Progress */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary-500" />
              Exercise Progress
            </h2>

            <div className="space-y-4">
              {DEMO_DATA.exerciseProgress.map((ex, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{ex.name}</span>
                    <span className="text-sm text-primary-500">+{ex.volumeChange}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (ex.volumeChange / 30) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-neutral-400">{ex.sessions} sessions</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Muscle Group Distribution (placeholder) */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Muscle Group Distribution</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { muscle: 'Chest', percentage: 22 },
              { muscle: 'Back', percentage: 25 },
              { muscle: 'Legs', percentage: 28 },
              { muscle: 'Shoulders', percentage: 15 },
              { muscle: 'Arms', percentage: 10 },
            ].map((item) => (
              <div key={item.muscle} className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-2">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-neutral-100 dark:text-neutral-800"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${item.percentage * 2.26} 226`}
                      className="text-primary-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-bold">
                    {item.percentage}%
                  </div>
                </div>
                <div className="text-sm font-medium">{item.muscle}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  trend,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  trend?: string
  color: 'primary' | 'accent' | 'neutral'
}) {
  const colors = {
    primary: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
    accent: 'bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400',
    neutral: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
  }

  return (
    <div className="card p-4">
      <div
        className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center mb-3',
          colors[color]
        )}
      >
        {icon}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-neutral-500">{label}</div>
      {trend && <div className="text-xs text-primary-500 mt-1">{trend}</div>}
    </div>
  )
}
