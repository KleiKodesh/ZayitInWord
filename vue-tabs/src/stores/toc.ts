import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { TocEntry } from '../types/Toc'

export const useTocStore = defineStore('toc', () => {
  const isVisible = ref(false)
  const tocData = ref<Map<number, TocEntry[]>>(new Map())
  const currentBookId = ref<number | null>(null)

  function toggleToc() {
    isVisible.value = !isVisible.value
  }

  function setTocData(bookId: number, toc: TocEntry[]) {
    // Set the first item as expanded by default
    const firstItem = toc[0]
    if (toc.length > 0 && firstItem && firstItem.hasChildren) {
      firstItem.isExpanded = true
    }
    tocData.value.set(bookId, toc)
    currentBookId.value = bookId
  }

  function getTocForBook(bookId: number): TocEntry[] | undefined {
    return tocData.value.get(bookId)
  }

  function requestToc(bookId: number) {
    // Check if we already have it
    if (tocData.value.has(bookId)) {
      currentBookId.value = bookId
      return
    }

    // Request from C#
    if (window.chrome?.webview) {
      window.chrome.webview.postMessage({
        command: 'GetToc',
        args: [bookId]
      })
    }
  }

  return {
    isVisible,
    tocData,
    currentBookId,
    toggleToc,
    setTocData,
    getTocForBook,
    requestToc
  }
})
