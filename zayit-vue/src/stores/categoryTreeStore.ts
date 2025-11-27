import { defineStore } from 'pinia'
import { ref } from 'vue'
import { send } from '../bridge/webview'
import type { TreeData } from '../types/Tree'
import { buildTreeFromFlat } from '../utils/treeBuilder'

export const useCategoryTreeStore = defineStore('categoryTree', () => {
  const treeData = ref<TreeData | null>(null)
  const isLoading = ref(false)

  let loadTimeout: number | null = null

  function loadTreeData() {
    if (treeData.value) {
      // Already loaded, no need to fetch again
      return
    }
    
    // Only send request if not already loading
    if (!isLoading.value) {
      isLoading.value = true
      send('GetTree', [])
      
      // Timeout for error detection (5 seconds)
      loadTimeout = window.setTimeout(() => {
        if (isLoading.value && !treeData.value) {
          console.error('Failed to load tree data - check console for errors')
          isLoading.value = false
        }
      }, 5000)
    }
  }

  // Clear timeout if data arrives
  const originalReceiveTreeData = window.receiveTreeData
  window.receiveTreeData = (data: any) => {
    if (loadTimeout) {
      clearTimeout(loadTimeout)
      loadTimeout = null
    }
    
    console.log('Received data from bridge:', data)
    
    // Check if data is flat (from C#) or already built tree (from SQLite)
    if (data.categoriesFlat && data.booksFlat) {
      // Flat data from C# - build tree using shared utility
      console.log('📦 Building tree from flat C# data...')
      treeData.value = buildTreeFromFlat(data.categoriesFlat, data.booksFlat)
      console.log('✅ Tree built from C# data')
    } else if (data.tree && data.allBooks) {
      // Already built tree from SQLite
      console.log('✅ Using pre-built tree from SQLite')
      treeData.value = data
    } else {
      console.error('❌ Invalid tree data format:', data)
    }
    
    isLoading.value = false
  }

  return {
    treeData,
    isLoading,
    loadTreeData
  }
})
