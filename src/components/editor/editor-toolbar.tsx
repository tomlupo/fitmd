'use client'

import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Link,
  Undo,
  Redo,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToolbarButtonProps {
  icon: typeof Bold
  label: string
  isActive?: boolean
  onClick: () => void
}

function ToolbarButton({ icon: Icon, label, isActive, onClick }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        'p-2 rounded-lg transition-colors',
        isActive
          ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100'
          : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
      )}
    >
      <Icon className="w-4 h-4" />
    </button>
  )
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-700 mx-1" />
}

export function EditorToolbar() {
  // In a real implementation, these would connect to the TipTap editor
  // For now, they're placeholder buttons
  const handleAction = (action: string) => {
    console.log('Toolbar action:', action)
    // Will connect to editor commands
  }

  return (
    <div className="flex items-center gap-0.5 px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 overflow-x-auto no-scrollbar">
      {/* History */}
      <ToolbarButton icon={Undo} label="Undo (⌘Z)" onClick={() => handleAction('undo')} />
      <ToolbarButton icon={Redo} label="Redo (⌘⇧Z)" onClick={() => handleAction('redo')} />

      <ToolbarDivider />

      {/* Headings */}
      <ToolbarButton icon={Heading1} label="Heading 1" onClick={() => handleAction('h1')} />
      <ToolbarButton icon={Heading2} label="Heading 2" onClick={() => handleAction('h2')} />

      <ToolbarDivider />

      {/* Formatting */}
      <ToolbarButton icon={Bold} label="Bold (⌘B)" onClick={() => handleAction('bold')} />
      <ToolbarButton icon={Italic} label="Italic (⌘I)" onClick={() => handleAction('italic')} />
      <ToolbarButton icon={Code} label="Code" onClick={() => handleAction('code')} />

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarButton icon={List} label="Bullet List" onClick={() => handleAction('bulletList')} />
      <ToolbarButton
        icon={ListOrdered}
        label="Numbered List"
        onClick={() => handleAction('orderedList')}
      />
      <ToolbarButton icon={Quote} label="Quote" onClick={() => handleAction('blockquote')} />

      <ToolbarDivider />

      {/* Links */}
      <ToolbarButton icon={Link} label="Internal Link [[]]" onClick={() => handleAction('link')} />

      {/* Workout-specific templates */}
      <div className="ml-auto flex items-center gap-1">
        <button
          onClick={() => handleAction('insertExercise')}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
        >
          + Exercise
        </button>
        <button
          onClick={() => handleAction('insertSuperset')}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
        >
          + Superset
        </button>
      </div>
    </div>
  )
}
