<template>
  <div class="toc-node">
    <div 
      class="toc-item" 
      :style="{ paddingRight: `${entry.level * 12}px` }"
      @click="handleClick"
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

const isExpanded = ref(false)

function toggleExpand() {
  isExpanded.value = !isExpanded.value
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
  padding: 6px 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.1s ease;
  gap: 6px;
  min-width: 100%;
  width: fit-content;
  background: transparent;
}

.toc-item:hover {
  background-color: rgba(90, 93, 94, 0.15);
}

.expand-icon {
  font-size: 10px;
  color: var(--text-secondary);
  width: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.toc-text {
  font-size: 13px;
  color: var(--text-primary);
  white-space: nowrap;
}

.toc-children {
  display: block;
}
</style>
