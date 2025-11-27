export interface Tab {
    id: number
    title: string
    isActive: boolean
    type: 1 | 2 | 3 | 4 // Type: 1 = Landing page, 2 = BookViewer, 3 = Future search page, 4 = pdf in iframe
    bookId?: number // For BookViewer tabs
    initialLineIndex?: number // For BookViewer tabs - scroll to this line index (only used once, not persisted)
    savedLineIndex?: number // For BookViewer tabs - line at top of viewport for session restore
}