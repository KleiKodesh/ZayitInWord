<template>
  <div 
    ref="lineRef" 
    class="book-line"
    :class="{ 'loaded': !!content, 'dev-mode': isDev }"
    :data-line-index="lineIndex"
  >
    <div v-if="content" class="line-content" v-html="content"></div>
    <div v-else class="line-placeholder">
      <span v-if="isDev" class="line-id">{{ lineIndex }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { lineBatcher } from '../../utils/lineBatcher'

const props = defineProps<{
  lineIndex: number
  bookId: number
}>()

const lineRef = ref<HTMLElement | null>(null)
const content = ref<string>('')
const isDev = import.meta.env.DEV
let observer: IntersectionObserver | null = null

const loadContent = async () => {
  if (content.value) return // Already loaded
  
  try {
    const lineContent = await lineBatcher.request(props.bookId, props.lineIndex)
    if (lineContent) {
      content.value = lineContent
    }
  } catch (error) {
    console.error(`Failed to load book ${props.bookId} line ${props.lineIndex}:`, error)
  }
}

const unloadContent = () => {
  if (!content.value) return // Already unloaded
  content.value = ''
}

onMounted(() => {
  if (!lineRef.value) return
  
  // Create intersection observer
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadContent()
        } else {
          // Unload content when far from viewport
          const rect = entry.boundingClientRect
          const viewportHeight = window.innerHeight
          
          // Calculate distance from viewport
          let distanceFromViewport = 0
          if (rect.bottom < 0) {
            // Above viewport
            distanceFromViewport = Math.abs(rect.bottom)
          } else if (rect.top > viewportHeight) {
            // Below viewport
            distanceFromViewport = rect.top - viewportHeight
          }
          
          // Unload if more than 2 viewports away
          if (distanceFromViewport > viewportHeight * 2) {
            unloadContent()
          }
        }
      })
    },
    {
      rootMargin: '200% 0px', // Load 2 viewports ahead
      threshold: 0
    }
  )
  
  observer.observe(lineRef.value)
})

onUnmounted(() => {
  if (observer && lineRef.value) {
    observer.unobserve(lineRef.value)
    observer.disconnect()
  }
})
</script>

<style scoped>
.book-line {
  min-height: 1.5rem; /* Minimum height for placeholder */
  /* IMPORTANT: Ensure text is selectable */
  user-select: text !important;
  -webkit-user-select: text !important;
  -moz-user-select: text !important;
  -ms-user-select: text !important;
}

.line-content {
  padding: 0.25rem 1rem;
  line-height: 1.8;
  direction: rtl;
  /* IMPORTANT: Ensure text content is selectable */
  user-select: text !important;
  -webkit-user-select: text !important;
  -moz-user-select: text !important;
  -ms-user-select: text !important;
  cursor: text;
}

.line-placeholder {
  height: 1.5rem; /* Placeholder height */
}

/* Dev mode indicators */
.book-line.dev-mode:not(.loaded) {
  background: rgba(255, 0, 0, 0.03); /* Very subtle red for unloaded */
}

.line-id {
  font-size: 0.625rem;
  color: var(--text-secondary);
  opacity: 0.3;
  padding: 0 1rem;
  font-family: monospace;
}
</style>
