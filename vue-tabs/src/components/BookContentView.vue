<template>
  <div class="book-content-view" ref="bookContentViewRef">
    <div 
      v-if="isLoading"
      class="loading-container"
    >
      <div class="loading-content">
        <div class="loading-icon">
          <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
            <path d="M12 8C12 7.44772 12.4477 7 13 7H23C23.5523 7 24 7.44772 24 8V40C24 40.5523 23.5523 41 23 41H13C12.4477 41 12 40.5523 12 40V8Z" stroke="currentColor" stroke-width="2.5" class="book-left"/>
            <path d="M24 8C24 7.44772 24.4477 7 25 7H35C35.5523 7 36 7.44772 36 8V40C36 40.5523 35.5523 41 35 41H25C24.4477 41 24 40.5523 24 40V8Z" stroke="currentColor" stroke-width="2.5" class="book-right"/>
          </svg>
        </div>
        <div class="loading-text">טוען ספר</div>
      </div>
    </div>
    
    <!-- Content container must always exist in DOM for C# to add lines -->
    <div 
      class="content-container"
      :class="{ hidden: isLoading }"
      :style="{ fontSize: `${fontSize}%` }"
      :data-tab-id="tabId"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, onActivated, onDeactivated, watch, nextTick } from 'vue'
import { useTabsStore } from '../stores/tabs'

const props = defineProps<{
  tabId: string
  isSplitPaneEnabled: boolean
}>()

const emit = defineEmits<{
  requestLinks: [lineId: number]
}>()

const tabsStore = useTabsStore()

// State
const isLoading = ref(true)
const fontSize = ref(100)
const lineCounter = ref(0)
const initLineIndex = ref(0)
const selectedLineId = ref<number | null>(null)
const savedScrollPosition = ref(0)
const bookContentViewRef = ref<HTMLElement | null>(null)

// Debug: Watch isLoading changes
watch(isLoading, (newVal, oldVal) => {
  console.log(`[BookContentView ${props.tabId}] ⚡ isLoading changed: ${oldVal} → ${newVal}`, new Date().toISOString())
})

// Functions for C# to call
const addLineToThisTab = (html: string) => {
  const contentContainer = document.querySelector(`.content-container[data-tab-id="${props.tabId}"]`)
  if (!contentContainer) {
    console.error(`[BookContentView ${props.tabId}] Content container not found`)
    return
  }
  
  const lineElement = document.createElement('line')
  lineElement.tabIndex = 0
  lineElement.innerHTML = html
  contentContainer.appendChild(lineElement)
  
  const isTargetLine = lineCounter.value === initLineIndex.value
  
  if (initLineIndex.value === 0 || isTargetLine) {
    if (isLoading.value) {
      isLoading.value = false
    }
  }
  
  if (isTargetLine) {
    lineElement.scrollIntoView({ behavior: 'auto', block: 'center' })
  }
  
  lineCounter.value++
}

const addLinesToThisTab = (linesArray: Array<{ id: number; html: string }>) => {
  const contentContainer = document.querySelector(`.content-container[data-tab-id="${props.tabId}"]`)
  if (!contentContainer) {
    console.error(`[BookContentView ${props.tabId}] Content container not found`)
    return
  }
  
  const fragment = document.createDocumentFragment()
  let targetLineElement: HTMLElement | null = null
  let foundTargetLine = false
  
  for (const lineData of linesArray) {
    const lineElement = document.createElement('line')
    lineElement.tabIndex = 0
    lineElement.id = `line-${lineData.id}`
    lineElement.innerHTML = lineData.html
    fragment.appendChild(lineElement)
    
    if (lineCounter.value === initLineIndex.value) {
      targetLineElement = lineElement
      foundTargetLine = true
    }
    
    lineCounter.value++
  }
  
  contentContainer.appendChild(fragment)
  
  if (initLineIndex.value === 0 || foundTargetLine) {
    if (isLoading.value) {
      isLoading.value = false
    }
  }
  
  if (targetLineElement) {
    targetLineElement.scrollIntoView({ behavior: 'auto', block: 'center' })
  }
}

const setInitLineIndexForThisTab = (index: number) => {
  initLineIndex.value = index
}

const clearBookContentForThisTab = () => {
  const contentContainer = document.querySelector(`.content-container[data-tab-id="${props.tabId}"]`)
  if (contentContainer) {
    contentContainer.innerHTML = ''
  }
  lineCounter.value = 0
  initLineIndex.value = 0
  isLoading.value = true
}

const bookLoadCompleteForThisTab = () => {
  if (isLoading.value) {
    isLoading.value = false
  }
}

