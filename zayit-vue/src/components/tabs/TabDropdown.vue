<template>
  <Transition name="slide">
    <div v-if="isOpen" class="dropdown" @click.stop>
      <div
        v-for="tab in tabsStore.tabs"
        :key="tab.id"
        class="bar bar-item"
        :class="{ selected: tab.isActive }"
        @click="handleActivate(tab.id)"
      >
        <span class="tab-item-title">{{ tab.title }}</span>
        <button @click.stop="handleClose(tab.id)">×</button>
      </div>
    </div>
  </Transition>
</template>


<script setup lang="ts">
import { useTabsStore } from '../../stores/tabStore';

defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{ close: [] }>()

const tabsStore = useTabsStore()

const handleActivate = (id: number) => {
  tabsStore.activateTab(id)
  emit('close')
}

const handleClose = (id: number) => {
  tabsStore.closeTab(id)
}
</script>

<style scoped>
/* Dropdown container - Positioned absolutely within parent */
.dropdown {
  position: absolute; /* Position relative to parent with position: relative */
  top: 100%; /* Position directly below parent (tab header) */
  left: 0; /* Align to left edge of parent */
  right: 0; /* Align to right edge of parent */
  max-height: 60vh; /* Maximum height is 60% of viewport */
  overflow-y: auto; /* Enable vertical scrolling if content exceeds max-height */
  z-index: 1000; /* Stack above other content */
  border-bottom: 1px solid var(--border-color); /* Bottom border separator */
  box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.1); /* Subtle shadow for depth */
}

/* Slide animation - Active state (entering/leaving) */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.15s ease; /* Smooth transition for all properties */
}

/* Slide animation - Initial state (before entering) and final state (after leaving) */
.slide-enter-from,
.slide-leave-to {
  opacity: 0; /* Fully transparent */
  transform: translateY(-0.5rem); /* Shifted up */
}

/* Bar item customization for dropdown */
.bar-item {
  justify-content: space-between; /* Space between title (left) and close button (right) */
  border-bottom: 1px solid var(--border-color);
  cursor: pointer; /* Clickable */  
}

/* Tab title text inside dropdown item */
.tab-item-title {
  flex: 1; /* Take remaining space */
  overflow: hidden; /* Hide overflowing text */
  text-overflow: ellipsis; /* Show ... for truncated text */
  white-space: nowrap; /* Prevent text wrapping to new line */
}

/* Bar item hover */
.bar-item:hover {
  background: var(--hover-bg);
}

/* Bar item active/pressed */
.bar-item:active {
  background: var(--active-bg);
}

/* Bar item selected state */
.bar-item.selected {
  background: var(--accent-bg);
  color: var(--accent-color);
  /* border-right: 0.1875rem solid var(--accent-color); */
}
</style>
