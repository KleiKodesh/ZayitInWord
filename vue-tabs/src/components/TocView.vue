<template>
  <div 
    class="toc-view"
    ref="tocViewRef"
    tabindex="-1"
    @keydown.up.prevent="navigateUp"
    @keydown.down.prevent="navigateDown"
    @keydown.enter="selectCurrentItem"
    @keydown.space.prevent="selectCurrentItem"
    @click="focusTocView"
    @touchstart="focusTocView"
  >
    <!-- Loading state -->
    <div v-if="isLoading" class="toc-status">טוען תוכן עניינים...</div>
    
    <!-- TOC content -->
    <div v-else-if="tocEntries && tocEntries.length > 0" class="toc-container">
      <!-- Filtered search results -->
      <div v-if="searchQuery && filteredEntries.length > 0" class="filtered-results">
        <div
          v-for="(entry, index) in filteredEntries"
          :key="entry.lineId"
          class="toc-search-item"
          :class="{ selected: selectedIndex === index && showSelection }"
          tabindex="0"
          @click="handleItemClick(entry)"
          @keydown.enter="handleItemClick(entry)"
          @keydown.space.prevent="handleItemClick(entry)"
        >
          <div class="toc-item-content">
            <div class="toc-text">{{ entry.text }}</div>
            <div v-if="entry.path" class="toc-path">{{ entry.path }}</div>
          </div>
        </div>
      </div>
      
      <!-- No results -->
      <div v-else-if="searchQuery && filteredEntries.length === 0" class="toc-status">
        לא נמצאו תוצאות
      </div>
      
      <!-- Full TOC tree when not searching -->
      <div v-else class="toc-tree">
        <TocNode
          v-for="entry in tocEntries"
          :key="entry.id"
          :entry="entry"
          @navigate="handleNavigate"
        />
      </div>
    </div>
    
    <!-- No TOC available -->
    <div v-else class="toc-status">
      אין תוכן עניינים זמין
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import TocNode from './TocNode.vue'
import type { TocEntry } from '../types/Toc'

interface Props {
  tocEntries: TocEntry[] | null  // Tree structure for display
  tocEntriesFlat: TocEntry[] | null  // Flattened array for search
  isLoading: boolean
  searchQuery: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'select-entry': [entry: TocEntry]
}>()

// Use flattened array for search
const allEntriesFlat = computed(() => {
  return props.tocEntriesFlat || []
})

// Filtered entries based on search - match all words in path + text combined
const filteredEntries = computed(() => {
  if (!props.searchQuery) {
    return []
  }
  
  const query = props.searchQuery.toLowerCase().trim()
  const queryWords = query.split(/\s+/)
  
  return allEntriesFlat.value.filter(entry => {
    // Combine path and text for searching
    const searchableText = `${entry.path || ''} ${entry.text}`.toLowerCase()
    
    // Split searchable text into words (by spaces, slashes, and other separators)
    const textWords = searchableText.split(/[\s\/\-,.:;]+/).filter(w => w.length > 0)
    
    // Each query word must match
    return queryWords.every(queryWord => {
      // For single character queries, require exact word match
      if (queryWord.length === 1) {
        return textWords.some(textWord => textWord === queryWord)
      }
      // For longer queries, allow prefix matching
      return textWords.some(textWord => 
        textWord === queryWord || textWord.startsWith(queryWord)
      )
    })
  })
})

const handleItemClick = (entry: TocEntry) => {
  emit('select-entry', entry)
}

const handleNavigate = (lineId: number) => {
  // Find the entry by lineId and emit it
  const entry = allEntriesFlat.value.find(e => e.lineId === lineId)
  if (entry) {
    emit('select-entry', entry)
  }
}

// Keyboard navigation
const tocViewRef = ref<HTMLElement | null>(null)
const selectedIndex = ref(-1)
const showSelection = ref(false) // Controls visual highlight
let selectionTimeout: number | null = null

// Hide selection highlight after inactivity (but keep position)
const clearSelectionAfterDelay = () => {
  if (selectionTimeout) {
    clearTimeout(selectionTimeout)
  }
  selectionTimeout = window.setTimeout(() => {
    showSelection.value = false // Hide highlight but keep selectedIndex
  }, 2000) // Hide after 2 seconds of inactivity
}

const navigateUp = () => {
  // Only navigate in filtered results (when searching)
  if (!props.searchQuery || filteredEntries.value.length === 0) return
  
  // Show selection highlight
  showSelection.value = true
  
  // If no selection, start at first item
  if (selectedIndex.value === -1) {
    selectedIndex.value = 0
  } else if (selectedIndex.value === 0) {
    // At first item, wrap to last
    selectedIndex.value = filteredEntries.value.length - 1
  } else {
    selectedIndex.value--
  }
  scrollToSelected()
  
  // Reset the inactivity timer
  clearSelectionAfterDelay()
}

const navigateDown = () => {
  // Only navigate in filtered results (when searching)
  if (!props.searchQuery || filteredEntries.value.length === 0) return
  
  // Show selection highlight
  showSelection.value = true
  
  if (selectedIndex.value >= filteredEntries.value.length - 1) {
    selectedIndex.value = 0
  } else {
    selectedIndex.value++
  }
  scrollToSelected()
  
  // Reset the inactivity timer
  clearSelectionAfterDelay()
}

const selectCurrentItem = () => {
  // Only select from filtered results (when searching)
  if (!props.searchQuery || filteredEntries.value.length === 0) return
  
  const entry = filteredEntries.value[selectedIndex.value]
  if (entry && selectedIndex.value >= 0 && selectedIndex.value < filteredEntries.value.length) {
    emit('select-entry', entry)
  }
}

const focusTocView = () => {
  if (tocViewRef.value) {
    tocViewRef.value.focus()
    if (selectedIndex.value === -1 && filteredEntries.value.length > 0) {
      selectedIndex.value = 0
      showSelection.value = true
      clearSelectionAfterDelay()
    }
  }
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

// Reset selection when search query changes
watch(() => props.searchQuery, () => {
  if (filteredEntries.value.length > 0) {
    selectedIndex.value = 0
    showSelection.value = false // Don't show highlight initially
  } else {
    selectedIndex.value = -1
    showSelection.value = false
  }
})

// Expose focus method for parent component
defineExpose({
  focusTocView
})
</script>

<style scoped>
.toc-view {
  height: 100%;
  overflow-y: auto;
  direction: rtl;
  outline: none;
}

.toc-view:focus {
  outline: none;
}

.toc-status {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
}

.toc-container {
  padding: 0;
  margin: 0;
}

.toc-tree {
  padding: 12px;
  display: inline-block;
  min-width: min-content;
  width: 100%;
}

.filtered-results {
  padding: 0;
  margin: 0;
}

/* Search results styled like tree items */
.toc-search-item {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.toc-search-item:hover {
  background: var(--hover-bg);
}

.toc-search-item.selected {
  background: rgba(var(--accent-color-rgb, 0, 120, 212), 0.1);
}

.toc-search-item:active {
  background: var(--active-bg);
  transform: scale(0.98);
}

.toc-search-item:focus {
  outline: 2px solid var(--accent-color);
  outline-offset: -2px;
  background: rgba(var(--accent-color-rgb, 0, 120, 212), 0.05);
}

.toc-item-content {
  flex: 1;
  min-width: 0;
}

.toc-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
  margin: 0 0 4px 0;
}

.toc-path {
  font-size: 11px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
  opacity: 0.8;
}
</style>
