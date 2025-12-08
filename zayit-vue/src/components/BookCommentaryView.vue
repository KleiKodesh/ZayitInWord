<template>
    <div class="commentary-view">
        <div class="commentary-header">
            <div class="commentary-title">קשרים</div>
            <div class="commentary-navigation"
                 v-if="linkGroups.length > 0">

                <div class="group-selector-wrapper">
                    <input type="text"
                           class="group-selector-input"
                           v-model="searchText"
                           @input="onSearchInput"
                           @focus="onFocus"
                           @blur="onBlur"
                           :placeholder="currentGroupName"
                           dir="rtl" />
                    <svg class="dropdown-arrow"
                         width="12"
                         height="12"
                         viewBox="0 0 24 24"
                         fill="none"
                         stroke="currentColor"
                         stroke-width="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                    <div v-if="showDropdown && filteredGroups.length > 0"
                         class="group-dropdown">
                        <div v-for="(group, index) in filteredGroups"
                             :key="group.originalIndex"
                             class="group-option"
                             @mousedown.prevent="selectGroup(group.originalIndex)"
                             :class="{ active: group.originalIndex === currentGroupIndex }">
                            {{ group.groupName }}
                        </div>
                    </div>
                </div>

                <button class="nav-btn"
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

                <button class="nav-btn"
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
        </div>

        <div class="commentary-content"
             ref="commentaryContentRef">
            <div v-if="isLoading"
                 class="commentary-loading">
                <div class="loading-spinner"></div>
                <div>טוען קשרים...</div>
            </div>

            <div v-else-if="linkGroups.length === 0"
                 class="commentary-placeholder">
                <div class="placeholder-text">בחר שורה לצפייה בקשרים</div>
            </div>

            <div v-else
                 class="commentary-links">
                <div v-for="(group, groupIndex) in linkGroups"
                     :key="groupIndex"
                     class="commentary-group"
                     :ref="el => setGroupRef(el, groupIndex)">
                    <div class="group-header"
                         :class="{ 'clickable': group.targetBookId !== undefined }"
                         @click="handleGroupClick(group)">
                        {{ group.groupName }}
                    </div>
                    <div v-for="(link, linkIndex) in group.links"
                         :key="linkIndex"
                         class="link-item"
                         v-html="link.html"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, type ComponentPublicInstance } from 'vue'

interface LinkGroup {
    groupName: string
    targetBookId?: number
    targetLineIndex?: number
    links: Array<{ text: string; html: string }>
}

const props = withDefaults(defineProps<{
    linkGroups?: LinkGroup[]
    isLoading?: boolean
    initialGroupIndex?: number
}>(), {
    linkGroups: () => [],
    isLoading: false,
    initialGroupIndex: 0
})

const emit = defineEmits<{
    groupClick: [bookId: number, lineId: number, title: string]
    groupChange: [groupIndex: number]
}>()

function handleGroupClick(group: LinkGroup) {
    if (group.targetBookId !== undefined && group.targetLineIndex !== undefined) {
        emit('groupClick', group.targetBookId, group.targetLineIndex, group.groupName)
    }
}

// Internal state
const currentGroupIndex = ref(props.initialGroupIndex || 0)
const savedScrollPosition = ref(0)
const commentaryContentRef = ref<HTMLElement | null>(null)
const groupRefs = ref<Map<number, HTMLElement>>(new Map())
const searchText = ref('')
const showDropdown = ref(false)
const filteredGroups = ref<Array<{ groupName: string; originalIndex: number }>>([])

// Computed property for current group name
const currentGroupName = computed(() => {
    if (props.linkGroups.length > 0 && currentGroupIndex.value < props.linkGroups.length) {
        const group = props.linkGroups[currentGroupIndex.value]
        return group ? group.groupName : ''
    }
    return ''
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
    if (!commentaryContentRef.value || props.linkGroups.length === 0 || groupRefs.value.size === 0) return

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
        emit('groupChange', activeIndex)
    }
}

// Navigation functions
const previousGroup = () => {
    if (currentGroupIndex.value > 0) {
        currentGroupIndex.value--
        emit('groupChange', currentGroupIndex.value)
        scrollToGroup(currentGroupIndex.value)
    }
}

const nextGroup = () => {
    if (currentGroupIndex.value < props.linkGroups.length - 1) {
        currentGroupIndex.value++
        emit('groupChange', currentGroupIndex.value)
        scrollToGroup(currentGroupIndex.value)
    }
}

// Search functionality
const onSearchInput = () => {
    const search = searchText.value.trim().toLowerCase()

    if (search === '') {
        filteredGroups.value = props.linkGroups.map((group, index) => ({
            groupName: group.groupName,
            originalIndex: index
        }))
    } else {
        const searchWords = search.split(/\s+/).filter(word => word.length > 0)
        filteredGroups.value = props.linkGroups
            .map((group, index) => ({
                groupName: group.groupName,
                originalIndex: index
            }))
            .filter(group => {
                const groupNameLower = group.groupName.toLowerCase()
                return searchWords.every(word => groupNameLower.includes(word))
            })
    }

    showDropdown.value = true
}

