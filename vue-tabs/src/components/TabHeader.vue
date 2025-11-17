<template>
  <div class="tab-header" :class="{ open: isDropdownOpen }" @click="emit('toggleDropdown')">
    <div class="tab-header-left">
      <div class="tab-header-content">
        <span class="tab-header-icon">▼</span>
        <span class="tab-header-text">{{ headerText }}</span>
        <button class="add-tab-btn" @click.stop="handleNewTab" title="כרטיסייה חדשה">+</button>
      </div>
    </div>

    <div class="header-actions">
      <button 
        v-if="showTocButton"
        class="toc-toggle-btn" 
        @click.stop="toggleToc" 
        :class="{ active: isTocVisible }"
        title="תוכן עניינים"
      >
        <img src="/assets/ic_fluent_text_bullet_list_tree_24_regular.png" alt="TOC" class="toc-icon rtl-flip" />
      </button>
      <button 
        v-if="showTocButton"
        class="diacritics-toggle-btn" 
        @click.stop="toggleDiacritics" 
        :class="diacriticsStateClass"
        :title="diacriticsTitle"
      >
        <span class="diacritics-icon">{{ diacriticsIcon }}</span>
      </button>
      <button class="theme-toggle-btn" @click.stop="toggleTheme" title="החלף ערכת נושא">
        <div class="theme-icon"></div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useTabsStore } from '../stores/tabs'
import { useTocStore } from '../stores/toc'

const props = defineProps<{ isDropdownOpen: boolean }>()
const emit = defineEmits<{ toggleDropdown: [] }>()
const isDropdownOpen = computed(() => props.isDropdownOpen)
const tabsStore = useTabsStore()
const tocStore = useTocStore()
const headerText = computed(() => tabsStore.activeTab?.title || 'כרטיסייה חדשה')

// Show TOC button only for book tabs
const showTocButton = computed(() => tabsStore.activeTab?.type === 'book')
const isTocVisible = computed(() => tocStore.isVisible)

const isDark = ref(false)

// Store diacritics state per tab in memory (not persisted)
// Use reactive ref to trigger updates
const diacriticsStates = ref(new Map<string, { state: number; originalHtml: string | null }>())

const getDiacriticsState = (tabId: string) => {
  if (!diacriticsStates.value.has(tabId)) {
    diacriticsStates.value.set(tabId, { state: 0, originalHtml: null })
  }
  return diacriticsStates.value.get(tabId)!
}

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
}

const toggleToc = () => {
  tocStore.toggleToc()
  
  // Request TOC if visible and we have a book
  if (tocStore.isVisible && tabsStore.activeTab?.type === 'book' && tabsStore.activeTab.bookId) {
    tocStore.requestToc(tabsStore.activeTab.bookId)
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

  textNodes.forEach((textNode) => {
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

const toggleTheme = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'כהה' : 'בהיר')
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  isDark.value = savedTheme === 'כהה' || savedTheme === 'dark'
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  }
})
</script>

<style scoped>
.tab-header {
  display: flex;
  height: 48px;
  background: var(--bg-secondary);
  backdrop-filter: blur(40px) saturate(150%);
  -webkit-backdrop-filter: blur(40px) saturate(150%);
  border-bottom: 1px solid var(--border-color);
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  position: relative;
  cursor: pointer;
  transition: background 0.2s ease;
  direction: rtl;
}

.tab-header:active {
  background: var(--active-bg);
}

.tab-header-left {
  display: flex;
  flex: 1;
  min-width: 0;
}

.tab-header-content {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
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
  opacity: 0.7;
  margin-left: 4px;
}

.tab-header.open .tab-header-icon {
  transform: rotate(180deg);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toc-toggle-btn,
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
.diacritics-toggle-btn:hover {
  background: var(--hover-bg);
  transform: scale(1.05);
}

.toc-toggle-btn.active {
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
  transition: opacity 0.2s ease;
}

.diacritics-icon {
  font-size: 18px;
  font-family: 'Times New Roman', Times, serif;
  opacity: 0.7;
  transition: opacity 0.2s ease;
  user-select: none;
}

.toc-toggle-btn:hover .toc-icon,
.diacritics-toggle-btn:hover .diacritics-icon {
  opacity: 1;
}

.toc-toggle-btn.active .toc-icon {
  opacity: 1;
  filter: brightness(0) saturate(100%) invert(42%) sepia(93%) saturate(1352%) hue-rotate(180deg) brightness(95%) contrast(101%);
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

.theme-toggle-btn {
  padding: 6px;
  cursor: pointer;
  font-size: 18px;
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

.theme-toggle-btn:hover {
  background: var(--hover-bg);
  transform: scale(1.05);
}

.theme-toggle-btn:active {
  background: var(--active-bg);
  transform: scale(0.95);
}

.theme-icon {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(90deg, var(--text-primary) 50%, transparent 50%);
  border: 1.5px solid var(--text-primary);
  transition: transform 0.3s ease;
}

.add-tab-btn {
  padding: 4px 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 400;
  color: var(--text-secondary);
  background: transparent;
  border-radius: 3px;
  transition: all 0.15s ease;
  border: 1px solid transparent;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-left: 8px;
  opacity: 0.8;
}

.add-tab-btn:hover {
  color: var(--accent-color);
  background: var(--hover-bg);
  border-color: var(--border-color);
  opacity: 1;
  transform: scale(1.05);
}

.add-tab-btn:active {
  background: var(--active-bg);
  transform: scale(0.98);
}
</style>
