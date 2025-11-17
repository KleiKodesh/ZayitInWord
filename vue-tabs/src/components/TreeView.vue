<template>
  <div class="tree-view">
    <!-- Loading state -->
    <div v-if="isLoading" class="tree-status">טוען...</div>
    
    <!-- Tree content -->
    <div v-else-if="treeData" class="tree-container">
      <!-- Filtered search results -->
      <div v-if="searchQuery && filteredBooks.length > 0" class="filtered-results">
        <div
          v-for="(book, index) in filteredBooks"
          :key="book.id"
          :ref="el => { if (index === selectedIndex) selectedItemRef = el as HTMLElement }"
          class="result-item"
          :class="{ selected: index === selectedIndex && showSelection }"
          :title="book.heShortDesc || undefined"
          @click="handleItemClick(index, book)"
        >
          <svg class="book-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 2.5C3 2.22386 3.22386 2 3.5 2H7.5C7.77614 2 8 2.22386 8 2.5V13.5C8 13.7761 7.77614 14 7.5 14H3.5C3.22386 14 3 13.7761 3 13.5V2.5Z" stroke="currentColor" stroke-width="1.2"/>
            <path d="M8 2.5C8 2.22386 8.22386 2 8.5 2H12.5C12.7761 2 13 2.22386 13 2.5V13.5C13 13.7761 12.7761 14 12.5 14H8.5C8.22386 14 8 13.7761 8 13.5V2.5Z" stroke="currentColor" stroke-width="1.2"/>
          </svg>
          <div class="book-info">
            <h3>{{ book.title }}</h3>
            <p v-if="book.fullCategory" class="book-category">{{ book.fullCategory }}</p>
          </div>
        </div>
      </div>
      
      <!-- No results -->
      <div v-else-if="searchQuery && filteredBooks.length === 0" class="tree-status">
        לא נמצאו תוצאות
      </div>
      
      <!-- Full tree view -->
      <div v-else class="tree-list">
        <TreeNode
          v-for="category in treeData.tree"
          :key="category.id"
          :node="category"
          :level="0"
          :expanded-ids="expandedCategories"
          :selected-index="showSelection ? selectedIndex : -1"
          :visible-items="visibleItems"
          @toggle-category="handleCategoryClick"
          @select-book="handleBookClick"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TreeNode from './TreeNode.vue'
import type { TreeData } from '../types/Tree'
import type { Book } from '../types/Book'

interface Props {
  treeData: TreeData | null
  isLoading: boolean
  searchQuery: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'select-book': [book: Book]
}>()

const expandedCategories = ref<Set<number>>(new Set())
const selectedIndex = ref(-1)
const showSelection = ref(false) // Controls visual highlight
const selectedItemRef = ref<HTMLElement | null>(null)
let selectionTimeout: number | null = null

// Filtered books based on search
const filteredBooks = computed(() => {
  if (!props.searchQuery || !props.treeData) {
    return []
  }
  
  const query = props.searchQuery.toLowerCase().trim()
  const queryWords = query.split(/\s+/) // Split by whitespace for multi-word search
  
  return props.treeData.allBooks.filter(book => {
    const title = book.title.toLowerCase()
    const desc = book.heShortDesc?.toLowerCase() || ''
    const category = book.fullCategory?.toLowerCase() || ''
    
    // All query words must match in at least one field
    return queryWords.every(word => 
      title.includes(word) || 
      desc.includes(word) || 
      category.includes(word)
    )
  })
})

// Get flat list of visible items for keyboard navigation
const visibleItems = computed(() => {
  if (filteredBooks.value.length > 0) {
    return filteredBooks.value.map(book => ({ type: 'book' as const, data: book }))
  }
  
  if (!props.treeData) return []
  
  const items: Array<{ type: 'category' | 'book', data: any }> = []
  
  const traverse = (categories: any[]) => {
    for (const cat of categories) {
      items.push({ type: 'category', data: cat })
      if (expandedCategories.value.has(cat.id)) {
        if (cat.children?.length > 0) {
          traverse(cat.children)
        }
        if (cat.books?.length > 0) {
          cat.books.forEach((book: Book) => items.push({ type: 'book', data: book }))
        }
      }
    }
  }
  
  traverse(props.treeData.tree)
  return items
})

