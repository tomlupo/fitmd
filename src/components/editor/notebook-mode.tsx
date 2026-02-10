'use client'

import { useState, useCallback } from 'react'
import { FileTree } from './file-tree'
import { MarkdownEditor } from './markdown-editor'
import { EditorToolbar } from './editor-toolbar'
import type { VaultFile } from '@/types'
import { cn } from '@/lib/utils'
import { FolderTree, Sparkles, Save, Clock } from 'lucide-react'

// Demo vault files for initial state
const DEMO_FILES: VaultFile[] = [
  {
    id: '1',
    path: '/workouts/push-day.md',
    title: 'Push Day',
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

## Superset
## Lateral Raise
3x12 @10kg

## Tricep Pushdown
3x12 @25kg
rest 60s

## Push-ups
3xAMRAP
rest 60s

> Focus on mind-muscle connection
> Control the eccentric phase
`,
    folder: 'workouts',
    tags: ['push', 'hypertrophy', 'chest'],
    links: [],
    metadata: { duration: 45, goal: 'hypertrophy' },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    path: '/workouts/pull-day.md',
    title: 'Pull Day',
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
rpe 7

## Bicep Curl
3x12 @12kg
rest 60s
`,
    folder: 'workouts',
    tags: ['pull', 'strength', 'back'],
    links: [],
    metadata: { duration: 50, goal: 'strength' },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    path: '/workouts/leg-day.md',
    title: 'Leg Day',
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
rpe 8

## Bulgarian Split Squat
3x10 @20kg
rest 60s
rpe 8

## Calf Raise
4x15 @60kg
rest 60s
`,
    folder: 'workouts',
    tags: ['legs', 'hypertrophy', 'squat'],
    links: [],
    metadata: { duration: 60, goal: 'hypertrophy' },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    path: '/plans/4-week-strength.md',
    title: '4-Week Strength Block',
    content: `# 4-Week Strength Block

@weeks 4
@goal strength
@frequency 4x/week

## Overview

Progressive overload focus with linear periodization.

## Week 1-2: Volume Phase
- Higher reps (6-8)
- Moderate intensity (70-75%)
- Build work capacity

## Week 3-4: Intensity Phase
- Lower reps (3-5)
- Higher intensity (80-85%)
- Peak strength

## Schedule

### Monday: [[Push Day]]
### Tuesday: [[Pull Day]]
### Thursday: [[Leg Day]]
### Friday: Upper accessories

## Notes
- Deload in week 5 if needed
- Track RPE for auto-regulation
`,
    folder: 'plans',
    tags: ['plan', 'strength', '4-week'],
    links: ['Push Day', 'Pull Day', 'Leg Day'],
    metadata: { weeks: 4, goal: 'strength' },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export function NotebookMode() {
  const [files, setFiles] = useState<VaultFile[]>(DEMO_FILES)
  const [activeFile, setActiveFile] = useState<VaultFile | null>(DEMO_FILES[0])
  const [isModified, setIsModified] = useState(false)
  const [showFileTree, setShowFileTree] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const handleFileSelect = useCallback((file: VaultFile) => {
    setActiveFile(file)
    setIsModified(false)
  }, [])

  const handleContentChange = useCallback(
    (content: string) => {
      if (!activeFile) return

      setActiveFile((prev) => (prev ? { ...prev, content } : null))
      setIsModified(true)
    },
    [activeFile]
  )

  const handleSave = useCallback(() => {
    if (!activeFile) return

    setFiles((prev) =>
      prev.map((f) => (f.id === activeFile.id ? { ...activeFile, updatedAt: new Date() } : f))
    )
    setIsModified(false)
    setLastSaved(new Date())
  }, [activeFile])

  const handleCreateFile = useCallback(
    (folder: string, title: string) => {
      const newFile: VaultFile = {
        id: crypto.randomUUID(),
        path: `/${folder}/${title.toLowerCase().replace(/\s+/g, '-')}.md`,
        title,
        content: `# ${title}\n\n`,
        folder: folder as VaultFile['folder'],
        tags: [],
        links: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setFiles((prev) => [...prev, newFile])
      setActiveFile(newFile)
    },
    []
  )

  const handleDeleteFile = useCallback(
    (fileId: string) => {
      setFiles((prev) => prev.filter((f) => f.id !== fileId))
      if (activeFile?.id === fileId) {
        setActiveFile(files[0] || null)
      }
    },
    [activeFile, files]
  )

  return (
    <div className="flex h-full">
      {/* File Tree Sidebar */}
      <div
        className={cn(
          'border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 transition-all duration-300 overflow-hidden',
          showFileTree ? 'w-64' : 'w-0'
        )}
      >
        <FileTree
          files={files}
          activeFileId={activeFile?.id}
          onFileSelect={handleFileSelect}
          onCreateFile={handleCreateFile}
          onDeleteFile={handleDeleteFile}
        />
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFileTree(!showFileTree)}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title={showFileTree ? 'Hide file tree' : 'Show file tree'}
            >
              <FolderTree className="w-5 h-5 text-neutral-500" />
            </button>

            {activeFile && (
              <div className="flex items-center gap-2">
                <span className="font-medium">{activeFile.title}</span>
                {isModified && (
                  <span className="w-2 h-2 rounded-full bg-amber-500" title="Unsaved changes" />
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {lastSaved && (
              <span className="text-xs text-neutral-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}

            <button
              onClick={handleSave}
              disabled={!isModified}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                isModified
                  ? 'bg-primary-500 text-white hover:bg-primary-600'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
              )}
            >
              <Save className="w-4 h-4" />
              Save
            </button>

            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:opacity-90 transition-opacity">
              <Sparkles className="w-4 h-4" />
              AI Normalize
            </button>
          </div>
        </div>

        {/* Editor Toolbar */}
        {activeFile && <EditorToolbar />}

        {/* Editor Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          {activeFile ? (
            <MarkdownEditor
              content={activeFile.content}
              onChange={handleContentChange}
              onSave={handleSave}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-neutral-400">
              <div className="text-center">
                <FolderTree className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Select a file to start editing</p>
                <p className="text-sm mt-2">or create a new workout</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
