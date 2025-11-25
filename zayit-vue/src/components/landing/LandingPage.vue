<template>
  <div class="landing-page">

    <div class="content-container">
      <CategoryTree 
        v-if="!tabsStore.activeTab?.bookId"
        ref="categoryTreeRef"
        :search-query="debouncedSearchQuery"
      />
      
      <TocTree
        v-else
        ref="tocTreeRef"
        :search-query="debouncedSearchQuery"
      />
    </div>

    <div class="bar search-bar">
        <button v-if="tabsStore.activeTab?.bookId" @click="goBack" title="חזור" class="back-button">
          <ChevronIconLeft />
        </button>
        <button v-else @click="resetTree" title="אפס עץ">
          <img src="/assets/ic_fluent_text_bullet_list_tree_24_regular.png" alt="Reset" class="rtl-flip" />
        </button>
        <input 
          ref="searchInputRef"
          v-model="searchInput" 
          type="text" 
          :placeholder="tabsStore.activeTab?.bookId ? 'חפש בתוכן עניינים...' : 'חפש ספר...'"
          @keydown.up.prevent="handleSearchArrowUp"
          @keydown.down.prevent="handleSearchArrowDown"
        />
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { SEARCH_DEBOUNCE_DELAY } from '../../constants'
import { useTabsStore } from '../../stores/tabStore'
import CategoryTree from './CategoryTree.vue'
import TocTree from '../toc/TocTree.vue'
import ChevronIconLeft from '../icons/ChevronIconLeft.vue'
import type { Book } from '../../types/Book'
import type { TocEntry } from '../../types/Toc'

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





const goBack = () => {
  // Clear bookId to go back to CategoryTree
  tabsStore.updateActiveTab(
    'איתור',
    1, // Type 1 = Landing page
    undefined // Clear bookId
  )
  searchInput.value = ''
  debouncedSearchQuery.value = ''
  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
  }
  searchInputRef.value?.focus()
}

const resetTree = () => {
  searchInput.value = ''
  debouncedSearchQuery.value = ''
  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
  }
  searchInputRef.value?.focus()
}

const handleSearchArrowUp = () => {
  if (tabsStore.activeTab?.bookId) {
    tocTreeRef.value?.focusTreeView()
  } else {
    categoryTreeRef.value?.focusTreeView()
  }
}

const handleSearchArrowDown = () => {
  if (tabsStore.activeTab?.bookId) {
    tocTreeRef.value?.focusTreeView()
  } else {
    categoryTreeRef.value?.focusTreeView()
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

/* Back button - rotated chevron for RTL with larger click area */
.back-button {
  transform: rotate(180deg); /* Rotate 180 degrees to point right for RTL */
  padding: 0.5rem; /* 8px padding for larger click area */
  min-width: 2.5rem; /* 40px minimum width */
  min-height: 2.5rem; /* 40px minimum height */
  display: flex; /* Flexbox for centering */
  align-items: center; /* Center vertically */
  justify-content: center; /* Center horizontally */
  transition: all 0.2s ease; /* Smooth transition for all properties */
}

/* Back button hover state */
.back-button:hover {
  background: var(--hover-bg); /* Light background on hover */
  border-radius: 0.25rem; /* 4px rounded corners */
}

/* Back button active state */
.back-button:active {
  background: var(--active-bg); /* Darker background when pressed */
  transform: rotate(180deg) scale(0.95); /* Keep rotation while scaling down */
}

/* Mobile - larger text to prevent iOS zoom on focus */
@media (max-width: 768px) {
  .search-bar input {
    font-size: 1rem; /* 16px font size prevents iOS auto-zoom */
  }
}
</style>
