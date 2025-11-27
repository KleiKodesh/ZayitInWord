<template>
  <div class="book-content-view" ref="bookContentViewRef">
    <LoadingAnimation v-if="isLoading" message="טוען ספר"/>
    
    <div v-else-if="lineIndices.length > 0" class="book-lines">
      <BookLine
        v-for="lineIndex in lineIndices"
        :key="lineIndex"
        :line-index="lineIndex"
        :book-id="bookId"
      />
    </div>
    
    <div v-else class="no-content">
      אין תוכן זמין
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, onActivated, watch, nextTick } from 'vue'
import LoadingAnimation from '../shared/LoadingAnimation.vue'
import BookLine from './BookLine.vue'
import { getBookLineCount } from '../../bridge/sqliteDb'
import { useTabsStore } from '../../stores/tabStore'

const props = defineProps<{
  bookId: number
  initialLineIndex?: number
  savedLineIndex?: number
}>()

const tabsStore = useTabsStore()
const bookContentViewRef = ref<HTMLElement | null>(null)
const lineIndices = ref<number[]>([])
const isLoading = ref(true)
const lastScrollPosition = ref(0) // Store scroll position for KeepAlive restoration

const scrollToLineIndex = async (lineIndex: number) => {
  // Wait for DOM to update
  await nextTick()
  
  // Calculate approximate scroll position
  const estimatedLineHeight = 40
  const estimatedScrollPosition = lineIndex * estimatedLineHeight
  
  // Scroll to approximate position first to trigger Intersection Observer
  if (bookContentViewRef.value) {
    bookContentViewRef.value.scrollTop = estimatedScrollPosition
  }
  
  // Retry mechanism to wait for element to exist in DOM
  let attempts = 0
  const maxAttempts = 30
  const scrollToLine = () => {
    const targetLine = bookContentViewRef.value?.querySelector(`[data-line-index="${lineIndex}"]`) as HTMLElement
    if (targetLine) {
      console.log(`Scrolling to line ${lineIndex}`)
      targetLine.scrollIntoView({ behavior: 'instant', block: 'start' })
    } else if (attempts < maxAttempts) {
      attempts++
      setTimeout(scrollToLine, 100)
    } else {
      console.warn(`Target line ${lineIndex} not found after ${maxAttempts} attempts`)
    }
  }
  
  setTimeout(scrollToLine, 100)
}

onMounted(async () => {
  try {
    const totalLines = await getBookLineCount(props.bookId)
    lineIndices.value = Array.from({ length: totalLines }, (_, i) => i)
    
    // Restore saved line if provided (session restore)
    if (props.savedLineIndex !== undefined) {
      await scrollToLineIndex(props.savedLineIndex)
    }
    // Otherwise scroll to initial line if specified (TOC navigation)
    else if (props.initialLineIndex !== undefined) {
      await scrollToLineIndex(props.initialLineIndex)
    }
  } catch (error) {
    console.error('Failed to load book line count:', error)
  } finally {
    isLoading.value = false
  }
  
  // Save scroll position and line at top of viewport periodically
  const saveScrollState = () => {
    if (!bookContentViewRef.value || !tabsStore.activeTab) return
    
    // Save raw scroll position for KeepAlive restoration
    lastScrollPosition.value = bookContentViewRef.value.scrollTop
    
    // Find the first fully visible line (at least 50% visible)
    const rect = bookContentViewRef.value.getBoundingClientRect()
    const lines = bookContentViewRef.value.querySelectorAll('[data-line-index]')
    
    for (const line of lines) {
      const lineRect = line.getBoundingClientRect()
      const lineHeight = lineRect.height
      const visibleTop = Math.max(lineRect.top, rect.top)
      const visibleBottom = Math.min(lineRect.bottom, rect.bottom)
      const visibleHeight = visibleBottom - visibleTop
      
      // Line is at least 50% visible
      if (visibleHeight >= lineHeight * 0.5) {
        const lineIndex = parseInt(line.getAttribute('data-line-index') || '0')
        tabsStore.activeTab.savedLineIndex = lineIndex
        break
      }
    }
  }
  
  bookContentViewRef.value?.addEventListener('scroll', saveScrollState)
  
  onUnmounted(() => {
    bookContentViewRef.value?.removeEventListener('scroll', saveScrollState)
  })
})

// IMPORTANT: onActivated runs when component is restored from KeepAlive cache
// This restores scroll position when switching back to this tab
onActivated(() => {
  if (bookContentViewRef.value && lastScrollPosition.value > 0) {
    console.log(`Restoring scroll position: ${lastScrollPosition.value}`)
    bookContentViewRef.value.scrollTop = lastScrollPosition.value
  }
})

// Watch for changes to initialLineIndex (when navigating within same book)
watch(() => props.initialLineIndex, (newLineIndex) => {
  if (newLineIndex !== undefined && !isLoading.value) {
    scrollToLineIndex(newLineIndex)
  }
})

</script>

<style scoped>
/* Book content view container */
.book-content-view {
  height: 100%; /* Full height of parent */
  width: 100%; /* Full width of parent */
  overflow-y: auto; /* Enable vertical scrolling */
  /* IMPORTANT: Ensure text is selectable */
  user-select: text !important;
  -webkit-user-select: text !important;
  -moz-user-select: text !important;
  -ms-user-select: text !important;
}

.no-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 12.5rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
}
</style>
