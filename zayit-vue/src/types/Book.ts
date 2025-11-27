export interface Book {
  id: number
  categoryId: number
  title: string
  heShortDesc: string | null
  path?: string
  orderIndex: number
  totalLines: number
  hasTargumConnection: number
  hasReferenceConnection: number
  hasCommentaryConnection: number
  hasOtherConnection: number
}

export interface SearchResult {
  book: Book
  matchType: 'title' | 'description'
}
