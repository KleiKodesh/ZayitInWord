import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export interface PdfTab {
  id: string
  title: string
  filePath: string
  baseUrl: string
  page: number
}

export const useTabsStore = defineStore('tabs', () => {
  const tabs = ref<PdfTab[]>([])
  const activeTabId = ref<string | null>(null)
  let tabCounter = 0

  const activeTab = computed(() => 
    tabs.value.find(tab => tab.id === activeTabId.value)
  )

  function createTab(baseUrl: string, fileName: string) {
    tabCounter++
    const savedPage = getSavedPage(fileName)
    // Add unique ID and page to URL to force browser to treat each as separate
    const uniqueUrl = `${baseUrl}#page=${savedPage}&id=${tabCounter}`
    const newTab: PdfTab = {
      id: `tab-${tabCounter}`,
      title: fileName,
      baseUrl,
      filePath: uniqueUrl,
      page: savedPage
    }
    tabs.value.unshift(newTab)
    activeTabId.value = newTab.id
    return newTab
  }

  function closeTab(id: string) {
    const index = tabs.value.findIndex(tab => tab.id === id)
    if (index === -1) return

    tabs.value.splice(index, 1)
    
    if (activeTabId.value === id) {
      if (tabs.value.length > 0) {
        const newIndex = Math.min(index, tabs.value.length - 1)
        activeTabId.value = tabs.value[newIndex].id
      } else {
        activeTabId.value = null
      }
    }
  }

  function activateTab(id: string) {
    if (tabs.value.find(tab => tab.id === id)) {
      activeTabId.value = id
    }
  }

  function updateTabPage(tabId: string, page: number) {
    const tab = tabs.value.find(t => t.id === tabId)
    if (tab) {
      tab.page = page
      savePagePosition(tab.title, page)
    }
  }

  function getSavedPage(fileName: string): number {
    try {
      const saved = localStorage.getItem(`pdf-page-${fileName}`)
      return saved ? parseInt(saved, 10) : 1
    } catch {
      return 1
    }
  }

  function savePagePosition(fileName: string, page: number) {
    try {
      localStorage.setItem(`pdf-page-${fileName}`, page.toString())
    } catch (e) {
      console.error('Failed to save page position:', e)
    }
  }

  return {
    tabs,
    activeTabId,
    activeTab,
    createTab,
    closeTab,
    activateTab,
    updateTabPage
  }
})
