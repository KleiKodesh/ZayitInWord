<template>
  <div class="tab-header" :class="{ open: isDropdownOpen }" @click="emit('toggleDropdown')">
    <div class="header-actions">
      <!-- Settings button: hidden when more options dropdown is visible -->
      <button 
        v-if="!(showTocButton || isInUserControl)"
        class="settings-toggle-btn" 
        @click.stop="toggleSettings" 
        title="הגדרות"
      >
        <img src="/assets/ic_fluent_settings_24_regular.png" alt="Settings" class="settings-icon themed-icon" />
      </button>

      <!-- Buttons visible on larger screens -->
      <button 
        v-if="showTocButton"
        class="diacritics-toggle-btn desktop-only" 
        @click.stop="toggleDiacritics" 
        :class="diacriticsStateClass"
        :title="diacriticsTitle"
      >
        <span class="diacritics-icon">{{ diacriticsIcon }}</span>
      </button>
      <button 
        v-if="showTocButton"
        class="line-display-toggle-btn desktop-only" 
        @click.stop="toggleLineDisplay" 
        :class="{ active: isLineDisplayInline }"
        title="החלף תצוגת שורות"
      >
        <img 
          v-if="isLineDisplayInline"
          src="/assets/ic_fluent_text_align_right_24_regular.png" 
          alt="Line Display" 
          class="line-display-icon themed-icon" 
        />
        <img 
          v-else
          src="/assets/ic_fluent_text_align_justify_24_regular.png" 
          alt="Line Display" 
          class="line-display-icon themed-icon" 
        />
      </button>
      
      <!-- More options dropdown button (only on mobile in book view) -->
      <div class="more-options-container mobile-only" v-if="showTocButton || isInUserControl">
        <button 
          class="more-options-btn" 
          @click.stop="toggleMoreOptions"
          title="אפשרויות נוספות"
        >
          <svg class="more-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="5" r="2" fill="currentColor"/>
            <circle cx="12" cy="12" r="2" fill="currentColor"/>
            <circle cx="12" cy="19" r="2" fill="currentColor"/>
          </svg>
        </button>

        <!-- Dropdown menu -->
        <div v-if="isMoreOptionsOpen" class="more-options-dropdown">
          <button 
            v-if="showTocButton"
            class="dropdown-item" 
            @click.stop="handleDiacriticsClick"
            :class="diacriticsStateClass"
          >
            <span class="dropdown-icon diacritics-icon">{{ diacriticsIcon }}</span>
            <span class="dropdown-label">{{ diacriticsTitle }}</span>
          </button>
          
          <button 
            v-if="showTocButton"
            class="dropdown-item" 
            @click.stop="handleLineDisplayClick"
            :class="{ active: isLineDisplayInline }"
          >
            <img 
              v-if="isLineDisplayInline"
              src="/assets/ic_fluent_text_align_right_24_regular.png" 
              alt="Line Display" 
              class="dropdown-icon line-display-icon themed-icon" 
            />
            <img 
              v-else
              src="/assets/ic_fluent_text_align_justify_24_regular.png" 
              alt="Line Display" 
              class="dropdown-icon line-display-icon themed-icon" 
            />
            <span class="dropdown-label">החלף תצוגת שורות</span>
          </button>
          
          <button 
            v-if="isInUserControl"
            class="dropdown-item" 
            @click.stop="handlePopOutClick"
          >
            <svg class="dropdown-icon popout-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 4H18C18.5304 4 19.0391 4.21071 19.4142 4.58579C19.7893 4.96086 20 5.46957 20 6V10M10 14L20 4M8 4H4V20H20V16" 
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="dropdown-label">{{ isPopOut ? 'חזור לחלון ראשי' : 'פתח בחלון נפרד' }}</span>
          </button>
          
          <button 
            class="dropdown-item" 
            @click.stop="handleSettingsClick"
          >
            <img src="/assets/ic_fluent_settings_24_regular.png" alt="Settings" class="dropdown-icon settings-icon themed-icon" />
            <span class="dropdown-label">הגדרות</span>
          </button>
        </div>
      </div>

      <!-- TOC button always visible when applicable -->
      <button 
        v-if="showTocButton"
        class="toc-toggle-btn" 
        @click.stop="toggleToc" 
        :class="{ active: isTocVisible }"
        title="תוכן עניינים"
      >
        <img src="/assets/ic_fluent_text_bullet_list_tree_24_regular.png" alt="TOC" class="toc-icon themed-icon rtl-flip" />
      </button>

      <button 
        v-if="isInUserControl"
        class="popout-toggle-btn desktop-only" 
        @click.stop="togglePopOut" 
        :title="isPopOut ? 'חזור לחלון ראשי' : 'פתח בחלון נפרד'"
      >
        <svg class="popout-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 4H18C18.5304 4 19.0391 4.21071 19.4142 4.58579C19.7893 4.96086 20 5.46957 20 6V10M10 14L20 4M8 4H4V20H20V16" 
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

    </div>

    <div class="tab-header-center">
      <span class="tab-header-icon">▼</span>
      <span class="tab-header-text">{{ headerText }}</span>
    </div>

    <div class="header-actions-right">
      <button class="add-tab-btn" @click.stop="handleNewTab" title="כרטיסייה חדשה">+</button>
      <button class="close-tab-btn" @click.stop="handleCloseTab" title="סגור כרטיסייה">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useTabsStore } from '../stores/tabs'
