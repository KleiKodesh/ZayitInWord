export interface Tab {
  id: string
  title: string
  type: 'search' | 'book'
  bookId?: number
  scrollPosition?: number
  initialLineIndex?: number
}