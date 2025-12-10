<template>
    <div v-if="viewerState.totalLines.value > 0"
         class="height-fill"
         style="position: relative;"
         tabindex="0"
         @keydown="handleKeyDown">
        <GenericSearch ref="searchRef"
                       :is-open="isSearchOpen"
                       @close="isSearchOpen = false"
                       @search-query-change="handleSearchQueryChange"
                       @navigate-to-match="handleNavigateToMatch" />

        <div ref="containerRef"
             class="overflow-y height-fill justify line-viewer"
             @scroll.passive="handleScrollDebounced">
            <BookLine v-for="index in viewerState.totalLines.value"
                      :key="index - 1"
                      :data-line-index-observer="index - 1"
                      :ref="el => { if (el) lineRefs[index - 1] = el as any }"
                      :content="processedLines[index - 1] || '\u00A0'"
                      :line-index="index - 1"
                      :is-selected="selectedLineIndex === (index - 1)"
                      :class="{
                        'show-selection': myTab?.bookState?.showBottomPane,
                        'inline-mode': myTab?.bookState?.isLineDisplayInline
                    }"
                      @line-click="handleLineClick" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted, computed } from 'vue'
import BookLine from './BookLine.vue'
import GenericSearch from './common/GenericSearch.vue'
import { BookLineViewerState } from '../data/bookLineViewerState'
import { getTopVisibleElementIndex } from '../utils/topVisibleElement'
import { useContainedSelection } from '../composables/useContainedSelection'
import { useContentSearch } from '../composables/useContentSearch'
import { useTabStore } from '../stores/tabStore'

// Buffer zone configuration
const LOAD_BUFFER_SIZE = 20    // Lines to load around visible area
const MEMORY_BUFFER_SIZE = 50  // Lines to keep in memory around visible area (regular mode)
const MEMORY_BUFFER_SIZE_INLINE = 500  // Lines to keep in memory around visible area (inline mode)

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
const visibleLines = ref<Set<number>>(new Set())

// Computed property for processed line content
const processedLines = computed(() => {
    const lines = viewerState.lines.value
    const diacriticsState = myTab.value?.bookState?.diacriticsState
    const query = search.searchQuery.value
    const currentMatch = search.currentMatch.value

    const processedLines: Record<number, string> = {}

    // Process all lines up to totalLines
    for (let lineIndex = 0; lineIndex < viewerState.totalLines.value; lineIndex++) {
        const line = lines[lineIndex]

        // If line is not loaded (undefined or placeholder), show placeholder
        if (!line || line === '\u00A0') {
            processedLines[lineIndex] = '\u00A0' // Hard space placeholder
            continue
        }

        let processedLine = line

        // Apply diacritics filtering
        if (diacriticsState && diacriticsState > 0) {
            processedLine = applyDiacriticsFilter(processedLine, diacriticsState)
        }

        // Apply search highlighting
        if (query) {
            const currentOccurrence = currentMatch?.itemIndex === lineIndex ? currentMatch.occurrence : -1
            processedLine = search.highlightMatches(processedLine, query, currentOccurrence)
        }

        processedLines[lineIndex] = processedLine
    }

    return processedLines
})

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
const searchRef = ref<InstanceType<typeof GenericSearch> | null>(null)

// Use content search composable
const search = useContentSearch()

// Sync search state with tab store
const isSearchOpen = computed({
    get: () => myTab.value?.bookState?.isSearchOpen || false,
    set: (value) => {
        if (myTab.value?.bookState) {
            myTab.value.bookState.isSearchOpen = value
        }
    }
})

function handleKeyDown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        isSearchOpen.value = true
        return
    }

    // Handle Ctrl+Home and Ctrl+End for virtualized content
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 'Home') {
            e.preventDefault()
            scrollToLine(0)
        } else if (e.key === 'End') {
            e.preventDefault()
            const lastLine = viewerState.totalLines.value - 1
            if (lastLine >= 0) {
                scrollToLine(lastLine)
            }
        }
    }
}

// Current search query for reactive updates
const currentSearchQuery = ref('')

function handleSearchQueryChange(query: string) {
    currentSearchQuery.value = query
    performSearch()
}

function performSearch() {
    const query = currentSearchQuery.value
    if (!query.trim()) {
        search.searchInItems([], query)
        searchRef.value?.setMatches(0)
        return
    }

    // Search only the buffer (now contains all loaded content)
    const allLines = viewerState.getBufferLinesForSearch()
    search.searchInItems(allLines, query)
    searchRef.value?.setMatches(search.totalMatches.value)
}

