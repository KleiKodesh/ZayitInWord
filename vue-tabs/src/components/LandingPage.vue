<template>
  <div class="content" tabindex="-1">
    <Transition :name="transitionName" mode="out-in">
      <div :key="selectedBook ? 'toc' : 'search'" class="search-results">
        <!-- Book search view -->
        <TreeView
          v-if="!selectedBook"
          ref="treeViewRef"
          :tree-data="treeData"
          :is-loading="isLoadingTree"
          :search-query="debouncedSearchQuery"
          @select-book="selectBook"
          @click="focusContent"
        />
        <!-- TOC view -->
        <TocView
          v-else
          ref="tocViewRef"
          :toc-entries="currentTocEntries"
          :toc-entries-flat="currentTocFlat"
          :is-loading="isLoadingToc"
          :search-query="debouncedSearchQuery"
          @select-entry="selectTocEntry"
        />
      </div>
    </Transition>

    <div class="search-bar">
      <button v-if="selectedBook" @click="goBackToSearch" class="back-btn" title="חזור לחיפוש ספרים">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M9 14L4 9L9 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M20 20V13C20 11.9391 19.5786 10.9217 18.8284 10.1716C18.0783 9.42143 17.0609 9 16 9H4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <button v-else @click="resetTree" class="reset-btn">
        <img src="/assets/ic_fluent_text_bullet_list_tree_24_regular.png" alt="Reset" class="themed-icon rtl-flip" />
      </button>
      <input 
        ref="searchInputRef"
        v-model="searchInput" 
        type="text" 
        :placeholder="selectedBook ? 'חפש בתוכן עניינים...' : 'חפש ספר...'"
        @keydown.enter="handleEnterKey"
        @keydown.up.prevent="handleSearchArrowUp"
        @keydown.down.prevent="handleSearchArrowDown"
      />
      <button v-if="selectedBook" @click="openBookAtLine(null)" class="open-start-btn" title="המשך">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M12.5 4.5L7 10L12.5 15.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import TreeView from './TreeView.vue'
import TocView from './TocView.vue'
import type { Book } from '../types/Book'
import type { TreeData } from '../types/Tree'
import type { TocEntry } from '../types/Toc'
import { useTabsStore } from '../stores/tabs'
import { useTocStore } from '../stores/toc'

const tabsStore = useTabsStore()
const tocStore = useTocStore()
const searchInput = ref('')
const debouncedSearchQuery = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)
const treeViewRef = ref<InstanceType<typeof TreeView> | null>(null)
const tocViewRef = ref<InstanceType<typeof TocView> | null>(null)
const selectedBook = ref<Book | null>(null)
const isLoadingToc = ref(false)
const transitionName = ref('slide-right')
let debounceTimeout: number | null = null

// Debounce search input to improve responsiveness
watch(searchInput, (newValue) => {
  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
  }
  
  debounceTimeout = window.setTimeout(() => {
    debouncedSearchQuery.value = newValue
  }, 250) // 250ms delay for better responsiveness
})

// Focus search input when this tab becomes active
watch(() => tabsStore.activeTabId, (newTabId) => {
  const activeTab = tabsStore.tabs.find(t => t.id === newTabId)
  if (activeTab?.type === 'search') {
    // Use nextTick to ensure DOM is updated
    setTimeout(() => {
      searchInputRef.value?.focus()
    }, 50)
  }
})

// Tree data is global (shared across all landing pages)
const treeData = computed(() => tabsStore.treeData)
const isLoadingTree = computed(() => tabsStore.isLoadingTree)

// Focus content div to enable keyboard navigation
const focusContent = () => {
  const content = document.querySelector('.content') as HTMLElement
  content?.focus()
  // Focus first item if nothing is selected
  treeViewRef.value?.focusFirstItem()
}

// Functions to be called from C#
declare global {
  interface Window {
    receiveTreeData: (data: TreeData) => void
    chrome?: {
      webview?: {
        postMessage: (message: any) => void
      }
    }
  }
}

