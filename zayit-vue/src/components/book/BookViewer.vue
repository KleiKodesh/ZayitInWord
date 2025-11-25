<template>
  <div class="book-viewer">
    <BookContentView
      :book-id="bookId"
      :initial-line-id="initialLineId"
    />
  </div>
</template>

<script setup lang="ts">
import BookContentView from './BookContentView.vue'

defineProps<{
  bookId: number
  initialLineId?: number
}>()
</script>

<style scoped>
/* Book viewer container */
.book-viewer {
  height: 100%; /* Full height of parent */
  width: 100%; /* Full width of parent */
  direction: rtl; /* Right-to-left text direction for Hebrew */
  position: relative; /* Positioning context for children */
  overflow: hidden; /* Hide overflow content */
}
</style>
