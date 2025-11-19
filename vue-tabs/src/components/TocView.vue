<template>
  <div class="toc-view">
    <!-- Loading state -->
    <div v-if="isLoading" class="toc-status">טוען תוכן עניינים...</div>
    
    <!-- TOC content -->
    <div v-else-if="tocEntries && tocEntries.length > 0" class="toc-container">
      <!-- Filtered search results (styled like tree items) -->
      <div v-if="searchQuery && filteredEntries.length > 0" class="filtered-results">
        <div
          v-for="(entry, index) in filteredEntries"
          :key="entry.lineId"
          class="toc-search-item"
          @click="handleItemClick(entry)"
        >
          <span class="toc-text">{{ entry.text }}</span>
        </div>
      </div>
      
      <!-- No results -->
      <div v-else-if="searchQuery && filteredEntries.length === 0" class="toc-status">
        לא נמצאו תוצאות
      </div>
      
      <!-- Full TOC tree - using same TocNode as sidebar -->
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
import { ref, computed } from 'vue'
import TocNode from './TocNode.vue'
import type { TocEntry } from '../types/Toc'

interface Props {
  tocEntries: TocEntry[] | null
  isLoading: boolean
  searchQuery: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'select-entry': [entry: TocEntry]
}>()

// Flatten all entries for search
const allEntriesFlat = computed(() => {
  if (!props.tocEntries) return []
  const flat: TocEntry[] = []
  
  const flatten = (entries: TocEntry[]) => {
    for (const entry of entries) {
      flat.push(entry)
      if (entry.children && entry.children.length > 0) {
        flatten(entry.children)
      }
    }
  }
  
  flatten(props.tocEntries)
  return flat
})

// Filtered entries based on search
const filteredEntries = computed(() => {
  if (!props.searchQuery) {
    return []
  }
  
  const query = props.searchQuery.toLowerCase().trim()
  const queryWords = query.split(/\s+/)
  
  return allEntriesFlat.value.filter(entry => {
    const text = entry.text.toLowerCase()
    return queryWords.every(word => text.includes(word))
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
</script>

<style scoped>
.toc-view {
  height: 100%;
  overflow-y: auto;
  direction: rtl;
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
  padding: 12px;
  display: inline-block;
  min-width: min-content;
  width: 100%;
}

/* Search results styled like tree items */
.toc-search-item {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.1s ease;
  gap: 6px;
  min-width: 100%;
  width: fit-content;
  background: transparent;
}

.toc-search-item:hover {
  background-color: rgba(90, 93, 94, 0.15);
}

.toc-search-item:active {
  background: var(--active-bg);
}

.toc-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}
</style>
