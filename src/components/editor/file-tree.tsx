'use client'

import { useState } from 'react'
import type { VaultFile, FileTreeNode } from '@/types'
import { cn } from '@/lib/utils'
import {
  Folder,
  FileText,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  MoreVertical,
} from 'lucide-react'

interface FileTreeProps {
  files: VaultFile[]
  activeFileId?: string
  onFileSelect: (file: VaultFile) => void
  onCreateFile: (folder: string, title: string) => void
  onDeleteFile: (fileId: string) => void
}

const FOLDERS = [
  { id: 'workouts', name: 'Workouts', icon: '💪' },
  { id: 'plans', name: 'Plans', icon: '📋' },
  { id: 'logs', name: 'Logs', icon: '📝' },
  { id: 'notes', name: 'Notes', icon: '📓' },
]

export function FileTree({
  files,
  activeFileId,
  onFileSelect,
  onCreateFile,
  onDeleteFile,
}: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['workouts', 'plans'])
  )
  const [contextMenu, setContextMenu] = useState<{ fileId: string; x: number; y: number } | null>(
    null
  )
  const [newFileDialog, setNewFileDialog] = useState<string | null>(null)
  const [newFileName, setNewFileName] = useState('')

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  const getFilesInFolder = (folder: string) => {
    return files.filter((f) => f.folder === folder)
  }

  const handleCreateFile = (folder: string) => {
    if (!newFileName.trim()) return
    onCreateFile(folder, newFileName.trim())
    setNewFileName('')
    setNewFileDialog(null)
  }

  const handleContextMenu = (e: React.MouseEvent, fileId: string) => {
    e.preventDefault()
    setContextMenu({ fileId, x: e.clientX, y: e.clientY })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-neutral-200 dark:border-neutral-800">
        <h2 className="font-semibold text-sm text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
          Vault
        </h2>
      </div>

      {/* Folder Tree */}
      <div className="flex-1 overflow-auto p-2">
        {FOLDERS.map((folder) => {
          const folderFiles = getFilesInFolder(folder.id)
          const isExpanded = expandedFolders.has(folder.id)

          return (
            <div key={folder.id} className="mb-1">
              {/* Folder Header */}
              <div
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer group"
                onClick={() => toggleFolder(folder.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-neutral-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-neutral-500" />
                )}
                <span className="mr-1">{folder.icon}</span>
                <span className="flex-1 text-sm font-medium">{folder.name}</span>
                <span className="text-xs text-neutral-400">{folderFiles.length}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setNewFileDialog(folder.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-opacity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Files */}
              {isExpanded && (
                <div className="ml-4 mt-1 space-y-0.5">
                  {/* New File Input */}
                  {newFileDialog === folder.id && (
                    <div className="flex items-center gap-1 px-2 py-1">
                      <FileText className="w-4 h-4 text-neutral-400" />
                      <input
                        type="text"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateFile(folder.id)
                          if (e.key === 'Escape') setNewFileDialog(null)
                        }}
                        placeholder="File name..."
                        className="flex-1 text-sm bg-transparent border-b border-primary-500 outline-none px-1 py-0.5"
                        autoFocus
                      />
                    </div>
                  )}

                  {folderFiles.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => onFileSelect(file)}
                      onContextMenu={(e) => handleContextMenu(e, file.id)}
                      className={cn(
                        'flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer group transition-colors',
                        activeFileId === file.id
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'hover:bg-neutral-200 dark:hover:bg-neutral-800'
                      )}
                    >
                      <FileText className="w-4 h-4 flex-shrink-0 opacity-60" />
                      <span className="flex-1 text-sm truncate">{file.title}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleContextMenu(e, file.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-opacity"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {folderFiles.length === 0 && !newFileDialog && (
                    <div className="px-2 py-2 text-xs text-neutral-400 italic">No files</div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-50 bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 min-w-[120px]"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              onClick={() => {
                onDeleteFile(contextMenu.fileId)
                setContextMenu(null)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  )
}
