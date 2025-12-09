/**
 * C# WebView2 Bridge
 * 
 * Handles communication between Vue frontend and C# backend via WebView2.
 * Uses promise-based request/response pattern.
 */

export class CSharpBridge {
    private pendingRequests = new Map<string, { resolve: Function, reject: Function }>()

    constructor() {
        this.setupGlobalHandlers()
    }

    /**
     * Check if WebView2 is available
     */
    isAvailable(): boolean {
        return typeof window !== 'undefined' &&
            (window as any).chrome?.webview !== undefined
    }

    /**
     * Send command to C#
     */
    send(command: string, args: any[]): void {
        if (!this.isAvailable()) {
            console.warn('WebView2 not available, cannot send command:', command)
            return
        }

        (window as any).chrome.webview.postMessage({
            command,
            args
        })
    }

    /**
     * Create a promise that will be resolved when C# responds
     */
    createRequest<T>(requestId: string): Promise<T> {
        return new Promise((resolve, reject) => {
            this.pendingRequests.set(requestId, { resolve, reject })
        })
    }

    /**
     * Setup global handlers for C# responses
     */
    private setupGlobalHandlers(): void {
        if (typeof window === 'undefined') return

        const win = window as any

        // Tree data response
        win.receiveTreeData = (data: any) => {
            const request = this.pendingRequests.get('GetTree')
            if (request) {
                request.resolve(data)
                this.pendingRequests.delete('GetTree')
            }
        }

        // TOC data response
        win.receiveTocData = (bookId: number, data: any) => {
            const request = this.pendingRequests.get(`GetToc:${bookId}`)
            if (request) {
                request.resolve(data)
                this.pendingRequests.delete(`GetToc:${bookId}`)
            }
        }

        // Links response
        win.receiveLinks = (tabId: string, bookId: number, links: any) => {
            const request = this.pendingRequests.get(`GetLinks:${tabId}:${bookId}`)
            if (request) {
                request.resolve(links)
                this.pendingRequests.delete(`GetLinks:${tabId}:${bookId}`)
            }
        }

        // Total lines response
        win.receiveTotalLines = (bookId: number, totalLines: number) => {
            const request = this.pendingRequests.get(`GetTotalLines:${bookId}`)
            if (request) {
                request.resolve(totalLines)
                this.pendingRequests.delete(`GetTotalLines:${bookId}`)
            }
        }

        // Line content response
        win.receiveLineContent = (bookId: number, lineIndex: number, content: string | null) => {
            const request = this.pendingRequests.get(`GetLineContent:${bookId}:${lineIndex}`)
            if (request) {
                request.resolve(content)
                this.pendingRequests.delete(`GetLineContent:${bookId}:${lineIndex}`)
            }
        }

        // Line ID response
        win.receiveLineId = (bookId: number, lineIndex: number, lineId: number | null) => {
            const request = this.pendingRequests.get(`GetLineId:${bookId}:${lineIndex}`)
            if (request) {
                request.resolve(lineId)
                this.pendingRequests.delete(`GetLineId:${bookId}:${lineIndex}`)
            }
        }

        // Line range response
        win.receiveLineRange = (bookId: number, start: number, end: number, lines: any[]) => {
            const request = this.pendingRequests.get(`GetLineRange:${bookId}:${start}:${end}`)
            if (request) {
                request.resolve(lines)
                this.pendingRequests.delete(`GetLineRange:${bookId}:${start}:${end}`)
            }
        }

        // PDF file picker response
        win.receivePdfFilePath = (filePath: string | null, fileName: string | null, dataUrl: string | null) => {
            console.log('receivePdfFilePath called:', { filePath, fileName, dataUrlLength: dataUrl?.length });
            const request = this.pendingRequests.get('OpenPdfFilePicker')
            if (request) {
                console.log('Resolving PDF picker request');
                request.resolve({ filePath, fileName, dataUrl })
                this.pendingRequests.delete('OpenPdfFilePicker')
            } else {
                console.log('No pending request found for OpenPdfFilePicker');
            }
        }

        // PDF load from path response
        win.receivePdfDataUrl = (filePath: string, dataUrl: string | null) => {
            const request = this.pendingRequests.get(`LoadPdfFromPath:${filePath}`)
            if (request) {
                request.resolve(dataUrl)
                this.pendingRequests.delete(`LoadPdfFromPath:${filePath}`)
            }
        }
    }
}
