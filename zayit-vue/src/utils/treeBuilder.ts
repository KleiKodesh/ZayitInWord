/**
 * Tree Builder Utility
 * 
 * Builds category tree from flat JSON data returned by database queries.
 * Used by both C# and TypeScript to ensure consistent tree structure.
 */

import type { TreeData, Category } from '../types/Tree'
import type { Book } from '../types/Book'

interface CategoryFlat {
  id: number
  parentId: number
  title: string
  level: number
  path: string
}

interface BookFlat {
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
  path?: string
}

/**
 * Build tree from flat category and book data
 */
export function buildTreeFromFlat(
  categoriesFlat: CategoryFlat[],
  booksFlat: BookFlat[]
): TreeData {
  // Build lookup for books by category
  const booksByCategory = new Map<number, Book[]>()
  const allBooks: Book[] = []

  booksFlat.forEach(bookFlat => {
    const book: Book = {
      id: bookFlat.id,
      categoryId: bookFlat.categoryId,
      title: bookFlat.title,
      heShortDesc: bookFlat.heShortDesc,
      orderIndex: bookFlat.orderIndex,
      totalLines: bookFlat.totalLines,
      hasTargumConnection: bookFlat.hasTargumConnection,
      hasReferenceConnection: bookFlat.hasReferenceConnection,
      hasCommentaryConnection: bookFlat.hasCommentaryConnection,
      hasOtherConnection: bookFlat.hasOtherConnection,
      path: ''
    }

    allBooks.push(book)

    if (!booksByCategory.has(book.categoryId)) {
      booksByCategory.set(book.categoryId, [])
    }
    booksByCategory.get(book.categoryId)!.push(book)
  })

  // Build tree structure in memory
  const categoryDict = new Map<number, Category>()
  const roots: Category[] = []

  // Create category objects
  categoriesFlat.forEach(catFlat => {
    const cat: Category = {
      id: catFlat.id,
      parentId: catFlat.parentId,
      title: catFlat.title,
      level: catFlat.level,
      path: catFlat.path || '',
      children: [],
      books: []
    }

    categoryDict.set(cat.id, cat)

    // Check for root - parentId might be 0, null, or level is 0
    if (cat.parentId === 0 || cat.parentId === null || cat.level === 0) {
      roots.push(cat)
    }
  })

  // Link children to parents
  categoryDict.forEach(cat => {
    if (cat.parentId !== 0 && cat.parentId !== null && categoryDict.has(cat.parentId)) {
      categoryDict.get(cat.parentId)!.children.push(cat)
    }

    // Assign books to leaf categories
    const books = booksByCategory.get(cat.id)
    if (books) {
      cat.books = books
      // Build book path: parent path + category title (no trailing separator)
      const bookPath = cat.path ? cat.path + ' > ' + cat.title : cat.title
      books.forEach(book => {
        book.path = bookPath
      })
    }
  })

  return { tree: roots, allBooks }
}
