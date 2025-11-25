export interface Tab {
    id: number
    title: string
    isActive: boolean
    type: 1 | 2 | 3 | 4 // Type: 1 = Landing page, 2 = BookViewer, 3 = Future search page, 4 = pdf in iframe
    bookId?: number // For BookViewer tabs
    initialLineId?: number // For BookViewer tabs - scroll to this line
}