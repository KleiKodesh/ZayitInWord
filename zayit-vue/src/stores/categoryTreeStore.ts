import { defineStore } from 'pinia'
import { ref } from 'vue'
import { send } from '../bridge/webview'
import type { TreeData } from '../types/Tree'

export const useCategoryTreeStore = defineStore('categoryTree', () => {
  const treeData = ref<TreeData | null>(null)
  const isLoading = ref(false)

  // Setup global callback for receiving tree data
  declare global {
    interface Window {
      receiveTreeData?: (data: TreeData) => void
    }
  }

  window.receiveTreeData = (data: TreeData) => {
    console.log('Received tree data:', data)
    treeData.value = data
    isLoading.value = false
  }

  function loadTreeData() {
    if (treeData.value) {
      // Already loaded, no need to fetch again
      return
    }
    isLoading.value = true
    send('GetTree', [])
  }

  return {
    treeData,
    isLoading,
    loadTreeData
  }
})