const toggleCategory = (categoryId: number) => {
  if (expandedCategories.value.has(categoryId)) {
    expandedCategories.value.delete(categoryId)
  } else {
    expandedCategories.value.add(categoryId)
  }
  // Trigger reactivity
  expandedCategories.value = new Set(expandedCategories.value)
}

// Update selected index based on clicked item
const updateSelectedIndex = (item: any, type: 'category' | 'book') => {
  const index = visibleItems.value.findIndex(
    vi => vi.type === type && vi.data.id === item.id
  )
  if (index !== -1) {
    selectedIndex.value = index
  }
}

// Click handlers
const handleCategoryClick = (categoryId: number) => {
  const category = visibleItems.value.find(
    item => item.type === 'category' && item.data.id === categoryId
  )
  if (category) {
    updateSelectedIndex(category.data, 'category')
  }
  toggleCategory(categoryId)
}

const handleBookClick = (book: Book) => {
  updateSelectedIndex(book, 'book')
  emit('select-book', book)
}

const handleItemClick = (index: number, book: Book) => {
  selectedIndex.value = index
  emit('select-book', book)
}

// Hide selection highlight after inactivity (but keep position)
const clearSelectionAfterDelay = () => {
  if (selectionTimeout) {
    clearTimeout(selectionTimeout)
  }
  selectionTimeout = window.setTimeout(() => {
    showSelection.value = false // Hide highlight but keep selectedIndex
  }, 2000) // Hide after 2 second of inactivity
}

// Scroll selected item into view
const scrollToSelected = () => {
  // Use nextTick to ensure DOM is updated
  import('vue').then(({ nextTick }) => {
    nextTick(() => {
      // Find the selected element
      const selectedElement = document.querySelector('.result-item.selected, .category-node.selected, .book-node.selected')
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        })
      }
    })
  })
}

// Keyboard navigation
const handleArrowKey = (key: string) => {
  // Show selection highlight
  showSelection.value = true
  
  if (key === 'ArrowDown') {
    // If nothing selected, start at 0, otherwise move down
    if (selectedIndex.value === -1) {
      selectedIndex.value = 0
    } else {
      selectedIndex.value = Math.min(selectedIndex.value + 1, visibleItems.value.length - 1)
    }
  } else if (key === 'ArrowUp') {
    // If nothing selected, start at last item, otherwise move up
    if (selectedIndex.value === -1) {
      selectedIndex.value = visibleItems.value.length - 1
    } else {
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
    }
  }
  
  // Scroll to selected item
  scrollToSelected()
  
  // Reset the inactivity timer
  clearSelectionAfterDelay()
}

const handleEnterKey = () => {
  const item = visibleItems.value[selectedIndex.value]
  if (!item) return
  
  if (item.type === 'category') {
    toggleCategory(item.data.id)
  } else if (item.type === 'book') {
    emit('select-book', item.data)
  }
}

// Focus first item if nothing is selected
const focusFirstItem = () => {
  if (selectedIndex.value === -1 && visibleItems.value.length > 0) {
    selectedIndex.value = 0
    showSelection.value = true
    clearSelectionAfterDelay()
  }
}

// Expose methods
defineExpose({
  reset: () => {
    expandedCategories.value = new Set()
    selectedIndex.value = -1
  },
  handleArrowKey,
  handleEnterKey,
  focusFirstItem
})
</script>

<style scoped>
.tree-view {
  height: 100%;
  overflow-y: auto;
  direction: rtl;
}

.tree-status {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
}

.tree-container {
  padding: 0;
  margin: 0;
}

.tree-list {
  padding: 0;
  margin: 0;
}

.filtered-results {
  padding: 0;
  margin: 0;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.result-item:hover {
  background: var(--hover-bg);
}

.result-item.selected {
  background: rgba(var(--accent-color-rgb, 0, 120, 212), 0.1);
}

.result-item:active {
  background: var(--active-bg);
  transform: scale(0.98);
}

.result-item .book-icon {
  color: var(--text-secondary);
  flex-shrink: 0;
  opacity: 0.8;
}

.result-item:hover .book-icon {
  opacity: 1;
  color: var(--accent-color);
}

.book-info {
  flex: 1;
  min-width: 0;
}

.result-item h3 {
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--text-primary);
  line-height: 1.4;
}

.result-item .book-category {
  font-size: 11px;
  color: #999;
  margin: 0 0 2px 0;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.result-item .book-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}


</style>
