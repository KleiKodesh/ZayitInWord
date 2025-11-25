<template>
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

const componentMap: Record<number, Component> = {
  1: LandingPage,
  2: BookViewer,
  3: { template: '<div class="placeholder"><h2>Search Page</h2><p>Coming soon...</p></div>' },
  4: { template: '<div class="placeholder"><h2>PDF Page</h2><p>Coming soon...</p></div>' }
}

const currentComponent = computed(() => componentMap[props.tab.type])

const componentProps = computed(() => {
  if (props.tab.type === 2 && props.tab.bookId) {
    return {
      bookId: props.tab.bookId,
      initialLineId: props.tab.initialLineId
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
