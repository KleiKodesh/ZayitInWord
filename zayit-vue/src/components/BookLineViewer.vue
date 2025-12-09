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

        <DynamicScroller ref="scrollerRef"
                         class="height-fill justify line-viewer scroller"
                         :items="lineItems"
                         :min-item-size="30"
                         key-field="index"
                         @scroll.passive="handleScrollDebounced">
            <template #default="{ item, index, active }">
                <DynamicScrollerItem :item="item"
                                     :active="active"
                                     :data-index="index"
                                     :size-dependencies="[
                                        processedLines[item.index]
                                    ]">
                    <BookLine :content="processedLines[item.index] || '\u00A0'"
                              :line-index="item.index"
                              :is-selected="selectedLineIndex === item.index"
                              :class="{
                                'show-selection': myTab?.bookState?.showBottomPane
                            }"
                              @line-click="handleLineClick" />
                </DynamicScrollerItem>
            </template>
        </DynamicScroller>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted, computed } from 'vue'
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
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
const scrollerRef = ref<InstanceType<typeof DynamicScroller> | null>(null)
const searchRef = ref<InstanceType<typeof GenericSearch> | null>(null)

// Create items array for virtual scroller
const lineItems = computed(() => {
    const total = viewerState.totalLines.value
    return Array.from({ length: total }, (_, i) => ({ index: i }))
})

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

        // Restore scroll position with retry
        const targetScrollPosition = myTab.value?.bookState?.scrollPosition
        if (targetScrollPosition !== undefined) {
            const restoreScroll = () => {
                const scrollerEl = scrollerRef.value?.$el as HTMLElement
                if (scrollerEl) {
                    scrollerEl.scrollTop = targetScrollPosition
                    // Verify and retry if needed
                    setTimeout(() => {
                        if (scrollerEl.scrollTop !== targetScrollPosition) {
                            scrollerEl.scrollTop = targetScrollPosition
                        }
                    }, 100)
                }
            }

            await nextTick()
            await nextTick()
            restoreScroll()
        } else if (initialLineIndex !== undefined) {
            await nextTick()
            await nextTick()
            scrollToLine(initialLineIndex)
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
        await nextTick()
        await nextTick()

        const scrollerEl = scrollerRef.value?.$el as HTMLElement
        if (scrollerEl) {
            scrollerEl.scrollTop = targetScrollPosition
            // Verify and retry if needed
            setTimeout(() => {
                if (scrollerEl.scrollTop !== targetScrollPosition) {
                    scrollerEl.scrollTop = targetScrollPosition
                }
            }, 100)
        }
    }
})

function handleScrollDebounced() {
    if (!scrollerRef.value) return

    if (scrollUpdateTimeout !== null) {
        clearTimeout(scrollUpdateTimeout)
    }
    scrollUpdateTimeout = window.setTimeout(() => {
        const scrollerEl = scrollerRef.value?.$el as HTMLElement
        if (!scrollerEl) return

        const scrollTop = scrollerEl.scrollTop

        if (myTab.value?.bookState) {
            myTab.value.bookState.scrollPosition = scrollTop
        }
    }, 300)
}

function scrollToLine(lineIndex: number) {
    if (!scrollerRef.value) return
    const scroller = scrollerRef.value as any
    scroller.scrollToItem(lineIndex)

    // If search is open, add offset to prevent search bar from covering result
    if (isSearchOpen.value) {
        nextTick(() => {
            const el = scrollerRef.value?.$el as HTMLElement
            if (el) {
                el.scrollTop = Math.max(0, el.scrollTop - 60)
            }
        })
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

.line-viewer.scroller :deep(.vue-recycle-scroller__item-wrapper) {
    overflow: visible;
}
</style>
