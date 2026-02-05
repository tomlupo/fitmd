'use client'

import { useState } from 'react'
import {
  Users,
  UserPlus,
  ChevronRight,
  Calendar,
  BarChart3,
  MessageSquare,
  FileText,
  Check,
  X,
  Clock,
  Dumbbell,
  Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Demo client data
const DEMO_CLIENTS = [
  {
    id: '1',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    avatar: null,
    goal: 'Muscle gain',
    plan: '4-Week Strength Block',
    compliance: 92,
    lastSession: '2024-01-15',
    sessionsThisWeek: 4,
    notes: 'Great progress on squats. Considering increasing volume.',
  },
  {
    id: '2',
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    avatar: null,
    goal: 'Fat loss',
    plan: 'HIIT + Strength Hybrid',
    compliance: 78,
    lastSession: '2024-01-14',
    sessionsThisWeek: 3,
    notes: 'Struggling with consistency. Consider adjusting schedule.',
  },
  {
    id: '3',
    name: 'Mike Thompson',
    email: 'mike@example.com',
    avatar: null,
    goal: 'General fitness',
    plan: 'Full Body 3x/week',
    compliance: 100,
    lastSession: '2024-01-15',
    sessionsThisWeek: 3,
    notes: 'Very consistent. Ready for progression.',
  },
]

type ViewMode = 'list' | 'detail'

export function CoachMode() {
  const [view, setView] = useState<ViewMode>('list')
  const [selectedClient, setSelectedClient] = useState<(typeof DEMO_CLIENTS)[0] | null>(null)
  const [showAddClient, setShowAddClient] = useState(false)

  const handleSelectClient = (client: (typeof DEMO_CLIENTS)[0]) => {
    setSelectedClient(client)
    setView('detail')
  }

  const handleBack = () => {
    setSelectedClient(null)
    setView('list')
  }

  return (
    <div className="h-full overflow-hidden bg-neutral-50 dark:bg-neutral-950 flex">
      {/* Client List Sidebar */}
      <div
        className={cn(
          'border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition-all duration-300',
          view === 'list' ? 'w-full md:w-80' : 'hidden md:block md:w-80'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-500" />
              Clients
            </h1>
            <button
              onClick={() => setShowAddClient(true)}
              className="p-2 rounded-lg bg-primary-500 text-white hover:bg-primary-400 transition-colors"
            >
              <UserPlus className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search clients..."
            className="input text-sm"
          />
        </div>

        {/* Client List */}
        <div className="overflow-auto h-[calc(100%-140px)]">
          {DEMO_CLIENTS.map((client) => (
            <button
              key={client.id}
              onClick={() => handleSelectClient(client)}
              className={cn(
                'w-full flex items-center gap-3 p-4 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors text-left',
                selectedClient?.id === client.id && 'bg-primary-50 dark:bg-primary-900/20'
              )}
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-lg">
                {client.name.charAt(0)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{client.name}</div>
                <div className="text-sm text-neutral-500 truncate">{client.goal}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full',
                      client.compliance >= 90
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : client.compliance >= 70
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    )}
                  >
                    {client.compliance}% compliance
                  </span>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-neutral-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Client Detail View */}
      {view === 'detail' && selectedClient && (
        <div className="flex-1 overflow-auto">
          {/* Mobile Back Button */}
          <div className="md:hidden p-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <button
              onClick={handleBack}
              className="text-primary-500 font-medium flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back
            </button>
          </div>

          {/* Client Header */}
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-2xl">
                {selectedClient.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{selectedClient.name}</h2>
                <p className="text-neutral-500">{selectedClient.email}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="badge badge-primary">{selectedClient.goal}</span>
                  <span className="text-sm text-neutral-500">
                    {selectedClient.plan}
                  </span>
                </div>
              </div>
              <button className="btn-primary">Edit</button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ClientStatCard
                icon={<Target className="w-5 h-5" />}
                label="Compliance"
                value={`${selectedClient.compliance}%`}
                color={selectedClient.compliance >= 90 ? 'green' : 'amber'}
              />
              <ClientStatCard
                icon={<Dumbbell className="w-5 h-5" />}
                label="This Week"
                value={`${selectedClient.sessionsThisWeek} sessions`}
              />
              <ClientStatCard
                icon={<Clock className="w-5 h-5" />}
                label="Last Active"
                value={selectedClient.lastSession}
              />
              <ClientStatCard
                icon={<Calendar className="w-5 h-5" />}
                label="Plan"
                value="Week 3 of 4"
              />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-neutral-200 dark:border-neutral-800">
              {['Schedule', 'Workouts', 'Progress', 'Messages'].map((tab) => (
                <button
                  key={tab}
                  className="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:border-primary-500 hover:text-primary-500 transition-colors"
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Weekly Schedule */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-500" />
                This Week's Schedule
              </h3>
              <div className="grid grid-cols-7 gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                  const hasWorkout = [0, 2, 4].includes(i) // M, W, F
                  const isCompleted = i < 3 // Past days

                  return (
                    <div
                      key={day}
                      className={cn(
                        'text-center p-3 rounded-lg',
                        hasWorkout
                          ? isCompleted
                            ? 'bg-primary-100 dark:bg-primary-900/30'
                            : 'bg-neutral-100 dark:bg-neutral-800'
                          : 'bg-neutral-50 dark:bg-neutral-900'
                      )}
                    >
                      <div className="text-xs text-neutral-500 mb-1">{day}</div>
                      {hasWorkout ? (
                        isCompleted ? (
                          <Check className="w-5 h-5 mx-auto text-primary-500" />
                        ) : (
                          <Dumbbell className="w-5 h-5 mx-auto text-neutral-400" />
                        )
                      ) : (
                        <div className="w-5 h-5 mx-auto text-neutral-300">-</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Assigned Workouts */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-500" />
                Assigned Workouts
              </h3>
              <div className="space-y-3">
                {['Push Day', 'Pull Day', 'Leg Day'].map((workout) => (
                  <div
                    key={workout}
                    className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-neutral-400" />
                      <span className="font-medium">{workout}</span>
                    </div>
                    <button className="text-sm text-primary-500 hover:underline">
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Coach Notes */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary-500" />
                Coach Notes
              </h3>
              <textarea
                defaultValue={selectedClient.notes}
                className="input min-h-[100px] resize-none"
                placeholder="Add notes about this client..."
              />
              <div className="flex justify-end mt-3">
                <button className="btn-primary text-sm">Save Notes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State when no client selected on desktop */}
      {view === 'list' && (
        <div className="hidden md:flex flex-1 items-center justify-center text-neutral-400">
          <div className="text-center">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Select a client to view details</p>
          </div>
        </div>
      )}

      {/* Add Client Modal (placeholder) */}
      {showAddClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Add New Client</h2>
              <button
                onClick={() => setShowAddClient(false)}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input type="text" className="input" placeholder="Client name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" className="input" placeholder="client@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Goal</label>
                <select className="input">
                  <option>Muscle gain</option>
                  <option>Fat loss</option>
                  <option>Strength</option>
                  <option>General fitness</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddClient(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button className="btn-primary flex-1">Add Client</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ClientStatCard({
  icon,
  label,
  value,
  color = 'primary',
}: {
  icon: React.ReactNode
  label: string
  value: string
  color?: 'primary' | 'green' | 'amber'
}) {
  const colors = {
    primary: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  }

  return (
    <div className="card p-4">
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-2', colors[color])}>
        {icon}
      </div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-sm text-neutral-500">{label}</div>
    </div>
  )
}
