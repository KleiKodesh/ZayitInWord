import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { TocEntry } from '../types/Toc'

export const useTocStore = defineStore('toc', () => {
  const isVisible = ref(false)
  const tocData = ref<Map<number, TocEntry[]>>(new Map())
  const tocDataFlat = ref<Map<number, TocEntry[]>>(new Map())
  const currentBookId = ref<number | null>(null)

  function toggleToc() {
    isVisible.value = !isVisible.value
  }

  function setTocData(bookId: number, data: TocEntry[] | { tree: TocEntry[], allTocs: TocEntry[] }) {
    // Handle both old format (array) and new format (object with tree and allTocs)
    let tree: TocEntry[]
    let allTocs: TocEntry[]
    
    if (Array.isArray(data)) {
      // Old format - just the tree
      tree = data
      allTocs = []
    } else {
      // New format - object with tree and allTocs
      tree = data.tree
      allTocs = data.allTocs
    }
    
    // Set the first item as expanded by default
    const firstItem = tree[0]
    if (tree.length > 0 && firstItem && firstItem.hasChildren) {
      firstItem.isExpanded = true
    }
    
    tocData.value.set(bookId, tree)
    tocDataFlat.value.set(bookId, allTocs)
    currentBookId.value = bookId
  }

  function getTocForBook(bookId: number): TocEntry[] | undefined {
    return tocData.value.get(bookId)
  }
  
  function getTocFlatForBook(bookId: number): TocEntry[] | undefined {
    return tocDataFlat.value.get(bookId)
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
    tocDataFlat,
    currentBookId,
    toggleToc,
    setTocData,
    getTocForBook,
    getTocFlatForBook,
    requestToc
  }
})
