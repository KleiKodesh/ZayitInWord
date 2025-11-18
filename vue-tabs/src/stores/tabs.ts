import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { TreeData } from '../types/Tree'

export interface Tab {
  id: string
  title: string
  type: 'search' | 'book'
  bookId?: number
  scrollPosition?: number
}

export const useTabsStore = defineStore('tabs', () => {
  const tabs = ref<Tab[]>([])
  const activeTabId = ref<string | null>(null)
  let tabCounter = 0

  // Global tree data shared across all landing pages
  const treeData = ref<TreeData | null>(null)
  const isLoadingTree = ref(false)

  const activeTab = computed(() => 
    tabs.value.find(tab => tab.id === activeTabId.value)
  )

  function createTab(type: 'search' | 'book' = 'search', title?: string, bookId?: number) {
    tabCounter++
    const newTab: Tab = {
      id: `tab-${tabCounter}`,
      title: title || (type === 'search' ? 'איתור' : `ספר ${tabCounter}`),
      type,
      bookId
    }
    // Insert at beginning for RTL (right to left)
    tabs.value.unshift(newTab)
    activeTabId.value = newTab.id
    return newTab
  }

  function convertTabToBook(tabId: string, bookId: number, title: string) {
    const tab = tabs.value.find(t => t.id === tabId)
    if (tab) {
      tab.type = 'book'
      tab.bookId = bookId
      tab.title = title
    }
  }

  function closeTab(id: string) {
    const index = tabs.value.findIndex(tab => tab.id === id)
    if (index === -1) return

    tabs.value.splice(index, 1)
    
    if (activeTabId.value === id) {
      if (tabs.value.length > 0) {
        const newIndex = Math.min(index, tabs.value.length - 1)
        const nextTab = tabs.value[newIndex]
        activeTabId.value = nextTab ? nextTab.id : null
      } else {
        activeTabId.value = null
        // Auto-create new tab when all tabs are closed
        createTab()
      }
    }
  }

  function closeAllTabs() {
    tabs.value = []
    activeTabId.value = null
    // Auto-create new tab when all tabs are closed
    createTab()
  }

  function activateTab(id: string) {
    if (tabs.value.find(tab => tab.id === id)) {
      activeTabId.value = id
    }
  }

  function setTreeData(data: TreeData) {
    treeData.value = data
    isLoadingTree.value = false
  }

  function setLoadingTree(loading: boolean) {
    isLoadingTree.value = loading
  }

  function saveTabs() {
    const tabsData = {
      tabs: tabs.value,
      activeTabId: activeTabId.value,
      tabCounter: tabCounter
    }
    localStorage.setItem('zayit-tabs', JSON.stringify(tabsData))
  }

  function restoreTabs() {
    try {
      const saved = localStorage.getItem('zayit-tabs')
      if (saved) {
        const data = JSON.parse(saved)
        tabs.value = data.tabs || []
        activeTabId.value = data.activeTabId || null
        tabCounter = data.tabCounter || 0
        
        if (tabs.value.length === 0) {
          createTab()
        }
      } else {
        createTab()
      }
    } catch (error) {
      console.error('Failed to restore tabs:', error)
      createTab()
    }
  }

  function createTabWithSave(type: 'search' | 'book' = 'search', title?: string, bookId?: number) {
    const tab = createTab(type, title, bookId)
    saveTabs()
    return tab
  }

  function closeTabWithSave(id: string) {
    closeTab(id)
    saveTabs()
  }

  function closeAllTabsWithSave() {
    closeAllTabs()
    saveTabs()
  }

  function activateTabWithSave(id: string) {
    activateTab(id)
    saveTabs()
  }

  function convertTabToBookWithSave(tabId: string, bookId: number, title: string) {
    convertTabToBook(tabId, bookId, title)
    saveTabs()
  }

  function saveScrollPosition(tabId: string, position: number) {
    const tab = tabs.value.find(t => t.id === tabId)
    if (tab) {
      tab.scrollPosition = position
      saveTabs()
    }
  }

  return {
    tabs,
    activeTabId,
    activeTab,
    treeData,
    isLoadingTree,
    createTab: createTabWithSave,
    convertTabToBook: convertTabToBookWithSave,
    closeTab: closeTabWithSave,
    closeAllTabs: closeAllTabsWithSave,
    activateTab: activateTabWithSave,
    setTreeData,
    setLoadingTree,
    restoreTabs,
    saveScrollPosition
  }
})