const selectGroup = (index: number) => {
    currentGroupIndex.value = index
    emit('groupChange', index)
    searchText.value = ''
    showDropdown.value = false
    scrollToGroup(index)
}

const onFocus = (event: FocusEvent) => {
    showDropdown.value = true
    const input = event.target as HTMLInputElement
    if (input) {
        input.select()
    }
}

const onBlur = () => {
    setTimeout(() => {
        showDropdown.value = false
        searchText.value = ''
    }, 200)
}

onMounted(() => {
    filteredGroups.value = props.linkGroups.map((group, index) => ({
        groupName: group.groupName,
        originalIndex: index
    }))

    if (commentaryContentRef.value) {
        commentaryContentRef.value.addEventListener('scroll', () => {
            if (commentaryContentRef.value) {
                savedScrollPosition.value = commentaryContentRef.value.scrollTop
            }
        })
    }
})

watch(() => props.linkGroups, (newGroups) => {
    filteredGroups.value = newGroups.map((group, index) => ({
        groupName: group.groupName,
        originalIndex: index
    }))

    // Restore group index if valid
    if (props.initialGroupIndex !== undefined && props.initialGroupIndex < newGroups.length) {
        currentGroupIndex.value = props.initialGroupIndex
        setTimeout(() => scrollToGroup(props.initialGroupIndex!), 100)
    } else {
        currentGroupIndex.value = 0
    }
}, { immediate: true })

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
.commentary-view {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--bg-primary);
    direction: rtl;
}

.commentary-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 2px 8px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    direction: rtl;
    flex-shrink: 0;
    min-height: 32px;
    position: relative;
    z-index: 10;
}

.commentary-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
}

.commentary-navigation {
    display: flex;
    align-items: center;
    gap: 3px;
    flex-shrink: 1;
    min-width: 0;
}

.nav-btn {
    width: 24px;
    height: 24px;
    background: transparent;
    border: 1px solid var(--border-color);
    border-radius: 3px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-primary);
    transition: all 0.2s ease;
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
    cursor: not-allowed;
}

.group-selector-wrapper {
    position: relative;
    flex: 1;
    min-width: 80px;
    max-width: 180px;
    display: flex;
    align-items: center;
}

.group-selector-input {
    width: 100%;
    padding: 3px 6px 3px 24px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 3px;
    color: var(--text-primary);
    font-size: 12px;
    cursor: pointer;
    direction: rtl;
    text-align: right;
    height: 24px;
    line-height: 1;
}

.group-selector-input:focus {
    outline: none;
    border-color: var(--accent-color);
    cursor: text;
}

.group-selector-input::placeholder {
    color: var(--text-primary);
    opacity: 1;
}

.dropdown-arrow {
    position: absolute;
    left: 6px;
    pointer-events: none;
    color: var(--text-secondary);
    opacity: 0.6;
    transition: transform 0.2s ease, opacity 0.2s ease;
}

.group-selector-wrapper:hover .dropdown-arrow {
    opacity: 1;
}

.group-selector-input:focus~.dropdown-arrow {
    transform: rotate(180deg);
    opacity: 1;
}

.group-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 2px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 1001;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    direction: rtl;
}

.group-option {
    padding: 5px 8px;
    cursor: pointer;
    color: var(--text-primary);
    font-size: 12px;
    text-align: right;
    transition: background 0.15s ease;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.group-option:hover {
    background: var(--hover-bg);
}

.group-option.active {
    background: var(--accent-color);
    color: white;
}

.commentary-content {
    overflow-y: auto;
    flex: 1;
    padding: 16px;
    direction: rtl;
    user-select: text !important;
}

.commentary-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 12px;
    color: var(--text-secondary);
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
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 16px;
    color: var(--text-secondary);
    opacity: 0.6;
}

.placeholder-text {
    font-size: 16px;
    font-weight: 500;
    font-family: 'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif;
    direction: rtl;
}

.commentary-links {
    display: flex;
    flex-direction: column;
    gap: 32px;
    padding-bottom: 32px;
    direction: rtl;
}

.commentary-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    direction: rtl;
}

.group-header {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 12px 0;
    padding: 8px 0;
    direction: rtl;
    font-family: var(--header-font);
    border-bottom: 2px solid var(--border-color);
}

.group-header.clickable {
    cursor: pointer;
    transition: color 0.2s ease;
}

.group-header.clickable:hover {
    color: var(--accent-color);
}

.link-item {
    color: var(--text-primary);
    font-family: var(--text-font);
    line-height: 1.6;
    direction: rtl;
    padding-block-start: 0.15em;
    padding-block-end: 0.15em;
    margin: 0;
    text-align: justify;
    display: block;
}

.link-item :deep(*) {
    user-select: text !important;
}

.link-item :deep(h1),
.link-item :deep(h2),
.link-item :deep(h3),
.link-item :deep(h4),
.link-item :deep(h5),
.link-item :deep(h6) {
    font-family: var(--header-font);
    color: var(--text-primary);
    line-height: 1.4;
    margin: 0;
    text-align: right;
}

.link-item :deep(h1) {
    font-size: 2em;
    font-weight: 700;
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
