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
let loadObserver: IntersectionObserver | null = null
let unloadObserver: IntersectionObserver | null = null

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
  
  // Create intersection observer with extended range for loading
  loadObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadContent()
        }
      })
    },
    {
      rootMargin: '200% 0px', // Load 2 viewports ahead
      threshold: 0
    }
  )
  
  // Create separate observer with even larger range for unloading
  unloadObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        // When element leaves the extended viewport, unload it
        if (!entry.isIntersecting) {
          unloadContent()
        }
      })
    },
    {
      rootMargin: '300% 0px', // Unload when 3 viewports away (beyond load range)
      threshold: 0
    }
  )
  
  loadObserver.observe(lineRef.value)
  unloadObserver.observe(lineRef.value)
})

onUnmounted(() => {
  if (lineRef.value) {
    if (loadObserver) {
      loadObserver.unobserve(lineRef.value)
      loadObserver.disconnect()
    }
    if (unloadObserver) {
      unloadObserver.unobserve(lineRef.value)
      unloadObserver.disconnect()
    }
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
