<template>
  <div class="commentary-view">
    <div class="commentary-header">
      <div class="commentary-title">קשרים</div>
      <div class="commentary-navigation" v-if="linkGroups.length > 0">
        
        <div class="group-selector-wrapper">
          <input 
            type="text"
            class="group-selector-input"
            v-model="searchText"
            @input="onSearchInput"
            @focus="onFocus"
            @blur="onBlur"
            :placeholder="currentGroupName"
            dir="rtl"
          />
          <svg class="dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
          <div v-if="showDropdown && filteredGroups.length > 0" class="group-dropdown">
            <div 
              v-for="(group, index) in filteredGroups" 
              :key="group.originalIndex"
              class="group-option"
              @mousedown.prevent="selectGroup(group.originalIndex)"
              :class="{ active: group.originalIndex === currentGroupIndex }"
            >
              {{ group.groupName }}
            </div>
          </div>
        </div>
        
        <button 
          class="nav-btn" 
          @click="previousGroup"
          :disabled="currentGroupIndex === 0"
          title="קבוצה קודמת"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transform: scaleX(-1)">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        
        </button>

        <button 
          class="nav-btn" 
          @click="nextGroup"
          :disabled="currentGroupIndex === linkGroups.length - 1"
          title="קבוצה הבאה"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transform: scaleX(-1)">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
    </div>
    
    <div class="commentary-content" ref="commentaryContentRef">
      <div v-if="isLoading" class="commentary-loading">
        <div class="loading-spinner"></div>
        <div>טוען קשרים...</div>
      </div>
      
      <div v-else-if="linkGroups.length === 0" class="commentary-placeholder">
        <div class="placeholder-text">בחר שורה לצפייה בקשרים</div>
      </div>
      
      <div v-else class="commentary-links">
        <div 
          v-for="(group, groupIndex) in linkGroups" 
          :key="groupIndex"
          class="commentary-group"
          :ref="el => setGroupRef(el, groupIndex)"
        >
          <div class="group-header">{{ group.groupName }}</div>
          <div 
            v-for="(link, linkIndex) in group.links" 
            :key="linkIndex" 
            class="link-item"
            v-html="link.html"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated, onDeactivated, watch, type ComponentPublicInstance } from 'vue'

interface LinkGroup {
  groupName: string
  links: Array<{ text: string; html: string }>
}

const props = defineProps<{
  linkGroups: LinkGroup[]
  isLoading: boolean
}>()

// Internal state
const currentGroupIndex = ref(0)
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
    // Temporarily disable scroll listener to prevent feedback loop
    commentaryContentRef.value.removeEventListener('scroll', handleCommentaryScroll)
    
    groupElement.scrollIntoView({ behavior: 'auto', block: 'start' })
    
    // Re-enable scroll listener immediately
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
  const containerTop = containerRect.top + 50 // Add offset for better detection
  
  let activeIndex = 0
  
  // Find the first group header that is visible or just passed
  groupRefs.value.forEach((groupElement, index) => {
    const headerRect = groupElement.getBoundingClientRect()
    
    // If header is above or at the detection point, it's the active one
    if (headerRect.top <= containerTop) {
      activeIndex = index
    }
  })
  
  // Update dropdown without triggering scroll
  if (currentGroupIndex.value !== activeIndex) {
    currentGroupIndex.value = activeIndex
  }
}

// Navigation functions - scroll to group
const previousGroup = () => {
  if (currentGroupIndex.value > 0) {
    currentGroupIndex.value--
    scrollToGroup(currentGroupIndex.value)
  }
}

const nextGroup = () => {
  if (currentGroupIndex.value < props.linkGroups.length - 1) {
    currentGroupIndex.value++
    scrollToGroup(currentGroupIndex.value)
  }
}

const onGroupChange = () => {
  // Group changed via dropdown, scroll to that group
  scrollToGroup(currentGroupIndex.value)
}

// Search functionality
const onSearchInput = () => {
  const search = searchText.value.trim().toLowerCase()
  
  if (search === '') {
    // Show all groups when search is empty
    filteredGroups.value = props.linkGroups.map((group, index) => ({
      groupName: group.groupName,
      originalIndex: index
    }))
  } else {
    // Split search into words
    const searchWords = search.split(/\s+/).filter(word => word.length > 0)
    
    // Filter groups where title contains all search words
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
  searchText.value = ''
  showDropdown.value = false
  scrollToGroup(index)
}

const onFocus = (event: FocusEvent) => {
  showDropdown.value = true
  // Select all text in the input
  const input = event.target as HTMLInputElement
  if (input) {
    input.select()
  }
}

const onBlur = () => {
  // Delay to allow click event to fire
  setTimeout(() => {
    showDropdown.value = false
    searchText.value = ''
  }, 200)
}

// Handle Ctrl+A to select only commentary content
const handleSelectAll = (event: KeyboardEvent) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
    // Check if focus is within commentary view
    const activeElement = document.activeElement
    const commentaryView = commentaryContentRef.value?.closest('.commentary-view')
    
    if (commentaryView && commentaryView.contains(activeElement)) {
      event.preventDefault()
      
      // Select all text in commentary content
      const selection = window.getSelection()
      const range = document.createRange()
      
      if (commentaryContentRef.value) {
        range.selectNodeContents(commentaryContentRef.value)
        selection?.removeAllRanges()
        selection?.addRange(range)
      }
    }
  }
}

