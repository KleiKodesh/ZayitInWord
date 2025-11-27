/**
 * Line Content Batcher
 * 
 * Batches multiple line content requests into a single database query
 * to improve performance and reduce database load.
 */

import { getBatchLineContent } from '../bridge/sqliteDb'

interface BatchRequest {
  bookId: number
  lineIndex: number
  resolve: (content: string | null) => void
}

class LineBatcher {
  private queue: BatchRequest[] = []
  private timeout: number | null = null
  private readonly BATCH_DELAY = 10 // ms to wait before executing batch

  request(bookId: number, lineIndex: number): Promise<string | null> {
    return new Promise((resolve) => {
      this.queue.push({ bookId, lineIndex, resolve })
      
      if (this.timeout) {
        clearTimeout(this.timeout)
      }
      
      this.timeout = window.setTimeout(() => {
        this.executeBatch()
      }, this.BATCH_DELAY)
    })
  }

  private async executeBatch() {
    if (this.queue.length === 0) return
    
    const batch = this.queue.splice(0)
    this.timeout = null
    
    // Group by bookId
    const byBook = new Map<number, BatchRequest[]>()
    for (const req of batch) {
      if (!byBook.has(req.bookId)) {
        byBook.set(req.bookId, [])
      }
      byBook.get(req.bookId)!.push(req)
    }
    
    // Execute each book's requests in a single batch query
    for (const [bookId, requests] of byBook) {
      const lineIndices = requests.map(r => r.lineIndex)
      const contentMap = await getBatchLineContent(bookId, lineIndices)
      
      // Resolve all requests with their content
      for (const req of requests) {
        req.resolve(contentMap.get(req.lineIndex) || null)
      }
    }
  }
}

export const lineBatcher = new LineBatcher()
