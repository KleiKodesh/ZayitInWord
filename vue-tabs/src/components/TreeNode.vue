<template>
  <div class="tree-node">
    <div 
      v-if="node.children.length > 0 || node.books.length > 0"
      class="category-node"
      :class="{ selected: isCategorySelected }"
      :style="{ paddingRight: `${level * 20 + 16}px` }"
      @click="toggleExpand"
    >
      <svg class="expand-icon" :class="{ expanded: isExpanded }" width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M4 2L8 6L4 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="category-title">{{ node.title }}</span>
    </div>
    
    <template v-if="isExpanded">
      <TreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :level="level + 1"
        :expanded-ids="expandedIds"
        :selected-index="selectedIndex"
        :visible-items="visibleItems"
        @toggle-category="$emit('toggle-category', $event)"
        @select-book="$emit('select-book', $event)"
      />
      
      <div
        v-for="book in node.books"
        :key="book.id"
        class="book-node"
        :class="{ selected: isBookSelected(book) }"
        :style="{ paddingRight: `${(level + 1) * 20 + 16}px` }"

        @click="$emit('select-book', book)"
      >
        <svg class="book-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 2.5C3 2.22386 3.22386 2 3.5 2H7.5C7.77614 2 8 2.22386 8 2.5V13.5C8 13.7761 7.77614 14 7.5 14H3.5C3.22386 14 3 13.7761 3 13.5V2.5Z" stroke="currentColor" stroke-width="1.2"/>
          <path d="M8 2.5C8 2.22386 8.22386 2 8.5 2H12.5C12.7761 2 13 2.22386 13 2.5V13.5C13 13.7761 12.7761 14 12.5 14H8.5C8.22386 14 8 13.7761 8 13.5V2.5Z" stroke="currentColor" stroke-width="1.2"/>
        </svg>
        <div class="book-info">
          <span class="book-title">{{ book.title }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Category } from '../types/Tree'
import type { Book } from '../types/Book'

interface Props {
  node: Category
  level: number
  expandedIds: Set<number>
  selectedIndex?: number
  visibleItems?: Array<{ type: 'category' | 'book', data: any }>
}

const props = withDefaults(defineProps<Props>(), {
  selectedIndex: -1,
  visibleItems: () => []
})

const emit = defineEmits<{
  'toggle-category': [id: number]
  'select-book': [book: Book]
}>()

const isExpanded = computed(() => props.expandedIds.has(props.node.id))

const toggleExpand = () => {
  emit('toggle-category', props.node.id)
}

const isCategorySelected = computed(() => {
  const item = props.visibleItems[props.selectedIndex]
  return item?.type === 'category' && item.data.id === props.node.id
})

const isBookSelected = (book: Book) => {
  const item = props.visibleItems[props.selectedIndex]
  return item?.type === 'book' && item.data.id === book.id
}
</script>

<style scoped>
.tree-node {
  user-select: none;
}

.category-node {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.category-node:hover {
  background: var(--hover-bg);
}

.category-node.selected {
  background: rgba(var(--accent-color-rgb, 0, 120, 212), 0.1);
}

.expand-icon {
  color: var(--text-secondary);
  flex-shrink: 0;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  transform: rotate(180deg); /* RTL: point left when collapsed */
}

.expand-icon.expanded {
  transform: rotate(90deg); /* RTL: point down when expanded */
}

.category-title {
  flex: 1;
  line-height: 1.4;
}

.book-node {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 14px;
  color: var(--text-primary);
}

.book-node:hover {
  background: var(--hover-bg);
}

.book-node.selected {
  background: rgba(var(--accent-color-rgb, 0, 120, 212), 0.1);
}

.book-node:active {
  transform: scale(0.98);
  background: var(--active-bg);
}

.book-icon {
  color: var(--text-secondary);
  flex-shrink: 0;
  opacity: 0.8;
}

.book-node:hover .book-icon {
  opacity: 1;
  color: var(--accent-color);
}

.book-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.book-title {
  font-weight: 600;
  line-height: 1.4;
}


</style>
