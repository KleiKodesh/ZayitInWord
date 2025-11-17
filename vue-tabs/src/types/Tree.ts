import type { Book } from './Book'

export interface Category {
  id: number
  parentId: number
  title: string
  fullCategory?: string | null
  level: number
  books: Book[]
  children: Category[]
}

export interface TreeData {
  tree: Category[]
  allBooks: Book[]
}
