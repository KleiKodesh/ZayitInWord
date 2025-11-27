<template>
  <div class="category-wrapper" :style="{ '--depth': depth }">
    <div class="category-node" tabindex="0" @click="toggleExpand" @keydown.enter.stop="toggleExpand" @keydown.space.stop.prevent="toggleExpand">
      <ChevronIconLeft 
        v-if="category.children.length > 0 || category.books.length > 0"
        :class="{ expanded: isExpanded }"
      />
      <span class="category-title">{{ category.title }}</span>
    </div>
    
    <template v-if="isExpanded">
      <CategoryNode
        v-for="child in category.children"
        :key="child.id"
        :category="child"
        :depth="depth + 1"
        :search-query="searchQuery"
        @select-book="$emit('select-book', $event)"
      />
      
      <div
        v-for="book in category.books"
        :key="book.id"
        class="book-node"
        tabindex="0"
        @click="$emit('select-book', book)"
        @keydown.enter.stop="$emit('select-book', book)"
        @keydown.space.stop.prevent="$emit('select-book', book)"
      >
        <BookIcon class="book-icon"/>
        <span class="book-title">{{ book.title }}</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import ChevronIconLeft from '../icons/ChevronIconLeft.vue'
  import BookIcon from '../icons/BookIcon.vue'
  import type { Category } from '../../types/Tree'
  import type { Book } from '../../types/Book'

  const props = withDefaults(defineProps<{
    category: Category
    depth?: number
    searchQuery?: string
  }>(), {
    depth: 0
  })
  
  const emit = defineEmits<{
    'select-book': [book: Book]
  }>()

  const isExpanded = ref(false)

  const toggleExpand = () => {
    isExpanded.value = !isExpanded.value
  }

  // Auto-expand when searching
  watch(() => props.searchQuery, (newQuery) => {
    if (newQuery && newQuery.trim()) {
      isExpanded.value = true
    }
  })
</script>

<style scoped>
/* Base styles for category and book nodes - clickable rows in tree */
.category-node,
.book-node {
  display: flex; /* Flexbox for horizontal layout */
  align-items: center; /* Vertically center icon and text */
  gap: 0.75rem; /* 12px space between icon and text */
  padding: 0.75rem 1.25rem; /* 12px vertical, 20px horizontal padding */
  cursor: pointer; /* Show pointer cursor on hover */
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1); /* Smooth transition */
  font-size: 0.875rem; /* 14px font size */
  font-weight: 600; /* Semi-bold weight */
}

/* Book nodes get slightly more vertical padding */
.book-node {
  padding-block: 0.875rem; /* 14px vertical padding */
}

/* Hover effect - light background overlay */
.category-node:hover,
.book-node:hover {
  background: var(--hover-bg); /* Light background on hover */
}

/* Book click effect - press feedback */
.book-node:active {
  transform: scale(0.98); /* Slight scale down for press effect */
  background: var(--active-bg); /* Darker background when pressed */
}

/* Focus state for keyboard navigation */
.category-node:focus,
.book-node:focus {
  outline: none; /* No outline */
  background: rgba(var(--accent-color-rgb, 0, 120, 212), 0.1); /* Light accent background */
}

/* Nested indentation - shows hierarchy using CSS variable for depth */
.category-node {
  padding-inline-start: calc(1.25rem + var(--depth, 0) * 1.5rem); /* Base 20px + 24px per level */
}

.book-node {
  padding-inline-start: calc(1.25rem + var(--depth, 0) * 1.5rem + 1.5rem); /* Category indent + 24px extra */
}

/* Chevron rotation - points right when collapsed, down when expanded */
.chevron-icon.expanded {
  transform: rotate(-90deg); /* Rotate 90 degrees counterclockwise */
}

/* Title text - takes remaining space */
.category-title,
.book-title {
  flex: 1; /* Grow to fill available space */
  line-height: 1.4; /* Line height for readability */
}

/* Book icon - muted by default */
.book-icon {
  color: var(--text-secondary); /* Secondary text color */
  opacity: 0.8; /* Slightly transparent */
}

/* Book icon on hover - accent color */
.book-node:hover .book-icon {
  color: var(--accent-color); /* Accent color on hover */
  opacity: 1; /* Full opacity on hover */
}
</style>
