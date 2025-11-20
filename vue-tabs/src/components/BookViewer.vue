<template>
  <div class="book-viewer" ref="bookViewerRef">
    <div v-if="isLoading" class="loading-container">
      <div class="loading-content">
        <div class="loading-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path d="M12 8C12 7.44772 12.4477 7 13 7H23C23.5523 7 24 7.44772 24 8V40C24 40.5523 23.5523 41 23 41H13C12.4477 41 12 40.5523 12 40V8Z" stroke="currentColor" stroke-width="2.5" class="book-left"/>
            <path d="M24 8C24 7.44772 24.4477 7 25 7H35C35.5523 7 36 7.44772 36 8V40C36 40.5523 35.5523 41 35 41H25C24.4477 41 24 40.5523 24 40V8Z" stroke="currentColor" stroke-width="2.5" class="book-right"/>
          </svg>
        </div>
        <div class="loading-text">טוען ספר</div>
        <div class="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
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
  
  const lineElement = document.createElement('line')
  lineElement.tabIndex = 0
  lineElement.innerHTML = html
  contentContainer.value.appendChild(lineElement)
  
  // Check if this is the target line
  const isTargetLine = lineCounter.value === initLineIndex.value
  
  // Only hide loading if:
  // 1. No target line was specified (initLineIndex is 0), OR
  // 2. This is the target line
  if (initLineIndex.value === 0 || isTargetLine) {
    if (isLoading.value) {
      isLoading.value = false
      console.log('BookViewer: Hiding loading - target line loaded or no target specified')
    }
  }
  
  if (isTargetLine) {
    lineElement.scrollIntoView({ behavior: 'auto', block: 'center' })
  }
  
  lineCounter.value++
}

const addLinesToThisTab = (linesArray: Array<{ id: number; html: string }>) => {
  if (!contentContainer.value) return
  
  // C# already sends lines in chunks, so we can process the entire batch at once
  const fragment = document.createDocumentFragment()
  let targetLineElement: HTMLElement | null = null
  let foundTargetLine = false
  
  linesArray.forEach(({ id, html }) => {
    const lineElement = document.createElement('line')
    lineElement.tabIndex = 0
    lineElement.id = `line-${id}`
    lineElement.innerHTML = html
    fragment.appendChild(lineElement)
    
    // Check if this is the line we want to scroll to
    if (initLineIndex.value > 0 && id === initLineIndex.value) {
      targetLineElement = lineElement
      foundTargetLine = true
      console.log('BookViewer: Found target line', id)
    }
  })
  
  contentContainer.value.appendChild(fragment)
  
  // Only hide loading if:
  // 1. No target line was specified (initLineIndex is 0), OR
  // 2. Target line was found in this batch
  if (initLineIndex.value === 0 || foundTargetLine) {
    if (isLoading.value) {
      isLoading.value = false
      console.log('BookViewer: Hiding loading - target line loaded or no target specified')
    }
  }
  
  // Scroll to target line after appending
  if (targetLineElement) {
    console.log('BookViewer: Scrolling to line', initLineIndex.value)
    setTimeout(() => {
      targetLineElement?.scrollIntoView({ behavior: 'auto', block: 'center' })
    }, 100)
  }
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
      
      // Apply divine name censoring if enabled
      if ((window as any).applyCensoringIfEnabled) {
        (window as any).applyCensoringIfEnabled()
      }
    }
  })
  
  // Load saved scroll position from store
  const tab = tabsStore.tabs.find(t => t.id === props.tabId)
  
  // Check if there's an initial line index to scroll to
  if (tab?.initialLineIndex !== undefined) {
    initLineIndex.value = tab.initialLineIndex
    console.log('BookViewer: Setting initial line index to', initLineIndex.value)
    
    // If content already exists, check if target line is loaded
    if (contentContainer.value && contentContainer.value.children.length > 0) {
      const lineElement = contentContainer.value.querySelector(`#line-${tab.initialLineIndex}`) as HTMLElement
      if (lineElement) {
        console.log('BookViewer: Target line already exists, scrolling to line', tab.initialLineIndex)
        lineElement.scrollIntoView({ behavior: 'auto', block: 'center' })
        // Target line exists, hide loading
        isLoading.value = false
      } else {
        console.log('BookViewer: Target line not loaded yet, keeping loading state visible')
        // Target line doesn't exist yet, keep loading visible
        isLoading.value = true
      }
    }
    
    // Clear the initial line index after using it
    tab.initialLineIndex = undefined
    tabsStore.saveTabs()
  } else if (tab?.scrollPosition !== undefined) {
    // No target line, just restore scroll position
    savedScrollPosition.value = tab.scrollPosition
    // Restore scroll position immediately if already has content
    if (bookViewerRef.value && contentContainer.value && contentContainer.value.children.length > 0) {
      bookViewerRef.value.scrollTop = savedScrollPosition.value
      // Content already exists, hide loading
      isLoading.value = false
    }
  } else if (contentContainer.value && contentContainer.value.children.length > 0) {
    // Content exists but no scroll position or target line, just hide loading
    isLoading.value = false
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
  background: var(--bg-primary);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.loading-icon {
  color: var(--accent-color);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.05);
  }
}

