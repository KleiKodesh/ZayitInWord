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
        console.log(`[CSharpBridge] Sending command: ${command}`, args)

        if (!this.isAvailable()) {
            console.warn('[CSharpBridge] WebView2 not available, cannot send command:', command)
            return
        }

        (window as any).chrome.webview.postMessage({
            command,
            args
        })

        console.log(`[CSharpBridge] Command sent successfully: ${command}`)
    }

    /**
     * Create a promise that will be resolved when C# responds
     */
    createRequest<T>(requestId: string): Promise<T> {
        console.log(`[CSharpBridge] Creating request promise for: ${requestId}`)

        return new Promise((resolve, reject) => {
            this.pendingRequests.set(requestId, { resolve, reject })
            console.log(`[CSharpBridge] Promise created and stored for: ${requestId}`)
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

        // Search lines response
        win.receiveSearchResults = (bookId: number, searchTerm: string, lines: any[]) => {
            const request = this.pendingRequests.get(`SearchLines:${bookId}:${searchTerm}`)
            if (request) {
                request.resolve(lines)
                this.pendingRequests.delete(`SearchLines:${bookId}:${searchTerm}`)
            }
        }

        // Hebrew book download ready response
        win.receiveHebrewBookDownloadReady = (bookId: string, action: string) => {
            console.log(`[CSharpBridge] receiveHebrewBookDownloadReady called - bookId: ${bookId}, action: ${action}`)

            const requestId = `PrepareHebrewBookDownload:${bookId}:${action}`
            const request = this.pendingRequests.get(requestId)

            if (request) {
                console.log(`[CSharpBridge] Resolving request: ${requestId}`)
                request.resolve({ success: true })
                this.pendingRequests.delete(requestId)
            } else {
                console.warn(`[CSharpBridge] No pending request found for: ${requestId}`)
                console.log('[CSharpBridge] Current pending requests:', Array.from(this.pendingRequests.keys()))
            }
        }

        // Hebrew book blob response (for viewing)
        win.receiveHebrewBookBlob = (bookId: string, title: string | null, base64: string | null) => {
            console.log(`[CSharpBridge] receiveHebrewBookBlob called - bookId: ${bookId}, title: ${title}, hasBase64: ${!!base64}`)

            // Try multiple possible request keys - prioritize blob request for blob responses
            const blobRequestId = `HebrewBookBlob:${bookId}`
            const viewRequestId = `PrepareHebrewBookDownload:${bookId}:view`

            const blobRequest = this.pendingRequests.get(blobRequestId)
            const viewRequest = this.pendingRequests.get(viewRequestId)

            // Prioritize blob request for blob responses
            const request = blobRequest || viewRequest
            const requestId = blobRequest ? blobRequestId : viewRequestId

            if (request) {
                console.log(`[CSharpBridge] Resolving blob request: ${requestId}`)
                if (base64 && title) {
                    request.resolve({ success: true, title, base64 })
                } else {
                    console.warn('[CSharpBridge] Blob response missing data - title:', title, 'hasBase64:', !!base64)
                    request.resolve({ success: false })
                }
                if (viewRequest) this.pendingRequests.delete(viewRequestId)
                if (blobRequest) this.pendingRequests.delete(blobRequestId)
            } else {
                console.warn(`[CSharpBridge] No pending request found for blob. Tried: ${viewRequestId}, ${blobRequestId}`)
                console.log('[CSharpBridge] Current pending requests:', Array.from(this.pendingRequests.keys()))
            }
        }

        // Hebrew book download complete response (for downloading)
        win.receiveHebrewBookDownloadComplete = (bookId: string, filePath: string | null) => {
            console.log(`[CSharpBridge] receiveHebrewBookDownloadComplete called - bookId: ${bookId}, filePath: ${filePath}`)

            // Try both possible request keys since the flow might use either
            const downloadRequestId = `PrepareHebrewBookDownload:${bookId}:download`
            const completeRequestId = `HebrewBookDownloadComplete:${bookId}`

            const downloadRequest = this.pendingRequests.get(downloadRequestId)
            const completeRequest = this.pendingRequests.get(completeRequestId)

            const request = downloadRequest || completeRequest
            const requestId = downloadRequest ? downloadRequestId : completeRequestId

            if (request) {
                console.log(`[CSharpBridge] Resolving download complete request: ${requestId}`)
                request.resolve({ success: !!filePath, filePath })
                if (downloadRequest) this.pendingRequests.delete(downloadRequestId)
                if (completeRequest) this.pendingRequests.delete(completeRequestId)
            } else {
                console.warn(`[CSharpBridge] No pending request found for download complete. Tried: ${downloadRequestId}, ${completeRequestId}`)
                console.log('[CSharpBridge] Current pending requests:', Array.from(this.pendingRequests.keys()))
            }
        }


    }
}
