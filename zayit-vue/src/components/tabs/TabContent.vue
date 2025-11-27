<template>
  <!-- 
    IMPORTANT: Component renders based on navigation stack
    - Each route in the stack determines which component to show
    - Navigation is handled by tab store (navigateTo, navigateBack, navigateForward)
    - Components manage their own state internally
  -->
  <component 
    :is="currentComponent"
    class="tab-content"
    v-bind="componentProps"
  />
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

// Get current route from navigation stack
const currentRoute = computed(() => {
  return props.tab.navigationStack[props.tab.currentIndex]
})

const currentComponent = computed(() => {
  const route = currentRoute.value
  if (!route) return componentMap[1] // Default to LandingPage
  return componentMap[route.type]
})

const componentProps = computed(() => {
  const route = currentRoute.value
  if (!route) return {}
  
  if (route.type === 2 && route.bookId) {
    return {
      bookId: route.bookId,
      initialLineIndex: route.lineIndex, // From TOC navigation
      savedLineIndex: route.savedScrollLine // From saved scroll position
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
