/**
 * TOC Builder Utility
 * 
 * Builds TOC tree from flat JSON data returned by database queries.
 * Used by both C# and TypeScript to ensure consistent TOC structure.
 */

import type { TocEntry } from '../types/Toc'

interface TocEntryFlat {
  id: number
  bookId: number
  parentId?: number | null
  textId: number
  level: number
  lineId: number
  lineIndex: number
  isLastChild: boolean | number
  hasChildren: boolean | number
  text: string
}

/**
 * Build TOC tree from flat data
 */
export function buildTocFromFlat(tocEntriesFlat: TocEntryFlat[]): {
  tree: TocEntry[]
  allTocs: TocEntry[]
} {
  // Convert flat entries to TocEntry objects
  const allEntries: TocEntry[] = tocEntriesFlat.map(flat => ({
    id: flat.id,
    bookId: flat.bookId,
    parentId: flat.parentId || undefined,
    textId: flat.textId,
    level: flat.level,
    lineId: flat.lineId,
    lineIndex: flat.lineIndex,
    isLastChild: Boolean(flat.isLastChild),
    hasChildren: Boolean(flat.hasChildren),
    text: flat.text,
    path: '',
    children: []
  }))

  // Build tree structure
  const tree = buildTocChildren(undefined, allEntries)

  // Automatically expand the first root item
  if (tree.length > 0 && tree[0] && tree[0].hasChildren) {
    tree[0].isExpanded = true
  }

  return { tree, allTocs: allEntries }
}

function buildTocChildren(parentId: number | undefined, items: TocEntry[]): TocEntry[] {
  const parent = items.find(t => t.id === parentId)
  const children = items.filter(t => t.parentId === parentId)

  for (const child of children) {
    // Build path from parent's path + parent's text (no trailing separator)
    if (parent) {
      if (parent.path) {
        child.path = parent.path + ' > ' + parent.text
      } else {
        child.path = parent.text
      }
    }

    // Recursively build children
    if (child.hasChildren) {
      child.children = buildTocChildren(child.id, items)
    }
  }

  return children
}
