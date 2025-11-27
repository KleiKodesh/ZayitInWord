<template>
  <div 
    ref="tocViewRef"
    class="toc-tree-container"
    tabindex="-1"
    @keydown.up.prevent="navigateUp"
    @keydown.down.prevent="navigateDown"
    @keydown.enter="selectCurrentItem"
    @keydown.space.prevent="toggleCurrentItem"
    @click="focusTreeView"
  >
    <LoadingAnimation v-if="isLoading" message="טוען תוכן עניינים"/>
    
    <div v-else-if="showSearchResults" class="search-results">
      <div
        v-for="(entry, index) in filteredEntries"
        :key="entry.lineId"
        class="toc-search-item"
        :class="{ selected: index === selectedIndex && showSelection }"
        tabindex="0"
        @click="handleEntryClick(entry, index)"
        @keydown.enter.stop="handleEntryClick(entry, index)"
        @keydown.space.stop.prevent="handleEntryClick(entry, index)"
      >
        <div class="toc-item-content">
          <div class="toc-text">{{ entry.text }}</div>
          <div v-if="entry.path" class="toc-path">{{ entry.path }}</div>
        </div>
      </div>
    </div>

    <div v-else-if="searchQuery && !filteredEntries.length" class="no-results">
      לא נמצאו תוצאות
    </div>

    <div v-else-if="tocData && tocData.tree.length > 0" class="toc-tree">
      <TocNode
        v-for="entry in tocData.tree"
        :key="entry.id"
        :entry="entry"
        @navigate="handleNavigate"
      />
    </div>

    <div v-else class="no-results">
      אין תוכן עניינים זמין
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { send } from '../../bridge/webview'
import { useTabsStore } from '../../stores/tabStore'
import TocNode from './TocNode.vue'
import LoadingAnimation from '../shared/LoadingAnimation.vue'
import type { TocEntry } from '../../types/Toc'
import { buildTocFromFlat } from '../../utils/tocBuilder'

const props = defineProps<{
  searchQuery: string
}>()

const tabsStore = useTabsStore()
const tocData = ref<{ tree: TocEntry[], allTocs: TocEntry[] } | null>(null)
const isLoading = ref(false)

// Setup global callback for receiving TOC data
declare global {
  interface Window {
    receiveTocData?: (bookId: number, data: any) => void
  }
}

window.receiveTocData = (bookId: number, data: any) => {
  const currentBookId = tabsStore.currentRoute?.bookId
  console.log('[TocTree] receiveTocData called for bookId:', bookId, 'currentBookId:', currentBookId)
  
  if (bookId === currentBookId) {
    console.log('[TocTree] Received TOC data for book:', bookId, data)
    
    // Both C# and SQLite now return flat data in same format
    if (data.tocEntriesFlat) {
      console.log('[TocTree] 📦 Building TOC tree from flat data...')
      tocData.value = buildTocFromFlat(data.tocEntriesFlat)
      console.log('[TocTree] ✅ TOC tree built successfully')
    } else {
      console.error('[TocTree] ❌ Invalid TOC data format:', data)
    }
    
    isLoading.value = false
  } else {
    console.log('[TocTree] Ignoring TOC data for different book')
  }
}

// Filtered entries for search
const filteredEntries = ref<TocEntry[]>([])

watch(() => props.searchQuery, (newQuery) => {
  if (!newQuery || !tocData.value) {
    filteredEntries.value = []
    return
  }
  
  const query = newQuery.toLowerCase().trim()
  const queryWords = query.split(/\s+/)
  
  filteredEntries.value = tocData.value.allTocs.filter(entry => {
    const searchableText = `${entry.path || ''} ${entry.text}`.toLowerCase()
    const textWords = searchableText.split(/[\s\/\-,.:;]+/).filter(w => w.length > 0)
    
    return queryWords.every(queryWord => {
      if (queryWord.length === 1) {
        return textWords.some(textWord => textWord === queryWord)
      }
      return textWords.some(textWord => 
        textWord === queryWord || textWord.startsWith(queryWord)
      )
    })
  })
}, { immediate: true })

const showSearchResults = computed(() => {
  return props.searchQuery.trim().length > 0 && filteredEntries.value.length > 0
})

const handleNavigate = (lineIndex: number) => {
  const entry = tocData.value?.allTocs.find(e => e.lineIndex === lineIndex)
  if (entry) {
    handleEntrySelect(entry)
  }
}

