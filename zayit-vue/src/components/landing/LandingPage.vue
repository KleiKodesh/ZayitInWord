<template>
  <div class="landing-page">

    <div class="content-container">
      <!-- 
        IMPORTANT: KeepAlive preserves CategoryTree and TocTree state
        - When navigating Book->TOC->CategoryTree, scroll position is maintained
        - DO NOT REMOVE or replace with Transition - breaks state preservation
      -->
      <KeepAlive>
        <CategoryTree 
          v-if="!tabsStore.currentRoute?.bookId"
          :key="`category-${treeKey}`"
          ref="categoryTreeRef"
          :search-query="debouncedSearchQuery"
        />
        
        <TocTree
          v-else
          key="toc"
          ref="tocTreeRef"
          :search-query="debouncedSearchQuery"
        />
      </KeepAlive>
    </div>

    <div class="bar search-bar">
        <button v-if="tabsStore.currentRoute?.bookId" @click="goBack" title="חזור" class="back-button">
          <ChevronIconLeft />
        </button>
        <button v-else @click="resetTree" title="אפס עץ">
          <img src="/assets/ic_fluent_text_bullet_list_tree_24_regular.png" alt="Reset" class="rtl-flip" />
        </button>
        <input 
          ref="searchInputRef"
          v-model="searchInput" 
          type="text" 
          :placeholder="tabsStore.currentRoute?.bookId ? 'חפש בתוכן עניינים...' : 'חפש ספר...'"
          @keydown.up.prevent="handleSearchArrowUp"
          @keydown.down.prevent="handleSearchArrowDown"
        />
        <button v-if="tabsStore.currentRoute?.bookId" @click="goToBook" title="עבור לספר" class="forward-button">
          <ChevronIconLeft />
        </button>
    </div>

  </div>
</template>

<script lang="ts">
// IMPORTANT: Explicit name required for KeepAlive to cache this component
export default {
  name: 'LandingPage'
}
</script>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { SEARCH_DEBOUNCE_DELAY } from '../../constants'
import { useTabsStore } from '../../stores/tabStore'
import CategoryTree from './CategoryTree.vue'
import TocTree from '../toc/TocTree.vue'
import ChevronIconLeft from '../icons/ChevronIconLeft.vue'

const tabsStore = useTabsStore()

const searchInput = ref('')
const debouncedSearchQuery = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)
const categoryTreeRef = ref<InstanceType<typeof CategoryTree> | null>(null)
const tocTreeRef = ref<InstanceType<typeof TocTree> | null>(null)

// Debounce search input for better performance
let debounceTimeout: number | null = null
watch(searchInput, (newValue) => {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  debounceTimeout = window.setTimeout(() => {
    debouncedSearchQuery.value = newValue
  }, SEARCH_DEBOUNCE_DELAY)
})

// Clear search when switching between CategoryTree and TocTree
watch(() => tabsStore.currentRoute?.bookId, () => {
  searchInput.value = ''
  debouncedSearchQuery.value = ''
  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
  }
  // Focus search bar after transition
  setTimeout(() => {
    searchInputRef.value?.focus()
  }, 250) // Wait for transition to complete
})

const goBack = () => {
  // Navigate back in history
  tabsStore.navigateBack()
  searchInput.value = ''
  debouncedSearchQuery.value = ''
  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
  }
  searchInputRef.value?.focus()
}

const treeKey = ref(0)

const resetTree = () => {
  searchInput.value = ''
  debouncedSearchQuery.value = ''
  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
  }
  // Force re-render of tree to collapse all nodes
  treeKey.value++
  searchInputRef.value?.focus()
}

const handleSearchArrowUp = () => {
  if (tabsStore.currentRoute?.bookId) {
    tocTreeRef.value?.focusTreeView()
  } else {
    categoryTreeRef.value?.focusTreeView()
  }
}

const handleSearchArrowDown = () => {
  if (tabsStore.currentRoute?.bookId) {
    tocTreeRef.value?.focusTreeView()
  } else {
    categoryTreeRef.value?.focusTreeView()
  }
}

const goToBook = () => {
  // Navigate to book viewer, skipping TOC selection
  const route = tabsStore.currentRoute
  if (route && route.bookId) {
    // Extract book title by removing "תוכן עניינים - " prefix if present
    const bookTitle = tabsStore.activeTab?.title.replace(/^תוכן עניינים - /, '') || ''
    
    tabsStore.navigateTo({
      type: 2, // Type 2 = Book Viewer
      title: bookTitle,
      bookId: route.bookId,
      lineIndex: undefined // No specific line, start from beginning
    })
  }
}

onMounted(() => {
  searchInputRef.value?.focus()
})
</script>

<style scoped>
/* Main container - flexbox with sticky search bar at bottom */
.landing-page {
  height: 100%; /* Full height of parent */
  flex-direction: column; /* Stack children vertically */
  display: flex; /* Flexbox layout */
}

/* Scrollable tree content - takes remaining space above search bar */
.content-container {
  flex: 1; /* Grow to fill available space */
  overflow-y: auto; /* Enable vertical scrolling */
  position: relative; /* For absolute positioning of transition elements */
}

/* Slide transition - subtle horizontal slide for RTL */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease-out;
  position: absolute;
  width: 100%;
  height: 100%;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(12px); /* Subtle slide in from right */
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-12px); /* Subtle slide out to left */
}

/* Search bar - fixed at bottom with reset button and input */
.search-bar {
  gap: 0.5rem; /* 8px space between button and input */
  padding: 0.375rem 0.75rem; /* 6px vertical, 12px horizontal padding */
  border-top: 1px solid var(--border-color); /* Top border separator */
}

/* Search input - matches vue-tabs design */
.search-bar input {
  flex: 1; /* Take remaining space */
  border: 1px solid var(--border-color); /* Border around input */
  border-radius: 1rem; /* 16px rounded corners */
  outline: none; /* Remove default focus outline */
  font-size: 0.875rem; /* 14px font size */
  padding: 0.375rem 0.75rem; /* 6px vertical, 12px horizontal padding */
  background: var(--bg-primary); /* Primary background color */
  transition: all 0.2s ease; /* Smooth transition for all properties */
}

/* Focus state - highlight with accent color */
.search-bar input:focus {
  border-color: var(--accent-color); /* Accent color border when focused */
}

/* Placeholder text - muted and semi-transparent */
.search-bar input::placeholder {
  color: var(--text-secondary); /* Secondary text color */
  opacity: 0.6; /* Semi-transparent */
}

/* Back button - rotated chevron for RTL */
.back-button {
  transform: rotate(180deg); /* Rotate 180 degrees to point right for RTL */
}

/* Back button active state - maintain rotation */
.back-button:active {
  transform: rotate(180deg) scale(0.95); /* Keep rotation while scaling down */
}

/* Back button hover state - maintain rotation */
.back-button:hover {
  transform: rotate(180deg) scale(1.05); /* Keep rotation while scaling up */
}

/* Smaller icons in navigation buttons */
.back-button :deep(.chevron-icon),
.forward-button :deep(.chevron-icon) {
  width: 1rem;
  height: 1rem;
}

/* Mobile - larger text to prevent iOS zoom on focus */
@media (max-width: 768px) {
  .search-bar input {
    font-size: 1rem; /* 16px font size prevents iOS auto-zoom */
  }
}
</style>
