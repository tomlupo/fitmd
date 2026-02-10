'use client'

import { useState, useCallback, useEffect } from 'react'
import type { VaultFile, FileTreeNode } from '@/types'
import { extractLinks, extractTags, extractMetadata, generatePath } from '@/lib/utils'

const STORAGE_KEY = 'fitmd-vault'

export function useVault() {
  const [files, setFiles] = useState<VaultFile[]>([])
  const [activeFile, setActiveFile] = useState<VaultFile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as VaultFile[]
        // Restore dates
        const filesWithDates = parsed.map((f) => ({
          ...f,
          createdAt: new Date(f.createdAt),
          updatedAt: new Date(f.updatedAt),
        }))
        setFiles(filesWithDates)
        if (filesWithDates.length > 0) {
          setActiveFile(filesWithDates[0])
        }
      }
    } catch (e) {
      console.error('Failed to load vault:', e)
      setError('Failed to load saved files')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save to localStorage whenever files change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(files))
    }
  }, [files, isLoading])

  // Create a new file
  const createFile = useCallback(
    (folder: VaultFile['folder'], title: string, content = ''): VaultFile => {
      const path = generatePath(folder, title)
      const initialContent = content || `# ${title}\n\n`

      const newFile: VaultFile = {
        id: crypto.randomUUID(),
        path,
        title,
        content: initialContent,
        folder,
        tags: extractTags(initialContent),
        links: extractLinks(initialContent),
        metadata: extractMetadata(initialContent),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      setFiles((prev) => [...prev, newFile])
      setActiveFile(newFile)
      return newFile
    },
    []
  )

  // Update a file
  const updateFile = useCallback(
    (fileId: string, updates: Partial<Pick<VaultFile, 'title' | 'content' | 'folder'>>) => {
      setFiles((prev) =>
        prev.map((f) => {
          if (f.id !== fileId) return f

          const updatedContent = updates.content ?? f.content
          const updatedTitle = updates.title ?? f.title
          const updatedFolder = updates.folder ?? f.folder

          const updated: VaultFile = {
            ...f,
            title: updatedTitle,
            content: updatedContent,
            folder: updatedFolder,
            path: generatePath(updatedFolder, updatedTitle),
            tags: extractTags(updatedContent),
            links: extractLinks(updatedContent),
            metadata: extractMetadata(updatedContent),
            updatedAt: new Date(),
          }

          // Update active file if it's the one being edited
          if (activeFile?.id === fileId) {
            setActiveFile(updated)
          }

          return updated
        })
      )
    },
    [activeFile]
  )

  // Delete a file
  const deleteFile = useCallback(
    (fileId: string) => {
      setFiles((prev) => prev.filter((f) => f.id !== fileId))

      // Clear active file if it was deleted
      if (activeFile?.id === fileId) {
        setActiveFile((prev) => {
          const remaining = files.filter((f) => f.id !== fileId)
          return remaining[0] || null
        })
      }
    },
    [activeFile, files]
  )

  // Get files by folder
  const getFilesByFolder = useCallback(
    (folder: VaultFile['folder']) => {
      return files.filter((f) => f.folder === folder)
    },
    [files]
  )

  // Search files
  const searchFiles = useCallback(
    (query: string) => {
      const lowerQuery = query.toLowerCase()
      return files.filter(
        (f) =>
          f.title.toLowerCase().includes(lowerQuery) ||
          f.content.toLowerCase().includes(lowerQuery) ||
          f.tags.some((t) => t.toLowerCase().includes(lowerQuery))
      )
    },
    [files]
  )

  // Build file tree
  const getFileTree = useCallback((): FileTreeNode[] => {
    const folders: VaultFile['folder'][] = ['workouts', 'plans', 'logs', 'notes', 'clients']

    return folders.map((folder) => ({
      id: folder,
      name: folder.charAt(0).toUpperCase() + folder.slice(1),
      type: 'folder' as const,
      path: `/${folder}`,
      children: files
        .filter((f) => f.folder === folder)
        .map((f) => ({
          id: f.id,
          name: f.title,
          type: 'file' as const,
          path: f.path,
          file: f,
        })),
    }))
  }, [files])

  // Export vault
  const exportVault = useCallback(() => {
    const data = JSON.stringify(files, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fitmd-vault-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [files])

  // Import vault
  const importVault = useCallback((jsonData: string) => {
    try {
      const imported = JSON.parse(jsonData) as VaultFile[]
      const filesWithDates = imported.map((f) => ({
        ...f,
        createdAt: new Date(f.createdAt),
        updatedAt: new Date(f.updatedAt),
      }))
      setFiles(filesWithDates)
      setActiveFile(filesWithDates[0] || null)
    } catch (e) {
      setError('Invalid import file')
      throw new Error('Invalid import file')
    }
  }, [])

  return {
    files,
    activeFile,
    isLoading,
    error,
    setActiveFile,
    createFile,
    updateFile,
    deleteFile,
    getFilesByFolder,
    searchFiles,
    getFileTree,
    exportVault,
    importVault,
  }
}
