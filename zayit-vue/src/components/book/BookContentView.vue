<template>
  <div class="book-content-view" ref="bookContentViewRef">
    <!-- Loading state -->
    <LoadingAnimation message="טוען ספר"/>
  </div>
</template>

<script setup lang="ts">
import LoadingAnimation from '../shared/LoadingAnimation.vue'

defineProps<{
  bookId: number
  initialLineId?: number
}>()
</script>

<style scoped>
/* Book content view container */
.book-content-view {
  height: 100%; /* Full height of parent */
  width: 100%; /* Full width of parent */
  direction: rtl; /* Right-to-left text direction for Hebrew */
  position: relative; /* Positioning context for children */
  overflow-y: auto; /* Enable vertical scrolling */
}
</style>
