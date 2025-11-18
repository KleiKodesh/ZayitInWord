<template>
  <div class="content" @keydown="handleKeyDown" tabindex="-1">
    <div class="search-results">
      <TreeView
        ref="treeViewRef"
        :tree-data="treeData"
        :is-loading="isLoadingTree"
        :search-query="searchInput"
        @select-book="selectBook"
        @click="focusContent"
      />
    </div>

    <div class="search-bar">
      <button @click="resetTree" class="reset-btn" title="איפוס עץ">
        <img src="/assets/ic_fluent_text_bullet_list_tree_24_regular.png" alt="Reset" class="themed-icon rtl-flip" />
      </button>
      <input 
        ref="searchInputRef"
        v-model="searchInput" 
        type="text" 
        placeholder="חפש ספר..."
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import TreeView from './TreeView.vue'
import type { Book } from '../types/Book'
import type { TreeData } from '../types/Tree'
import { useTabsStore } from '../stores/tabs'

const tabsStore = useTabsStore()
const searchInput = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)
const treeViewRef = ref<InstanceType<typeof TreeView> | null>(null)
const contentRef = ref<HTMLElement | null>(null)

// Focus search input when this tab becomes active
watch(() => tabsStore.activeTabId, (newTabId) => {
  const activeTab = tabsStore.tabs.find(t => t.id === newTabId)
  if (activeTab?.type === 'search') {
    // Use nextTick to ensure DOM is updated
    setTimeout(() => {
      searchInputRef.value?.focus()
    }, 50)
  }
})

// Tree data is global (shared across all landing pages)
const treeData = computed(() => tabsStore.treeData)
const isLoadingTree = computed(() => tabsStore.isLoadingTree)

// Focus content div to enable keyboard navigation
const focusContent = () => {
  const content = document.querySelector('.content') as HTMLElement
  content?.focus()
  // Focus first item if nothing is selected
  treeViewRef.value?.focusFirstItem()
}

// Functions to be called from C#
declare global {
  interface Window {
    receiveTreeData: (data: TreeData) => void
    chrome?: {
      webview?: {
        postMessage: (message: any) => void
      }
    }
  }
}

window.receiveTreeData = (data: TreeData) => {
  tabsStore.setTreeData(data)
}

// Load tree data on mount
onMounted(() => {
  // Autofocus search input
  searchInputRef.value?.focus()
  
  if (!treeData.value && !isLoadingTree.value) {
    tabsStore.setLoadingTree(true)
    
    console.log('Attempting to load tree data...')
    console.log('WebView available:', !!window.chrome?.webview)
    
    if (window.chrome?.webview) {
      console.log('Sending GetTree command to C#')
      window.chrome.webview.postMessage({
        command: 'GetTree',
        args: []
      })
    } else {
      // Development mode: use sample data
      console.log('Loading sample data (dev mode)')
      import('../data/sampleTreeData').then(module => {
        tabsStore.setTreeData(module.sampleTreeData)
      })
    }
    
    // Timeout after 5 seconds
    setTimeout(() => {
      if (isLoadingTree.value && !treeData.value) {
        tabsStore.setLoadingTree(false)
        console.error('Failed to load tree data - timeout after 5 seconds')
      }
    }, 5000)
  }
})

// Global keyboard navigation
const handleKeyDown = (event: KeyboardEvent) => {
  // Arrow keys work anywhere
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    // If in search box, move focus to content
    if (event.target === searchInputRef.value) {
      focusContent()
    }
    treeViewRef.value?.handleArrowKey(event.key)
  } 
  // Enter key behavior
  else if (event.key === 'Enter') {
    // If in search input, move focus to tree
    if (event.target === searchInputRef.value) {
      event.preventDefault()
      focusContent()
    } 
    // If in tree, activate selected item
    else {
      event.preventDefault()
      treeViewRef.value?.handleEnterKey()
    }
  }
}

// Reset tree: clear search and collapse all
const resetTree = () => {
  searchInput.value = ''
  treeViewRef.value?.reset()
}

const selectBook = (book: Book) => {
  // Convert current tab from search to book
  // BookViewer will handle loading the book content
  const currentTabId = tabsStore.activeTabId
  if (!currentTabId) return
  
  tabsStore.convertTabToBook(currentTabId, book.id, book.title)
}
</script>

<style scoped>
.content {
  height: 100%;
  width: 100%;
  direction: rtl;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  outline: none;
}

.content::before {
  background: url('/assets/zayit_transparent.png') no-repeat center center;
 background-size: clamp(50px, 40vw, 250px);
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.2;
  pointer-events: none;
}

.search-results {
  flex: 1;
  overflow: hidden;
  width: 100%;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--bg-secondary);
  backdrop-filter: blur(40px) saturate(150%);
  -webkit-backdrop-filter: blur(40px) saturate(150%);
  border-top: 1px solid var(--border-color);
  box-shadow: 0 -1px 4px rgba(0, 0, 0, 0.04);
  position: relative;
  z-index: 20;
}

.search-bar input {
  flex: 1;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  outline: none;
  font-size: 0.875rem;
  padding: 6px 12px;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.search-bar input:focus {
  border-color: var(--accent-color);
}

.search-bar input::placeholder {
  color: var(--text-secondary);
  opacity: 0.6;
}

.search-bar button {
  background: transparent;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.1s ease;
}

.search-bar button:hover {
  background: var(--hover-bg);
}

.search-bar button:active {
  background: var(--active-bg);
  transform: scale(0.95);
}

.reset-btn img {
  width: 20px;
  opacity: 0.7;
}

.reset-btn:hover img {
  opacity: 1;
}

.rtl-flip {
  transform: scaleX(-1);
}

@media (max-width: 768px) {
  .search-bar input {
    font-size: 1rem;
  }
}
</style>
