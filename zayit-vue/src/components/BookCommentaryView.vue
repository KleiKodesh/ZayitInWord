<template>
    <div class="flex-column height-fill">
        <div class="flex-between bar commentary-header">
            <span class="bold smaller-em commentary-title">קשרים</span>

            <div class="flex-row flex-center commentary-navigation"
                 v-if="linkGroups.length > 0">

                <Combobox v-model="currentGroupIndex"
                          :options="groupOptions"
                          :placeholder="currentGroupName"
                          dir="rtl" />

                <button class="flex-center c-pointer nav-btn"
                        @click="previousGroup"
                        :disabled="currentGroupIndex === 0"
                        title="קבוצה קודמת">
                    <svg width="16"
                         height="16"
                         viewBox="0 0 24 24"
                         fill="none"
                         stroke="currentColor"
                         stroke-width="2"
                         style="transform: scaleX(-1)">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>

                </button>

                <button class="flex-center c-pointer nav-btn"
                        @click="nextGroup"
                        :disabled="currentGroupIndex === linkGroups.length - 1"
                        title="קבוצה הבאה">
                    <svg width="16"
                         height="16"
                         viewBox="0 0 24 24"
                         fill="none"
                         stroke="currentColor"
                         stroke-width="2"
                         style="transform: scaleX(-1)">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
            </div>

            <button class="flex-center c-pointer commentary-close-btn"
                    @click="handleClose"
                    title="סגור פאנל">
                -
            </button>
        </div>

        <div class="overflow-y flex-110 selectable commentary-content"
             ref="commentaryContentRef">
            <div v-if="isLoading"
                 class="flex-column flex-center height-fill text-secondary commentary-loading">
                <div class="loading-spinner"></div>
                <div>טוען קשרים...</div>
            </div>

            <div v-else-if="linkGroups.length === 0"
                 class="flex-column flex-center height-fill text-secondary commentary-placeholder">
                <div class="bold placeholder-text">בחר שורה לצפייה בקשרים</div>
            </div>

            <div v-else
                 class="flex-column commentary-links">
                <div v-for="(group, groupIndex) in linkGroups"
                     :key="groupIndex"
                     class="flex-column commentary-group"
                     :ref="el => setGroupRef(el, groupIndex)">
                    <div class="bold group-header"
                         :class="{ 'c-pointer': group.targetBookId !== undefined }"
                         @click="handleGroupClick(group)">
                        {{ group.groupName }}
                    </div>
                    <div v-for="(link, linkIndex) in group.links"
                         :key="linkIndex"
                         class="selectable line-1.6 justify link-item"
                         v-html="link.html"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, type ComponentPublicInstance } from 'vue'
import Combobox, { type ComboboxOption } from './common/Combobox.vue'
import { useContainedSelection } from '../composables/useContainedSelection'
import { commentaryManager, type CommentaryLinkGroup } from '../data/commentaryManager'
import { useTabStore } from '../stores/tabStore'

const props = withDefaults(defineProps<{
    bookId?: number
    selectedLineIndex?: number
}>(), {
    bookId: undefined,
    selectedLineIndex: undefined
})

const emit = defineEmits<{
    clearOtherSelections: []
}>()

const tabStore = useTabStore()

// Commentary state
const linkGroups = ref<CommentaryLinkGroup[]>([])
const isLoading = ref(false)

// Load commentary when props change
watch([() => props.bookId, () => props.selectedLineIndex], async ([bookId, lineIndex]) => {
    if (bookId !== undefined && lineIndex !== undefined) {
        await loadCommentaryLinks(bookId, lineIndex)
    }
}, { immediate: true })

async function loadCommentaryLinks(bookId: number, lineIndex: number) {
    isLoading.value = true
    try {
        linkGroups.value = await commentaryManager.loadCommentaryLinks(
            bookId,
            lineIndex,
            tabStore.activeTab?.id?.toString() || ''
        )

        // Restore saved group index if valid
        const savedGroupIndex = tabStore.activeTab?.bookState?.commentaryGroupIndex
        if (savedGroupIndex !== undefined && savedGroupIndex < linkGroups.value.length) {
            currentGroupIndex.value = savedGroupIndex
        }
    } catch (error) {
        console.error('❌ Failed to load commentary links:', error)
        linkGroups.value = []
    } finally {
        isLoading.value = false
    }
}

function handleGroupClick(group: CommentaryLinkGroup) {
    if (group.targetBookId !== undefined && group.targetLineIndex !== undefined) {
        // Create a new tab first
        tabStore.addTab()
        // Then open the book in the new tab with the initial line index
        tabStore.openBook(group.groupName, group.targetBookId, undefined, group.targetLineIndex)
    }
}

function handleClose() {
    // Close the bottom pane by updating tab state directly
    const activeTab = tabStore.activeTab
    if (activeTab?.bookState) {
        activeTab.bookState.showBottomPane = false
    }
}

// Internal state
const currentGroupIndex = ref(0)
const savedScrollPosition = ref(0)
const commentaryContentRef = ref<HTMLElement | null>(null)
const groupRefs = ref<Map<number, HTMLElement>>(new Map())

// Computed property for current group name
const currentGroupName = computed(() => {
    if (linkGroups.value.length > 0 && currentGroupIndex.value < linkGroups.value.length) {
        const group = linkGroups.value[currentGroupIndex.value]
        return group ? group.groupName : ''
    }
    return ''
})

// Computed property for combobox options
const groupOptions = computed<ComboboxOption[]>(() => {
    return linkGroups.value.map((group, index) => ({
        label: group.groupName,
        value: index
    }))
})

// Set group ref for scrolling
const setGroupRef = (el: Element | ComponentPublicInstance | null, index: number) => {
    if (el && el instanceof HTMLElement) {
        groupRefs.value.set(index, el)
    }
}

