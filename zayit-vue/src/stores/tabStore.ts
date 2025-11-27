import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Tab, TabRoute } from '../types/Tab'

export const useTabsStore = defineStore('tabStore', () => {
  
  const tabs = ref<Tab[]>([])
  const nextId = ref(1)
  const activeTab = computed(() => tabs.value.find(t => t.isActive))
  
  // Get current route from active tab's navigation stack
  const currentRoute = computed(() => {
    if (!activeTab.value) return null
    return activeTab.value.navigationStack[activeTab.value.currentIndex]
  })

  // Calculate next available ID based on existing tabs
  function getNextId(): number {
    if (tabs.value.length === 0) return 1
    return Math.max(...tabs.value.map(t => t.id)) + 1
  }
  
  // Migrate old tab format to new navigation stack format
  function migrateTab(oldTab: any): Tab {
    // If already has navigationStack, return as-is
    if (oldTab.navigationStack && Array.isArray(oldTab.navigationStack)) {
      return oldTab as Tab
    }
    
    // Migrate old format to navigation stack
    const initialRoute: TabRoute = {
      type: oldTab.type || 1,
      title: oldTab.title || 'איתור',
      bookId: oldTab.bookId,
      lineIndex: oldTab.savedLineIndex || oldTab.initialLineIndex
    }
    
    return {
      id: oldTab.id,
      title: oldTab.title || 'איתור',
      isActive: oldTab.isActive,
      navigationStack: [initialRoute],
      currentIndex: 0
    }
  }

  // Load tabs from localStorage on initialization
  function loadTabs() {
    const savedTabs = localStorage.getItem('tabs')
    
    if (savedTabs) {
      try {
        const parsed = JSON.parse(savedTabs)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Migrate old tabs to new format
          tabs.value = parsed.map(migrateTab)
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

  function createTab(title: string = 'איתור', type : 1 | 2 | 3 | 4 = 1, bookId?: number, lineIndex?: number) {
     if (activeTab.value)
        activeTab.value.isActive = false
    
    const newId = getNextId()
    const initialRoute: TabRoute = {
      type,
      title,
      bookId,
      lineIndex
    }
    
    tabs.value.push({
        id: newId,
        title,
        isActive: true,
        navigationStack: [initialRoute],
        currentIndex: 0
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
  
  // Navigate to a new route in the active tab
  function navigateTo(route: TabRoute) {
    if (!activeTab.value) return
    
    // Remove any forward history if we're not at the end
    if (activeTab.value.currentIndex < activeTab.value.navigationStack.length - 1) {
      activeTab.value.navigationStack = activeTab.value.navigationStack.slice(0, activeTab.value.currentIndex + 1)
    }
    
    // Add new route to stack
    activeTab.value.navigationStack.push(route)
    activeTab.value.currentIndex = activeTab.value.navigationStack.length - 1
    activeTab.value.title = route.title
    
    // IMPORTANT: Limit navigation stack size to prevent memory leaks
    // Keep max 50 entries - if exceeded, remove oldest entries but keep current position valid
    const MAX_STACK_SIZE = 50
    if (activeTab.value.navigationStack.length > MAX_STACK_SIZE) {
      const removeCount = activeTab.value.navigationStack.length - MAX_STACK_SIZE
      activeTab.value.navigationStack = activeTab.value.navigationStack.slice(removeCount)
      activeTab.value.currentIndex -= removeCount
    }
  }
  
  // Navigate back in the active tab's history
  function navigateBack() {
    if (!activeTab.value) return
    if (activeTab.value.currentIndex > 0) {
      activeTab.value.currentIndex--
      const route = activeTab.value.navigationStack[activeTab.value.currentIndex]
      if (route) {
        activeTab.value.title = route.title
      }
    }
  }
  
  // Navigate forward in the active tab's history
  function navigateForward() {
    if (!activeTab.value) return
    if (activeTab.value.currentIndex < activeTab.value.navigationStack.length - 1) {
      activeTab.value.currentIndex++
      const route = activeTab.value.navigationStack[activeTab.value.currentIndex]
      if (route) {
        activeTab.value.title = route.title
      }
    }
  }
  
  // Check if can navigate back
  const canNavigateBack = computed(() => {
    return activeTab.value ? activeTab.value.currentIndex > 0 : false
  })
  
  // Check if can navigate forward
  const canNavigateForward = computed(() => {
    return activeTab.value 
      ? activeTab.value.currentIndex < activeTab.value.navigationStack.length - 1 
      : false
  })

  // Legacy method for backward compatibility - will be removed
  function updateActiveTab(title: string, type: 1 | 2 | 3 | 4, bookId?: number, lineIndex?: number) {
    navigateTo({ type, title, bookId, lineIndex })
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
    currentRoute,
    canNavigateBack,
    canNavigateForward,
    createTab,
    closeTab,
    activateTab,
    navigateTo,
    navigateBack,
    navigateForward,
    updateActiveTab // Legacy - keep for now
  }
})
