<template>
    <div v-if="viewerState.totalLines.value > 0"
         ref="containerRef"
         class="overflow-y height-fill justify relative line-viewer book-content"
         :data-book-id="myTab?.bookState?.bookId"
         @scroll.passive="handleScrollDebounced">
        <BookLine v-for="index in viewerState.totalLines.value"
                  :key="index - 1"
                  :data-line-index-observer="index - 1"
                  :ref="el => { if (el) lineRefs[index - 1] = el as any }"
                  :content="viewerState.lines.value[index - 1] || '-'"
                  :line-index="index - 1"
                  :is-selected="selectedLineIndex === (index - 1)"
                  :class="{ 'show-selection': myTab?.bookState?.showBottomPane }"
                  @line-click="handleLineClick" />
    </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted, computed } from 'vue'
import BookLine from './BookLine.vue'
import { BookLineViewerState } from '../data/bookLineViewerState'
import { getTopVisibleElementIndex } from '../utils/topVisibleElement'
import { useContainedSelection } from '../composables/useContainedSelection'
import { useTabStore } from '../stores/tabStore'

const tabStore = useTabStore()

const props = defineProps<{
    tabId?: number
}>()

const emit = defineEmits<{
    updateScrollPosition: [lineIndex: number]
    placeholdersReady: []
    lineClick: [lineIndex: number]
    clearOtherSelections: []
}>()

const myTab = computed(() => tabStore.tabs.find(t => t.id === props.tabId))
const selectedLineIndex = ref<number | null>(null)

// Watch for selectedLineIndex changes to restore selection
watch(() => myTab.value?.bookState?.selectedLineIndex, (newIndex) => {
    if (newIndex !== undefined) {
        selectedLineIndex.value = newIndex
    }
}, { immediate: true })

function handleLineClick(lineIndex: number) {
    selectedLineIndex.value = lineIndex
    // Save selected line to tab state
    if (myTab.value?.bookState) {
        myTab.value.bookState.selectedLineIndex = lineIndex
    }
    emit('lineClick', lineIndex)
}

const viewerState = new BookLineViewerState()
const containerRef = ref<HTMLElement | null>(null)
const lineRefs = ref<InstanceType<typeof BookLine>[]>([])

let scrollUpdateTimeout: number | null = null

// Load book when bookId changes
watch(() => myTab.value?.bookState?.bookId, async (bookId, oldBookId) => {
    if (bookId && bookId !== oldBookId) {
        const initialLineIndex = myTab.value?.bookState?.initialLineIndex
        const isRestore = oldBookId === undefined && initialLineIndex !== undefined
        await viewerState.loadBook(bookId, isRestore, initialLineIndex)
        await nextTick()
        emit('placeholdersReady')

        // Scroll to initial position if provided
        if (initialLineIndex !== undefined) {
            scrollToLine(initialLineIndex)
        }
    }
}, { immediate: true })

watch(() => myTab.value?.bookState?.isTocOpen, (isTocOpen) => {
    viewerState.setBufferingMode(isTocOpen || false)
})

// Restore scroll when tab becomes active
watch(() => myTab.value?.isActive, async (isActive, wasActive) => {
    const bookId = myTab.value?.bookState?.bookId
    const initialLineIndex = myTab.value?.bookState?.initialLineIndex
    if (isActive && !wasActive && bookId && viewerState.totalLines.value > 0) {
        await nextTick()
        if (initialLineIndex !== undefined) {
            scrollToLine(initialLineIndex)
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
            // Save scroll position to tab state
            if (myTab.value?.bookState) {
                myTab.value.bookState.initialLineIndex = topLine
            }
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
    scrollToLine(lineIndex)
}

// Set up contained selection behavior
const { clearSelection } = useContainedSelection(containerRef, {
    handleSelectAll: true,
    preventSelectionSpanning: true,
    onSelectionStart: () => {
        emit('clearOtherSelections')
    }
})

// Watch for diacritics state changes
watch(() => myTab.value?.bookState?.diacriticsState, (newState, oldState) => {
    if (!containerRef.value || !myTab.value?.bookState) return

    const bookState = myTab.value.bookState

    // Store original HTML on first toggle
    if (oldState === undefined && newState !== undefined && newState > 0 && !bookState.originalHtml) {
        bookState.originalHtml = containerRef.value.innerHTML
    }

    if (newState === 0) {
        // Restore original
        if (bookState.originalHtml) {
            containerRef.value.innerHTML = bookState.originalHtml
            bookState.originalHtml = undefined
        }
    } else if (newState && newState > 0) {
        // Apply filter
        applyDiacriticsFilter(containerRef.value, newState)
    }
})

// Watch for line display state changes
watch(() => myTab.value?.bookState?.isLineDisplayInline, (isInline) => {
    if (!containerRef.value) return

    const lines = Array.from(containerRef.value.querySelectorAll('.book-line'))

    lines.forEach(lineElement => {
        const element = lineElement as HTMLElement
        const hasHeaders = element.querySelector('h1, h2, h3, h4, h5, h6')

        if (!hasHeaders) {
            if (isInline) {
                element.classList.add('inline-mode')
            } else {
                element.classList.remove('inline-mode')
            }
        }
    })
})

// Diacritics filter function
function applyDiacriticsFilter(container: Element, state: number) {
    const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        null
    )

    const textNodes: Text[] = []
    let node: Node | null
    while ((node = walker.nextNode())) {
        textNodes.push(node as Text)
    }

    textNodes.forEach(textNode => {
        if (!textNode) return

        let text = textNode.nodeValue || ''

        // State 1: Remove cantillations only (U+0591-U+05AF)
        if (state >= 1) {
            text = text.replace(/[\u0591-\u05AF]/g, '')
        }

        // State 2: Remove nikkud as well (U+05B0-U+05BD, U+05C1, U+05C2, U+05C4, U+05C5)
        if (state >= 2) {
            text = text.replace(/[\u05B0-\u05BD\u05C1\u05C2\u05C4\u05C5]/g, '')
        }

        textNode.nodeValue = text
    })
}



onUnmounted(() => {
    viewerState.cleanup()

    const topLine = getTopVisibleLine()
    if (topLine !== undefined) {
        // Save scroll position to tab state
        if (myTab.value?.bookState) {
            myTab.value.bookState.initialLineIndex = topLine
        }
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
    font-size: var(--font-size, 100%);
}
</style>