// Scroll to specific group
const scrollToGroup = (index: number) => {
    const groupElement = groupRefs.value.get(index)
    if (groupElement && commentaryContentRef.value) {
        commentaryContentRef.value.removeEventListener('scroll', handleCommentaryScroll)
        groupElement.scrollIntoView({ behavior: 'auto', block: 'start' })
        setTimeout(() => {
            if (commentaryContentRef.value) {
                commentaryContentRef.value.addEventListener('scroll', handleCommentaryScroll)
            }
        }, 50)
    }
}

// Handle commentary scroll to update dropdown
const handleCommentaryScroll = () => {
    if (!commentaryContentRef.value || linkGroups.value.length === 0 || groupRefs.value.size === 0) return

    const containerRect = commentaryContentRef.value.getBoundingClientRect()
    const containerTop = containerRect.top + 50

    let activeIndex = 0
    groupRefs.value.forEach((groupElement, index) => {
        const headerRect = groupElement.getBoundingClientRect()
        if (headerRect.top <= containerTop) {
            activeIndex = index
        }
    })

    if (currentGroupIndex.value !== activeIndex) {
        currentGroupIndex.value = activeIndex
        saveGroupIndexToTab()
    }
}

// Navigation functions
const previousGroup = () => {
    if (currentGroupIndex.value > 0) {
        currentGroupIndex.value--
        saveGroupIndexToTab()
        scrollToGroup(currentGroupIndex.value)
    }
}

const nextGroup = () => {
    if (currentGroupIndex.value < linkGroups.value.length - 1) {
        currentGroupIndex.value++
        saveGroupIndexToTab()
        scrollToGroup(currentGroupIndex.value)
    }
}

// Set up contained selection behavior
const { clearSelection } = useContainedSelection(commentaryContentRef, {
    handleSelectAll: true,
    preventSelectionSpanning: true,
    onSelectionStart: () => {
        emit('clearOtherSelections')
    }
})





onMounted(() => {
    if (commentaryContentRef.value) {
        commentaryContentRef.value.addEventListener('scroll', () => {
            if (commentaryContentRef.value) {
                savedScrollPosition.value = commentaryContentRef.value.scrollTop
            }
        })
    }
})

// Save group index to tab state
function saveGroupIndexToTab() {
    const activeTab = tabStore.activeTab
    if (activeTab?.bookState) {
        activeTab.bookState.commentaryGroupIndex = currentGroupIndex.value
    }
}

// Reset group index when new commentary loads
watch(() => linkGroups.value, () => {
    currentGroupIndex.value = 0
    saveGroupIndexToTab()
}, { immediate: true })

watch(currentGroupIndex, (newIndex) => {
    saveGroupIndexToTab()
    scrollToGroup(newIndex)
})

watch(commentaryContentRef, (newVal, oldVal) => {
    if (oldVal) {
        oldVal.removeEventListener('scroll', handleCommentaryScroll)
    }
    if (newVal) {
        newVal.addEventListener('scroll', handleCommentaryScroll)
    }
})
</script>

<style scoped>
.commentary-header {
    justify-content: space-between;
    padding: 0 15px 5px 5px;
}

.commentary-navigation {
    gap: 3px;
}

.nav-btn {
    width: 24px;
    height: 24px;
    background: transparent;
    border: 1px solid var(--border-color);
    border-radius: 3px;
    color: var(--text-primary);
    flex-shrink: 0;
    padding: 0;
}

.nav-btn svg {
    width: 14px;
    height: 14px;
}

.nav-btn:hover:not(:disabled) {
    background: var(--hover-bg);
    border-color: var(--accent-color);
}

.nav-btn:disabled {
    opacity: 0.3;
}

.commentary-content {
    padding: 16px;
    direction: rtl;
}

.commentary-loading {
    gap: 12px;
    direction: rtl;
}

.loading-spinner {
    width: 24px;
    height: 24px;
    border: 3px solid var(--border-color);
    border-top-color: var(--accent-color);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.commentary-placeholder {
    gap: 16px;
    opacity: 0.6;
}

.placeholder-text {
    font-size: 16px;
    font-family: 'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif;
    direction: rtl;
}

.commentary-links {
    gap: 32px;
    padding-bottom: 32px;
    direction: rtl;
}

.commentary-group {
    gap: 8px;
    direction: rtl;
}

.group-header {
    font-size: 18px;
    color: var(--text-primary);
    margin: 0 0 12px 0;
    padding: 8px 0;
    direction: rtl;
    font-family: var(--header-font);
    border-bottom: 2px solid var(--border-color);
}

.group-header.c-pointer:hover {
    color: var(--accent-color);
}

.link-item {
    color: var(--text-primary);
    font-family: var(--text-font);
    direction: rtl;
    padding-block-start: 0.15em;
    padding-block-end: 0.15em;
    margin: 0;
    display: block;
}

.link-item :deep(h1),
.link-item :deep(h2),
.link-item :deep(h3),
.link-item :deep(h4),
.link-item :deep(h5),
.link-item :deep(h6) {
    font-family: var(--header-font);
    color: var(--text-primary);
    margin: 0;
    text-align: right;
}

.link-item :deep(h1) {
    font-size: 2em;
    padding: 0.8em 0 0.4em 0;
    margin-bottom: 0.5em;
    border-bottom: 1px solid var(--border-color);
}

.link-item :deep(h2) {
    font-size: 1.6em;
    font-weight: 700;
    padding: 0.7em 0 0.3em 0;
    margin-bottom: 0.4em;
}

.link-item :deep(h3) {
    font-size: 1.4em;
    font-weight: 600;
    padding: 0.6em 0 0.2em 0;
    margin-bottom: 0.3em;
}
</style>
