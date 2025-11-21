<template>
  <div class="book-viewer">
    <SplitPane 
      :initial-top-height="topPaneHeight"
      :show-bottom="isSplitPaneEnabled"
      @resize="handleResize"
    >
      <template #top>
        <BookContentView
          ref="bookContentViewRef"
          :tab-id="tabId"
          :is-split-pane-enabled="isSplitPaneEnabled"
          @request-links="handleRequestLinks"
        />
      </template>
      
      <template #bottom>
        <CommentaryView
          :link-groups="linkGroups"
          :is-loading="isLoadingLinks"
        />
      </template>
    </SplitPane>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, onActivated } from 'vue'
import { useTabsStore } from '../stores/tabs'
import SplitPane from './SplitPane.vue'
import BookContentView from './BookContentView.vue'
import CommentaryView from './CommentaryView.vue'

const props = defineProps<{
  tabId: string
}>()

const tabsStore = useTabsStore()
const bookContentViewRef = ref<InstanceType<typeof BookContentView> | null>(null)

// Split pane state
const isSplitPaneEnabled = ref(false)
const topPaneHeight = ref(40)
const bottomPaneHeight = ref(60)

// Commentary state
const linkGroups = ref<Array<{ groupName: string; links: Array<{ text: string; html: string }> }>>([])
const isLoadingLinks = ref(false)

// Handle split pane resize
const handleResize = (topHeight: number, bottomHeight: number) => {
  topPaneHeight.value = topHeight
  bottomPaneHeight.value = bottomHeight
}

// Handle link request from BookContentView
const handleRequestLinks = (lineId: number) => {
  const tab = tabsStore.tabs.find(t => t.id === props.tabId)
  if (!tab || tab.type !== 'book' || !tab.bookId) return
  
  isLoadingLinks.value = true
  linkGroups.value = []
  
  if (window.chrome?.webview) {
    window.chrome.webview.postMessage({
      command: 'GetLinks',
      args: [tab.bookId, lineId, props.tabId]
    })
  }
}

// Handle split pane toggle from C#
const handleSplitPaneToggle = (event: CustomEvent) => {
  if (event.detail.tabId === props.tabId) {
    isSplitPaneEnabled.value = event.detail.enabled
  }
}

// === C# Integration ===

// Global tab handlers
const tabHandlers = (window as any).__tabHandlers || ((window as any).__tabHandlers = new Map())

// Global functions for C#
declare global {
  interface Window {
    addLine: (tabId: string, html: string) => void
    addLines: (tabId: string, linesArray: Array<{ id: number; html: string }>) => void
    setInitLineIndex: (tabId: string, index: number) => void
    clearBookContent: (tabId: string) => void
    bookLoadComplete: (tabId: string) => void
    setLinks: (tabId: string, groups: Array<{ groupName: string; links: Array<{ text: string; html: string }> }>) => void
  }
}

// Initialize global functions once
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
  
  window.setLinks = (tabId: string, groups: Array<{ groupName: string; links: Array<{ text: string; html: string }> }>) => {
    const handler = tabHandlers.get(tabId)
    if (handler) {
      handler.linkGroups.value = groups
      handler.isLoadingLinks.value = false
    }
  }
}

onMounted(() => {
  console.log(`[BookViewer ${props.tabId}] Component mounted`)
  
  // Register this tab's handlers
  if (bookContentViewRef.value) {
    tabHandlers.set(props.tabId, {
      addLine: bookContentViewRef.value.addLine,
      addLines: bookContentViewRef.value.addLines,
      setInitLineIndex: bookContentViewRef.value.setInitLineIndex,
      clearBookContent: bookContentViewRef.value.clearBookContent,
      bookLoadComplete: bookContentViewRef.value.bookLoadComplete,
      linkGroups,
      isLoadingLinks
    })
    console.log(`[BookViewer ${props.tabId}] Handlers registered`)
  }
  
  // Listen for split pane toggle
  window.addEventListener('toggleSplitPane', handleSplitPaneToggle as EventListener)
})

onActivated(() => {
  console.log(`[BookViewer ${props.tabId}] Component activated from KeepAlive cache`)
  // Child components (BookContentView, CommentaryView) handle their own scroll restoration
})

onUnmounted(() => {
  tabHandlers.delete(props.tabId)
  window.removeEventListener('toggleSplitPane', handleSplitPaneToggle as EventListener)
})
</script>

<style scoped>
.book-viewer {
  height: 100%;
  width: 100%;
  direction: rtl;
  position: relative;
  overflow: hidden;
}
</style>
