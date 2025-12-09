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

        <div ref="scrollerRef"
             class="overflow-y height-fill line-viewer scroller"
             @scroll.passive="handleScrollDebounced">
            <div class="lines-container">
                <BookLine v-for="item in lineItems"
                          :key="item.index"
                          :content="getLineContent(item.index)"
                          :line-index="item.index"
                          :is-selected="selectedLineIndex === item.index"
                          :inline-mode="myTab?.bookState?.isLineDisplayInline"
                          :class="{
                            'show-selection': myTab?.bookState?.showBottomPane,
                            'inline-mode': myTab?.bookState?.isLineDisplayInline
                        }"
                          @line-click="handleLineClick" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted, computed, onMounted } from 'vue'
import BookLine from './BookLine.vue'
import GenericSearch from './common/GenericSearch.vue'
import { BookLineViewerState } from '../data/bookLineViewerState'
import { useContainedSelection } from '../composables/useContainedSelection'
import { useContentSearch } from '../composables/useContentSearch'
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

const viewerState = new BookLineViewerState()
const scrollerRef = ref<HTMLElement | null>(null)
const searchRef = ref<InstanceType<typeof GenericSearch> | null>(null)

// Track visible range
const visibleRange = ref({ start: 0, end: 50 })

// Create items array
const lineItems = computed(() => {
    const total = viewerState.totalLines.value
    return Array.from({ length: total }, (_, i) => ({ index: i }))
})

// Get line content - only load for visible lines
function getLineContent(index: number): string {
    // Always return content if available
    const content = processedLines.value[index]
    if (content) return content

    // Return placeholder for non-visible lines
    return '\u00A0'
}

// Update visible range based on scroll position
function updateVisibleRange() {
    if (!scrollerRef.value) return

    const container = scrollerRef.value
    const scrollTop = container.scrollTop
    const containerHeight = container.clientHeight

    // Estimate line height (adjust based on your content)
    const estimatedLineHeight = 30
    const buffer = 20 // Load extra lines above and below

    const startIndex = Math.max(0, Math.floor(scrollTop / estimatedLineHeight) - buffer)
    const visibleCount = Math.ceil(containerHeight / estimatedLineHeight)
    const endIndex = Math.min(viewerState.totalLines.value, startIndex + visibleCount + buffer * 2)

    visibleRange.value = { start: startIndex, end: endIndex }
}

// Load lines in visible range
watch(() => visibleRange.value, async (range) => {
    if (range.start !== undefined && range.end !== undefined) {
        const centerLine = Math.floor((range.start + range.end) / 2)
        const padding = Math.ceil((range.end - range.start) / 2) + 50
        await viewerState.loadLinesAround(centerLine, padding)
    }
}, { deep: true })

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

function handleSearchQueryChange(query: string) {
    // Build searchable items from current lines
    const items = Object.entries(viewerState.lines.value)
        .filter(([_, content]) => content && content !== '-')
        .map(([index, content]) => ({
            index: Number(index),
            content
        }))

    search.searchInItems(items, query)
    searchRef.value?.setMatches(search.totalMatches.value)
}

function handleNavigateToMatch(matchIndex: number) {
    search.navigateToMatch(matchIndex)
    const match = search.currentMatch.value
    if (match) {
        // Scroll line into view first (instant, no animation)
        scrollToLine(match.itemIndex)

        // Wait for virtual scroller to render the item, then fine-tune scroll position
        setTimeout(() => {
            const currentMark = document.querySelector('.line-viewer mark.current')
            if (currentMark && scrollerRef.value) {
                const scrollerEl = scrollerRef.value.$el as HTMLElement
                const markRect = currentMark.getBoundingClientRect()
                const scrollerRect = scrollerEl.getBoundingClientRect()

                // Calculate if mark is already visible
                const isVisible = markRect.top >= scrollerRect.top &&
                    markRect.bottom <= scrollerRect.bottom

                // Only adjust scroll if mark is not fully visible
                if (!isVisible) {
                    const offset = markRect.top - scrollerRect.top - (scrollerRect.height / 2) + (markRect.height / 2)
                    scrollerEl.scrollTop += offset
                }
            }
        }, 50)
    }
}

function handleKeyDown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        isSearchOpen.value = true
    }
}

