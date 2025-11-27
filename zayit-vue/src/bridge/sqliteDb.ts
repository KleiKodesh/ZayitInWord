/**
 * SQLite Database Access for Development
 * 
 * Uses Vite dev server API to query database.
 * Only used in development mode.
 */

import type { TreeData } from '../types/Tree'
import { buildTreeFromFlat } from '../utils/treeBuilder'
import { buildTocFromFlat } from '../utils/tocBuilder'

/**
 * Execute SQL query via Vite dev server API
 */
async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  // In production, this should not be used
  if (import.meta.env.PROD) {
    throw new Error('SQLite API is only available in development mode')
  }

  try {
    const response = await fetch('/__db/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sql, params })
    })

    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.error)
    }

    return result.data
  } catch (error) {
    console.error('❌ Database query failed:', error)
    throw error
  }
}

/**
 * Build category tree from database using recursive CTE
 */
export async function getTree(): Promise<TreeData> {
  console.log('🌲 Building category tree...')
  
  // Use recursive CTE to get all categories with their path in a single query
  const categoriesWithPath = await query<{
    id: number
    parentId: number
    title: string
    level: number
    path: string
  }>(`
    WITH RECURSIVE CategoryPath AS (
      -- Base case: root categories (Level = 0)
      SELECT 
        Id as id,
        ParentId as parentId,
        Title as title,
        Level as level,
        '' AS path
      FROM category
      WHERE Level = 0
      
      UNION ALL
      
      -- Recursive case: child categories
      SELECT 
        c.Id as id,
        c.ParentId as parentId,
        c.Title as title,
        c.Level as level,
        CASE 
          WHEN cp.path = '' THEN cp.title
          ELSE cp.path || ' > ' || cp.title
        END AS path
      FROM category c
      INNER JOIN CategoryPath cp ON c.ParentId = cp.id
    )
    SELECT 
      id,
      parentId,
      title,
      level,
      path
    FROM CategoryPath
    ORDER BY level, id
  `)
  
  console.log('📊 Categories loaded:', categoriesWithPath.length)
  console.log('📊 Sample category:', categoriesWithPath[0])

  // Get all books in a single query
  const booksFlat = await query<{
    id: number
    categoryId: number
    title: string
    heShortDesc: string
    orderIndex: number
    totalLines: number
    hasTargumConnection: number
    hasReferenceConnection: number
    hasCommentaryConnection: number
    hasOtherConnection: number
  }>(`
    SELECT 
      Id as id,
      CategoryId as categoryId,
      Title as title,
      HeShortDesc as heShortDesc,
      OrderIndex as orderIndex,
      TotalLines as totalLines,
      HasTargumConnection as hasTargumConnection,
      HasReferenceConnection as hasReferenceConnection,
      HasCommentaryConnection as hasCommentaryConnection,
      HasOtherConnection as hasOtherConnection
    FROM book
  `)
  
  console.log('📚 Books loaded:', booksFlat.length)

  // Use shared tree builder utility
  const treeData = buildTreeFromFlat(categoriesWithPath, booksFlat)
  
  console.log('✅ Tree built successfully')
  console.log('📊 Sample root category:', treeData.tree[0])
  console.log('📊 Sample book:', treeData.allBooks[0])
  return treeData
}

/**
 * Get TOC data for a book
 * Returns flat data that matches C# format
 */
export async function getToc(bookId: number) {
  const tocEntriesFlat = await query<{
    id: number
    bookId: number
    parentId?: number | null
    textId: number
    level: number
    lineId: number
    isLastChild: number
    hasChildren: number
    text: string
    lineIndex: number
  }>(`
    SELECT DISTINCT
      te.id,
      te.bookId,
      te.parentId,
      te.textId,
      te.level,
      te.lineId,
      te.isLastChild,
      te.hasChildren,
      tt.text AS text,
      l.lineIndex
    FROM tocEntry AS te
    LEFT JOIN tocText AS tt 
      ON te.textId = tt.id
    LEFT JOIN line AS l 
      ON l.id = te.lineId
    WHERE te.bookId = ?
  `, [bookId])

  // Return flat data in same format as C#
  return { tocEntriesFlat }
}

/**
 * Get single line content by bookId and lineIndex
 */
export async function getLineContent(bookId: number, lineIndex: number): Promise<string | null> {
  const rows = await query<{ content: string }>(`
    SELECT content 
    FROM line 
    WHERE bookId = ? AND lineIndex = ?
  `, [bookId, lineIndex])

  return rows.length > 0 && rows[0] ? rows[0].content : null
}

/**
 * Get multiple lines content by bookId and lineIndices
 */
export async function getBatchLineContent(bookId: number, lineIndices: number[]): Promise<Map<number, string>> {
  if (lineIndices.length === 0) return new Map()
  
  // Create placeholders for IN clause
  const placeholders = lineIndices.map(() => '?').join(',')
  
  const rows = await query<{ lineIndex: number; content: string }>(`
    SELECT lineIndex, content 
    FROM line 
    WHERE bookId = ? AND lineIndex IN (${placeholders})
  `, [bookId, ...lineIndices])

  const result = new Map<number, string>()
  for (const row of rows) {
    result.set(row.lineIndex, row.content)
  }
  
  return result
}

/**
 * Get total line count for a book
 */
export async function getBookLineCount(bookId: number): Promise<number> {
  const rows = await query<{ totalLines: number }>(`
    SELECT TotalLines as totalLines
    FROM book 
    WHERE Id = ?
  `, [bookId])

  return rows.length > 0 && rows[0] ? rows[0].totalLines : 0
}

/**
 * Get links for a line
 */
export async function getLinks(lineId: number) {
  const rows = await query<any>(`
    SELECT
      l.targetLineId,
      l.targetBookId,
      l.connectionTypeId,
      bk.title,
      ln.content
    FROM link l
    JOIN line ln ON ln.id = l.targetLineId
    JOIN book bk ON bk.id = l.targetBookId
    WHERE l.sourceLineId = ?
    ORDER BY l.connectionTypeId, bk.title
  `, [lineId])

  return rows.map(row => ({
    targetLineId: row.targetLineId,
    targetBookId: row.targetBookId,
    connectionTypeId: row.connectionTypeId,
    title: row.title,
    content: row.content
  }))
}

