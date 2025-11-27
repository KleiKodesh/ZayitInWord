import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Tab } from '../types/Tab'

export const useTabsStore = defineStore('tabStore', () => {
  
  const tabs = ref<Tab[]>([])
  const nextId = ref(1)
  const activeTab = computed(() => tabs.value.find(t => t.isActive))

  // Calculate next available ID based on existing tabs
  function getNextId(): number {
    if (tabs.value.length === 0) return 1
    return Math.max(...tabs.value.map(t => t.id)) + 1
  }

  // Load tabs from localStorage on initialization
  function loadTabs() {
    const savedTabs = localStorage.getItem('tabs')
    
    if (savedTabs) {
      try {
        const parsed = JSON.parse(savedTabs)
        if (Array.isArray(parsed) && parsed.length > 0) {
          tabs.value = parsed
          return
        }
      } catch (e) {
        console.error('Failed to load tabs from localStorage:', e)
      }
    }
    
    // If no saved tabs or loading failed, create default tab
    createTab()
  }

  // Save tabs to localStorage
  function saveTabs() {
    localStorage.setItem('tabs', JSON.stringify(tabs.value))
  }

  function createTab(title: string = 'איתור', type : 1 | 2 | 3 | 4 = 1, bookId?: number, initialLineIndex?: number) {
     if (activeTab.value)
        activeTab.value.isActive = false
    
    const newId = getNextId()
    tabs.value.push({
        id: newId,
        title: title || `Tab ${newId}`,
        isActive : true,
        type,
        bookId,
        initialLineIndex
    })
  }

  function closeTab(id: number) {
    const index = tabs.value.findIndex(t => t.id === id)
    if (index === -1) return
    
    const wasActive = tabs.value[index]?.isActive
    tabs.value.splice(index, 1)
    
    // If there are tabs left and we closed the active one, activate the first
    if (wasActive && tabs.value.length > 0) 
         tabs.value[0]!.isActive = true

    // If all tabs are closed, create a new one
    if (tabs.value.length === 0) {
      createTab()
    }
  }

  function activateTab (id: number) {
      tabs.value.forEach(t => {
        t.isActive = t.id === id
      })
  }

  function updateActiveTab(title: string, type: 1 | 2 | 3 | 4, bookId?: number, initialLineIndex?: number) {
    if (activeTab.value) {
      activeTab.value.title = title
      activeTab.value.type = type
      activeTab.value.bookId = bookId
      activeTab.value.initialLineIndex = initialLineIndex
    }
  }

  // Watch tabs and save to localStorage on any change
  watch(tabs, () => {
    saveTabs()
  }, { deep: true })

  // Load tabs on store initialization
  loadTabs()

  return {
    tabs,
    activeTab,
    createTab,
    closeTab,
    activateTab,
    updateActiveTab
  }
})