// Handle line clicks
const handleLineClick = (event: Event) => {
  if (!props.isSplitPaneEnabled) return
  
  const target = event.target as HTMLElement
  const lineElement = target.closest('line')
  
  if (!lineElement || !lineElement.id) return
  
  const lineIdMatch = lineElement.id.match(/line-(\d+)/)
  if (!lineIdMatch || !lineIdMatch[1]) return
  
  const lineId = parseInt(lineIdMatch[1])
  
  // Toggle if same line clicked
  if (selectedLineId.value === lineId) {
    selectedLineId.value = null
    lineElement.classList.remove('selected')
    return
  }
  
  // Remove previous selection
  if (selectedLineId.value !== null) {
    const prevLine = document.getElementById(`line-${selectedLineId.value}`)
    if (prevLine) {
      prevLine.classList.remove('selected')
    }
  }
  
  // Add new selection
  lineElement.classList.add('selected')
  selectedLineId.value = lineId
  
  // Request links from parent
  emit('requestLinks', lineId)
}

// Watch for split pane disable to clear selection
watch(() => props.isSplitPaneEnabled, (enabled) => {
  if (!enabled && selectedLineId.value !== null) {
    const selectedLine = document.getElementById(`line-${selectedLineId.value}`)
    if (selectedLine) {
      selectedLine.classList.remove('selected')
    }
    selectedLineId.value = null
  }
})

// Handle Ctrl+A to select only book content
const handleSelectAll = (event: KeyboardEvent) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
    // Check if focus is within book content view
    const activeElement = document.activeElement
    const bookView = bookContentViewRef.value
    
    if (bookView && bookView.contains(activeElement)) {
      event.preventDefault()
      
      // Select all text in book content
      const selection = window.getSelection()
      const range = document.createRange()
      const contentContainer = document.querySelector(`.content-container[data-tab-id="${props.tabId}"]`)
      
      if (contentContainer) {
        range.selectNodeContents(contentContainer)
        selection?.removeAllRanges()
        selection?.addRange(range)
      }
    }
  }
}

// Prevent selection from crossing view boundaries
const handleMouseDown = (event: MouseEvent) => {
  const bookView = bookContentViewRef.value
  if (bookView && bookView.contains(event.target as Node)) {
    // Mark that selection started in book view
    ;(bookView as any).__selectionStarted = true
  }
}

const handleMouseUp = () => {
  const bookView = bookContentViewRef.value
  if (bookView) {
    ;(bookView as any).__selectionStarted = false
  }
}

const handleSelectStart = (event: Event) => {
  const bookView = bookContentViewRef.value
  const target = event.target as Node
  
  if (bookView) {
    const selectionStartedHere = (bookView as any).__selectionStarted
    const targetInBookView = bookView.contains(target)
    
    // Prevent selection if it started in book view but moved outside, or vice versa
    if (selectionStartedHere && !targetInBookView) {
      event.preventDefault()
    }
  }
}

onMounted(() => {
  console.log(`[BookContentView ${props.tabId}] ========== MOUNTED ==========`)
  
  const contentContainer = document.querySelector(`.content-container[data-tab-id="${props.tabId}"]`)
  console.log(`[BookContentView ${props.tabId}] Container found:`, !!contentContainer)
  
  if (contentContainer) {
    console.log(`[BookContentView ${props.tabId}] Container children count:`, contentContainer.children.length)
    contentContainer.addEventListener('click', handleLineClick as EventListener)
    
    // Check if content already exists (from KeepAlive cache)
    if (contentContainer.children.length > 0) {
      console.log(`[BookContentView ${props.tabId}] ✅ Content exists from cache, hiding loading`)
      isLoading.value = false
      return
    }
  }
  
  // Save scroll position on scroll
  if (bookContentViewRef.value) {
    bookContentViewRef.value.addEventListener('scroll', () => {
      if (bookContentViewRef.value) {
        savedScrollPosition.value = bookContentViewRef.value.scrollTop
        console.log(`[BookContentView ${props.tabId}] 📜 Scroll saved:`, savedScrollPosition.value)
      }
    })
  }
  
  // Add Ctrl+A handler
  document.addEventListener('keydown', handleSelectAll)
  
  // Add selection boundary handlers
  document.addEventListener('mousedown', handleMouseDown)
  document.addEventListener('mouseup', handleMouseUp)
  document.addEventListener('selectstart', handleSelectStart)
  
  // Request book content from C# if container is empty
  const tab = tabsStore.tabs.find(t => t.id === props.tabId)
  if (tab?.type === 'book' && tab.bookId) {
    console.log(`[BookContentView ${props.tabId}] 📡 Requesting book ${tab.bookId} from C#`)
    if (window.chrome?.webview) {
      window.chrome.webview.postMessage({
        command: 'OpenBook',
        args: [tab.bookId, props.tabId]
      })
    }
  }
})

