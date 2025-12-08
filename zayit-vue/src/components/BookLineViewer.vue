<template>
    <div v-if="viewerState.totalLines.value > 0"
         ref="containerRef"
         class="overflow-y height-fill relative line-viewer"
         @scroll.passive="handleScrollDebounced">
        <BookLine v-for="index in viewerState.totalLines.value"
                  :key="index - 1"
                  :data-line-index-observer="index - 1"
                  :ref="el => { if (el) lineRefs[index - 1] = el as any }"
                  :content="viewerState.lines.value[index - 1] || '-'"
                  :line-index="index - 1"
                  :is-selected="selectedLineIndex === (index - 1)"
                  @line-click="handleLineClick" />
    </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from 'vue'
import BookLine from './BookLine.vue'
import { BookLineViewerState } from '../data/bookLineViewerState'
import { getTopVisibleElementIndex } from '../utils/topVisibleElement'

const props = defineProps<{
    bookId: number
    initialLineIndex?: number
    selectedLineIndex?: number
    isActive: boolean
    isTocOpen: boolean
}>()

const emit = defineEmits<{
    updateScrollPosition: [lineIndex: number]
    placeholdersReady: []
    lineClick: [lineIndex: number]
}>()

const selectedLineIndex = ref<number | null>(null)

// Watch for selectedLineIndex prop changes to restore selection
watch(() => props.selectedLineIndex, (newIndex) => {
    if (newIndex !== undefined) {
        selectedLineIndex.value = newIndex
    }
}, { immediate: true })

function handleLineClick(lineIndex: number) {
    selectedLineIndex.value = lineIndex
    emit('lineClick', lineIndex)
}

const viewerState = new BookLineViewerState()
const containerRef = ref<HTMLElement>()
const lineRefs = ref<InstanceType<typeof BookLine>[]>([])

let scrollUpdateTimeout: number | null = null

// Load book when bookId changes
watch(() => props.bookId, async (bookId, oldBookId) => {
    if (bookId && bookId !== oldBookId) {
        const isRestore = oldBookId === undefined && props.initialLineIndex !== undefined
        await viewerState.loadBook(bookId, isRestore, props.initialLineIndex)
        await nextTick()
        emit('placeholdersReady')
        // Scroll to initial position if provided
        if (props.initialLineIndex !== undefined) {
            scrollToLine(props.initialLineIndex)
        }
    }
}, { immediate: true })

watch(() => props.isTocOpen, (isTocOpen) => {
    viewerState.setBufferingMode(isTocOpen)
})

// Restore scroll when tab becomes active
watch(() => props.isActive, async (isActive, wasActive) => {
    if (isActive && !wasActive && props.bookId && viewerState.totalLines.value > 0) {
        await nextTick()
        if (props.initialLineIndex !== undefined) {
            scrollToLine(props.initialLineIndex)
        }
    }
})

function getTopVisibleLine(): number | undefined {
    if (!containerRef.value) return undefined

    const lineElements = lineRefs.value.map(ref => ref?.$el as HTMLElement | undefined)
    return getTopVisibleElementIndex(containerRef.value, lineElements)
}

function handleScrollDebounced() {
    if (!containerRef.value || viewerState.isInitialLoad) return

    if (scrollUpdateTimeout !== null) {
        clearTimeout(scrollUpdateTimeout)
    }
    scrollUpdateTimeout = window.setTimeout(() => {
        const topLine = getTopVisibleLine()
        if (topLine !== undefined) {
            emit('updateScrollPosition', topLine)
        }
    }, 300)
}

function scrollToLine(lineIndex: number) {
    const lineRef = lineRefs.value[lineIndex]
    const lineElement = lineRef?.$el

    if (lineElement) {
        lineElement.scrollIntoView({ behavior: 'instant', block: 'start' })
    }
}

async function handleTocSelection(lineIndex: number) {
    await viewerState.handleTocSelection(lineIndex)

    // Scroll immediately (even if placeholder)
    await nextTick()
    await nextTick()
    scrollToLine(lineIndex)
}

onUnmounted(() => {
    viewerState.cleanup()

    const topLine = getTopVisibleLine()
    if (topLine !== undefined) {
        emit('updateScrollPosition', topLine)
    }
})

defineExpose({
    handleTocSelection
})
</script>

<style scoped>
.line-viewer {
    padding: 25px 15px;
}
</style>
