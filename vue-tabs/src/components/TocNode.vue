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
      <span v-if="entry.hasChildren" class="expand-icon" @click.stop="toggleExpand">
        {{ isExpanded ? '▼' : '◀' }}
      </span>
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
import type { TocEntry } from '../types/Toc'

const props = defineProps<{
  entry: TocEntry
}>()

const emit = defineEmits<{
  navigate: [lineId: number]
}>()

const isExpanded = ref(props.entry.isExpanded || false)

function toggleExpand() {
  isExpanded.value = !isExpanded.value
  // Update the entry's isExpanded property
  props.entry.isExpanded = isExpanded.value
}

function handleClick() {
  emit('navigate', props.entry.lineId)
}
</script>

<style scoped>
.toc-node {
  user-select: none;
  display: inline-block;
  width: 100%;
  background: transparent;
}

.toc-item {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.1s ease;
  gap: 8px;
  min-width: 100%;
  width: fit-content;
  background: transparent;
}

.toc-item:hover {
  background-color: var(--hover-bg);
}

.toc-item:focus {
  outline: 2px solid var(--accent-color);
  outline-offset: -2px;
  background: rgba(var(--accent-color-rgb, 0, 120, 212), 0.1);
}

.expand-icon {
  font-size: 11px;
  color: var(--text-secondary);
  width: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.toc-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.toc-children {
  display: block;
}
</style>
