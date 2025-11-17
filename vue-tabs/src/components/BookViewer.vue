<template>
  <div class="book-viewer">
    <div class="content-container" :data-tab-id="tabId"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useTabsStore } from '../stores/tabs'

const props = defineProps<{
  tabId: string
}>()

const tabsStore = useTabsStore()
const contentContainer = ref<HTMLElement | null>(null)
const lineCounter = ref(0)
const initLineIndex = ref(0)

// Expose functions to C# with tab-specific keys
declare global {
  interface Window {
    addLine: (tabId: string, html: string) => void
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
  
  if (lineCounter.value++ === initLineIndex.value) {
    lineElement.scrollIntoView()
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

onMounted(() => {
  contentContainer.value = document.querySelector(`.content-container[data-tab-id="${props.tabId}"]`)
  
  // Clear any existing handlers for this tab to prevent duplicates
  if (tabHandlers.has(props.tabId)) {
    console.warn(`Handler already exists for ${props.tabId}, replacing...`)
    tabHandlers.delete(props.tabId)
  }
  
  // Register this tab's handlers FIRST before any book loading
  tabHandlers.set(props.tabId, {
    addLine: addLineToThisTab,
    setInitLineIndex: setInitLineIndexForThisTab,
    clearBookContent: clearContentForThisTab,
    bookLoadComplete: () => {
      // Book finished loading, restore scroll position
      const tab = tabsStore.tabs.find(t => t.id === props.tabId)
      const tabPane = document.querySelector(`.tab-pane[data-tab-id="${props.tabId}"]`) as HTMLElement
      if (tab?.scrollPosition !== undefined && tabPane) {
        const savedPosition = tab.scrollPosition
        // Use requestAnimationFrame to ensure DOM is fully updated
        requestAnimationFrame(() => {
          if (tabPane) {
            tabPane.scrollTop = savedPosition
          }
        })
      }
    }
  })
  
  // Request book content if container is empty
  const tab = tabsStore.tabs.find(t => t.id === props.tabId)
  if (tab?.type === 'book' && tab.bookId && contentContainer.value?.children.length === 0) {
    if (window.chrome?.webview) {
      window.chrome.webview.postMessage({
        command: 'OpenBook',
        args: [tab.bookId, props.tabId]
      })
    }
  }
})

onUnmounted(() => {
  // Clean up handlers when component unmounts
  tabHandlers.delete(props.tabId)
})
</script>

<style scoped>
.book-viewer {
  height: 100%;
  width: 100%;
  direction: rtl;
}

.content-container {
  color: #111;
  text-align: justify;
  font-family: 'Times New Roman', Times, serif;
  padding: 16px;
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
  font-family: 'Guttman Mantova', Tahoma, sans-serif;
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

:root.dark .content-container :deep(line:focus) {
  border-right: 3px solid var(--accent-color);
}
</style>
