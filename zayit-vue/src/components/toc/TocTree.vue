<template>
  <div 
    ref="tocViewRef"
    class="toc-tree-container"
    tabindex="-1"
    @keydown.up.prevent="navigateUp"
    @keydown.down.prevent="navigateDown"
    @keydown.enter="selectCurrentItem"
    @keydown.space.prevent="selectCurrentItem"
  >
    <LoadingAnimation v-if="isLoading" message="טוען תוכן עניינים"/>
    
    <div v-else-if="showSearchResults" class="search-results">
      <div
        v-for="(entry, index) in filteredEntries"
        :key="entry.lineId"
        class="toc-search-item"
        :class="{ selected: index === selectedIndex && showSelection }"
        @click="handleEntryClick(entry, index)"
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

const props = defineProps<{
  searchQuery: string
}>()

const tabsStore = useTabsStore()
const tocData = ref<{ tree: TocEntry[], allTocs: TocEntry[] } | null>(null)
const isLoading = ref(false)

// Setup global callback for receiving TOC data
declare global {
  interface Window {
    receiveTocData?: (bookId: number, data: { tree: TocEntry[], allTocs: TocEntry[] }) => void
  }
}

window.receiveTocData = (bookId: number, data: { tree: TocEntry[], allTocs: TocEntry[] }) => {
  if (bookId === tabsStore.activeTab?.bookId) {
    console.log('Received TOC data for book:', bookId, data)
    tocData.value = data
    isLoading.value = false
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

const handleNavigate = (lineId: number) => {
  const entry = tocData.value?.allTocs.find(e => e.lineId === lineId)
  if (entry) {
    handleEntrySelect(entry)
  }
}

const handleEntrySelect = (entry: TocEntry) => {
  console.log('Selected TOC entry:', entry.text, 'lineId:', entry.lineId)
  // Update the current tab to show book viewer with bookId and lineId
  if (tabsStore.activeTab?.bookId) {
    tabsStore.updateActiveTab(
      entry.text,
      2, // Type 2 = Book Viewer
      tabsStore.activeTab.bookId,
      entry.lineId
    )
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

const scrollToSelected = () => {
  setTimeout(() => {
    const items = document.querySelectorAll('.toc-search-item')
    const item = items[selectedIndex.value]
    if (item) {
      item.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    }
  }, 0)
}

const navigateUp = () => {
  if (filteredEntries.value.length === 0) return
  
  showSelection.value = true
  
  if (selectedIndex.value === -1) {
    selectedIndex.value = 0
  } else if (selectedIndex.value === 0) {
    selectedIndex.value = filteredEntries.value.length - 1
  } else {
    selectedIndex.value--
  }
  
  scrollToSelected()
  clearSelectionAfterDelay()
}

const navigateDown = () => {
  if (filteredEntries.value.length === 0) return
  
  showSelection.value = true
  
  if (selectedIndex.value === -1) {
    selectedIndex.value = 0
  } else if (selectedIndex.value >= filteredEntries.value.length - 1) {
    selectedIndex.value = 0
  } else {
    selectedIndex.value++
  }
  
  scrollToSelected()
  clearSelectionAfterDelay()
}

const selectCurrentItem = () => {
  if (selectedIndex.value >= 0 && selectedIndex.value < filteredEntries.value.length) {
    const entry = filteredEntries.value[selectedIndex.value]
    if (entry) {
      handleEntryClick(entry, selectedIndex.value)
    }
  }
}

const handleEntryClick = (entry: TocEntry, index: number) => {
  selectedIndex.value = index
  handleEntrySelect(entry)
}

const focusTreeView = () => {
  tocViewRef.value?.focus()
  if (selectedIndex.value === -1 && filteredEntries.value.length > 0) {
    selectedIndex.value = 0
    showSelection.value = true
    clearSelectionAfterDelay()
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

onMounted(() => {
  if (tabsStore.activeTab?.bookId) {
    isLoading.value = true
    send('GetToc', [tabsStore.activeTab.bookId])
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

/* Selected state - highlight for keyboard navigation */
.toc-search-item.selected {
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
  padding: 0.75rem; /* 12px padding on all sides */
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
