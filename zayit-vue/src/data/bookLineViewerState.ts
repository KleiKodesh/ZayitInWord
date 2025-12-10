/**
 * BookLineViewerState
 * 
 * Manages line loading state and strategy for a single BookLineViewer instance.
 * Handles buffer management, background loading, and coordinating between DB and UI.
 */

import { ref, type Ref } from 'vue'
import { bookLinesLoader, type LineLoadResult } from './bookLinesManager'

const PADDING_LINES = 100

export class BookLineViewerState {
    // Public reactive state
    lines: Ref<Record<number, string>> = ref({})
    totalLines: Ref<number> = ref(0)
    bufferUpdateCount: Ref<number> = ref(0) // Reactive counter for buffer updates
    isInitialLoad = true

    // Private state
    private lineBuffer: Record<number, string> = {}
    private backgroundAbort: (() => void) | null = null
    private bookId: number | null = null
    private shouldBufferInsteadOfRender = false

    /**
     * Enable or disable buffering mode for background loading
     * When enabled, lines are stored in memory buffer instead of being rendered
     */
    setBufferingMode(enabled: boolean) {
        this.shouldBufferInsteadOfRender = enabled
    }

    /**
     * Clean up non-visible lines to free memory
     * Removes from UI but keeps in buffer (buffer is always complete)
     */
    cleanupNonVisibleLines(visibleLines: Set<number>, bufferSize = PADDING_LINES) {
        const linesToKeep = new Set<number>()

        // Calculate which lines to keep in UI (visible + buffer)
        visibleLines.forEach(lineIndex => {
            for (let i = Math.max(0, lineIndex - bufferSize);
                i <= Math.min(this.totalLines.value - 1, lineIndex + bufferSize);
                i++) {
                linesToKeep.add(i)
            }
        })

        // Remove non-visible lines from UI (but keep in buffer)
        Object.keys(this.lines.value).forEach(indexStr => {
            const lineIndex = Number(indexStr)
            if (!linesToKeep.has(lineIndex)) {
                const content = this.lines.value[lineIndex]
                if (content && content !== '\u00A0') {
                    // Content already in buffer, just remove from UI
                    delete this.lines.value[lineIndex]
                }
            }
        })
    }

    /**
     * Load a new book
     */
    async loadBook(bookId: number, isRestore: boolean, initialLineIndex?: number): Promise<void> {
        console.log('📚 Loading book:', bookId, 'isRestore:', isRestore, 'initialLineIndex:', initialLineIndex)

        this.cleanup()

        this.bookId = bookId
        this.isInitialLoad = true
        this.totalLines.value = 0
        this.lines.value = {}

        try {
            this.totalLines.value = await bookLinesLoader.getTotalLines(bookId)

            // Start background buffer loading immediately
            this.startBackgroundLoading()

            // Only load initial content if restoring
            if (isRestore && initialLineIndex !== undefined) {
                await this.loadLinesAround(initialLineIndex)
            }

            this.isInitialLoad = false
        } catch (error) {
            console.error('❌ Failed to load book:', error)
            this.totalLines.value = 0
            throw error
        }
    }

    /**
     * Load lines around a center point (from buffer first, then DB)
     * This is called by intersection observer for immediate UI rendering
     */
    async loadLinesAround(centerLine: number, padding = PADDING_LINES): Promise<void> {
        const start = Math.max(0, centerLine - padding)
        const end = Math.min(this.totalLines.value - 1, centerLine + padding)

        // First check buffer for already loaded lines
        for (let i = start; i <= end; i++) {
            const bufferedLine = this.lineBuffer[i]
            if (this.lines.value[i] === undefined && bufferedLine !== undefined) {
                this.lines.value[i] = bufferedLine
                // Keep in buffer too - don't delete
            }
        }

        // Then load missing lines from DB
        const needsLoading: number[] = []
        for (let i = start; i <= end; i++) {
            if (this.lines.value[i] === undefined && this.lineBuffer[i] === undefined) {
                needsLoading.push(i)
            }
        }

        if (needsLoading.length > 0 && this.bookId !== null) {
            const firstLine = needsLoading[0]!
            const lastLine = needsLoading[needsLoading.length - 1]!
            const loadedLines = await bookLinesLoader.loadLineRange(this.bookId, firstLine, lastLine)
            loadedLines.forEach(line => {
                // Add to both UI and buffer immediately
                this.lines.value[line.lineIndex] = line.content
                this.lineBuffer[line.lineIndex] = line.content
            })
        }
    }

    /**
     * Handle TOC selection - stop background loading, load selected area, apply buffer
     */
    async handleTocSelection(lineIndex: number): Promise<void> {
        // Stop background loading
        this.stopBackgroundLoading()

        // Load selected ± padding (from buffer if available, else DB)
        await this.loadLinesAround(lineIndex, PADDING_LINES)

        // Apply remaining buffer to UI (non-blocking)
        setTimeout(() => {
            Object.assign(this.lines.value, this.lineBuffer)
            this.lineBuffer = {}
        }, 0)
    }

    /**
     * Start background loading of all lines
     * Only buffers content, doesn't render to UI - intersection observer handles rendering
     */
    private startBackgroundLoading() {
        if (this.bookId === null || this.totalLines.value === 0) return

        // Delay start to let UI render first
        setTimeout(() => {
            if (this.bookId === null) return

            this.backgroundAbort = bookLinesLoader.startBackgroundLoad(
                this.bookId,
                this.totalLines.value,
                (loadedLines: LineLoadResult[]) => {
                    // Only buffer content, don't render to UI
                    // Intersection observer will move from buffer to UI when needed
                    let hasNewContent = false
                    loadedLines.forEach(line => {
                        if (this.lines.value[line.lineIndex] === undefined &&
                            this.lineBuffer[line.lineIndex] === undefined) {

                            // Always buffer, never directly render
                            this.lineBuffer[line.lineIndex] = line.content
                            hasNewContent = true
                        }
                    })

                    // Trigger reactive update for search
                    if (hasNewContent) {
                        this.bufferUpdateCount.value++
                    }
                }
            )
        }, 100)
    }

    /**
     * Stop background loading
     */
    private stopBackgroundLoading() {
        if (this.backgroundAbort) {
            this.backgroundAbort()
            this.backgroundAbort = null
        }
    }

    /**
     * Get all lines from buffer for search (buffer is source of truth)
     */
    getBufferLinesForSearch(): Array<{ index: number, content: string }> {
        const allLines: Array<{ index: number, content: string }> = []

        // Debug: log buffer size
        console.log('Buffer size for search:', Object.keys(this.lineBuffer).length)

        // Only search the buffer - it contains all loaded content
        Object.entries(this.lineBuffer).forEach(([indexStr, content]) => {
            if (content && content !== '\u00A0') {
                allLines.push({
                    index: Number(indexStr),
                    content
                })
            }
        })

        console.log('Search lines found:', allLines.length)
        return allLines.sort((a, b) => a.index - b.index)
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.stopBackgroundLoading()
        this.lineBuffer = {}
    }
}
