<template>
  <div class="book-viewer">
    <!-- 
      IMPORTANT: KeepAlive preserves BookContentView scroll position
      - Key by bookId so different books get separate cached instances
      - When switching tabs viewing same book, scroll position is maintained
      - DO NOT REMOVE: Critical for preserving reading position
    -->
    <KeepAlive>
      <BookContentView
        :key="bookId"
        :book-id="bookId"
        :initial-line-index="initialLineIndex"
        :saved-line-index="savedLineIndex"
      />
    </KeepAlive>
  </div>
</template>

<script setup lang="ts">
import BookContentView from './BookContentView.vue'

defineProps<{
  bookId: number
  initialLineIndex?: number
  savedLineIndex?: number
}>()
</script>

<script lang="ts">
// IMPORTANT: Explicit name required for KeepAlive to cache this component
export default {
  name: 'BookViewer'
}
</script>

<style scoped>
/* Book viewer container */
.book-viewer {
  height: 100%; /* Full height of parent */
  width: 100%; /* Full width of parent */
  position: relative; /* Positioning context for children */
  overflow: hidden; /* Hide overflow content */
}
</style>
