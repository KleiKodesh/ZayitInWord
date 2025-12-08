<template>
  <div class="flex-column height-fill book-view-wrapper">

    <BookTocTreeView v-if="myTab?.bookState?.isTocOpen"
                     :toc-entries="tocEntries"
                     :is-loading="isTocLoading || !isPlaceholdersReady"
                     class="toc-overlay"
                     @select-line="handleTocSelection" />

    <BookViewSplitPane v-if="myTab?.bookState?.bookId"
                       :show-bottom="myTab.bookState.showBottomPane || false">
      <template #top>
        <BookLineViewer ref="lineViewerRef"
                        :book-id="myTab.bookState.bookId"
                        :initial-line-index="myTab.bookState.initialLineIndex"
                        :selected-line-index="myTab.bookState.selectedLineIndex"
                        :is-active="myTab.isActive"
                        :is-toc-open="myTab.bookState.isTocOpen || false"
                        class="flex-110"
                        @update-scroll-position="handleScrollUpdate"
                        @placeholders-ready="isPlaceholdersReady = true"
                        @line-click="handleLineClick" />
      </template>
      <template #bottom>
        <BookCommentaryView :link-groups="linkGroups"
                            :is-loading="isCommentaryLoading"
                            :initial-group-index="myTab.bookState.commentaryGroupIndex"
                            @group-click="handleGroupClick"
                            @group-change="handleGroupChange" />
      </template>
    </BookViewSplitPane>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useTabStore } from '../../stores/tabStore'
import { storeToRefs } from 'pinia'
import { getToc, getLinks, getLineId } from '../../data/sqliteDb'
import { buildTocFromFlat } from '../../data/tocBuilder'
import type { TocEntry } from '../../types/BookToc'
import BookTocTreeView from '../BookTocTreeView.vue' // This line is already correct
import BookLineViewer from '../BookLineViewer.vue'
import BookViewSplitPane from '../BookViewSplitPane.vue'
import BookCommentaryView from '../BookCommentaryView.vue'

const tabStore = useTabStore()
const { activeTab } = storeToRefs(tabStore)

const myTabId = ref<number | undefined>(activeTab.value?.id)
const myTab = computed(() => tabStore.tabs.find(t => t.id === myTabId.value))

const tocEntries = ref<TocEntry[]>([])
const isTocLoading = ref(false)
const lineViewerRef = ref<InstanceType<typeof BookLineViewer> | null>(null)
const isPlaceholdersReady = ref(false)

// Commentary state
interface LinkGroup {
  groupName: string
  targetBookId?: number
  targetLineIndex?: number
  links: Array<{ text: string; html: string }>
}
const linkGroups = ref<LinkGroup[]>([])
const isCommentaryLoading = ref(false)

// Load TOC when bookId changes
watch(() => myTab.value?.bookState?.bookId, async (bookId, oldBookId) => {
  if (bookId && bookId !== oldBookId) {
    isPlaceholdersReady.value = false
    await loadToc(bookId)

    // Restore commentary if we have a saved selected line (for session restore)
    const savedLineIndex = myTab.value?.bookState?.selectedLineIndex
    if (savedLineIndex !== undefined) {
      loadCommentaryLinks(bookId, savedLineIndex)
    }
  }
}, { immediate: true })

// Watch for when this tab becomes active - restore commentary
watch(() => myTab.value?.isActive, (isActive, wasActive) => {
  if (isActive && !wasActive && myTab.value?.bookState) {
    // Tab became active - restore commentary if we have a saved selected line
    const savedLineIndex = myTab.value.bookState.selectedLineIndex
    const bookId = myTab.value.bookState.bookId
    if (savedLineIndex !== undefined && bookId) {
      loadCommentaryLinks(bookId, savedLineIndex)
    }
  }
})

async function loadToc(bookId: number) {
  isTocLoading.value = true
  try {
    const { tocEntriesFlat } = await getToc(bookId)
    const { tree } = buildTocFromFlat(tocEntriesFlat)
    tocEntries.value = tree
  } catch (error) {
    console.error('❌ Failed to load TOC:', error)
    tocEntries.value = []
  } finally {
    isTocLoading.value = false
  }
}

function handleScrollUpdate(lineIndex: number) {
  if (myTab.value?.bookState) {
    myTab.value.bookState.initialLineIndex = lineIndex
  }
}

function handleTocSelection(lineIndex: number) {
  lineViewerRef.value?.handleTocSelection(lineIndex)
}

// Handle line click to load commentary
function handleLineClick(lineIndex: number) {
  const bookId = myTab.value?.bookState?.bookId
  if (bookId) {
    // Save selected line to tab state
    if (myTab.value?.bookState) {
      myTab.value.bookState.selectedLineIndex = lineIndex
    }
    loadCommentaryLinks(bookId, lineIndex)
  }
}

// Handle commentary group click to open linked book in new tab
function handleGroupClick(bookId: number, lineId: number, title: string) {
  // Create a new tab first
  tabStore.addTab()
  // Then open the book in the new tab with the initial line index
  tabStore.openBook(title, bookId, undefined, lineId)
}

// Handle commentary group change to save state
function handleGroupChange(groupIndex: number) {
  if (myTab.value?.bookState) {
    myTab.value.bookState.commentaryGroupIndex = groupIndex
  }
}

// Load commentary links from database
async function loadCommentaryLinks(bookId: number, lineIndex: number) {
  isCommentaryLoading.value = true
  try {
    // Get the actual line ID from the database
    const lineId = await getLineId(bookId, lineIndex)
    if (!lineId) {
      console.warn(`No line ID found for book ${bookId}, lineIndex ${lineIndex}`)
      linkGroups.value = []
      isCommentaryLoading.value = false
      return
    }

    const links = await getLinks(lineId)

    // Group links by title and store first targetBookId/lineIndex
    const grouped = new Map<string, {
      links: Array<{ text: string; html: string }>,
      targetBookId?: number,
      targetLineIndex?: number
    }>()

    links.forEach(link => {
      const groupName = link.title || 'אחר'
      if (!grouped.has(groupName)) {
        grouped.set(groupName, {
          links: [],
          targetBookId: link.targetBookId,
          targetLineIndex: link.lineIndex
        })
      }
      grouped.get(groupName)!.links.push({
        text: link.content || '',
        html: link.content || ''
      })
    })

    // Convert to array format
    linkGroups.value = Array.from(grouped.entries()).map(([groupName, data]) => ({
      groupName,
      targetBookId: data.targetBookId,
      targetLineIndex: data.targetLineIndex,
      links: data.links
    }))

    console.log(`✅ Loaded ${linkGroups.value.length} link groups with ${links.length} total links`)
  } catch (error) {
    console.error('❌ Failed to load commentary links:', error)
    linkGroups.value = []
  } finally {
    isCommentaryLoading.value = false
  }
}
</script>

<style scoped>
.book-view-wrapper {
  position: relative;
}

.toc-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
}
</style>
