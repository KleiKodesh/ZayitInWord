<template>
  <div class="book-viewer" ref="bookViewerRef">
    <div v-if="isLoading" class="loading-container">
      <div class="loading-text">טוען...</div>
    </div>
    <div class="content-container" :data-tab-id="tabId" :class="{ hidden: isLoading }"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, onActivated, ref } from 'vue'
import { useTabsStore } from '../stores/tabs'

const props = defineProps<{
  tabId: string
}>()

const tabsStore = useTabsStore()
const bookViewerRef = ref<HTMLElement | null>(null)
const contentContainer = ref<HTMLElement | null>(null)
const lineCounter = ref(0)
const initLineIndex = ref(0)
const savedScrollPosition = ref(0)
const isLoading = ref(true)

// Expose functions to C# with tab-specific keys
declare global {
  interface Window {
    addLine: (tabId: string, html: string) => void
    addLines: (tabId: string, linesArray: Array<{ id: number; html: string }>) => void
    setInitLineIndex: (tabId: string, index: number) => void
    clearBookContent: (tabId: string) => void
    bookLoadComplete: (tabId: string) => void
    receiveTocData: (bookId: number, tocTree: any[]) => void
  }
}

// Global registry for tab handlers
const tabHandlers = (window as any).__tabHandlers || ((window as any).__tabHandlers = new Map())

// Initialize global functions if not already set
if (!window.addLine) {
  window.addLine = (tabId: string, html: string) => {
    const handler = tabHandlers.get(tabId)
    if (handler?.addLine) handler.addLine(html)
  }
  window.addLines = (tabId: string, linesArray: Array<{ id: number; html: string }>) => {
    const handler = tabHandlers.get(tabId)
    if (handler?.addLines) handler.addLines(linesArray)
  }
  window.setInitLineIndex = (tabId: string, index: number) => {
    const handler = tabHandlers.get(tabId)
    if (handler?.setInitLineIndex) handler.setInitLineIndex(index)
  }
  window.clearBookContent = (tabId: string) => {
    const handler = tabHandlers.get(tabId)
    if (handler?.clearBookContent) handler.clearBookContent()
  }
  window.bookLoadComplete = (tabId: string) => {
    const handler = tabHandlers.get(tabId)
    if (handler?.bookLoadComplete) handler.bookLoadComplete()
  }
}

// Local functions that handle this specific tab
const addLineToThisTab = (html: string) => {
  if (!contentContainer.value) return
  
  // Hide loading on first line
  if (isLoading.value) {
    isLoading.value = false
  }
  
  const lineElement = document.createElement('line')
  lineElement.tabIndex = 0
  lineElement.innerHTML = html
  contentContainer.value.appendChild(lineElement)
  
  if (lineCounter.value++ === initLineIndex.value) {
    lineElement.scrollIntoView()
  }
}

const addLinesToThisTab = (linesArray: Array<{ id: number; html: string }>) => {
  if (!contentContainer.value) return
  
  // Hide loading on first batch of lines
  if (isLoading.value) {
    isLoading.value = false
  }
  
  // Create a document fragment for better performance
  const fragment = document.createDocumentFragment()
  
  linesArray.forEach(({ id, html }) => {
    const lineElement = document.createElement('line')
    lineElement.tabIndex = 0
    lineElement.id = `line-${id}`
    lineElement.innerHTML = html
    fragment.appendChild(lineElement)
    
    if (lineCounter.value++ === initLineIndex.value) {
      lineElement.scrollIntoView()
    }
  })
  
  contentContainer.value.appendChild(fragment)
}

const setInitLineIndexForThisTab = (index: number) => {
  initLineIndex.value = index
}

const clearContentForThisTab = () => {
  if (contentContainer.value) {
    contentContainer.value.innerHTML = ''
    lineCounter.value = 0
  }
}

// No need for any diacritics restoration logic in BookViewer
// The DOM is preserved by KeepAlive, and filters are only applied when user clicks the button