const handleEntrySelect = (entry: TocEntry) => {
  console.log('Selected TOC entry:', entry.text, 'lineIndex:', entry.lineIndex)
  // Navigate to book viewer with selected line
  const route = tabsStore.currentRoute
  if (route?.bookId) {
    // Extract book title by removing "תוכן עניינים - " prefix if present
    const bookTitle = tabsStore.activeTab?.title.replace(/^תוכן עניינים - /, '') || ''
    
    tabsStore.navigateTo({
      type: 2, // Type 2 = Book Viewer
      title: bookTitle,
      bookId: route.bookId,
      lineIndex: entry.lineIndex
    })
  }
}

// Keyboard navigation
const tocViewRef = ref<HTMLElement | null>(null)
const selectedIndex = ref(-1)
const showSelection = ref(false)
let selectionTimeout: number | null = null

const clearSelectionAfterDelay = () => {
  if (selectionTimeout) {
    clearTimeout(selectionTimeout)
  }
  selectionTimeout = window.setTimeout(() => {
    showSelection.value = false
  }, 2000)
}

// Helper to scroll element into view only if needed - minimal scroll to edge
const scrollIntoViewIfNeeded = (element: HTMLElement) => {
  const container = tocViewRef.value
  if (!container) return
  
  const containerRect = container.getBoundingClientRect()
  const elementRect = element.getBoundingClientRect()
  
  // Calculate how much to scroll
  let scrollAmount = 0
  
  if (elementRect.top < containerRect.top) {
    scrollAmount = elementRect.top - containerRect.top
  } else if (elementRect.bottom > containerRect.bottom) {
    scrollAmount = elementRect.bottom - containerRect.bottom
  }
  
  if (scrollAmount !== 0) {
    container.scrollBy({ top: scrollAmount, behavior: 'smooth' })
  }
}

const scrollToSelected = () => {
  setTimeout(() => {
    const items = document.querySelectorAll('.toc-search-item')
    const item = items[selectedIndex.value] as HTMLElement
    if (item) {
      item.focus({ preventScroll: true })
      scrollIntoViewIfNeeded(item)
    }
  }, 0)
}

const navigateUp = () => {
  const focusableElements = Array.from(
    tocViewRef.value?.querySelectorAll('.toc-search-item, .toc-item') || []
  ) as HTMLElement[]
  
  if (focusableElements.length === 0) return
  
  const currentFocused = document.activeElement as HTMLElement
  const currentIndex = focusableElements.indexOf(currentFocused)
  
  const nextIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1
  const nextElement = focusableElements[nextIndex]
  if (nextElement) {
    nextElement.focus({ preventScroll: true })
    scrollIntoViewIfNeeded(nextElement)
  }
}

const navigateDown = () => {
  const focusableElements = Array.from(
    tocViewRef.value?.querySelectorAll('.toc-search-item, .toc-item') || []
  ) as HTMLElement[]
  
  if (focusableElements.length === 0) return
  
  const currentFocused = document.activeElement as HTMLElement
  const currentIndex = focusableElements.indexOf(currentFocused)
  
  const nextIndex = currentIndex === -1 || currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1
  const nextElement = focusableElements[nextIndex]
  if (nextElement) {
    nextElement.focus({ preventScroll: true })
    scrollIntoViewIfNeeded(nextElement)
  }
}

const selectCurrentItem = () => {
  // Enter key: navigate to the TOC entry
  const currentFocused = document.activeElement as HTMLElement
  if (currentFocused && tocViewRef.value?.contains(currentFocused)) {
    currentFocused.click()
  }
}

const toggleCurrentItem = () => {
  // Space key: toggle expand/collapse if it has children
  const currentFocused = document.activeElement as HTMLElement
  if (currentFocused && currentFocused.classList.contains('toc-item')) {
    const chevron = currentFocused.querySelector('.chevron-icon') as HTMLElement
    if (chevron) {
      // Has children, toggle expand
      chevron.click()
    }
  }
}

const handleEntryClick = (entry: TocEntry, index: number) => {
  selectedIndex.value = index
  handleEntrySelect(entry)
}

const focusTreeView = () => {
  // Only focus if nothing in the tree is currently focused
  const currentFocused = document.activeElement as HTMLElement
  if (tocViewRef.value?.contains(currentFocused)) {
    // Already focused on something in the tree, don't change focus
    return
  }
  
  // Focus first focusable element in tree
  const firstFocusable = tocViewRef.value?.querySelector('.toc-search-item, .toc-item') as HTMLElement
  if (firstFocusable) {
    firstFocusable.focus()
  } else {
    tocViewRef.value?.focus()
  }
}

