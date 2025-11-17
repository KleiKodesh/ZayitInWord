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
        ☰
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

.toc-toggle-btn {
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
  color: var(--text-primary);
}

.toc-toggle-btn:hover {
  background: var(--hover-bg);
  transform: scale(1.05);
}

.toc-toggle-btn.active {
  background: var(--accent-bg);
  color: var(--accent-color);
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
  width: 20px;
  height: 20px;
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