// Computed property for processed line content
const processedLines = computed(() => {
    const lines = viewerState.lines.value
    const diacriticsState = myTab.value?.bookState?.diacriticsState
    const query = search.searchQuery.value
    const currentMatch = search.currentMatch.value

    const processedLines: Record<number, string> = {}

    Object.entries(lines).forEach(([index, line]) => {
        if (!line || line === '\u00A0') {
            processedLines[Number(index)] = line
            return
        }

        let processedLine = line

        // Apply diacritics filtering
        if (diacriticsState && diacriticsState > 0) {
            processedLine = applyDiacriticsFilter(processedLine, diacriticsState)
        }

        // Apply search highlighting
        if (query) {
            const currentOccurrence = currentMatch?.itemIndex === Number(index) ? currentMatch.occurrence : -1
            processedLine = search.highlightMatches(processedLine, query, currentOccurrence)
        }

        processedLines[Number(index)] = processedLine
    })

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

let scrollUpdateTimeout: number | null = null

// Load book when bookId changes
watch(() => myTab.value?.bookState?.bookId, async (bookId, oldBookId) => {
    if (bookId && bookId !== oldBookId) {
        const initialLineIndex = myTab.value?.bookState?.initialLineIndex
        const isRestore = oldBookId === undefined && initialLineIndex !== undefined
        await viewerState.loadBook(bookId, isRestore, initialLineIndex)
        await nextTick()
        emit('placeholdersReady')

        // Restore scroll position
        const targetScrollPosition = myTab.value?.bookState?.scrollPosition
        if (targetScrollPosition !== undefined) {
            setTimeout(() => {
                if (scrollerRef.value) {
                    scrollerRef.value.scrollTop = targetScrollPosition
                    updateVisibleRange()
                }
            }, 150)
        } else if (initialLineIndex !== undefined) {
            setTimeout(() => {
                scrollToLine(initialLineIndex)
            }, 150)
        }
    }
}, { immediate: true })

watch(() => myTab.value?.bookState?.isTocOpen, (isTocOpen) => {
    viewerState.setBufferingMode(isTocOpen || false)
})

watch(() => myTab.value?.bookState?.isTocOpen, (isTocOpen) => {
    viewerState.setBufferingMode(isTocOpen || false)
})

// Restore scroll when tab becomes active
watch(() => myTab.value?.isActive, async (isActive, wasActive) => {
    const bookId = myTab.value?.bookState?.bookId
    const targetLineIndex = myTab.value?.bookState?.scrollLineIndex
    const targetScrollPosition = myTab.value?.bookState?.scrollPosition

    if (isActive && !wasActive && bookId && viewerState.totalLines.value > 0 && targetScrollPosition !== undefined) {
        setTimeout(() => {
            if (scrollerRef.value) {
                scrollerRef.value.scrollTop = targetScrollPosition
                updateVisibleRange()
            }
        }, 150)
    }
})

function handleScrollDebounced() {
    if (!scrollerRef.value) return

    // Update visible range immediately
    updateVisibleRange()

    if (scrollUpdateTimeout !== null) {
        clearTimeout(scrollUpdateTimeout)
    }
    scrollUpdateTimeout = window.setTimeout(() => {
        if (!scrollerRef.value) return

        const scrollTop = scrollerRef.value.scrollTop

        if (myTab.value?.bookState) {
            myTab.value.bookState.scrollPosition = scrollTop
        }
    }, 300)
}

function scrollToLine(lineIndex: number) {
    if (!scrollerRef.value) return

    // Find the line element and scroll to it
    const lineElement = scrollerRef.value.querySelector(`[data-line-index="${lineIndex}"]`)
    if (lineElement) {
        lineElement.scrollIntoView({ behavior: 'auto', block: 'start' })

        // If search is open, add offset to prevent search bar from covering result
        if (isSearchOpen.value) {
            nextTick(() => {
                if (scrollerRef.value) {
                    scrollerRef.value.scrollTop = Math.max(0, scrollerRef.value.scrollTop - 60)
                }
            })
        }
    }
}



async function handleTocSelection(lineIndex: number) {
    await viewerState.handleTocSelection(lineIndex)

    // Scroll immediately (even if placeholder)
    await nextTick()
    scrollToLine(lineIndex)
}



// Set up contained selection behavior
const containerRef = computed(() => (scrollerRef.value?.$el as HTMLElement) || null)
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







onMounted(() => {
    updateVisibleRange()
})

onUnmounted(() => {
    viewerState.cleanup()
})

defineExpose({
    handleTocSelection
})
</script>

<style scoped>
.line-viewer.scroller {
    padding: 25px 15px;
    font-size: var(--font-size, 100%);
}

.lines-container {
    padding: 25px 15px;
}
</style>
