<template>
  <div 
    ref="treeViewRef"
    class="category-tree-container"
    tabindex="-1"
    @keydown.up.prevent="navigateUp"
    @keydown.down.prevent="navigateDown"
    @keydown.enter="selectCurrentItem"
    @keydown.space.prevent="selectCurrentItem"
    @click="focusTreeView"
  >
    <!-- Show loading animation while data is loading or not yet available -->
    <LoadingAnimation v-if="isLoading || !treeData" message="טוען אילן ספרים"/>
    
    <!-- Show search results when user is searching -->
    <template v-else>
      <div v-if="showSearchResults" class="search-results">
        <div 
          v-for="(book, index) in filteredBooks" 
          :key="book.id" 
          class="result-item" 
          :class="{ selected: index === selectedIndex && showSelection }"
          @click="handleBookClick(book, index)"
        >
          <BookIcon class="book-icon"/>
          <div class="book-info">
            <h3>{{ book.title }}</h3>
            <p v-if="book.path" class="book-category">{{ book.path }}</p>
          </div>
        </div>
        <div v-if="hasMoreResults" class="more-results-hint">
          מוצגים {{ filteredBooks.length }} תוצאות ראשונות. הקלד עוד תווים לסינון נוסף.
        </div>
      </div>

      <!-- Show no results message when searching but nothing found -->
      <div v-else-if="searchQuery && !filteredBooks.length" class="no-results">
        לא נמצאו תוצאות
      </div>

      <!-- Show category tree when not searching -->
      <div v-else>
        <CategoryNode v-for="category in treeData.tree" :key="category.id" :category="category" @select-book="handleBookClick($event, -1)"/>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useCategoryTreeStore } from '../../stores/categoryTreeStore'
import { useTabsStore } from '../../stores/tabStore'
import { MAX_SEARCH_RESULTS } from '../../constants'
import CategoryNode from './CategoryNode.vue'
import LoadingAnimation from '../shared/LoadingAnimation.vue'
import BookIcon from '../icons/BookIcon.vue'
import type { Book } from '../../types/Book'

const props = defineProps<{
  searchQuery: string
}>()

const categoryTreeStore = useCategoryTreeStore()
const tabsStore = useTabsStore()
const { treeData, isLoading } = storeToRefs(categoryTreeStore)

const filteredBooks = ref<Book[]>([])

// Only recalculate when searchQuery changes
watch(() => props.searchQuery, (newQuery) => {
  if (!newQuery || !treeData.value) {
    filteredBooks.value = []
    return
  }
  
  const query = newQuery.toLowerCase().trim()
  const queryWords = query.split(/\s+/)
  const results: Book[] = []
  
  for (const book of treeData.value.allBooks) {
    if (results.length >= MAX_SEARCH_RESULTS) break
    
    const title = book.title.toLowerCase()
    const desc = book.heShortDesc?.toLowerCase() || ''
    const category = book.path?.toLowerCase() || ''
    
    const matches = queryWords.every(word => 
      title.includes(word) || desc.includes(word) || category.includes(word)
    )
    
    if (matches) results.push(book)
  }
  
  filteredBooks.value = results
}, { immediate: true })

const hasMoreResults = computed(() => {
  return props.searchQuery && treeData.value && filteredBooks.value.length >= MAX_SEARCH_RESULTS
})

const showSearchResults = computed(() => {
  return props.searchQuery.trim().length > 0 && filteredBooks.value.length > 0
})

