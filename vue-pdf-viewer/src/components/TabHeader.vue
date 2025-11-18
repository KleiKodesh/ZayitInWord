<template>
  <div class="tab-header" :class="{ open: isDropdownOpen }" @click="emit('toggleDropdown')">
    <div class="tab-header-left">
      <div class="tab-header-content">
        <span class="tab-header-icon">▼</span>
        <span class="tab-header-text">{{ headerText }}</span>
      </div>
    </div>

    <div class="header-actions">
      <button class="folder-btn" @click.stop="emit('openFile')" title="פתח PDF (Ctrl+O)">
        📁
      </button>
      <button 
        v-if="isInUserControl"
        class="popout-btn" 
        @click.stop="togglePopOut" 
        :title="(isPopOut ? 'חזור לחלון ראשי' : 'פתח בחלון נפרד') + ' (Ctrl+P)'"
      >
        <svg class="popout-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 4H18C18.5304 4 19.0391 4.21071 19.4142 4.58579C19.7893 4.96086 20 5.46957 20 6V10M10 14L20 4M8 4H4V20H20V16" 
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useTabsStore } from '../stores/tabs'

const props = defineProps<{ isDropdownOpen: boolean }>()
const emit = defineEmits<{ 
  toggleDropdown: []
  openFile: []
}>()

const tabsStore = useTabsStore()
const headerText = computed(() => tabsStore.activeTab?.title || 'מציג PDF')

const isInUserControl = ref(false)
const isPopOut = ref(false)

;(window as any).setHostingMode = (inUserControl: boolean) => {
  isInUserControl.value = inUserControl
  isPopOut.value = false
}

const togglePopOut = () => {
  if (window.chrome?.webview) {
    window.chrome.webview.postMessage({
      command: 'TogglePopOut',
      args: []
    })
    isPopOut.value = !isPopOut.value
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.ctrlKey) {
    switch (e.key.toLowerCase()) {
      case 'o':
        e.preventDefault()
        emit('openFile')
        break
      case 'p':
        e.preventDefault()
        if (isInUserControl.value) togglePopOut()
        break
    }
  }
}

onMounted(() => {
  if (window.chrome?.webview) {
    window.chrome.webview.postMessage({
      command: 'CheckHostingMode',
      args: []
    })
  }
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

</script>

<style scoped>
.tab-header {
  display: flex;
  height: 48px;
  background: #3c3c3c;
  border-bottom: 1px solid rgba(128, 128, 128, 0.35);
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  cursor: pointer;
  transition: background 0.2s ease;
  direction: rtl;
}

.tab-header:active {
  background: #4a4a4a;
}

.tab-header-left {
  display: flex;
  flex: 1;
  min-width: 0;
}

.tab-header-content {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.tab-header-text {
  font-size: 14px;
  font-weight: 600;
  color: #cccccc;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-header-icon {
  font-size: 10px;
  color: #858585;
  transition: transform 0.2s ease;
  flex-shrink: 0;
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

.folder-btn,
.popout-btn {
  padding: 6px;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 4px;
  transition: all 0.1s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 16px;
}

.folder-btn:hover,
.popout-btn:hover {
  background: rgba(90, 93, 94, 0.31);
  transform: scale(1.05);
}

.folder-btn:active,
.popout-btn:active {
  background: rgba(90, 93, 94, 0.5);
  transform: scale(0.95);
}

.popout-icon {
  width: 16px;
  height: 16px;
  color: #cccccc;
  opacity: 0.7;
}

.popout-btn:hover .popout-icon {
  opacity: 1;
}
</style>
