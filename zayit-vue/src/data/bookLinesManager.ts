/**
 * Book Lines Loader
 * 
 * Utility for loading book lines from database.
 * Simple and reusable - components manage their own state/cache.
 */

export interface LineLoadResult {
    lineIndex: number
    content: string
}

export class BookLinesLoader {
    private readonly batchSize = 200
    private loadingRanges = new Map<number, Set<string>>() // bookId -> Set of "start-end" ranges being loaded

    /**
     * Get total line count for a book
     */
    async getTotalLines(bookId: number): Promise<number> {
        const response = await fetch('/__db/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: `SELECT TotalLines as totalLines FROM book WHERE Id = ${bookId}`,
                params: []
            })
        })

        const result = await response.json()
        if (!result.success) throw new Error(result.error)

        return result.data[0]?.totalLines || 0
    }

    /**
     * Load a range of lines from database
     * Returns array of loaded lines
     */
    async loadLineRange(bookId: number, start: number, end: number): Promise<LineLoadResult[]> {
        const rangeKey = `${start}-${end}`

        // Check if this range is already being loaded
        if (!this.loadingRanges.has(bookId)) {
            this.loadingRanges.set(bookId, new Set())
        }
        const bookRanges = this.loadingRanges.get(bookId)!

        if (bookRanges.has(rangeKey)) {
            return []
        }

        bookRanges.add(rangeKey)

        try {
            const response = await fetch('/__db/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `SELECT lineIndex, content FROM line WHERE bookId = ${bookId} AND lineIndex >= ${start} AND lineIndex <= ${end} ORDER BY lineIndex`,
                    params: []
                })
            })

            const result = await response.json()
            if (!result.success) throw new Error(result.error)

            return result.data
        } catch (error) {
            console.error(`❌ Failed to load lines ${start}-${end}:`, error)
            throw error
        } finally {
            bookRanges.delete(rangeKey)
        }
    }

    /**
     * Start background loading of all lines in batches
     * Returns abort function
     */
    startBackgroundLoad(
        bookId: number,
        totalLines: number,
        onBatch: (lines: LineLoadResult[]) => void,
        onComplete?: () => void
    ): () => void {
        let aborted = false
        const abort = () => {
            aborted = true
        }

        const loadNextBatch = async (currentBatch: number) => {
            if (aborted) return

            const start = currentBatch * this.batchSize
            if (start >= totalLines) {
                onComplete?.()
                return
            }

            const end = Math.min(start + this.batchSize - 1, totalLines - 1)

            try {
                const lines = await this.loadLineRange(bookId, start, end)
                if (!aborted) {
                    onBatch(lines)
                    loadNextBatch(currentBatch + 1)
                }
            } catch (error) {
                console.error('Background load failed:', error)
            }
        }

        loadNextBatch(0)

        return abort
    }
}

// Export singleton instance
export const bookLinesLoader = new BookLinesLoader()
