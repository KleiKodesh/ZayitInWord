<template>
  <div class="app-container">
    <TabHeader 
      :isDropdownOpen="isDropdownOpen"
      @toggleDropdown="toggleDropdown"
      @openFile="openFile"
    />
    
    <TabDropdown 
      :isOpen="isDropdownOpen"
      @close="closeDropdown"
    />

    <div class="pdf-content">
      <div v-if="tabsStore.tabs.length === 0" class="empty-state">
        <p>לא נטען PDF</p>
        <button @click="openFile" class="open-btn">פתח PDF</button>
      </div>
      <template v-for="tab in tabsStore.tabs" :key="tab.id">
        <PdfViewer
          v-if="loadedTabs.has(tab.id)"
          v-show="tab.id === tabsStore.activeTabId"
          :src="tab.baseUrl"
          :initial-page="tab.page"
          class="pdf-viewer-container"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTabsStore } from './stores/tabs'
import TabHeader from './components/TabHeader.vue'
import TabDropdown from './components/TabDropdown.vue'
import PdfViewer from './components/PdfViewer.vue'

const tabsStore = useTabsStore()
const isDropdownOpen = ref(false)
const loadedTabs = ref<Set<string>>(new Set())

const toggleDropdown = () => isDropdownOpen.value = !isDropdownOpen.value
const closeDropdown = () => isDropdownOpen.value = false

// Track which tabs have been loaded
watch(() => tabsStore.activeTabId, (newTabId) => {
  if (newTabId) {
    loadedTabs.value.add(newTabId)
  }
}, { immediate: true })

function openFile() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.pdf'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      // Create a new Blob from the file to get a unique URL
      const blob = new Blob([await file.arrayBuffer()], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      tabsStore.createTab(url, file.name)
      closeDropdown()
    }
  }
  input.click()
}

</script>

<style>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: var(--bg-primary);
}

.pdf-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.empty-state {
  text-align: center;
  color: var(--text-secondary);
}

.empty-state p {
  font-size: 18px;
  margin-bottom: 16px;
}

.open-btn {
  padding: 12px 24px;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.open-btn:hover {
  opacity: 0.9;
}

.pdf-viewer-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
</style>