import { useTocStore } from '../stores/toc'

const props = defineProps<{ isDropdownOpen: boolean }>()
const emit = defineEmits<{ 
  toggleDropdown: []
  toggleSettings: []
}>()
const isDropdownOpen = computed(() => props.isDropdownOpen)
const tabsStore = useTabsStore()
const tocStore = useTocStore()
const headerText = computed(() => tabsStore.activeTab?.title || 'כרטיסייה חדשה')

// Show TOC button only for book tabs
const showTocButton = computed(() => tabsStore.activeTab?.type === 'book')
const isTocVisible = computed(() => tocStore.isVisible)

// Store diacritics state per tab in memory (not persisted)
// Use reactive ref to trigger updates
const diacriticsStates = ref(new Map<string, { state: number; originalHtml: string | null }>())

const getDiacriticsState = (tabId: string) => {
  if (!diacriticsStates.value.has(tabId)) {
    diacriticsStates.value.set(tabId, { state: 0, originalHtml: null })
  }
  return diacriticsStates.value.get(tabId)!
}

// Store line display state per tab (false = block, true = inline)
const lineDisplayStates = ref(new Map<string, boolean>())

const getLineDisplayState = (tabId: string) => {
  if (!lineDisplayStates.value.has(tabId)) {
    lineDisplayStates.value.set(tabId, false) // Default to block
  }
  return lineDisplayStates.value.get(tabId)!
}

const isLineDisplayInline = computed(() => {
  if (!tabsStore.activeTab) return false
  return getLineDisplayState(tabsStore.activeTab.id)
})

const diacriticsState = computed(() => {
  if (!tabsStore.activeTab) return 0
  return getDiacriticsState(tabsStore.activeTab.id).state
})

const diacriticsStateClass = computed(() => {
  if (diacriticsState.value === 1) return 'state-1'
  if (diacriticsState.value === 2) return 'state-2'
  return ''
})

const diacriticsIcon = computed(() => {
  if (diacriticsState.value === 1) return 'א̇'  // With cantillation mark
  if (diacriticsState.value === 2) return 'א'   // Plain letter
  return 'אָ֑'  // With both nikkud and cantillation
})

const diacriticsTitle = computed(() => {
  if (diacriticsState.value === 0) return 'הסר טעמים'
  if (diacriticsState.value === 1) return 'הסר גם ניקוד'
  return 'שחזר טעמים וניקוד'
})

const handleNewTab = () => {
  tabsStore.createTab()
  if (isDropdownOpen.value) {
    emit('toggleDropdown')
  }
}

const handleCloseTab = () => {
  if (tabsStore.activeTab) {
    tabsStore.closeTab(tabsStore.activeTab.id)
  }
  if (isDropdownOpen.value) {
    emit('toggleDropdown')
  }
}

const toggleToc = () => {
  const activeTab = tabsStore.activeTab
  if (!activeTab || activeTab.type !== 'book' || !activeTab.bookId) return
  
  // If opening TOC, request data first if needed
  if (!tocStore.isVisible) {
    tocStore.requestToc(activeTab.bookId)
  }
  
  tocStore.toggleToc()
  
  if (isDropdownOpen.value) {
    emit('toggleDropdown')
  }
}

