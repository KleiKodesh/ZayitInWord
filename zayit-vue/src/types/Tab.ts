// Navigation route within a tab
export interface TabRoute {
    type: 1 | 2 | 3 | 4 // Type: 1 = Landing page, 2 = BookViewer, 3 = Future search page, 4 = pdf in iframe
    title: string // Title for this route
    bookId?: number // For BookViewer routes
    lineIndex?: number // For BookViewer routes - initial scroll target (from TOC navigation)
    savedScrollLine?: number // Saved scroll position for this specific route (for session restore)
}

export interface Tab {
    id: number
    title: string // Current route title
    isActive: boolean
    navigationStack: TabRoute[] // History of navigation within this tab
    currentIndex: number // Current position in navigation stack (for back/forward)
    
    // Legacy properties for backward compatibility during migration
    type?: 1 | 2 | 3 | 4
    bookId?: number
    initialLineIndex?: number
    savedLineIndex?: number
}