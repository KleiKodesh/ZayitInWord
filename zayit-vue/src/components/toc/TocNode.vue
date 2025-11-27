<template>
  <div class="toc-wrapper">
    <div 
      class="toc-item" 
      tabindex="0"
      @click="handleClick"
      @keydown.enter.stop="handleClick"
      @keydown.space.stop.prevent="handleSpace"
    >
      <div 
        v-if="entry.hasChildren"
        class="chevron-area"
        @click.stop="toggleExpand"
      >
        <ChevronIconLeft :class="{ expanded: isExpanded }" />
      </div>
      <span class="toc-text">{{ entry.text }}</span>
    </div>
    <template v-if="isExpanded && entry.children">
      <TocNode 
        v-for="child in entry.children" 
        :key="child.id" 
        :entry="child"
        @navigate="$emit('navigate', $event)"
      />
    </template>
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
  navigate: [lineIndex: number]
}>()

const isExpanded = ref(props.entry.isExpanded || false)

function toggleExpand() {
  isExpanded.value = !isExpanded.value
  props.entry.isExpanded = isExpanded.value
}

function handleClick() {
  // Navigate to line
  emit('navigate', props.entry.lineIndex)
}

function handleSpace() {
  // Space key: toggle if has children, otherwise navigate
  if (props.entry.hasChildren) {
    toggleExpand()
  } else {
    emit('navigate', props.entry.lineIndex)
  }
}
</script>

<style scoped>
/* TOC wrapper container */
.toc-wrapper {
  user-select: none; /* Prevent text selection during interaction */
}

/* TOC item - clickable row with compact styling */
.toc-item {
  display: flex; /* Flexbox for horizontal layout */
  align-items: center; /* Vertically center chevron and text */
  padding: 0.5rem 1rem; /* 8px vertical, 16px horizontal - more compact */
  cursor: pointer; /* Show pointer cursor on hover */
  transition: all 0.1s ease; /* Faster, simpler transition */
  font-size: 0.8125rem; /* 13px font size - slightly smaller */
  font-weight: 500; /* Medium weight - lighter than category */
  border-radius: 0.25rem; /* 4px rounded corners */
}

/* Nested indentation - shows hierarchy recursively */
.toc-wrapper .toc-wrapper .toc-item {
  padding-inline-start: 2.5rem; /* 40px left indent for each nesting level */
}

/* Hover state - highlight background */
.toc-item:hover {
  background-color: var(--hover-bg); /* Light background on hover */
}

/* Focus state - accent outline for keyboard navigation */
.toc-item:focus {
  outline: none; /* No outline */
  background: rgba(var(--accent-color-rgb, 0, 120, 212), 0.1); /* Light accent background */
}

/* Chevron area - larger clickable area for expand/collapse */
.chevron-area {
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: stretch; /* Stretch to full height */
  min-width: 2rem; /* Larger click area */
  margin-inline-start: -1rem; /* Extend into left padding */
  padding-inline-end: 0.5rem; /* Extend into left padding */
  margin-block: -0.5rem; /* Extend into top/bottom padding */
  padding-inline-start: 1rem; /* Restore padding for chevron positioning */
  cursor: pointer;
}

/* Chevron rotation - points right when collapsed, down when expanded */
.chevron-icon.expanded {
  transform: rotate(-90deg); /* Rotate 90 degrees counterclockwise when expanded */
}

/* TOC entry text - refined styling */
.toc-text {
  flex: 1; /* Take remaining space */
  color: var(--text-primary); /* Primary text color */
  white-space: nowrap; /* Prevent text wrapping */
  line-height: 1.4; /* Line height for readability */
}


</style>