const toggleLineDisplay = () => {
  const activeTab = tabsStore.activeTab
  if (!activeTab || activeTab.type !== 'book') return

  const contentContainer = document.querySelector(`.content-container[data-tab-id="${activeTab.id}"]`)
  if (!contentContainer) return

  // Toggle state
  const currentState = getLineDisplayState(activeTab.id)
  const newState = !currentState
  lineDisplayStates.value.set(activeTab.id, newState)

  // Apply CSS change to all line elements
  const lines = Array.from(contentContainer.querySelectorAll('line:not(:has(h1, h2, h3, h4, h5, h6))'))
  
  // Process in chunks to avoid blocking UI
  const CHUNK_SIZE = 500
  let currentIndex = 0
  
  const processChunk = () => {
    const endIndex = Math.min(currentIndex + CHUNK_SIZE, lines.length)
    
    for (let i = currentIndex; i < endIndex; i++) {
      const lineElement = lines[i] as HTMLElement
      if (newState) {
        // Inline mode: add margin-left
        lineElement.style.display = 'inline'
        lineElement.style.marginLeft = '0.2em'
      } else {
        // Block mode: remove margin-left
        lineElement.style.display = 'block'
        lineElement.style.marginLeft = ''
      }
    }
    
    currentIndex = endIndex
    
    // Continue processing if there are more lines
    if (currentIndex < lines.length) {
      requestAnimationFrame(processChunk)
    }
  }
  
  // Start processing
  processChunk()

  // Force reactivity update
  lineDisplayStates.value = new Map(lineDisplayStates.value)
  
  if (isDropdownOpen.value) {
    emit('toggleDropdown')
  }
}

const toggleDiacritics = () => {
  const activeTab = tabsStore.activeTab
  if (!activeTab || activeTab.type !== 'book') return

  const contentContainer = document.querySelector(`.content-container[data-tab-id="${activeTab.id}"]`)
  if (!contentContainer) return

  // Get current state from local Map
  const tabState = getDiacriticsState(activeTab.id)

  // Store original HTML on first toggle
  if (tabState.state === 0 && !tabState.originalHtml) {
    tabState.originalHtml = contentContainer.innerHTML
  }

  // Cycle through states: 0 -> 1 -> 2 -> 0
  tabState.state = (tabState.state + 1) % 3

  if (tabState.state === 0) {
    // Restore original
    if (tabState.originalHtml) {
      contentContainer.innerHTML = tabState.originalHtml
      tabState.originalHtml = null // Clear stored HTML to release memory
    }
  } else {
    // Apply filter
    applyDiacriticsFilter(contentContainer, tabState.state)
  }

  // Force reactivity update by creating a new Map reference
  diacriticsStates.value = new Map(diacriticsStates.value)
  
  if (isDropdownOpen.value) {
    emit('toggleDropdown')
  }
}

const applyDiacriticsFilter = (container: Element, state: number) => {
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

  // Process in chunks to avoid blocking UI
  const CHUNK_SIZE = 500
  let currentIndex = 0
  
  const processChunk = () => {
    const endIndex = Math.min(currentIndex + CHUNK_SIZE, textNodes.length)
    
    for (let i = currentIndex; i < endIndex; i++) {
      const textNode = textNodes[i]
      if (!textNode) continue
      
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
    }
    
    currentIndex = endIndex
    
    // Continue processing if there are more nodes
    if (currentIndex < textNodes.length) {
      requestAnimationFrame(processChunk)
    }
  }
  
  // Start processing
  processChunk()
}

const toggleSettings = () => {
  emit('toggleSettings')
  if (isDropdownOpen.value) {
    emit('toggleDropdown')
  }
}

// More options dropdown
const isMoreOptionsOpen = ref(false)

const toggleMoreOptions = () => {
  isMoreOptionsOpen.value = !isMoreOptionsOpen.value
  
  if (isDropdownOpen.value) {
    emit('toggleDropdown')
  }
}

const handleDiacriticsClick = () => {
  toggleDiacritics()
  isMoreOptionsOpen.value = false
}