onMounted(() => {
  contentContainer.value = document.querySelector(`.content-container[data-tab-id="${props.tabId}"]`)
  
  // Clear any existing handlers for this tab to prevent duplicates
  if (tabHandlers.has(props.tabId)) {
    tabHandlers.delete(props.tabId)
  }
  
  // Register this tab's handlers
  tabHandlers.set(props.tabId, {
    addLine: addLineToThisTab,
    addLines: addLinesToThisTab,
    setInitLineIndex: setInitLineIndexForThisTab,
    clearBookContent: clearContentForThisTab,
    bookLoadComplete: () => {
      // Book finished loading, restore scroll position
      if (savedScrollPosition.value > 0 && bookViewerRef.value) {
        bookViewerRef.value.scrollTop = savedScrollPosition.value
      }
    }
  })
  
  // Load saved scroll position from store
  const tab = tabsStore.tabs.find(t => t.id === props.tabId)
  if (tab?.scrollPosition !== undefined) {
    savedScrollPosition.value = tab.scrollPosition
    // Restore scroll position immediately if already has content
    if (bookViewerRef.value && contentContainer.value && contentContainer.value.children.length > 0) {
      bookViewerRef.value.scrollTop = savedScrollPosition.value
      // Content already exists, hide loading
      isLoading.value = false
    }
  }
  
  // Request book content if container is empty
  if (tab?.type === 'book' && tab.bookId && contentContainer.value?.children.length === 0) {
    if (window.chrome?.webview) {
      window.chrome.webview.postMessage({
        command: 'OpenBook',
        args: [tab.bookId, props.tabId]
      })
    }
  }
  
  // Save scroll position on scroll
  if (bookViewerRef.value) {
    bookViewerRef.value.addEventListener('scroll', () => {
      if (bookViewerRef.value) {
        savedScrollPosition.value = bookViewerRef.value.scrollTop
        tabsStore.saveScrollPosition(props.tabId, savedScrollPosition.value)
      }
    })
  }
})

// Restore scroll position when component is reactivated from cache
onActivated(() => {
  // Restore scroll position synchronously - no animation
  if (bookViewerRef.value && savedScrollPosition.value > 0) {
    // Set scroll immediately without any delay
    bookViewerRef.value.scrollTop = savedScrollPosition.value
  }
  // Don't reapply diacritics filter - the DOM content is already in the correct state
  // The KeepAlive preserves the DOM exactly as it was, including filtered text
})

onUnmounted(() => {
  // Save final scroll position
  if (bookViewerRef.value) {
    tabsStore.saveScrollPosition(props.tabId, bookViewerRef.value.scrollTop)
  }
  // Clean up handlers
  tabHandlers.delete(props.tabId)
})
</script>

<style scoped>
.book-viewer {
  height: 100%;
  width: 100%;
  direction: rtl;
  overflow-y: auto;
  position: relative;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
}

.loading-text {
  font-size: 18px;
  color: var(--text-secondary);
  font-family: 'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif;
}

.content-container {
  color: #111;
  text-align: justify;
  font-family: var(--text-font);
  padding: 16px;
  font-size: 100%; /* Default, will be overridden by settings */
}

.content-container.hidden {
  display: none;
}

.content-container :deep(line:not(:has(h1, h2, h3, h4, h5, h6))) {
  display: block;
  contain: layout style;
  padding-block-start: 0.3em;
}

.content-container :deep(line h1),
.content-container :deep(line h2),
.content-container :deep(line h3),
.content-container :deep(line h4),
.content-container :deep(line h5),
.content-container :deep(line h6) {
  font-family: var(--header-font);
  padding-block-start: 0.3em;
  color: #1a1a1a;
}

.content-container :deep(line h1) {
  position: relative;
  padding-bottom: 4px;
}

.content-container :deep(line h1)::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 0.1px;
  background-color: rgba(128, 128, 128, 0.2);
}

.content-container :deep(line:hover) {
  background: rgba(0, 120, 212, 0.01); /* Very light blue */
}

.content-container :deep(line:not(:has(h1, h2, h3, h4, h5, h6)):focus) {
  border-right: 3px solid #0078d4;
  padding-right: 3px;
  margin-right: -3px;
  outline: none;
}

/* Dark theme support */
:root.dark .content-container {
  color: var(--text-primary);
}

:root.dark .content-container :deep(line h1),
:root.dark .content-container :deep(line h2),
:root.dark .content-container :deep(line h3),
:root.dark .content-container :deep(line h4),
:root.dark .content-container :deep(line h5),
:root.dark .content-container :deep(line h6) {
  color: var(--text-primary);
}

:root.dark .content-container :deep(line h1) {
  border-bottom: 1px solid var(--border-color);
}

:root.dark .content-container :deep(line:hover) {
  background: var(--hover-bg);
}

:root.dark .content-container :deep(line:not(:has(h1, h2, h3, h4, h5, h6)):focus) {
  border-right: 3px solid var(--accent-color);
  padding-right: 3px;
  margin-right: -3px;
  outline: none;
}
</style>
