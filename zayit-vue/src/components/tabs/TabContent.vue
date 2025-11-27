<template>
  <!-- 
    IMPORTANT: KeepAlive with max caches component instances
    - Key includes tab.id AND type to cache each state separately
    - When tab switches Landing->Book->Landing, both states are preserved
    - max=20 allows caching multiple tab states (10 tabs × 2 types each)
    - DO NOT REMOVE: Critical for preserving scroll and navigation state
  -->
  <KeepAlive :max="20">
    <component 
      :is="currentComponent"
      :key="`t${tab.id}-ty${tab.type}-b${tab.bookId || 0}`"
      class="tab-content"
      v-bind="componentProps"
    />
  </KeepAlive>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import type { Tab } from '../../types/Tab'
import LandingPage from '../landing/LandingPage.vue'
import BookViewer from '../book/BookViewer.vue'

const props = defineProps<{
  tab: Tab
}>()

// Define placeholder components with explicit names for KeepAlive
const SearchPlaceholder: Component = {
  name: 'SearchPlaceholder',
  template: '<div class="placeholder"><h2>Search Page</h2><p>Coming soon...</p></div>'
}

const PdfPlaceholder: Component = {
  name: 'PdfPlaceholder',
  template: '<div class="placeholder"><h2>PDF Page</h2><p>Coming soon...</p></div>'
}

const componentMap: Record<number, Component> = {
  1: LandingPage,
  2: BookViewer,
  3: SearchPlaceholder,
  4: PdfPlaceholder
}

const currentComponent = computed(() => componentMap[props.tab.type])

const componentProps = computed(() => {
  if (props.tab.type === 2 && props.tab.bookId) {
    return {
      bookId: props.tab.bookId,
      initialLineIndex: props.tab.initialLineIndex,
      savedLineIndex: props.tab.savedLineIndex
    }
  }
  return {}
})
</script>

<style scoped>
/* Tab content container - fills available space */
.tab-content {
  height: 100%; /* Fill parent height */
  overflow: hidden; /* Prevent content from overflowing */
}

/* Placeholder for unimplemented tabs */
.placeholder {
  padding: 2.5rem; /* Generous padding around placeholder content */
  text-align: center; /* Center-align text */
  color: var(--text-secondary); /* Use muted text color */
}
</style>