window.receiveTreeData = (data: TreeData) => {
  tabsStore.setTreeData(data)
}

// Load tree data on mount
onMounted(() => {
  // Autofocus search input
  searchInputRef.value?.focus()
  
  if (!treeData.value && !isLoadingTree.value) {
    tabsStore.setLoadingTree(true)
    
    console.log('Attempting to load tree data...')
    console.log('WebView available:', !!window.chrome?.webview)
    
    if (window.chrome?.webview) {
      console.log('Sending GetTree command to C#')
      window.chrome.webview.postMessage({
        command: 'GetTree',
        args: []
      })
    } else {
      // Development mode: use sample data
      console.log('Loading sample data (dev mode)')
      import('../data/sampleTreeData').then(module => {
        tabsStore.setTreeData(module.sampleTreeData)
      })
    }
    
    // Timeout after 5 seconds
    setTimeout(() => {
      if (isLoadingTree.value && !treeData.value) {
        tabsStore.setLoadingTree(false)
        console.error('Failed to load tree data - timeout after 5 seconds')
      }
    }, 5000)
  }
})

// Reset tree: clear search and collapse all
const resetTree = () => {
  searchInput.value = ''
  debouncedSearchQuery.value = ''
  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
  }
  treeViewRef.value?.reset()
}

// Get current TOC entries for selected book (tree for display, flat for search)
const currentTocEntries = computed(() => {
  if (!selectedBook.value) return null
  // Always use tree structure for display
  const entries = tocStore.getTocForBook(selectedBook.value.id)
  console.log('Current TOC tree entries for book', selectedBook.value.id, ':', entries?.length || 0)
  return entries || null
})

// Get flattened TOC for search
const currentTocFlat = computed(() => {
  if (!selectedBook.value) return null
  const flatEntries = tocStore.getTocFlatForBook(selectedBook.value.id)
  console.log('Current TOC flat entries for book', selectedBook.value.id, ':', flatEntries?.length || 0)
  return flatEntries || null
})

// Declare global function for receiving TOC data
declare global {
  interface Window {
    receiveTocData: (bookId: number, tocData: any) => void
  }
}

// Set up global TOC receiver - wrap existing one if it exists
const originalReceiveTocData = window.receiveTocData
window.receiveTocData = (bookId: number, tocData: any) => {
  console.log('LandingPage received TOC data for book:', bookId)
  tocStore.setTocData(bookId, tocData)
  isLoadingToc.value = false
  
  // Call original if it exists (for TocSidebar)
  if (originalReceiveTocData) {
    originalReceiveTocData(bookId, tocData)
  }
}

const selectBook = (book: Book) => {
  // We're in book selection mode, show TOC
  transitionName.value = 'slide-left'
  selectedBook.value = book
  
  // Clear search when switching to TOC
  searchInput.value = ''
  debouncedSearchQuery.value = ''
  
  // Focus search input when TOC loads
  setTimeout(() => {
    searchInputRef.value?.focus()
  }, 200)
  
  console.log('Selected book:', book.id, book.title)
  
  // Request TOC if not already loaded (shared with TOC sidebar)
  const existingToc = tocStore.tocData.get(book.id)
  if (!existingToc || existingToc.length === 0) {
    console.log('Requesting TOC for book:', book.id)
    isLoadingToc.value = true
    tocStore.requestToc(book.id)
    
    // Timeout after 1.5 seconds - faster response for books without TOC
    setTimeout(() => {
      if (isLoadingToc.value) {
        console.log('TOC request timed out for book:', book.id)
        isLoadingToc.value = false
        // Auto-open book if no TOC available
        if (selectedBook.value && (!currentTocEntries.value || currentTocEntries.value.length === 0)) {
          openBookAtLine(null)
        }
      }
    }, 1500)
  } else {
    console.log('TOC already loaded for book:', book.id, 'entries:', existingToc.length)
    // Auto-open book if no TOC available
    if (existingToc.length === 0) {
      openBookAtLine(null)
    }
  }
}

