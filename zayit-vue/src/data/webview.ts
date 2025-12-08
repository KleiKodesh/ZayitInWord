/**
 * Data Bridge
 * 
 * Abstraction layer for data sources.
 * - Production: Uses C# WebView2
 * - Development: Uses SQLite database directly when C# not available
 */

import type { TreeData } from '../types/BookCategoryTree'
import * as sqliteDb from './sqliteDb'

declare global {
  interface Window {
    chrome?: {
      webview?: {
        postMessage: (message: any) => void
      }
    }
    receiveTreeData?: (data: any) => void
    receiveTocData?: (bookId: number, data: any) => void
    receiveLinks?: (tabId: string, bookId: number, links: any[]) => void
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
 * Send command to C# or use SQLite in dev mode
 */
export function send(command: string, args: any[] = []) {
  log(`📤 ${command}`, args.length > 0 ? args : undefined)

  if (isWebViewAvailable()) {
    // C# available: Send to C#
    window.chrome!.webview!.postMessage({ command, args })
  } else if (import.meta.env.DEV) {
    // Development mode: Use SQLite database
    log('⚠️  C# not available, using SQLite database')
    handleDevMode(command, args)
  } else {
    // Production without C#: This shouldn't happen
    log('❌ C# WebView not available in production build')
    console.error('C# WebView is required in production builds')
  }
}

/**
 * Handle commands in dev mode with SQLite database
 */
async function handleDevMode(command: string, args: any[]) {
  try {
    switch (command) {
      case 'GetTree':
        log('📚 Loading tree data from SQLite')
        const treeData = await sqliteDb.getTree()
        if (window.receiveTreeData) {
          log('✅ Calling window.receiveTreeData')
          window.receiveTreeData(treeData)
        } else {
          log('❌ window.receiveTreeData not found!')
        }
        break

      case 'GetToc':
        log('📑 Loading TOC data from SQLite')
        const bookId = args[0]
        log('📦 bookId:', bookId)
        const tocData = await sqliteDb.getToc(bookId)
        if (window.receiveTocData) {
          log('✅ Calling window.receiveTocData')
          window.receiveTocData(bookId, tocData)
        } else {
          log('❌ window.receiveTocData not found!')
        }
        break


      case 'GetLinks':
        log('🔗 Loading links from SQLite')
        const linkLineId = args[0]
        const links = await sqliteDb.getLinks(linkLineId)
        if (window.receiveLinks) {
          window.receiveLinks(args[1], args[2], links)
        }
        break

      default:
        log(`⚠️  Unknown command: ${command}`)
        break
    }
  } catch (error) {
    log('❌ Error in dev mode:', error)
    console.error(error)
  }
}
