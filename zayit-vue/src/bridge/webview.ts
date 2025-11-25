/**
 * Data Bridge
 * 
 * Abstraction layer for data sources.
 * - Production: Uses C# WebView2
 * - Development: Uses sample data when C# not available
 */

import type { TreeData } from '../types/Tree'
import sampleTreeData from '../data/sampleTreeData.json'

declare global {
  interface Window {
    chrome?: {
      webview?: {
        postMessage: (message: any) => void
      }
    }
    receiveTreeData?: (data: TreeData) => void
  }
}

const ENABLE_LOGGING = true

function log(message: string, data?: any) {
  if (!ENABLE_LOGGING) return
  const time = new Date().toLocaleTimeString()
  console.log(`[Bridge ${time}] ${message}`, data || '')
}

/**
 * Check if C# WebView is available
 */
function isWebViewAvailable(): boolean {
  return !!window.chrome?.webview
}

/**
 * Send command to C# or use sample data in dev mode
 */
export function send(command: string, args: any[] = []) {
  log(`📤 ${command}`, args.length > 0 ? args : undefined)
  
  if (isWebViewAvailable()) {
    // Production: Send to C#
    window.chrome!.webview!.postMessage({ command, args })
  } else {
    // Development: Use sample data
    log('⚠️  C# not available, using sample data')
    handleDevMode(command, args)
  }
}

/**
 * Handle commands in dev mode with sample data
 */
async function handleDevMode(command: string, args: any[]) {
  setTimeout(async () => {
    switch (command) {
      case 'GetTree':
        log('📚 Loading sample tree data')
        log('📦 sampleTreeData:', sampleTreeData)
        if (window.receiveTreeData) {
          log('✅ Calling window.receiveTreeData')
          window.receiveTreeData(sampleTreeData)
        } else {
          log('❌ window.receiveTreeData not found!')
        }
        break
        
      case 'GetToc':
        log('📑 Loading sample TOC data')
        const bookId = args[0]
        log('📦 bookId:', bookId)
        const tocModule = await import('../data/sampleTocData.json')
        const tocData = tocModule.default
        if (window.receiveTocData) {
          log('✅ Calling window.receiveTocData')
          window.receiveTocData(bookId, tocData)
        } else {
          log('❌ window.receiveTocData not found!')
        }
        break
        
      case 'OpenBook':
        log('📖 Loading sample book content')
        const openBookId = args[0]
        const initialLineId = args[1] || 0
        log('📦 bookId:', openBookId, 'initialLineId:', initialLineId)
        const contentModule = await import('../data/sampleContentData.json')
        const contentData = contentModule.default
        
        // Find the index of the initial line
        if (initialLineId && window.setInitLineIndex) {
          const lineIndex = contentData.lines.findIndex((line: any) => line.id === initialLineId)
          if (lineIndex !== -1) {
            log('✅ Setting init line index:', lineIndex)
            window.setInitLineIndex(openBookId, lineIndex)
          }
        }
        
        // Simulate C# sending lines
        if (window.addLines) {
          log('✅ Calling window.addLines')
          window.addLines(openBookId, contentData.lines)
        } else {
          log('❌ window.addLines not found!')
        }
        
        if (window.bookLoadComplete) {
          log('✅ Calling window.bookLoadComplete')
          window.bookLoadComplete(openBookId)
        }
        break
        
      default:
        log(`⚠️  Unknown command: ${command}`)
        break
    }
  }, 100)
}