.loading-icon .book-left {
  animation: bookOpen 1.5s ease-in-out infinite;
  transform-origin: right center;
}

.loading-icon .book-right {
  animation: bookOpen 1.5s ease-in-out infinite;
  animation-delay: 0.1s;
  transform-origin: left center;
}

@keyframes bookOpen {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

.loading-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  font-family: 'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif;
  direction: rtl;
}

.loading-dots {
  display: flex;
  gap: 6px;
  align-items: center;
  height: 8px;
}

.loading-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-color);
  animation: bounce 1.4s ease-in-out infinite;
}

.loading-dots span:nth-child(1) {
  animation-delay: 0s;
}

.loading-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

.content-container {
  color: var(--text-primary);
  text-align: justify;
  font-family: var(--text-font);
  padding: 16px;
  font-size: 100%; /* Default, will be overridden by settings */
  user-select: text !important;
  -webkit-user-select: text !important;
  -moz-user-select: text !important;
  -ms-user-select: text !important;
}

.content-container :deep(*) {
  user-select: text !important;
  -webkit-user-select: text !important;
  -moz-user-select: text !important;
  -ms-user-select: text !important;
}

.content-container.hidden {
  display: none;
}

.content-container :deep(line:not(:has(h1, h2, h3, h4, h5, h6))) {
  display: block;
  contain: layout style;
  padding-block-start: 0.3em;
}

/* Header hierarchy styling */
.content-container :deep(line h1),
.content-container :deep(line h2),
.content-container :deep(line h3),
.content-container :deep(line h4),
.content-container :deep(line h5),
.content-container :deep(line h6) {
  font-family: var(--header-font);
  color: var(--text-primary);
  line-height: 1.4;
  margin: 0;
  text-align: right;
}

/* H1 - Main title */
.content-container :deep(line h1) {
  font-size: 2em;
  font-weight: 700;
  padding: 0.8em 0 0.4em 0;
  margin-bottom: 0.5em;
  border-bottom: 1px solid var(--border-color);
  letter-spacing: -0.02em;
}

/* H2 - Major section */
.content-container :deep(line h2) {
  font-size: 1.6em;
  font-weight: 700;
  padding: 0.7em 0 0.3em 0;
  margin-bottom: 0.4em;
  letter-spacing: -0.01em;
}

/* H3 - Subsection */
.content-container :deep(line h3) {
  font-size: 1.4em;
  font-weight: 600;
  padding: 0.6em 0 0.2em 0;
  margin-bottom: 0.3em;
}

/* H4 - Minor heading */
.content-container :deep(line h4) {
  font-size: 1.2em;
  font-weight: 600;
  padding: 0.5em 0 0.2em 0;
  margin-bottom: 0.2em;
  color: var(--text-primary);
  opacity: 0.95;
}

/* H5 - Small heading */
.content-container :deep(line h5) {
  font-size: 1.1em;
  font-weight: 600;
  padding: 0.4em 0 0.15em 0;
  margin-bottom: 0.15em;
  color: var(--text-primary);
  opacity: 0.9;
}

/* H6 - Smallest heading */
.content-container :deep(line h6) {
  font-size: 1em;
  font-weight: 600;
  padding: 0.3em 0 0.1em 0;
  margin-bottom: 0.1em;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.9em;
}

/* Hover effects */
.content-container :deep(line:hover) {
  background: var(--hover-bg);
}

.content-container :deep(line:has(h1, h2, h3, h4, h5, h6):hover) {
  background: transparent;
}

.content-container :deep(line:has(h1, h2, h3, h4, h5, h6)) {
  cursor: default;
}

.content-container :deep(line:not(:has(h1, h2, h3, h4, h5, h6)):focus) {
  border-right: 3px solid var(--accent-color);
  padding-right: 3px;
  margin-right: -3px;
  outline: none;
}


</style>
