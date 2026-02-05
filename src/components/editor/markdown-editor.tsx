'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useCallback } from 'react'

interface MarkdownEditorProps {
  content: string
  onChange: (content: string) => void
  onSave: () => void
}

export function MarkdownEditor({ content, onChange, onSave }: MarkdownEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4 font-mono text-sm',
          },
        },
        blockquote: {
          HTMLAttributes: {
            class:
              'border-l-4 border-primary-500 pl-4 italic text-neutral-600 dark:text-neutral-400',
          },
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading' && node.attrs.level === 1) {
            return 'Workout Name...'
          }
          return 'Start typing your workout...'
        },
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: convertMarkdownToHtml(content),
    editorProps: {
      attributes: {
        class: 'tiptap-editor prose dark:prose-invert max-w-none focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      const markdown = convertHtmlToMarkdown(editor.getHTML())
      onChange(markdown)
    },
  })

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        onSave()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onSave])

  // Update editor content when file changes
  useEffect(() => {
    if (editor && editor.getHTML() !== convertMarkdownToHtml(content)) {
      editor.commands.setContent(convertMarkdownToHtml(content))
    }
  }, [content, editor])

  if (!editor) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-neutral-400">Loading editor...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <EditorContent editor={editor} />
    </div>
  )
}

// Simple markdown to HTML converter
function convertMarkdownToHtml(markdown: string): string {
  let html = markdown
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    // Inline code
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>')
    // Lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    // Links (Obsidian style)
    .replace(
      /\[\[(.+?)\]\]/g,
      '<span class="internal-link text-accent-500 cursor-pointer hover:underline">[[$1]]</span>'
    )
    // Metadata highlighting
    .replace(
      /^(@\w+\s+.+)$/gm,
      '<p class="workout-meta text-primary-600 dark:text-primary-400 font-medium">$1</p>'
    )
    // Paragraphs
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')

  // Wrap in paragraph tags
  if (!html.startsWith('<')) {
    html = '<p>' + html + '</p>'
  }

  // Clean up consecutive blockquotes
  html = html.replace(/<\/blockquote>\s*<blockquote>/g, '')

  // Wrap list items in ul
  if (html.includes('<li>')) {
    html = html.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>')
  }

  return html
}

// Simple HTML to markdown converter
function convertHtmlToMarkdown(html: string): string {
  let markdown = html
    // Remove wrapper p tags
    .replace(/^<p>|<\/p>$/g, '')
    // Headers
    .replace(/<h1>(.*?)<\/h1>/g, '# $1\n')
    .replace(/<h2>(.*?)<\/h2>/g, '## $1\n')
    .replace(/<h3>(.*?)<\/h3>/g, '### $1\n')
    // Bold and italic
    .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
    .replace(/<em>(.*?)<\/em>/g, '*$1*')
    // Code
    .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, '```\n$1```\n')
    .replace(/<code>(.*?)<\/code>/g, '`$1`')
    // Blockquotes
    .replace(/<blockquote><p>(.*?)<\/p><\/blockquote>/g, '> $1\n')
    // Lists
    .replace(/<ul>([\s\S]*?)<\/ul>/g, '$1')
    .replace(/<li>(.*?)<\/li>/g, '- $1\n')
    // Links
    .replace(/<span class="internal-link[^"]*">\[\[(.*?)\]\]<\/span>/g, '[[$1]]')
    // Metadata
    .replace(/<p class="workout-meta[^"]*">(.*?)<\/p>/g, '$1\n')
    // Paragraphs and breaks
    .replace(/<\/p><p>/g, '\n\n')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<p>/g, '')
    .replace(/<\/p>/g, '\n')
    // Clean up HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')

  // Clean up extra newlines
  markdown = markdown.replace(/\n{3,}/g, '\n\n').trim()

  return markdown
}
