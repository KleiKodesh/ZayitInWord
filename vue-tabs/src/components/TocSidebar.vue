<template>
  <Transition name="backdrop">
    <div v-if="tocStore.isVisible" class="toc-backdrop" @click="tocStore.toggleToc()" @touchend="tocStore.toggleToc()"></div>
  </Transition>
  <Transition name="slide">
    <div v-if="tocStore.isVisible" class="toc-sidebar" @click.stop @touchend.stop>
      <div class="toc-header">
        <span>תוכן עניינים</span>
        <button @click="tocStore.toggleToc()" class="close-btn">×</button>
      </div>
      <div class="toc-content">
        <TocNode 
          v-for="entry in currentToc" 
          :key="entry.id" 
          :entry="entry"
          @navigate="navigateToLine"
        />
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useTocStore } from '../stores/toc'
import { useTabsStore } from '../stores/tabs'
import TocNode from './TocNode.vue'

const tocStore = useTocStore()
const tabsStore = useTabsStore()

const currentToc = computed(() => {
  const activeTab = tabsStore.activeTab
  if (!activeTab || activeTab.type !== 'book' || !activeTab.bookId) return []
  return tocStore.getTocForBook(activeTab.bookId) || []
})

// Watch for tab changes and request TOC if needed
watch(() => tabsStore.activeTabId, () => {
  if (tocStore.isVisible && tabsStore.activeTab?.type === 'book' && tabsStore.activeTab.bookId) {
    tocStore.requestToc(tabsStore.activeTab.bookId)
  }
})

function navigateToLine(lineId: number) {
  const activeTab = tabsStore.activeTab
  if (!activeTab || activeTab.type !== 'book') return
  
  // Find the line element within the active tab's content container
  const contentContainer = document.querySelector(`.content-container[data-tab-id="${activeTab.id}"]`)
  if (!contentContainer) return
  
  const lineElement = contentContainer.querySelector(`#line-${lineId}`) as HTMLElement
  if (lineElement) {
    lineElement.scrollIntoView({ behavior: 'auto', block: 'center' })
    lineElement.focus()
  }
}

// Set up global receiver for TOC data from C#
if (!window.receiveTocData) {
  window.receiveTocData = (bookId: number, tocData: any) => {
    tocStore.setTocData(bookId, tocData)
  }
}
</script>

<style scoped>
/* Semi-transparent backdrop - click to close */
.toc-backdrop {
  position: fixed;
  top: 48px;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 100;
}

/* Backdrop transitions */
.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.2s ease;
}

.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

/* TOC Sidebar - compact semi-transparent overlay */
.toc-sidebar {
  position: fixed;
  top: 48px;
  right: 0;
  width: fit-content;
  max-width: min(500px, 50vw);
  height: calc(100vh - 48px);
  background-color: rgba(var(--bg-primary-rgb), 0.95);
  backdrop-filter: blur(10px);
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.15);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  z-index: 101;
  direction: rtl;
  overflow: hidden;
}

/* Slide-in animation */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

.toc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
  background: transparent;
  flex-shrink: 0;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
  transform: scale(1.1);
}

.close-btn:active {
  transform: scale(0.95);
}

.toc-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px;
  display: inline-block;
  min-width: min-content;
  background: transparent;
}


</style>