const handleLineDisplayClick = () => {
  toggleLineDisplay()
  isMoreOptionsOpen.value = false
}

const handlePopOutClick = () => {
  togglePopOut()
  isMoreOptionsOpen.value = false
}

const handleSettingsClick = () => {
  toggleSettings()
  isMoreOptionsOpen.value = false
}

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.more-options-container')) {
    isMoreOptionsOpen.value = false
  }
}

// Pop-out functionality
const isInUserControl = ref(false)
const isPopOut = ref(false)

// Expose function to C# to set hosting mode
;(window as any).setHostingMode = (inUserControl: boolean) => {
  isInUserControl.value = inUserControl
  isPopOut.value = false
}

const togglePopOut = () => {
  if (window.chrome?.webview) {
    window.chrome.webview.postMessage({
      command: 'TogglePopOut',
      args: []
    })
    // Toggle state
    isPopOut.value = !isPopOut.value
  }
  
  if (isDropdownOpen.value) {
    emit('toggleDropdown')
  }
}

onMounted(() => {
  // Request hosting mode from C#
  if (window.chrome?.webview) {
    window.chrome.webview.postMessage({
      command: 'CheckHostingMode',
      args: []
    })
  }
  
  // Add click listener for closing dropdown
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  // Remove click listener
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.tab-header {
  display: flex;
  height: 48px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
  position: relative;
  cursor: pointer;
  transition: background 0.2s ease;
  direction: rtl;
  z-index: 1000;
}

.tab-header:active {
  background: var(--active-bg);
}

.tab-header-center {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
  justify-content: center;
}

.header-actions-right {
  display: flex;
  align-items: center;
  gap: 2px;
}

.tab-text-container {
  position: relative;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.tab-header-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-header-icon {
  font-size: 10px;
  color: var(--text-secondary);
  transition: transform 0.2s ease;
  flex-shrink: 0;
  opacity: 0.6;
  margin-left: 6px;
  pointer-events: none;
}

.tab-header.open .tab-header-icon {
  transform: rotate(180deg);
  opacity: 1;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  position: relative;
  z-index: 10000;
}

.toc-toggle-btn,
.line-display-toggle-btn,
.diacritics-toggle-btn {
  padding: 6px;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 4px;
  transition: all 0.1s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.toc-toggle-btn:hover,
.line-display-toggle-btn:hover,
.diacritics-toggle-btn:hover {
  background: var(--hover-bg);
  transform: scale(1.05);
}

.toc-toggle-btn.active,
.line-display-toggle-btn.active {
  background: var(--accent-bg);
}

.diacritics-toggle-btn.state-1 {
  background: rgba(255, 165, 0, 0.15);
}

.diacritics-toggle-btn.state-2 {
  background: rgba(255, 69, 0, 0.15);
}

.toc-icon {
  width: 20px;
  height: 20px;
  opacity: 0.7;
}

.line-display-icon {
  width: 16px;
  height: 16px;
  opacity: 0.7;
}

.diacritics-icon {
  font-size: 18px;
  font-family: 'Times New Roman', Times, serif;
  color: var(--text-primary);
  opacity: 0.7;
  transition: opacity 0.2s ease, color 0.2s ease;
  user-select: none;
}

.toc-toggle-btn:hover .toc-icon,
.line-display-toggle-btn:hover .line-display-icon,
.diacritics-toggle-btn:hover .diacritics-icon {
  opacity: 1;
}

.toc-toggle-btn.active .toc-icon {
  opacity: 1;
  filter: brightness(0) saturate(100%) invert(42%) sepia(93%) saturate(1352%) hue-rotate(180deg) brightness(95%) contrast(101%) !important;
}

.line-display-toggle-btn.active .line-display-icon {
  opacity: 1;
  filter: brightness(0) saturate(100%) invert(42%) sepia(93%) saturate(1352%) hue-rotate(180deg) brightness(95%) contrast(101%) !important;
}

.diacritics-toggle-btn.state-1 .diacritics-icon {
  opacity: 1;
  color: #ff8c00;
}

.diacritics-toggle-btn.state-2 .diacritics-icon {
  opacity: 1;
  color: #ff4500;
}

.rtl-flip {
  transform: scaleX(-1);
}

.popout-toggle-btn,
.settings-toggle-btn {
  padding: 6px;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 4px;
  transition: all 0.1s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.popout-toggle-btn:hover,
.settings-toggle-btn:hover {
  background: var(--hover-bg);
  transform: scale(1.05);
}

.popout-toggle-btn:active,
.settings-toggle-btn:active {
  background: var(--active-bg);
  transform: scale(0.95);
}

.popout-icon {
  width: 16px;
  height: 16px;
  color: var(--text-primary);
  opacity: 0.7;
}

.settings-icon {
  width: 16px;
  height: 16px;
  opacity: 0.7;
}

.popout-toggle-btn:hover .popout-icon,
.settings-toggle-btn:hover .settings-icon {
  opacity: 1;
}

.close-tab-btn {
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  line-height: 1;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.1s ease;
  flex-shrink: 0;
  padding: 6px;
  opacity: 0.7;
}

.close-tab-btn:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
  opacity: 1;
  transform: scale(1.05);
}

.close-tab-btn:active {
  background: var(--active-bg);
  transform: scale(0.95);
}

.add-tab-btn {
  padding: 6px;
  cursor: pointer;
  font-size: 20px;
  font-weight: 400;
  line-height: 1;
  color: var(--text-secondary);
  background: transparent;
  border-radius: 4px;
  transition: all 0.1s ease;
  border: none;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0.7;
}

.add-tab-btn:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
  opacity: 1;
  transform: scale(1.05);
}

.add-tab-btn:active {
  background: var(--active-bg);
  transform: scale(0.95);
}

/* More options dropdown */
.more-options-container {
  position: relative;
  z-index: 9999;
}

.more-options-btn {
  padding: 6px;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 4px;
  transition: all 0.1s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.more-options-btn:hover {
  background: var(--hover-bg);
  transform: scale(1.05);
}

.more-icon {
  width: 16px;
  height: 16px;
  color: var(--text-primary);
  opacity: 0.7;
}

.more-options-btn:hover .more-icon {
  opacity: 1;
}

.more-options-dropdown {
  position: fixed;
  top: 48px;
  right: 0;
  background: var(--bg-secondary);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-left: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  border-radius: 0 0 0 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  z-index: 9999;
  overflow: hidden;
}

/* Responsive design */
.desktop-only {
  display: flex;
}

.mobile-only {
  display: none;
}

@media (max-width: 768px) {
  .desktop-only {
    display: none !important;
  }
  
  .mobile-only {
    display: flex !important;
  }
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.1s ease;
  text-align: right;
  direction: rtl;
}

.dropdown-item:hover {
  background: var(--hover-bg);
}

.dropdown-item:active {
  background: var(--active-bg);
}

.dropdown-item.active {
  background: var(--accent-bg);
}

.dropdown-item.state-1 {
  background: rgba(255, 165, 0, 0.15);
}

.dropdown-item.state-2 {
  background: rgba(255, 69, 0, 0.15);
}

.dropdown-icon {
  width: 20px;
  height: 20px;
  opacity: 0.7;
  flex-shrink: 0;
}

.dropdown-icon.diacritics-icon {
  font-size: 18px;
  font-family: 'Times New Roman', Times, serif;
  color: var(--text-primary);
  width: auto;
  height: auto;
}

.dropdown-item.state-1 .diacritics-icon {
  opacity: 1;
  color: #ff8c00;
}

.dropdown-item.state-2 .diacritics-icon {
  opacity: 1;
  color: #ff4500;
}

.dropdown-icon.line-display-icon {
  width: 16px;
  height: 16px;
}

.dropdown-icon.popout-icon {
  width: 16px;
  height: 16px;
  color: var(--text-primary);
}

.dropdown-icon.settings-icon {
  width: 16px;
  height: 16px;
}

.dropdown-label {
  font-size: 14px;
  color: var(--text-primary);
  white-space: nowrap;
}

.dropdown-item:hover .dropdown-icon {
  opacity: 1;
}

.dropdown-item.active .dropdown-icon {
  opacity: 1;
  filter: brightness(0) saturate(100%) invert(42%) sepia(93%) saturate(1352%) hue-rotate(180deg) brightness(95%) contrast(101%) !important;
}
</style>