// Prevent selection from crossing view boundaries
const handleMouseDown = (event: MouseEvent) => {
  const commentaryView = commentaryContentRef.value?.closest('.commentary-view')
  if (commentaryView && commentaryView.contains(event.target as Node)) {
    // Mark that selection started in commentary view
    ;(commentaryView as any).__selectionStarted = true
  }
}

const handleMouseUp = () => {
  const commentaryView = commentaryContentRef.value?.closest('.commentary-view')
  if (commentaryView) {
    ;(commentaryView as any).__selectionStarted = false
  }
}

const handleSelectStart = (event: Event) => {
  const commentaryView = commentaryContentRef.value?.closest('.commentary-view')
  const target = event.target as Node
  
  if (commentaryView) {
    const selectionStartedHere = (commentaryView as any).__selectionStarted
    const targetInCommentary = commentaryView.contains(target)
    
    // Prevent selection if it started in commentary but moved outside, or vice versa
    if (selectionStartedHere && !targetInCommentary) {
      event.preventDefault()
    }
  }
}

onMounted(() => {
  console.log('[CommentaryView] Mounted')
  // Initialize filtered groups
  filteredGroups.value = props.linkGroups.map((group, index) => ({
    groupName: group.groupName,
    originalIndex: index
  }))
  
  // Save scroll position on scroll
  if (commentaryContentRef.value) {
    commentaryContentRef.value.addEventListener('scroll', () => {
      if (commentaryContentRef.value) {
        savedScrollPosition.value = commentaryContentRef.value.scrollTop
        console.log('[CommentaryView] 📜 Scroll saved:', savedScrollPosition.value)
      }
    })
  }
  
  // Add Ctrl+A handler
  document.addEventListener('keydown', handleSelectAll)
  
  // Add selection boundary handlers
  document.addEventListener('mousedown', handleMouseDown)
  document.addEventListener('mouseup', handleMouseUp)
  document.addEventListener('selectstart', handleSelectStart)
})

// Watch for linkGroups changes to update filtered groups
watch(() => props.linkGroups, (newGroups) => {
  filteredGroups.value = newGroups.map((group, index) => ({
    groupName: group.groupName,
    originalIndex: index
  }))
}, { immediate: true })

// Watch for commentary content ref to become available and attach scroll listener
watch(commentaryContentRef, (newVal, oldVal) => {
  if (oldVal) {
    oldVal.removeEventListener('scroll', handleCommentaryScroll)
  }
  if (newVal) {
    newVal.addEventListener('scroll', handleCommentaryScroll)
  }
})

onActivated(() => {
  console.log('[CommentaryView] Activated, restoring scroll:', savedScrollPosition.value)
  // Restore scroll position
  if (commentaryContentRef.value && savedScrollPosition.value > 0) {
    commentaryContentRef.value.scrollTop = savedScrollPosition.value
  }
})

onDeactivated(() => {
  console.log('[CommentaryView] Deactivated')
  // Don't read scrollTop here - it's already being saved continuously by the scroll event
  // Just log the current saved value
  console.log('[CommentaryView] 📜 Scroll position at deactivate:', savedScrollPosition.value)
  
  // Remove event listeners
  document.removeEventListener('keydown', handleSelectAll)
  document.removeEventListener('mousedown', handleMouseDown)
  document.removeEventListener('mouseup', handleMouseUp)
  document.removeEventListener('selectstart', handleSelectStart)
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

.group-selector-input:focus ~ .dropdown-arrow {
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

.group-option.active:hover {
  background: var(--accent-color);
  opacity: 0.9;
}

.commentary-content {
  overflow-y: auto;
  flex: 1;
  padding: 16px;
  direction: rtl;
  user-select: text !important;
  -webkit-user-select: text !important;
  -moz-user-select: text !important;
  -ms-user-select: text !important;
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
  to { transform: rotate(360deg); }
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

.placeholder-icon {
  color: var(--text-secondary);
  opacity: 0.5;
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

/* Match BookContentView text selection */
.link-item :deep(*) {
  user-select: text !important;
  -webkit-user-select: text !important;
  -moz-user-select: text !important;
  -ms-user-select: text !important;
}

/* Match BookContentView header styles */
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
  letter-spacing: -0.02em;
}

.link-item :deep(h2) {
  font-size: 1.6em;
  font-weight: 700;
  padding: 0.7em 0 0.3em 0;
  margin-bottom: 0.4em;
  letter-spacing: -0.01em;
}

.link-item :deep(h3) {
  font-size: 1.4em;
  font-weight: 600;
  padding: 0.6em 0 0.2em 0;
  margin-bottom: 0.3em;
}

.link-item :deep(h4) {
  font-size: 1.2em;
  font-weight: 600;
  padding: 0.5em 0 0.2em 0;
  margin-bottom: 0.2em;
  color: var(--text-primary);
  opacity: 0.95;
}

.link-item :deep(h5) {
  font-size: 1.1em;
  font-weight: 600;
  padding: 0.4em 0 0.15em 0;
  margin-bottom: 0.15em;
  color: var(--text-primary);
  opacity: 0.9;
}

.link-item :deep(h6) {
  font-size: 1em;
  font-weight: 600;
  padding: 0.3em 0 0.1em 0;
  margin-bottom: 0.1em;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.9em;
}
</style>