// Re-search when buffer updates
watch(() => viewerState.bufferUpdateCount.value, () => {
    if (currentSearchQuery.value.trim()) {
        performSearch()
    }
})

function handleNavigateToMatch(matchIndex: number) {
    search.navigateToMatch(matchIndex)
    const match = search.currentMatch.value
    if (match) {
        // Scroll line into view first (instant, no animation)
        scrollToLine(match.itemIndex)

        // Wait for virtual scroller to render the item, then fine-tune scroll position
        setTimeout(() => {
            const currentMark = document.querySelector('.line-viewer mark.current')
            if (currentMark && containerRef.value) {
                const markRect = currentMark.getBoundingClientRect()
                const containerRect = containerRef.value.getBoundingClientRect()

                // Account for search bar height (approximately 60px)
                const searchBarOffset = 60
                const effectiveTop = containerRect.top + searchBarOffset

                // Calculate if mark is visible below search bar
                const isVisible = markRect.top >= effectiveTop &&
                    markRect.bottom <= containerRect.bottom

                // Only adjust scroll if mark is not fully visible
                if (!isVisible) {
                    const offset = markRect.top - containerRect.top - (containerRect.height / 2) + (markRect.height / 2)
                    containerRef.value.scrollTop += offset
                }
            }
        }, 50)
    }
}

let scrollUpdateTimeout: number | null = null

// Load book when bookId changes
watch(() => myTab.value?.bookState?.bookId, async (bookId, oldBookId) => {
    if (bookId && bookId !== oldBookId) {
        const initialLineIndex = myTab.value?.bookState?.initialLineIndex
        const isRestore = oldBookId === undefined && initialLineIndex !== undefined
        await viewerState.loadBook(bookId, isRestore, initialLineIndex)
        await nextTick()

        // Set up observer after lines are rendered
        setupObserver()

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
    if (!containerRef.value)
        return undefined
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

async function scrollToLine(lineIndex: number) {
    // Ensure the target line is loaded first
    await viewerState.loadLinesAround(lineIndex, LOAD_BUFFER_SIZE)

    // Wait for DOM update
    await nextTick()

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

// Helper function to apply diacritics filtering to HTML content
function applyDiacriticsFilter(htmlContent: string, state: number): string {
    if (!htmlContent || state === 0) return htmlContent

    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent

    const walker = document.createTreeWalker(
        tempDiv,
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

    return tempDiv.innerHTML
}





// Set up IntersectionObserver for semi-virtualization
let observer: IntersectionObserver | null = null

function setupObserver() {
    if (observer) {
        observer.disconnect()
    }

    observer = new IntersectionObserver((entries) => {
        let hasChanges = false

        entries.forEach(entry => {
            const lineIndex = Number(entry.target.getAttribute('data-line-index-observer'))
            if (entry.isIntersecting) {
                if (!visibleLines.value.has(lineIndex)) {
                    visibleLines.value.add(lineIndex)
                    hasChanges = true
                }
                // Load this line and surrounding lines for UI rendering
                // This will check buffer first, then DB if needed
                viewerState.loadLinesAround(lineIndex, LOAD_BUFFER_SIZE)
            } else {
                if (visibleLines.value.has(lineIndex)) {
                    visibleLines.value.delete(lineIndex)
                    hasChanges = true
                }
            }
        })

        // Clean up non-visible lines after visibility changes
        if (hasChanges) {
            // Debounce cleanup to avoid excessive calls
            setTimeout(() => {
                const isInlineMode = myTab.value?.bookState?.isLineDisplayInline
                const bufferSize = isInlineMode ? MEMORY_BUFFER_SIZE_INLINE : MEMORY_BUFFER_SIZE
                viewerState.cleanupNonVisibleLines(visibleLines.value, bufferSize)
            }, 500)
        }
    }, {
        root: containerRef.value,
        rootMargin: '200px', // Load lines 200px before they come into view
        threshold: 0
    })

    // Observe all line elements
    nextTick(() => {
        lineRefs.value.forEach((lineRef, index) => {
            if (lineRef && lineRef.$el) {
                observer?.observe(lineRef.$el)
            }
        })
    })
}

onMounted(() => {
    // Observer will be set up when book loads
})

onUnmounted(() => {
    observer?.disconnect()
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