// Keyboard navigation
const treeViewRef = ref<HTMLElement | null>(null)
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
    const items = document.querySelectorAll('.result-item')
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
  // Get all focusable elements in the tree
  const focusableElements = Array.from(
    treeViewRef.value?.querySelectorAll('.result-item, .category-node, .book-node') || []
  ) as HTMLElement[]
  
  if (focusableElements.length === 0) return
  
  const currentFocused = document.activeElement as HTMLElement
  const currentIndex = focusableElements.indexOf(currentFocused)
  
  let nextIndex
  if (currentIndex <= 0) {
    nextIndex = focusableElements.length - 1 // Wrap to last
  } else {
    nextIndex = currentIndex - 1
  }
  
  focusableElements[nextIndex]?.focus()
  focusableElements[nextIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

const navigateDown = () => {
  // Get all focusable elements in the tree
  const focusableElements = Array.from(
    treeViewRef.value?.querySelectorAll('.result-item, .category-node, .book-node') || []
  ) as HTMLElement[]
  
  if (focusableElements.length === 0) return
  
  const currentFocused = document.activeElement as HTMLElement
  const currentIndex = focusableElements.indexOf(currentFocused)
  
  let nextIndex
  if (currentIndex === -1 || currentIndex >= focusableElements.length - 1) {
    nextIndex = 0 // Wrap to first or start at first
  } else {
    nextIndex = currentIndex + 1
  }
  
  focusableElements[nextIndex]?.focus()
  focusableElements[nextIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

const selectCurrentItem = () => {
  // Trigger click on currently focused element
  const currentFocused = document.activeElement as HTMLElement
  if (currentFocused && treeViewRef.value?.contains(currentFocused)) {
    currentFocused.click()
  }
}

const handleBookClick = (book: Book, index: number) => {
  selectedIndex.value = index
  console.log('Selected book:', book.title)
  // Set bookId in active tab to show TOC
  tabsStore.updateActiveTab(
    `תוכן עניינים - ${book.title}`,
    1, // Keep type as Landing page
    book.id // Set bookId to show TOC
  )
}

const focusTreeView = () => {
  // Only focus if nothing in the tree is currently focused
  const currentFocused = document.activeElement as HTMLElement
  if (treeViewRef.value?.contains(currentFocused)) {
    // Already focused on something in the tree, don't change focus
    return
  }
  
  // Focus first focusable element in tree
  const firstFocusable = treeViewRef.value?.querySelector('.result-item, .category-node, .book-node') as HTMLElement
  if (firstFocusable) {
    firstFocusable.focus()
  } else {
    treeViewRef.value?.focus()
  }
}

// Reset selection when search query changes
watch(() => props.searchQuery, () => {
  if (filteredBooks.value.length > 0) {
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
  categoryTreeStore.loadTreeData()
})
</script>

<style scoped>
/* Category tree container - focusable for keyboard navigation */
.category-tree-container {
  height: 100%; /* Full height */
  overflow-y: auto; /* Scrollable */
  outline: none; /* Remove focus outline */
}

.category-tree-container:focus {
  outline: none; /* Remove focus outline */
}

/* Search results container - no padding for full-width items */
.search-results { 
  padding: 0; /* No padding to allow items to span full width */
}

/* Search result item - horizontal layout with icon and book info */
.result-item {
  display: flex; /* Flexbox for horizontal layout */
  align-items: center; /* Vertically center icon and text */
  gap: 0.875rem; /* 14px space between icon and text */
  padding: 0.875rem 1.25rem; /* 14px vertical, 20px horizontal padding */
  cursor: pointer; /* Show pointer cursor on hover */
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1); /* Smooth transition for all properties */
}

/* Hover state - highlight background */
.result-item:hover { 
  background: var(--hover-bg); /* Light background on hover */
}

/* Selected state - highlight for keyboard navigation */
.result-item.selected {
  background: rgba(var(--accent-color-rgb, 0, 120, 212), 0.1); /* Light accent background */
}

/* Active state - darker background with press effect */
.result-item:active { 
  background: var(--active-bg); /* Darker background when pressed */
  transform: scale(0.98); /* Slight scale down for press effect */
}

/* Book icon - muted by default, accent color on hover */
.result-item .book-icon {
  color: var(--text-secondary); /* Secondary text color */
  opacity: 0.8; /* Slightly transparent */
  flex-shrink: 0; /* Prevent icon from shrinking */
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); /* Smooth transition for color and opacity */
}

/* Book icon hover state - accent color */
.result-item:hover .book-icon { 
  color: var(--accent-color); /* Accent color on hover */
  opacity: 1; /* Full opacity on hover */
}

/* Book icon active state - flip animation */
.result-item:active .book-icon { 
  animation: flip-pages 0.4s cubic-bezier(0.4, 0, 0.2, 1); /* 3D flip animation */
}

/* Book info container */
.book-info { 
  flex: 1; /* Take remaining space */
  min-width: 0; /* Allow text truncation with ellipsis */
}

/* Book title */
.result-item h3 {
  font-size: 0.8125rem; /* 13px font size */
  font-weight: 600; /* Semi-bold weight */
  margin: 0 0 0.25rem 0; /* 4px bottom margin */
  color: var(--text-primary); /* Primary text color */
  line-height: 1.4; /* Line height for readability */
}

/* Book category breadcrumb - truncated with ellipsis */
.book-category {
  font-size: 0.6875rem; /* 11px font size */
  color: var(--text-secondary); /* Secondary text color */
  margin: 0; /* No margin */
  line-height: 1.3; /* Compact line height */
  overflow: hidden; /* Hide overflow text */
  text-overflow: ellipsis; /* Show ellipsis for overflow */
  white-space: nowrap; /* Prevent text wrapping */
  font-weight: 500; /* Medium weight */
}

/* Hint shown when results are limited */
.more-results-hint {
  padding: 1rem 1.25rem; /* 16px vertical, 20px horizontal padding */
  text-align: center; /* Center-align text */
  color: var(--text-secondary); /* Secondary text color */
  font-size: 0.75rem; /* 12px font size */
  font-style: italic; /* Italic style */
  background: var(--bg-secondary); /* Secondary background color */
  border-top: 1px solid var(--border-color); /* Top border separator */
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

/* 3D page-turning animation for book icon */
@keyframes flip-pages {
  0% { 
    transform: perspective(400px) rotateY(0deg); /* Start position */
  }
  50% { 
    transform: perspective(400px) rotateY(-15deg) scale(1.05); /* Mid flip with slight scale */
  }
  100% { 
    transform: perspective(400px) rotateY(0deg); /* Return to start */
  }
}
</style>