onActivated(async () => {
  console.log(`[BookContentView ${props.tabId}] ========== ACTIVATED ==========`)
  console.log(`[BookContentView ${props.tabId}] isLoading state on activate:`, isLoading.value)
  
  // Wait for DOM to be fully restored
  await nextTick()
  
  const contentContainer = document.querySelector(`.content-container[data-tab-id="${props.tabId}"]`)
  if (contentContainer) {
    console.log(`[BookContentView ${props.tabId}] Container children on activate:`, contentContainer.children.length)
    console.log(`[BookContentView ${props.tabId}] Container has 'hidden' class:`, contentContainer.classList.contains('hidden'))
    
    // If content exists from KeepAlive cache, hide loading
    if (contentContainer.children.length > 0) {
      console.log(`[BookContentView ${props.tabId}] ✅ Content preserved by KeepAlive, setting isLoading = false`)
      isLoading.value = false
      console.log(`[BookContentView ${props.tabId}] isLoading is now:`, isLoading.value)
    }
  }
  
  // Restore scroll position
  if (bookContentViewRef.value && savedScrollPosition.value > 0) {
    console.log(`[BookContentView ${props.tabId}] 📜 Restoring scroll:`, savedScrollPosition.value)
    bookContentViewRef.value.scrollTop = savedScrollPosition.value
  }
})

onDeactivated(() => {
  console.log(`[BookContentView ${props.tabId}] ========== DEACTIVATED ==========`)
  // Don't read scrollTop here - it's already being saved continuously by the scroll event
  // Just log the current saved value
  console.log(`[BookContentView ${props.tabId}] 📜 Scroll position at deactivate:`, savedScrollPosition.value)
})

onUnmounted(() => {
  const contentContainer = document.querySelector(`.content-container[data-tab-id="${props.tabId}"]`)
  if (contentContainer) {
    contentContainer.removeEventListener('click', handleLineClick as EventListener)
  }
  
  // Remove event listeners
  document.removeEventListener('keydown', handleSelectAll)
  document.removeEventListener('mousedown', handleMouseDown)
  document.removeEventListener('mouseup', handleMouseUp)
  document.removeEventListener('selectstart', handleSelectStart)
})

// Expose functions for parent to register with C# handlers
defineExpose({
  addLine: addLineToThisTab,
  addLines: addLinesToThisTab,
  setInitLineIndex: setInitLineIndexForThisTab,
  clearBookContent: clearBookContentForThisTab,
  bookLoadComplete: bookLoadCompleteForThisTab
})
</script>

<style scoped>
.book-content-view {
  height: 100%;
  width: 100%;
  direction: rtl;
  position: relative;
  overflow-y: auto;
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

.content-container {
  color: var(--text-primary);
  text-align: justify;
  font-family: var(--text-font);
  padding: 16px;
  font-size: 100%;
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
  padding-block-start: 0.15em;
  padding-block-end: 0.15em;
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

.content-container :deep(line h1) {
  font-size: 2em;
  font-weight: 700;
  padding: 0.8em 0 0.4em 0;
  margin-bottom: 0.5em;
  border-bottom: 1px solid var(--border-color);
  letter-spacing: -0.02em;
}

.content-container :deep(line h2) {
  font-size: 1.6em;
  font-weight: 700;
  padding: 0.7em 0 0.3em 0;
  margin-bottom: 0.4em;
  letter-spacing: -0.01em;
}

.content-container :deep(line h3) {
  font-size: 1.4em;
  font-weight: 600;
  padding: 0.6em 0 0.2em 0;
  margin-bottom: 0.3em;
}

.content-container :deep(line h4) {
  font-size: 1.2em;
  font-weight: 600;
  padding: 0.5em 0 0.2em 0;
  margin-bottom: 0.2em;
  color: var(--text-primary);
  opacity: 0.95;
}

.content-container :deep(line h5) {
  font-size: 1.1em;
  font-weight: 600;
  padding: 0.4em 0 0.15em 0;
  margin-bottom: 0.15em;
  color: var(--text-primary);
  opacity: 0.9;
}

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

/* Selected line styling */
.content-container :deep(line:not(:has(h1, h2, h3, h4, h5, h6)).selected) {
  border-right: 3px solid var(--accent-color);
  padding-right: 3px;
  margin-right: -3px;
}

/* Keep focus outline disabled */
.content-container :deep(line:focus) {
  outline: none;
}
</style>
