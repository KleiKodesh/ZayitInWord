import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { HebrewBook } from '../types/HebrewBook'
import { CsvLoader } from '../services/hebrewBooksCsvLoader'
import { PopularityManager } from '../services/hebrewBooksPopularityManager'
import { HebrewBooksSearchService } from '../services/hebrewBooksSearchService'
import { CSharpBridge } from '../data/csharpBridge'

// Create debounced search function outside store to persist across instances
let globalDebouncedSearch: ((value: string) => void) | null = null

export const useHebrewBooksStore = defineStore('hebrewBooks', () => {
  // State
  const books = ref<HebrewBook[]>([])
  const filteredBooks = ref<HebrewBook[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const searchTerm = ref('')
  const debouncedSearchTerm = ref('')

  // Navigation state
  const currentView = ref<'list' | 'viewer'>('list')
  const selectedBookId = ref<string | null>(null)

  // C# Bridge instance
  const csharp = new CSharpBridge()

  // Getters
  const hasBooks = computed(() => books.value.length > 0)
  const selectedBook = computed(() => {
    if (!selectedBookId.value) return null
    return books.value.find(book => book.ID_Book === selectedBookId.value) || null
  })

  // Actions
  const loadBooks = async () => {
    if (books.value.length > 0) {
      // Books already loaded, don't load again
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const loadedBooks = await CsvLoader.loadBooks()
      books.value = await PopularityManager.loadUserInteractions(loadedBooks)
      // Load initial filtered books
      await updateFilteredBooks()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load books'
      console.error('Error loading books:', err)
    } finally {
      isLoading.value = false
    }
  }

  const trackBookInteraction = async (bookId: string) => {
    books.value = await PopularityManager.trackBookInteraction(books.value, bookId)
    // Update filtered books after interaction
    await updateFilteredBooks()
  }

  const updateSearchTerm = (term: string) => {
    searchTerm.value = term
  }

  const updateDebouncedSearchTerm = async (term: string) => {
    debouncedSearchTerm.value = term
    await updateFilteredBooks()
  }

  // Update filtered books based on current search term
  const updateFilteredBooks = async () => {
    filteredBooks.value = await HebrewBooksSearchService.getFilteredBooks(books.value, debouncedSearchTerm.value)
  }

  // Create debounced search function once globally
  if (!globalDebouncedSearch) {
    globalDebouncedSearch = HebrewBooksSearchService.createDebouncedSearch((value: string) => {
      debouncedSearchTerm.value = value
      updateFilteredBooks() // Remove await since callback should return void
    }, 300)
  }

  const performDebouncedSearch = (term: string) => {
    updateSearchTerm(term)
    if (globalDebouncedSearch) {
      globalDebouncedSearch(term)
    }
  }

  // Navigation actions
  const openBookViewer = (bookId: string) => {
    selectedBookId.value = bookId
    currentView.value = 'viewer'
  }

  const closeBookViewer = () => {
    selectedBookId.value = null
    currentView.value = 'list'
  }

  // Hebrew Books PDF actions
  const openHebrewBookViewer = async (bookId: string, title: string) => {
    console.log(`[HebrewBooks] Starting openHebrewBookViewer - bookId: ${bookId}, title: ${title}`)

    // Import tab store dynamically to avoid circular dependencies
    const { useTabStore } = await import('../stores/tabStore')
    const tabStore = useTabStore()

    // Navigate to Hebrew books view page and set title immediately
    console.log('[HebrewBooks] Navigating to Hebrew books view page')
    tabStore.setPage('hebrewbooks-view')

    // Set tab title to book title immediately
    const tab = tabStore.activeTab
    if (tab) {
      tab.title = title
      console.log('[HebrewBooks] Set tab title to:', title)
    }

    // Use C# bridge to get Hebrew book as blob
    if (csharp.isAvailable()) {
      console.log('[HebrewBooks] C# bridge available, starting Hebrew book viewing flow')
      try {
        // Create promise for ready response (for non-cached files)
        console.log('[HebrewBooks] Creating promise for ready response')
        const readyPromise = csharp.createRequest<{ success: boolean }>(`PrepareHebrewBookDownload:${bookId}:view`)

        // Create promise for blob response (this handles both cached and downloaded blobs)
        console.log('[HebrewBooks] Creating promise for blob response')
        const blobPromise = csharp.createRequest<{ success: boolean; title?: string; base64?: string }>(`HebrewBookBlob:${bookId}`)

        // Send prepare command to C# - this might return cached blob immediately or ready signal
        console.log('[HebrewBooks] Sending PrepareHebrewBookDownload command to C#')
        csharp.send('PrepareHebrewBookDownload', [bookId, title, 'view'])

        console.log('[HebrewBooks] Starting race between ready and blob promises...')
        // Race between ready signal (for non-cached) and blob (for cached)
        const result = await Promise.race([
          readyPromise.then(() => {
            console.log('[HebrewBooks] Ready promise resolved')
            return { type: 'ready' as const }
          }),
          blobPromise.then(blob => {
            console.log('[HebrewBooks] Blob promise resolved:', { success: blob.success, hasBase64: !!blob.base64 })
            return { type: 'blob' as const, data: blob }
          })
        ])

        console.log('[HebrewBooks] Race completed with result type:', result.type)

        if (result.type === 'ready') {
          // Non-cached file - need to trigger download
          console.log('[HebrewBooks] C# is ready, triggering browser download')
          triggerBrowserDownload(bookId, title)

          console.log('[HebrewBooks] Waiting for blob response from C#...')
          // Now wait for the blob response from C#
          const blobResult = await blobPromise
          console.log('[HebrewBooks] Received response from C#:', { success: blobResult.success, hasBase64: !!blobResult.base64, title: blobResult.title })

          if (blobResult.success && blobResult.base64) {
            await processBlobResponse(blobResult, bookId, title, tabStore)
          } else {
            console.error('[HebrewBooks] Failed to get Hebrew book blob from C# - success:', blobResult.success, 'hasBase64:', !!blobResult.base64)
          }
        } else if (result.type === 'blob') {
          // Cached file - blob received immediately
          console.log('[HebrewBooks] Received cached blob from C#:', { success: result.data.success, hasBase64: !!result.data.base64, title: result.data.title })

          if (result.data.success && result.data.base64) {
            await processBlobResponse(result.data, bookId, title, tabStore)
          } else {
            console.error('[HebrewBooks] Failed to get cached Hebrew book blob from C# - success:', result.data.success, 'hasBase64:', !!result.data.base64)
          }
        }
      } catch (error) {
        console.error('[HebrewBooks] Failed to prepare Hebrew book for viewing:', error)
      }
    } else {
      console.log('[HebrewBooks] C# bridge not available, using development mode fallback')
      // Development mode fallback - open in new tab
      const url = `https://download.hebrewbooks.org/downloadhandler.ashx?req=${bookId}`
      window.open(url, '_blank')
    }
  }

  const processBlobResponse = async (result: { success: boolean; title?: string; base64?: string }, bookId: string, title: string, tabStore: any) => {
    console.log('[HebrewBooks] Converting base64 to blob URL')
    // Convert base64 to blob URL
    const binaryString = atob(result.base64!)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    const blob = new Blob([bytes], { type: 'application/pdf' })
    const blobUrl = URL.createObjectURL(blob)
    console.log('[HebrewBooks] Created blob URL:', blobUrl)

    // Set the PDF state directly on the active tab
    const tab = tabStore.activeTab
    if (tab) {
      console.log('[HebrewBooks] Setting PDF state on active tab')
      tab.pdfState = {
        fileName: `${result.title || title}.pdf`,
        fileUrl: blobUrl,
        source: 'hebrewbook',
        bookId: bookId,
        bookTitle: result.title || title
      }
    } else {
      console.error('[HebrewBooks] No active tab found to set PDF state')
    }

    console.log('[HebrewBooks] Hebrew book loaded successfully:', result.title || title)
  }

  const downloadHebrewBook = async (bookId: string, title: string) => {
    console.log(`[HebrewBooks] Starting downloadHebrewBook - bookId: ${bookId}, title: ${title}`)

    // Use C# bridge to prepare for download capture, then trigger browser download
    if (csharp.isAvailable()) {
      console.log('[HebrewBooks] C# bridge available, starting Hebrew book download flow')
      try {
        // Create promise for download ready response (after save dialog)
        console.log(`[HebrewBooks] Creating request promise for: PrepareHebrewBookDownload:${bookId}:download`)
        const readyPromise = csharp.createRequest<{ success: boolean }>(`PrepareHebrewBookDownload:${bookId}:download`)

        // Create promise for download completion
        console.log(`[HebrewBooks] Creating request promise for: HebrewBookDownloadComplete:${bookId}`)
        const downloadPromise = csharp.createRequest<{ success: boolean; filePath?: string }>(`HebrewBookDownloadComplete:${bookId}`)

        console.log('[HebrewBooks] Sending PrepareHebrewBookDownload command to C# (will show save dialog)')
        // Send prepare command to C# (this will show save dialog immediately)
        csharp.send('PrepareHebrewBookDownload', [bookId, title, 'download'])

        console.log('[HebrewBooks] Waiting for C# ready response (after save dialog)...')
        // Wait for C# to be ready (after user selects save location)
        await readyPromise

        console.log('[HebrewBooks] C# is ready, triggering browser download')
        // Now trigger browser download (C# will capture it to the selected location)
        triggerBrowserDownload(bookId, title)

        console.log('[HebrewBooks] Waiting for download completion from C#...')
        // Wait for download completion
        const result = await downloadPromise
        console.log('[HebrewBooks] Received download completion response:', { success: result.success, filePath: result.filePath })

        if (result.success && result.filePath) {
          console.log('[HebrewBooks] Hebrew book downloaded successfully to:', result.filePath)
        } else {
          console.log('[HebrewBooks] Hebrew book download was cancelled or failed')
        }
      } catch (error) {
        console.error('[HebrewBooks] Failed to download Hebrew book:', error)
      }
    } else {
      console.log('[HebrewBooks] C# bridge not available, using development mode fallback')
      // Development mode fallback
      triggerBrowserDownload(bookId, title)
    }
  }

  const triggerBrowserDownload = (bookId: string, title: string) => {
    console.log(`[HebrewBooks] triggerBrowserDownload - bookId: ${bookId}, title: ${title}`)

    // Create a temporary link and click it to trigger browser download
    const url = `https://download.hebrewbooks.org/downloadhandler.ashx?req=${bookId}`
    console.log('[HebrewBooks] Download URL:', url)

    const link = document.createElement('a')
    link.href = url
    link.download = `${title}.pdf`
    link.style.display = 'none'
    document.body.appendChild(link)

    console.log('[HebrewBooks] Clicking download link')
    link.click()
    document.body.removeChild(link)
    console.log('[HebrewBooks] Browser download triggered')
  }

  return {
    // State
    books,
    filteredBooks,
    isLoading,
    error,
    searchTerm,
    debouncedSearchTerm,
    currentView,
    selectedBookId,

    // Getters
    hasBooks,
    selectedBook,

    // Actions
    loadBooks,
    trackBookInteraction,
    updateSearchTerm,
    updateDebouncedSearchTerm,
    performDebouncedSearch,
    updateFilteredBooks,
    openBookViewer,
    closeBookViewer,
    openHebrewBookViewer,
    downloadHebrewBook,
  }
})