// Watch for TOC loading completion and auto-open if no TOC
watch([isLoadingToc, currentTocEntries], ([loading, entries]) => {
  if (!loading && selectedBook.value && (!entries || entries.length === 0)) {
    // TOC finished loading but no entries - auto-open the book
    openBookAtLine(null)
  }
})

const selectTocEntry = (entry: TocEntry) => {
  console.log('Selected TOC entry:', entry.lineId, entry.text)
  // Open the book at this line
  openBookAtLine(entry.lineId)
}

const goBackToSearch = () => {
  transitionName.value = 'slide-right'
  selectedBook.value = null
  isLoadingToc.value = false
  searchInput.value = ''
  debouncedSearchQuery.value = ''
  // Refocus search input
  setTimeout(() => {
    searchInputRef.value?.focus()
  }, 50)
}

const openBookAtLine = (lineIndex: number | null) => {
  if (!selectedBook.value) return
  
  const currentTabId = tabsStore.activeTabId
  if (!currentTabId) return
  
  // Convert tab to book with optional initial line index
  // The book content should already be pre-loaded from selectBook
  tabsStore.convertTabToBook(
    currentTabId, 
    selectedBook.value.id, 
    selectedBook.value.title,
    lineIndex !== null ? lineIndex : undefined
  )
}

const handleEnterKey = () => {
  if (selectedBook.value) {
    // In TOC mode - open book from start
    openBookAtLine(null)
  }
}

const handleSearchArrowUp = () => {
  // Focus tree/toc view and navigate
  if (selectedBook.value && tocViewRef.value) {
    tocViewRef.value.focusTocView()
  } else if (treeViewRef.value) {
    (treeViewRef.value.$el as HTMLElement)?.focus()
    treeViewRef.value.focusFirstItem()
  }
}

const handleSearchArrowDown = () => {
  // Focus tree/toc view and navigate
  if (selectedBook.value && tocViewRef.value) {
    tocViewRef.value.focusTocView()
  } else if (treeViewRef.value) {
    (treeViewRef.value.$el as HTMLElement)?.focus()
    treeViewRef.value.focusFirstItem()
  }
}
</script>

<style scoped>
.content {
  height: 100%;
  width: 100%;
  direction: rtl;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  outline: none;
}

.content::before {
  background: url('/assets/zayit_transparent.png') no-repeat center center;
 background-size: clamp(50px, 40vw, 250px);
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.2;
  pointer-events: none;
}

.search-results {
  flex: 1;
  overflow: hidden;
  width: 100%;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  position: relative;
  z-index: 20;
}

.search-bar input {
  flex: 1;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  outline: none;
  font-size: 0.875rem;
  padding: 6px 12px;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.search-bar input:focus {
  border-color: var(--accent-color);
}

.search-bar input::placeholder {
  color: var(--text-secondary);
  opacity: 0.6;
}

.search-bar button {
  background: transparent;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.1s ease;
}

.search-bar button:hover {
  background: var(--hover-bg);
}

.search-bar button:active {
  background: var(--active-bg);
  transform: scale(0.95);
}

.reset-btn img {
  width: 20px;
  opacity: 0.7;
}

.reset-btn:hover img {
  opacity: 1;
}

.back-btn {
  background: transparent;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.1s ease;
  color: var(--text-primary);
}

.back-btn svg {
  transform: scaleX(-1);
}

.back-btn:hover {
  background: var(--hover-bg);
}

.back-btn:active {
  background: var(--active-bg);
  transform: scale(0.95);
}

.open-start-btn {
  background: transparent;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.1s ease;
  color: var(--text-primary);
  opacity: 0.7;
}

.open-start-btn:hover {
  background: var(--hover-bg);
  opacity: 1;
}

.open-start-btn:active {
  background: var(--active-bg);
  transform: scale(0.95);
}

.rtl-flip {
  transform: scaleX(-1);
}

/* Slide transitions */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

@media (max-width: 768px) {
  .search-bar input {
    font-size: 1rem;
  }
}
</style>