// Reset selection when search query changes
watch(() => props.searchQuery, () => {
  if (filteredEntries.value.length > 0) {
    selectedIndex.value = 0
    showSelection.value = false
  } else {
    selectedIndex.value = -1
    showSelection.value = false
  }
})

defineExpose({
  focusTreeView
})

// Load TOC when component mounts or when bookId changes
const loadToc = () => {
  const route = tabsStore.currentRoute
  console.log('[TocTree] loadToc called, currentRoute:', route)
  if (route?.bookId) {
    console.log('[TocTree] Loading TOC for bookId:', route.bookId)
    isLoading.value = true
    send('GetToc', [route.bookId])
  } else {
    console.warn('[TocTree] No bookId in currentRoute')
  }
}

onMounted(() => {
  console.log('[TocTree] onMounted')
  loadToc()
})

// Watch for bookId changes (when navigating to different books)
watch(() => tabsStore.currentRoute?.bookId, (newBookId, oldBookId) => {
  console.log('[TocTree] bookId changed from', oldBookId, 'to', newBookId)
  if (newBookId && newBookId !== oldBookId) {
    loadToc()
  }
})
</script>

<style scoped>
/* TOC tree container - focusable for keyboard navigation */
.toc-tree-container {
  height: 100%; /* Full height */
  overflow-y: auto; /* Scrollable */
  outline: none; /* Remove focus outline */
}

.toc-tree-container:focus {
  outline: none; /* Remove focus outline */
}

/* Search results container - no padding for full-width items */
.search-results {
  padding: 0; /* No padding to allow items to span full width */
}

/* Search result item - horizontal layout with content */
.toc-search-item {
  display: flex; /* Flexbox for horizontal layout */
  align-items: center; /* Vertically center content */
  padding: 0.875rem 1.25rem; /* 14px vertical, 20px horizontal padding */
  cursor: pointer; /* Show pointer cursor on hover */
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1); /* Smooth transition for all properties */
}

/* Hover state - highlight background */
.toc-search-item:hover {
  background: var(--hover-bg); /* Light background on hover */
}

/* Focus state - highlight for keyboard navigation (same as tree nodes) */
.toc-search-item:focus {
  outline: none; /* No outline */
  background: rgba(var(--accent-color-rgb, 0, 120, 212), 0.1); /* Light accent background */
}

/* Active state - darker background with press effect */
.toc-search-item:active {
  background: var(--active-bg); /* Darker background when pressed */
  transform: scale(0.98); /* Slight scale down for press effect */
}

/* TOC item content container */
.toc-item-content {
  flex: 1; /* Take remaining space */
  min-width: 0; /* Allow text truncation with ellipsis */
}

/* TOC entry text - primary heading */
.toc-text {
  font-size: 0.8125rem; /* 13px font size */
  font-weight: 600; /* Semi-bold weight */
  color: var(--text-primary); /* Primary text color */
  line-height: 1.4; /* Line height for readability */
  margin: 0 0 0.25rem 0; /* 4px bottom margin */
}

/* TOC path breadcrumb - truncated with ellipsis */
.toc-path {
  font-size: 0.6875rem; /* 11px font size */
  color: var(--text-secondary); /* Secondary text color */
  margin: 0; /* No margin */
  line-height: 1.3; /* Compact line height */
  overflow: hidden; /* Hide overflow text */
  text-overflow: ellipsis; /* Show ellipsis for overflow */
  white-space: nowrap; /* Prevent text wrapping */
  font-weight: 500; /* Medium weight */
  opacity: 0.8; /* Slightly transparent */
}

/* TOC tree container - inline-block for proper width calculation */
.toc-tree {
  padding: 0; /* No padding to fill container */
  display: inline-block; /* Allow width to fit content */
  min-width: min-content; /* Minimum width based on content */
  width: 100%; /* Take full width of parent */
}

/* No results message - centered */
.no-results {
  display: flex; /* Flexbox for centering */
  align-items: center; /* Vertically center text */
  justify-content: center; /* Horizontally center text */
  height: 12.5rem; /* 200px fixed height */
  color: var(--text-secondary); /* Secondary text color */
  font-size: 0.875rem; /* 14px font size */
  font-weight: 500; /* Medium weight */
}
</style>
