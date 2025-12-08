import type { Book } from './Book'

export type PageType = 'landing' | 'bookview' | 'pdfview' | 'search' | 'settings' | 'about';

export interface BookState {
    bookId: number;
    bookTitle: string;
    initialLineIndex?: number; // Line index (0 to totalLines-1) representing which line should be at the top of the viewport. Set by TOC selection or saved from scroll position
    isTocOpen?: boolean; // Whether TOC overlay is open
    showBottomPane?: boolean; // Whether bottom pane of split view is visible
    hasConnections?: boolean; // Whether book has any connections (targum, reference, commentary, or other)
    selectedLineIndex?: number; // Currently selected line index for commentary
    commentaryGroupIndex?: number; // Currently selected commentary group index
}

export interface Tab {
    id: number;
    title: string;
    isActive: boolean;
    currentPage: PageType;
    bookState?: BookState;
}
