<template>
  <div class="category-wrapper">
    <div class="category-node" @click="toggleExpand">
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
        :search-query="searchQuery"
        @select-book="$emit('select-book', $event)"
      />
      
      <div
        v-for="book in category.books"
        :key="book.id"
        class="book-node"
        @click="$emit('select-book', book)"
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

  const props = defineProps<{
    category: Category
    searchQuery?: string
  }>()
  
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

/* Nested indentation - shows hierarchy */
.category-wrapper .category-wrapper .category-node {
  padding-inline-start: 3rem; /* 48px left indent for nested categories */
}

.category-wrapper .category-wrapper .book-node {
  padding-inline-start: 4.5rem; /* 72px left indent for nested books */
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
