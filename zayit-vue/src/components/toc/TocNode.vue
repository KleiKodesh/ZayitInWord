<template>
  <div class="toc-node">
    <div 
      class="toc-item" 
      :style="{ paddingRight: `${entry.level * 12}px` }"
      tabindex="0"
      @click="handleClick"
      @keydown.enter="handleClick"
      @keydown.space.prevent="handleClick"
    >
      <ChevronIconLeft 
        v-if="entry.hasChildren"
        :class="{ expanded: isExpanded }"
        @click.stop="toggleExpand"
      />
      <span class="toc-text">{{ entry.text }}</span>
    </div>
    <div v-if="isExpanded && entry.children" class="toc-children">
      <TocNode 
        v-for="child in entry.children" 
        :key="child.id" 
        :entry="child"
        @navigate="$emit('navigate', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ChevronIconLeft from '../icons/ChevronIconLeft.vue'
import type { TocEntry } from '../../types/Toc'

const props = defineProps<{
  entry: TocEntry
}>()

const emit = defineEmits<{
  navigate: [lineId: number]
}>()

const isExpanded = ref(props.entry.isExpanded || false)

function toggleExpand() {
  isExpanded.value = !isExpanded.value
  props.entry.isExpanded = isExpanded.value
}

function handleClick() {
  emit('navigate', props.entry.lineId)
}
</script>

<style scoped>
/* TOC node container - inline-block for proper width calculation */
.toc-node {
  user-select: none; /* Prevent text selection during interaction */
  display: inline-block; /* Allow width to fit content while respecting parent */
  width: 100%; /* Take full width of parent */
  background: transparent; /* No background color */
}

/* TOC item - clickable row with indentation based on level */
.toc-item {
  display: inline-flex; /* Horizontal layout that fits content */
  align-items: center; /* Vertically center chevron and text */
  padding: 0.5rem 0.75rem; /* 8px vertical, 12px horizontal padding */
  cursor: pointer; /* Show pointer cursor on hover */
  border-radius: 0.25rem; /* 4px rounded corners */
  transition: background 0.1s ease; /* Smooth background color transition */
  gap: 0.5rem; /* 8px space between chevron and text */
  min-width: 100%; /* Ensure minimum width fills parent */
  width: fit-content; /* Expand to fit content if needed */
  background: transparent; /* No background by default */
}

/* Hover state - highlight background */
.toc-item:hover {
  background-color: var(--hover-bg); /* Light background on hover */
}

/* Focus state - accent outline for keyboard navigation */
.toc-item:focus {
  outline: 2px solid var(--accent-color); /* Accent color outline */
  outline-offset: -2px; /* Outline inside the element */
  background: rgba(var(--accent-color-rgb, 0, 120, 212), 0.1); /* Light accent background */
}

/* Chevron rotation - points right when collapsed, down when expanded */
.chevron-icon.expanded {
  transform: rotate(-90deg); /* Rotate 90 degrees counterclockwise when expanded */
}

/* TOC entry text - no wrapping */
.toc-text {
  font-size: 0.875rem; /* 14px font size */
  font-weight: 600; /* Semi-bold weight */
  color: var(--text-primary); /* Primary text color */
  white-space: nowrap; /* Prevent text wrapping */
}

/* Children container - block display for vertical stacking */
.toc-children {
  display: block; /* Block display for vertical stacking of child nodes */
}
</style>
